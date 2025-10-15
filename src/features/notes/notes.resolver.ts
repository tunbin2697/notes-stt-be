import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { Note } from './entities/note.model';
import { PaginatedNotes } from './entities/paginated-notes.object';
import { CreateNoteInput } from './dto/create-note.input';
import { UpdateNoteInput } from './dto/update-note.input';
import { PaginationArgs } from './dto/pagination.args';
import { NotesFilterArgs } from './dto/notes-filter.args';
import { GqlAuthGuard } from '@/common/security/guards/gql-auth.guard';

@Resolver(() => Note)
@UseGuards(GqlAuthGuard)
export class NotesResolver {
  constructor(private notes: NotesService) {}

  @Mutation(() => Note)
  async createNote(
    @Args('input') input: CreateNoteInput,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.createNote(profileId, input);
  }

  @Query(() => PaginatedNotes)
  async getMyNotes(
    @Context() ctx: any,
    @Args() pagination: PaginationArgs,
    @Args() filters: NotesFilterArgs,
  ): Promise<PaginatedNotes> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.findAllByProfile(
      profileId,
      {
        type: filters.type,
        status: filters.status,
        isArchived: filters.isArchived,
        isPinned: filters.isPinned,
        tags: filters.tags,
      },
      {
        limit: pagination.limit,
        offset: pagination.offset,
        cursor: pagination.cursor,
      },
    );
  }

  @Query(() => Note)
  async getNote(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.findOne(id, profileId);
  }

  @Query(() => PaginatedNotes)
  async getUpcomingNotes(
    @Context() ctx: any,
    @Args() pagination: PaginationArgs,
  ): Promise<PaginatedNotes> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.getUpcoming(profileId, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Query(() => PaginatedNotes)
  async getOverdueNotes(
    @Context() ctx: any,
    @Args() pagination: PaginationArgs,
  ): Promise<PaginatedNotes> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.getOverdue(profileId, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Query(() => PaginatedNotes)
  async searchNotes(
    @Args('query') query: string,
    @Context() ctx: any,
    @Args() pagination: PaginationArgs,
  ): Promise<PaginatedNotes> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.searchNotes(profileId, query, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Mutation(() => Note)
  async updateNote(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateNoteInput,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.updateNote(id, profileId, input);
  }

  @Mutation(() => Boolean)
  async deleteNote(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<boolean> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.deleteNote(id, profileId);
  }

  @Mutation(() => Note)
  async archiveNote(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.archiveNote(id, profileId);
  }

  @Mutation(() => Note)
  async unarchiveNote(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.unarchiveNote(id, profileId);
  }

  @Mutation(() => Note)
  async pinNote(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.pinNote(id, profileId);
  }

  @Mutation(() => Note)
  async unpinNote(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.unpinNote(id, profileId);
  }

  @Mutation(() => Note)
  async completeTask(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.completeTask(id, profileId);
  }

  @Mutation(() => Note)
  async uncompleteTask(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.uncompleteTask(id, profileId);
  }
}
