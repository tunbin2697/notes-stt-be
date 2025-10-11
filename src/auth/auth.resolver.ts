import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { Tokens } from './dto/tokens.object';
import { GqlAuthGuard } from '@/security/guards/gql-auth.guard';
import { SECURITY_CONFIG } from '@/config/security.config';

@Resolver()
export class AuthResolver {
  constructor(private auth: AuthService) {}

  @Mutation(() => Tokens)
  async login(
    @Args('input') input: LoginInput,
    @Context() ctx: any,
  ): Promise<Tokens> {
    const user = await this.auth.validateUser(input.email, input.password);
    if (!user) throw new Error('Invalid credentials');

    const accessToken = this.auth.signAccessToken(user.id);
    const refreshToken = await this.auth.signRefreshToken(user.id, {
      ip: ctx.req.ip,
      device: ctx.req.headers['user-agent'],
    });

    // set refresh token as httpOnly cookie using centralized config
    ctx.res.cookie(
      SECURITY_CONFIG.cookie.refresh.name,
      refreshToken,
      SECURITY_CONFIG.cookie.refresh.options,
    );

    return { accessToken, refreshToken };
  }

  @Mutation(() => Tokens)
  async refresh(
    @Args('refreshToken') refreshToken: string,
    @Context() ctx: any,
  ): Promise<Tokens> {
    // rotateRefreshToken will revoke the old and create a new one
    // but we need to validate
    const decoded: any = null; // you should verify jwt here, omitted for brevity
    // This is a simplified example - real-world usage must validate signature

    // find user from token (or pass userId as claim)
    // here we simplify: decode sub from jwt
    const jwt = require('jsonwebtoken');
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Invalid refresh token');
    }

    if (payload.type !== 'refresh') throw new Error('Not a refresh token');

    const newRaw = await this.auth.rotateRefreshToken(
      refreshToken,
      payload.sub,
      { ip: ctx.req.ip, device: ctx.req.headers['user-agent'] },
    );
    if (!newRaw) throw new Error('Refresh token not found');

    const accessToken = this.auth.signAccessToken(payload.sub);

    ctx.res.cookie(
      SECURITY_CONFIG.cookie.refresh.name,
      newRaw,
      SECURITY_CONFIG.cookie.refresh.options,
    );

    return { accessToken, refreshToken: newRaw };
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async logout(@Context() ctx: any) {
    const user = ctx.req.user;
    const rawRefresh = ctx.req.cookies?.refreshToken;
    if (rawRefresh) {
      await this.auth.rotateRefreshToken(rawRefresh, user.id, {
        ip: ctx.req.ip,
      });
    } else {
      await this.auth.revokeAllForUser(user.id);
    }
    ctx.res.clearCookie(
      SECURITY_CONFIG.cookie.refresh.name,
      SECURITY_CONFIG.cookie.refresh.options,
    );
    return true;
  }
}
