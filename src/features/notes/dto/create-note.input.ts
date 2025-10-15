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
export class CreateNoteInput {
  @Field()
  @IsString()
  @MaxLength(255)
  title: string;

  @Field()
  @IsString()
  content: string;

  @Field(() => NoteType, { defaultValue: NoteType.NOTE })
  @IsOptional()
  @IsEnum(NoteType)
  type?: NoteType;

  @Field(() => NoteStatus, { defaultValue: NoteStatus.PENDING })
  @IsOptional()
  @IsEnum(NoteStatus)
  status?: NoteStatus;

  @Field(() => NotePriority, { defaultValue: NotePriority.MEDIUM })
  @IsOptional()
  @IsEnum(NotePriority)
  priority?: NotePriority;

  @Field({ nullable: true })
  @IsOptional()
  dueDate?: Date;

  @Field(() => [String], { defaultValue: [] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
