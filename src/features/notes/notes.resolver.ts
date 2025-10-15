import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { Note, NoteType, NoteStatus } from './entities/note.model';
import { CreateNoteInput } from './dto/create-note.input';
import { UpdateNoteInput } from './dto/update-note.input';
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

  @Query(() => [Note])
  async getMyNotes(
    @Context() ctx: any,
    @Args('type', { type: () => NoteType, nullable: true }) type?: NoteType,
    @Args('status', { type: () => NoteStatus, nullable: true })
    status?: NoteStatus,
    @Args('isArchived', { type: () => Boolean, nullable: true })
    isArchived?: boolean,
    @Args('isPinned', { type: () => Boolean, nullable: true })
    isPinned?: boolean,
    @Args('tags', { type: () => [String], nullable: true }) tags?: string[],
  ): Promise<Note[]> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.findAllByProfile(profileId, {
      type,
      status,
      isArchived,
      isPinned,
      tags,
    });
  }

  @Query(() => Note)
  async getNote(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ): Promise<Note> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.findOne(id, profileId);
  }

  @Query(() => [Note])
  async getUpcomingNotes(@Context() ctx: any): Promise<Note[]> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.getUpcoming(profileId);
  }

  @Query(() => [Note])
  async getOverdueNotes(@Context() ctx: any): Promise<Note[]> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.getOverdue(profileId);
  }

  @Query(() => [Note])
  async searchNotes(
    @Args('query') query: string,
    @Context() ctx: any,
  ): Promise<Note[]> {
    const profileId = ctx.req.user.profileId;
    return await this.notes.searchNotes(profileId, query);
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
