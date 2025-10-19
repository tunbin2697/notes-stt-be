import { ArgsType, Field } from '@nestjs/graphql';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsString,
  ArrayMaxSize,
} from 'class-validator';
import { NoteType } from '../../../enums/NoteType';
import { NoteStatus } from '../../../enums/NoteStatus';
import { NotePriority } from '../../../enums/NotePriority';

@ArgsType()
export class NotesFilterArgs {
  @Field(() => NoteType, { nullable: true, description: 'Filter by note type' })
  @IsOptional()
  @IsEnum(NoteType, { message: 'Type must be a valid NoteType' })
  type?: NoteType;

  @Field(() => NoteStatus, { nullable: true, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(NoteStatus, { message: 'Status must be a valid NoteStatus' })
  status?: NoteStatus;

  @Field(() => NotePriority, {
    nullable: true,
    description: 'Filter by priority',
  })
  @IsOptional()
  @IsEnum(NotePriority, { message: 'Priority must be a valid NotePriority' })
  priority?: NotePriority;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Filter archived notes',
  })
  @IsOptional()
  @IsBoolean({ message: 'isArchived must be a boolean' })
  isArchived?: boolean;

  @Field(() => Boolean, { nullable: true, description: 'Filter pinned notes' })
  @IsOptional()
  @IsBoolean({ message: 'isPinned must be a boolean' })
  isPinned?: boolean;

  @Field(() => [String], {
    nullable: true,
    description: 'Filter by tags (max 20)',
  })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @ArrayMaxSize(20, { message: 'Maximum 20 tags allowed' })
  tags?: string[];

  @Field(() => String, {
    nullable: true,
    description: 'Search in title and content',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Filter upcoming notes (due within 7 days)',
  })
  @IsOptional()
  @IsBoolean()
  isUpcoming?: boolean;

  @Field(() => Boolean, { nullable: true, description: 'Filter overdue notes' })
  @IsOptional()
  @IsBoolean()
  isOverdue?: boolean;
}
