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
  constructor(private notesService: NotesService) {}

  @Mutation(() => Note)
  async createNote(
    @Args('input') input: CreateNoteInput,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notesService.createNote(profileId, input);
  }

  @Query(() => PaginatedNotes, {
    description: 'Get notes with flexible filtering, pagination, and search',
  })
  async notes(
    @Context() ctx: any,
    @Args() pagination: PaginationArgs,
    @Args() filters: NotesFilterArgs,
  ): Promise<PaginatedNotes> {
    const profileId = ctx.req.user.profileId;

    return await this.notesService.findAllByProfile(
      profileId,
      {
        type: filters.type,
        status: filters.status,
        priority: filters.priority,
        isArchived: filters.isArchived,
        isPinned: filters.isPinned,
        tags: filters.tags,
        search: filters.search,
        isUpcoming: filters.isUpcoming,
        isOverdue: filters.isOverdue,
      },
      {
        limit: pagination.limit,
        offset: pagination.offset,
        cursor: pagination.cursor,
      },
    );
  }

  @Query(() => Note, {
    description: 'Get a single note by ID',
  })
  async note(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notesService.findOne(id, profileId);
  }

  @Mutation(() => Note)
  async updateNote(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateNoteInput,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notesService.updateNote(id, profileId, input);
  }

  @Mutation(() => Boolean)
  async deleteNote(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<boolean> {
    const profileId = ctx.req.user.profileId;
    return await this.notesService.deleteNote(id, profileId);
  }

  @Mutation(() => Note)
  async archiveNote(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notesService.archiveNote(id, profileId);
  }

  @Mutation(() => Note)
  async unarchiveNote(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notesService.unarchiveNote(id, profileId);
  }

  @Mutation(() => Note)
  async pinNote(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notesService.pinNote(id, profileId);
  }

  @Mutation(() => Note)
  async unpinNote(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notesService.unpinNote(id, profileId);
  }

  @Mutation(() => Note)
  async completeTask(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notesService.completeTask(id, profileId);
  }

  @Mutation(() => Note)
  async uncompleteTask(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notesService.uncompleteTask(id, profileId);
  }
}
