import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Tokens } from './dto/tokens.object';
import { GqlAuthGuard } from '@/common/security/guards/gql-auth.guard';
import { SECURITY_CONFIG } from '@/config/security.config';
import { BusinessRuleException } from '@/common/exceptions/business-rule.exception';
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
    if (!user) throw new BusinessRuleException('Invalid credentials');

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
    const rawRefreshToken =
      ctx.req.cookies?.[SECURITY_CONFIG.cookie.refresh.name];
    if (!rawRefreshToken) throw new BusinessRuleException('No refresh token');

    const accessToken = await this.auth.useRefreshToken(rawRefreshToken);
    if (!accessToken) throw new BusinessRuleException('Invalid refresh token');

    return { accessToken };
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async logout(@Context() ctx: any) {
    const user = ctx.req.user;
    const rawRefreshToken =
      ctx.req.cookies?.[SECURITY_CONFIG.cookie.refresh.name];
    if (rawRefreshToken) {
      // revoke only this refresh token
      await this.auth.revokeRefreshToken(rawRefreshToken, user.id);
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
