import { InputType, Field } from '@nestjs/graphql';
import { NoteType, NotePriority, NoteStatus } from '../entities/note.model';

@InputType()
export class CreateNoteInput {
  @Field()
  title: string;

  @Field()
  content: string;

  @Field(() => NoteType, { defaultValue: NoteType.NOTE })
  type?: NoteType;

  @Field(() => NoteStatus, { defaultValue: NoteStatus.PENDING })
  status?: NoteStatus;

  @Field(() => NotePriority, { defaultValue: NotePriority.MEDIUM })
  priority?: NotePriority;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field(() => [String], { defaultValue: [] })
  tags?: string[];

  @Field({ nullable: true })
  color?: string;

  @Field({ defaultValue: false })
  isPinned?: boolean;
}
