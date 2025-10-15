import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { NoteType } from '../../../enums/NoteType';
import { NotePriority } from '../../../enums/NotePriority';
import { NoteStatus } from '../../../enums/NoteStatus';

// Register enums with GraphQL
registerEnumType(NoteType, {
  name: 'NoteType',
  description: 'Type of note: NOTE, TASK, TODO, or REMINDER',
});

registerEnumType(NotePriority, {
  name: 'NotePriority',
  description: 'Priority level of the note',
});

registerEnumType(NoteStatus, {
  name: 'NoteStatus',
  description: 'Status of task/todo',
});

@ObjectType()
export class Note {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field(() => NoteType)
  type: NoteType;

  @Field(() => NoteStatus)
  status: NoteStatus;

  @Field(() => NotePriority)
  priority: NotePriority;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field(() => [String])
  tags: string[];

  @Field({ nullable: true })
  color?: string;

  @Field()
  isPinned: boolean;

  @Field()
  isArchived: boolean;

  @Field(() => Int)
  profileId: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
