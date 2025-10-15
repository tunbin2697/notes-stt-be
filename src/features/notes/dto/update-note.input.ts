import { InputType, Field } from '@nestjs/graphql';
import { NoteType } from '../../../enums/NoteType';
import { NotePriority } from '../../../enums/NotePriority';
import { NoteStatus } from '../../../enums/NoteStatus';

@InputType()
export class UpdateNoteInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  content?: string;

  @Field(() => NoteType, { nullable: true })
  type?: NoteType;

  @Field(() => NoteStatus, { nullable: true })
  status?: NoteStatus;

  @Field(() => NotePriority, { nullable: true })
  priority?: NotePriority;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field({ nullable: true })
  color?: string;

  @Field({ nullable: true })
  isPinned?: boolean;

  @Field({ nullable: true })
  isArchived?: boolean;
}
