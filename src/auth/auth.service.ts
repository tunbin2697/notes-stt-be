import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    return user;
  }

  signAccessToken(userId: number) {
    return this.jwt.sign({ sub: userId }, { expiresIn: '30m' });
  }

  async signRefreshToken(
    userId: number,
    options: { ip?: string; device?: string },
  ) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const rawToken = this.jwt.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: '7d' },
    );

    const hashed = await bcrypt.hash(rawToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        token: hashed,
        expiresAt,
        ip: options.ip,
        device: options.device,
        user: { connect: { id: userId } },
      },
    });

    return rawToken;
  }

  async rotateRefreshToken(
    oldRawToken: string,
    userId: number,
    options: { ip?: string; device?: string },
  ) {
    // Find token by comparing bcrypt (we store hashed tokens)
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, revoked: false },
    });
    for (const t of tokens) {
      const match = await bcrypt.compare(oldRawToken, t.token);
      if (match) {
        // revoke old
        await this.prisma.refreshToken.update({
          where: { id: t.id },
          data: { revoked: true },
        });
        // create new
        const newRaw = await this.signRefreshToken(userId, options);
        return newRaw;
      }
    }
    return null;
  }

  async revokeAllForUser(userId: number) {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }
}
