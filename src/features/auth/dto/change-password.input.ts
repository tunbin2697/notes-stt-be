import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { SECURITY_CONFIG } from '@/config/security.config';

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsNotEmpty({ message: 'Current password cannot be empty.' })
  @IsString()
  currentPassword: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  @MinLength(SECURITY_CONFIG.password.MIN_LENGTH, {
    message: `Password must be at least ${SECURITY_CONFIG.password.MIN_LENGTH} characters long.`,
  })
  @Matches(new RegExp(SECURITY_CONFIG.password.REGEX_PATTERN), {
    message: SECURITY_CONFIG.password.MESSAGE,
  })
  newPassword: string;
}
