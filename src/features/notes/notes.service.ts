import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BusinessRuleException } from '@/common/exceptions/business-rule.exception';
import { CreateNoteInput } from './dto/create-note.input';
import { UpdateNoteInput } from './dto/update-note.input';
import { NoteType } from '../../enums/NoteType';
import { NoteStatus } from '../../enums/NoteStatus';

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
    pagination?: {
      limit?: number;
      offset?: number;
      cursor?: number;
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

    const orderBy = [
      { isPinned: 'desc' },
      { dueDate: 'asc' },
      { updatedAt: 'desc' },
    ];

    // Cursor-based pagination (preferred for real-time data)
    if (pagination?.cursor) {
      where.id = { lt: pagination.cursor };
    }

    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    // Get total count for pagination info
    const totalCount = await (this.prisma as any).note.count({ where });

    // Fetch notes with pagination
    const notes = await (this.prisma as any).note.findMany({
      where,
      orderBy,
      take: limit + 1, // Fetch one extra to check if there are more
      skip: pagination?.cursor ? 0 : offset,
    });

    // Check if there are more results
    const hasMore = notes.length > limit;
    if (hasMore) {
      notes.pop(); // Remove the extra item
    }

    // Get next cursor (ID of last item)
    const nextCursor =
      hasMore && notes.length > 0 ? notes[notes.length - 1].id : null;

    return {
      nodes: notes,
      totalCount,
      hasMore,
      nextCursor,
      pageInfo: {
        limit,
        offset,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
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
  async getUpcoming(
    profileId: number,
    pagination?: { limit?: number; offset?: number },
  ) {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const where = {
      profileId,
      isArchived: false,
      status: { not: NoteStatus.COMPLETED },
      dueDate: {
        gte: now,
        lte: nextWeek,
      },
    };

    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    const [totalCount, notes] = await Promise.all([
      (this.prisma as any).note.count({ where }),
      (this.prisma as any).note.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      nodes: notes,
      totalCount,
      hasMore: offset + notes.length < totalCount,
      pageInfo: {
        limit,
        offset,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  // Get overdue tasks/todos
  async getOverdue(
    profileId: number,
    pagination?: { limit?: number; offset?: number },
  ) {
    const now = new Date();

    const where = {
      profileId,
      isArchived: false,
      status: { not: NoteStatus.COMPLETED },
      dueDate: {
        lt: now,
      },
    };

    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    const [totalCount, notes] = await Promise.all([
      (this.prisma as any).note.count({ where }),
      (this.prisma as any).note.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      nodes: notes,
      totalCount,
      hasMore: offset + notes.length < totalCount,
      pageInfo: {
        limit,
        offset,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  // Search notes by title or content
  async searchNotes(
    profileId: number,
    query: string,
    pagination?: { limit?: number; offset?: number },
  ) {
    const where = {
      profileId,
      isArchived: false,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ],
    };

    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    const [totalCount, notes] = await Promise.all([
      (this.prisma as any).note.count({ where }),
      (this.prisma as any).note.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      nodes: notes,
      totalCount,
      hasMore: offset + notes.length < totalCount,
      pageInfo: {
        limit,
        offset,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}
