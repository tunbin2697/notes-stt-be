import { ArgsType, Field } from '@nestjs/graphql';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { NoteType } from '../../../enums/NoteType';
import { NoteStatus } from '../../../enums/NoteStatus';

@ArgsType()
export class NotesFilterArgs {
  @Field(() => NoteType, { nullable: true })
  @IsOptional()
  @IsEnum(NoteType, { message: 'Type must be a valid NoteType' })
  type?: NoteType;

  @Field(() => NoteStatus, { nullable: true })
  @IsOptional()
  @IsEnum(NoteStatus, { message: 'Status must be a valid NoteStatus' })
  status?: NoteStatus;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean({ message: 'isArchived must be a boolean' })
  isArchived?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean({ message: 'isPinned must be a boolean' })
  isPinned?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @ArrayMaxSize(20, { message: 'Maximum 20 tags allowed' })
  tags?: string[];
}
