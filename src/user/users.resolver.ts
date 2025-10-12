import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';

@Resolver()
export class UsersResolver {
  constructor(private users: UsersService) {}

  @Mutation(() => Boolean)
  async register(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    await this.users.createUser(email, password);
    return true;
  }
}
