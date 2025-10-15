import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { SECURITY_CONFIG } from '@/config/security.config';

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsNotEmpty({ message: 'Email cannot be empty.' })
  @IsString()
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;

  @Field()
  @IsNotEmpty({ message: 'OTP (One-Time Password) cannot be empty.' })
  @IsString()
  // Optional but recommended: Add length/format checks for your specific OTP format (e.g., IsLength(6))
  otp: string;

  @Field()
  @IsNotEmpty({ message: 'New password cannot be empty.' })
  @IsString()
  @MinLength(SECURITY_CONFIG.password.MIN_LENGTH, {
    message: `New password must be at least ${SECURITY_CONFIG.password.MIN_LENGTH} characters long.`,
  })
  @Matches(new RegExp(SECURITY_CONFIG.password.REGEX_PATTERN), {
    message: SECURITY_CONFIG.password.MESSAGE,
  })
  newPassword: string;
}
