import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SECURITY_CONFIG } from '@/config/security.config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

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
      throw new ForbiddenException('Maximum active devices reached');
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
        await this.prisma.refreshToken.update({
          where: { id: t.id },
          data: { revoked: true },
        });
        return true;
      }
    }
    return false;
  }

  async revokeAllForUser(accountId: number) {
    await (this.prisma as any).refreshToken.updateMany({
      where: { accountId } as any,
      data: { revoked: true },
    });
  }
}
