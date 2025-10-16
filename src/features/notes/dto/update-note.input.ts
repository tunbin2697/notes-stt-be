import { InputType, Field } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { NoteType } from '../../../enums/NoteType';
import { NotePriority } from '../../../enums/NotePriority';
import { NoteStatus } from '../../../enums/NoteStatus';

@InputType()
export class UpdateNoteInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  content?: string;

  @Field(() => NoteType, { nullable: true })
  @IsOptional()
  @IsEnum(NoteType)
  type?: NoteType;

  @Field(() => NoteStatus, { nullable: true })
  @IsOptional()
  @IsEnum(NoteStatus)
  status?: NoteStatus;

  @Field(() => NotePriority, { nullable: true })
  @IsOptional()
  @IsEnum(NotePriority)
  priority?: NotePriority;

  @Field({ nullable: true })
  @IsOptional()
  dueDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  completedAt?: Date;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
