import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Profile {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  accountId: number;

  @Field({ nullable: true })
  fullName?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Account relation fields (if you want to expose them)
  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  role?: string;
}
