import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Tokens } from './entities/tokens.object';
import { GqlAuthGuard } from '@/common/security/guards/gql-auth.guard';
import { SECURITY_CONFIG } from '@/config/security.config';
import { BusinessRuleException } from '@/common/exceptions/business-rule.exception';
import { ChangePasswordInput } from './dto/change-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
@Resolver()
export class AuthResolver {
  constructor(private auth: AuthService) {}

  @Mutation(() => Boolean)
  async register(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<boolean> {
    if (!email || !password) {
      throw new BusinessRuleException('Email and password are required');
    }
    await this.auth.register(email, password);
    return true;
  }

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
      ctx.res.clearCookie(
        SECURITY_CONFIG.cookie.refresh.name,
        SECURITY_CONFIG.cookie.refresh.options,
      );
      return true;
    } else {
      throw new BusinessRuleException('No refresh token provided');
    }
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async changePassword(
    @Args('input') input: ChangePasswordInput,
    @Context() ctx: any,
  ): Promise<boolean> {
    const accountId = ctx.req.user.id;
    await this.auth.changePassword(
      accountId,
      input.currentPassword,
      input.newPassword,
    );
    return true;
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Args('email') email: string): Promise<boolean> {
    await this.auth.forgotPassword(email);
    return true;
  }

  @Mutation(() => Boolean)
  async resetPassword(
    @Args('input') input: ResetPasswordInput,
  ): Promise<boolean> {
    await this.auth.resetPassword(input.email, input.otp, input.newPassword);
    return true;
  }
}
