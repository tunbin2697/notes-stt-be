import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

@InputType()
export class CorrectTextInput {
  @Field(() => String, { description: 'Text to be corrected' })
  @IsString()
  @IsNotEmpty({ message: 'Text cannot be empty' })
  @MaxLength(5000, { message: 'Text cannot exceed 5000 characters' })
  text: string;
}
