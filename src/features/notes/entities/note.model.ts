import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';

// Enums for GraphQL
export enum NoteType {
  NOTE = 'NOTE',
  TASK = 'TASK',
  TODO = 'TODO',
  REMINDER = 'REMINDER',
}

export enum NotePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NoteStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

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
