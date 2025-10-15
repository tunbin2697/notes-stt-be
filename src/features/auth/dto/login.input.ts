import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsNotEmpty({ message: 'Email cannot be empty.' })
  @IsString()
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;

  @Field()
  @IsNotEmpty({ message: 'Password cannot be empty.' })
  password: string;
}
