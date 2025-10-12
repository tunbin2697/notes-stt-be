import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { SECURITY_CONFIG } from '@/config/security.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: SECURITY_CONFIG.jwt.defaultSecret,
    });
  }

  async validate(payload: { sub: number; iat?: number; exp?: number }) {
    const account = await (this.prisma as any).account.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: { id: true, fullName: true, avatar: true },
        },
      },
    });
    if (!account) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...safe } = account as any;
    return safe;
  }
}
