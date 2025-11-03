import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SECURITY_CONFIG } from '@/config/security.config';
import { BusinessRuleException } from '@/common/exceptions/business-rule.exception';
import { EmailService } from '@/common/services/email.service';

/**
 * Convert JWT time string (e.g., '7d', '30m', '1h') to milliseconds
 * Used to calculate database expiration timestamps
 */
function timeStringToMs(timeStr: string): number {
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid time string: ${timeStr}`);

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  const units: Record<string, number> = {
    s: 1000, // seconds
    m: 60 * 1000, // minutes
    h: 60 * 60 * 1000, // hours
    d: 24 * 60 * 60 * 1000, // days
  };

  return num * units[unit];
}

/**
 * Verify Google ID token and extract user info
 */
async function verifyGoogleToken(idToken: string): Promise<{
  email: string;
  name?: string;
  picture?: string;
  sub: string;
} | null> {
  try {
    const GOOGLE_CLIENT_ID = SECURITY_CONFIG.google.clientId;

    // Verify token with Google's tokeninfo endpoint
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
    );

    if (!response.ok) {
      throw new BusinessRuleException('Failed to verify Google token');
      return null;
    }

    const payload = await response.json();

    // Verify audience (client ID)
    if (payload.aud !== GOOGLE_CLIENT_ID) {
      return null;
    }

    // Verify token is not expired
    if (payload.exp * 1000 < Date.now()) {
      throw new BusinessRuleException('Google token has expired');
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub, // Google user ID
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    return null;
  }
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  async register(email: string, password: string) {
    const existing = await (this.prisma as any).account.findUnique({
      where: { email },
    });
    if (existing) {
      throw new BusinessRuleException('Account with this email already exists');
    }

    // Create account and profile in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      // Create account
      const hashed = await bcrypt.hash(password, 10);
      const account = await (tx as any).account.create({
        data: { email, password: hashed },
      });

      // Create profile for the account
      await (tx as any).profile.create({
        data: {
          accountId: account.id,
          fullName: null,
          phone: null,
          location: null,
          avatar: null,
          bio: null,
        },
      });

      return account;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...safe } = user as any;
    return safe;
  }

  /**
   * Google One Tap authentication
   * Registers new user or logs in existing user
   */
  async authenticateWithGoogle(idToken: string) {
    // Verify Google ID token
    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser) {
      throw new BusinessRuleException('Invalid Google token');
    }

    // Check if user exists
    let account = await (this.prisma as any).account.findUnique({
      where: { email: googleUser.email },
    });

    // If user doesn't exist, create new account
    if (!account) {
      account = await this.prisma.$transaction(async (tx) => {
        // Create account with Google provider
        const newAccount = await (tx as any).account.create({
          data: {
            email: googleUser.email,
            password: null, // No password for OAuth users
            provider: 'google',
            providerId: googleUser.sub,
          },
        });

        // Create profile with Google info
        await (tx as any).profile.create({
          data: {
            accountId: newAccount.id,
            fullName: googleUser.name || null,
            avatar: googleUser.picture || null,
            phone: null,
            location: null,
            bio: null,
          },
        });

        return newAccount;
      });
    } else {
      // User exists - update provider info if needed
      if (account.provider !== 'google') {
        await (this.prisma as any).account.update({
          where: { id: account.id },
          data: {
            provider: 'google',
            providerId: googleUser.sub,
          },
        });
      }
    }

    return account;
  }

  async validateUser(email: string, password: string) {
    const user = await (this.prisma as any).account.findUnique({
      where: { email },
    });
    if (!user) return null;

    // Check if account was created via Google OAuth
    if (user.provider === 'google') {
      throw new BusinessRuleException(
        'This account was created using Google Sign-In. Please sign in with Google instead.',
      );
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    return user;
  }

  signAccessToken(accountId: number) {
    const expiresIn = SECURITY_CONFIG.jwt.accessExpiresIn;
    return this.jwt.sign(
      {
        sub: accountId,
        type: 'access',
      },
      {
        expiresIn: expiresIn as any,
      },
    );
  }

  async signRefreshToken(accountId: number) {
    const MAX_DEVICES = SECURITY_CONFIG.auth.maxDevices;

    const now = new Date();
    const activeCount = await (this.prisma as any).refreshToken.count({
      where: {
        accountId,
        revoked: false,
        expiresAt: { gt: now },
      } as any,
    });

    if (activeCount >= MAX_DEVICES) {
      throw new BusinessRuleException('Maximum active devices reached');
    }

    // Use refresh token expiration from config
    const refreshExpiresIn = SECURITY_CONFIG.jwt.refreshExpiresIn;
    const expiresAt = new Date(Date.now() + timeStringToMs(refreshExpiresIn));

    const rawToken = this.jwt.sign(
      { sub: accountId, type: 'refresh' },
      { expiresIn: refreshExpiresIn as any },
    );

    const hashed = await bcrypt.hash(rawToken, 10);

    await (this.prisma as any).refreshToken.create({
      data: {
        token: hashed,
        expiresAt,
        accountId: accountId,
      },
    });

    return rawToken;
  }

  async useRefreshToken(rawRefreshToken: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(rawRefreshToken);
    } catch (err) {
      return null;
    }
    if (payload.type !== 'refresh') return null;

    const accountId = payload.sub;

    const tokens = await (this.prisma as any).refreshToken.findMany({
      where: { accountId, revoked: false } as any,
    });
    for (const t of tokens) {
      const match = await bcrypt.compare(rawRefreshToken, t.token);
      if (match) {
        const accessToken = this.signAccessToken(accountId);
        return accessToken;
      }
    }
    return null;
  }

  async revokeRefreshToken(oldRawToken: string, accountId: number) {
    const tokens = await (this.prisma as any).refreshToken.findMany({
      where: { accountId, revoked: false } as any,
    });
    for (const t of tokens) {
      const match = await bcrypt.compare(oldRawToken, t.token);
      if (match) {
        console.log('revoking token id:', t.id);
        await this.prisma.refreshToken.update({
          where: { id: t.id },
          data: { revoked: true },
        });
        return true;
      }
    }
    throw new BusinessRuleException('Refresh token not found');
  }

  async revokeAllForUser(accountId: number) {
    await (this.prisma as any).refreshToken.updateMany({
      where: { accountId } as any,
      data: { revoked: true },
    });
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    accountId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Get user account
    const account = await (this.prisma as any).account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new BusinessRuleException('Account not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, account.password);
    if (!isValid) {
      throw new BusinessRuleException('Current password is incorrect');
    }

    // Validate new password is different
    if (currentPassword === newPassword) {
      throw new BusinessRuleException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await (this.prisma as any).account.update({
      where: { id: accountId },
      data: { password: hashedNewPassword },
    });

    // Send notification email (mock)
    await this.email.sendPasswordChangedNotification(account.email);

    // Revoke all refresh tokens for security
    await this.revokeAllForUser(accountId);
  }

  /**
   * Request password reset - sends OTP to email
   */
  async forgotPassword(email: string): Promise<void> {
    // Check if account exists
    const account = await (this.prisma as any).account.findUnique({
      where: { email },
    });

    if (!account) {
      // For security, don't reveal if email exists or not
      // Just return success
      return;
    }

    // Generate OTP
    const otp = this.email.generateOTP();

    // Store OTP in database (expires based on config)
    const expiresAt = new Date(
      Date.now() + SECURITY_CONFIG.otp.expiresInSeconds * 1000,
    );

    // Invalidate any existing unused password reset tokens for this account
    await (this.prisma as any).passwordReset.updateMany({
      where: { accountId: account.id, used: false } as any,
      data: { used: true },
    });

    // Create new password reset token
    await (this.prisma as any).passwordReset.create({
      data: {
        token: otp,
        accountId: account.id,
        expiresAt,
      },
    });

    // Send OTP via email (mock - logs to console)
    await this.email.sendPasswordResetOTP(email, otp);
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<void> {
    // Find account
    const account = await (this.prisma as any).account.findUnique({
      where: { email },
    });

    if (!account) {
      throw new BusinessRuleException('Invalid reset code');
    }

    // Find valid password reset token
    const resetToken = await (this.prisma as any).passwordReset.findFirst({
      where: {
        accountId: account.id,
        token: otp,
        used: false,
        expiresAt: { gt: new Date() },
      } as any,
    });

    if (!resetToken) {
      throw new BusinessRuleException(
        'Invalid or expired reset code. Please request a new one.',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used
    await this.prisma.$transaction(async (tx) => {
      // Update password
      await (tx as any).account.update({
        where: { id: account.id },
        data: { password: hashedPassword },
      });

      // Mark token as used
      await (tx as any).passwordReset.update({
        where: { id: resetToken.id },
        data: { used: true },
      });
    });

    // Send notification email (mock)
    await this.email.sendPasswordChangedNotification(email);

    // Revoke all refresh tokens for security
    await this.revokeAllForUser(account.id);
  }

  /**
   * Request OTP for logout all sessions
   * Sends OTP to user's email to verify they want to logout from all devices
   */
  async requestLogoutAllOTP(email: string): Promise<void> {
    // Check if account exists
    const account = await (this.prisma as any).account.findUnique({
      where: { email },
    });

    if (!account) {
      // For security, don't reveal if email exists or not
      return;
    }

    // Generate OTP
    const otp = this.email.generateOTP();

    // Store OTP in database (expires based on config)
    const expiresAt = new Date(
      Date.now() + SECURITY_CONFIG.otp.expiresInSeconds * 1000,
    );

    // Invalidate any existing unused logout tokens for this account
    await (this.prisma as any).passwordReset.updateMany({
      where: { accountId: account.id, used: false } as any,
      data: { used: true },
    });

    // Create new logout verification token (reusing passwordReset table)
    await (this.prisma as any).passwordReset.create({
      data: {
        token: otp,
        accountId: account.id,
        expiresAt,
      },
    });

    // Send OTP via email
    await this.email.sendLogoutAllOTP(email, otp);
  }

  /**
   * Logout from all devices using OTP verification
   * This revokes all refresh tokens for the user
   */
  async logoutAllWithOTP(email: string, otp: string): Promise<void> {
    // Find account
    const account = await (this.prisma as any).account.findUnique({
      where: { email },
    });

    if (!account) {
      throw new BusinessRuleException('Invalid email or OTP');
    }

    // Find valid OTP token
    const resetToken = await (this.prisma as any).passwordReset.findFirst({
      where: {
        accountId: account.id,
        token: otp,
        used: false,
        expiresAt: { gt: new Date() },
      } as any,
      orderBy: { createdAt: 'desc' },
    });

    if (!resetToken) {
      throw new BusinessRuleException('Invalid or expired OTP');
    }

    // Revoke all refresh tokens and mark OTP as used in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Revoke all refresh tokens
      await (tx as any).refreshToken.updateMany({
        where: { accountId: account.id } as any,
        data: { revoked: true },
      });

      // Mark OTP as used
      await (tx as any).passwordReset.update({
        where: { id: resetToken.id },
        data: { used: true },
      });
    });

    // Send confirmation email
    await this.email.sendLogoutAllConfirmation(email);
  }
}
