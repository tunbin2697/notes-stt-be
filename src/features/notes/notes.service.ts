import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BusinessRuleException } from '@/common/exceptions/business-rule.exception';
import { CreateNoteInput } from './dto/create-note.input';
import { UpdateNoteInput } from './dto/update-note.input';
import { NoteType, NoteStatus } from './entities/note.model';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async createNote(profileId: number, data: CreateNoteInput) {
    return await (this.prisma as any).note.create({
      data: {
        ...data,
        profileId,
      },
    });
  }

  async findAllByProfile(
    profileId: number,
    filters?: {
      type?: NoteType;
      status?: NoteStatus;
      isArchived?: boolean;
      isPinned?: boolean;
      tags?: string[];
    },
  ) {
    const where: any = { profileId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.isArchived !== undefined)
      where.isArchived = filters.isArchived;
    if (filters?.isPinned !== undefined) where.isPinned = filters.isPinned;
    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    return await (this.prisma as any).note.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { dueDate: 'asc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  async findOne(id: number, profileId: number) {
    const note = await (this.prisma as any).note.findUnique({
      where: { id },
    });

    if (!note) {
      throw new BusinessRuleException('Note not found');
    }

    if (note.profileId !== profileId) {
      throw new BusinessRuleException(
        'You do not have permission to access this note',
      );
    }

    return note;
  }

  async updateNote(id: number, profileId: number, data: UpdateNoteInput) {
    // Verify ownership
    await this.findOne(id, profileId);

    // If marking as completed, set completedAt
    if (data.status === NoteStatus.COMPLETED && !data.completedAt) {
      data.completedAt = new Date();
    }

    // If marking as not completed, clear completedAt
    if (data.status && data.status !== NoteStatus.COMPLETED) {
      data.completedAt = null as any;
    }

    return await (this.prisma as any).note.update({
      where: { id },
      data,
    });
  }

  async deleteNote(id: number, profileId: number) {
    // Verify ownership
    await this.findOne(id, profileId);

    await (this.prisma as any).note.delete({
      where: { id },
    });

    return true;
  }

  async archiveNote(id: number, profileId: number) {
    return await this.updateNote(id, profileId, { isArchived: true });
  }

  async unarchiveNote(id: number, profileId: number) {
    return await this.updateNote(id, profileId, { isArchived: false });
  }

  async pinNote(id: number, profileId: number) {
    return await this.updateNote(id, profileId, { isPinned: true });
  }

  async unpinNote(id: number, profileId: number) {
    return await this.updateNote(id, profileId, { isPinned: false });
  }

  async completeTask(id: number, profileId: number) {
    return await this.updateNote(id, profileId, {
      status: NoteStatus.COMPLETED,
      completedAt: new Date(),
    });
  }

  async uncompleteTask(id: number, profileId: number) {
    return await this.updateNote(id, profileId, {
      status: NoteStatus.PENDING,
      completedAt: null as any,
    });
  }

  // Get upcoming tasks/todos (due within next 7 days)
  async getUpcoming(profileId: number) {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return await (this.prisma as any).note.findMany({
      where: {
        profileId,
        isArchived: false,
        status: { not: NoteStatus.COMPLETED },
        dueDate: {
          gte: now,
          lte: nextWeek,
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  // Get overdue tasks/todos
  async getOverdue(profileId: number) {
    const now = new Date();

    return await (this.prisma as any).note.findMany({
      where: {
        profileId,
        isArchived: false,
        status: { not: NoteStatus.COMPLETED },
        dueDate: {
          lt: now,
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  // Search notes by title or content
  async searchNotes(profileId: number, query: string) {
    return await (this.prisma as any).note.findMany({
      where: {
        profileId,
        isArchived: false,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
