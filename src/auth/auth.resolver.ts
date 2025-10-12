import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Tokens } from './dto/tokens.object';
import { GqlAuthGuard } from '@/security/guards/gql-auth.guard';
import { SECURITY_CONFIG } from '@/config/security.config';

@Resolver()
export class AuthResolver {
  constructor(private auth: AuthService) {}

  @Mutation(() => Tokens)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Context() ctx: any,
  ): Promise<Tokens> {
    const user = await this.auth.validateUser(email, password);
    if (!user) throw new Error('Invalid credentials');

    const accessToken = this.auth.signAccessToken(user.id);
    const refreshToken = await this.auth.signRefreshToken(user.id);

    // set refresh token as httpOnly cookie using centralized config
    ctx.res.cookie(
      SECURITY_CONFIG.cookie.refresh.name,
      refreshToken,
      SECURITY_CONFIG.cookie.refresh.options,
    );

    return { accessToken };
  }

  @Mutation(() => Tokens)
  async refresh(@Context() ctx: any): Promise<Tokens> {
    const rawRefresh = ctx.req.cookies?.[SECURITY_CONFIG.cookie.refresh.name];
    if (!rawRefresh) throw new Error('No refresh token');

    const accessToken = await this.auth.useRefreshToken(rawRefresh);
    if (!accessToken) throw new Error('Invalid refresh token');

    return { accessToken };
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async logout(@Context() ctx: any) {
    const user = ctx.req.user;
    const rawRefresh = ctx.req.cookies?.[SECURITY_CONFIG.cookie.refresh.name];
    if (rawRefresh) {
      // revoke only this refresh token
      await this.auth.revokeRefreshToken(rawRefresh, user.id);
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
