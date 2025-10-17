import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SECURITY_CONFIG } from '@/config/security.config';
import { BusinessRuleException } from '@/common/exceptions/business-rule.exception';
import { EmailService } from '@/common/services/email.service';

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

  async validateUser(email: string, password: string) {
    const user = await (this.prisma as any).account.findUnique({
      where: { email },
    });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    return user;
  }

  signAccessToken(accountId: number) {
    return this.jwt.sign(
      {
        sub: accountId,
      },
      {
        expiresIn: '15m', // Shorter lifespan for better security
        issuer: 'dpl-note-app', // Example issuer
        audience: 'dpl-note-api', // Example audience
      },
    );
  }

  async signRefreshToken(accountId: number) {
    const MAX_DEVICES = SECURITY_CONFIG.auth.maxDevices;

    // count active (non-revoked, not expired) refresh tokens for this account
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

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const rawToken = this.jwt.sign(
      { sub: accountId, type: 'refresh' },
      { expiresIn: '7d' },
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
