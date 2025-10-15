import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { GqlAuthGuard } from '@/common/security/guards/gql-auth.guard';
import { Profile } from '@/features/user/entities/profile.model';
import { UpdateProfileInput } from './dto/update-profile.input';

@Resolver()
export class UsersResolver {
  constructor(private users: UsersService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => Profile)
  async getMyProfile(@Context() ctx: any): Promise<Profile> {
    const accountId = ctx.req.user.id;
    const profile = await this.users.findProfileByAccountId(accountId);

    return {
      ...profile,
      email: profile.account?.email,
      role: profile.account?.role,
    };
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async updateMyProfile(
    @Args('input') input: UpdateProfileInput,
    @Context() ctx: any,
  ): Promise<Boolean> {
    const accountId = ctx.req.user.id;

    // Debug logging
    console.log('=== UPDATE PROFILE DEBUG ===');
    console.log('Account ID:', accountId);
    console.log('Input received:', JSON.stringify(input, null, 2));
    console.log('Input keys:', Object.keys(input));
    console.log('Input values:', Object.values(input));
    console.log('===========================');

    await this.users.updateProfile(accountId, input);

    // Map null values to undefined for GraphQL
    return true;
  }
}
