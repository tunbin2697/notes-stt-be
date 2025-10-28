import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class GoogleAuthInput {
  @Field(() => String, {
    description: 'Google ID token from Google One Tap',
  })
  @IsNotEmpty()
  @IsString()
  idToken: string;
}
