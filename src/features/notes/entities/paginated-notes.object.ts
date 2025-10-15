import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Note } from './note.model';

@ObjectType()
export class PageInfo {
  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  offset: number;

  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  totalPages: number;
}

@ObjectType()
export class PaginatedNotes {
  @Field(() => [Note])
  nodes: Note[];

  @Field(() => Int)
  totalCount: number;

  @Field()
  hasMore: boolean;

  @Field(() => Int, { nullable: true })
  nextCursor?: number;

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}
