import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Prisma.TransactionClient): Prisma.TransactionClient {
    return (tx ?? this.prisma) as unknown as Prisma.TransactionClient;
  }

  async findForWorkspace(workspaceId: string, includeDeleted = false) {
    return this.prisma.task.findMany({
      where: {
        workspaceId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        subtasks: { orderBy: { position: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
        timeEntries: true,
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findById(id: string, includeDeleted = false) {
    return this.prisma.task.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: {
        subtasks: { orderBy: { position: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
        timeEntries: true,
      },
    });
  }

  private async replaceSubtasks(
    db: Prisma.TransactionClient,
    taskId: string,
    items: any[],
  ) {
    await db.subtask.deleteMany({ where: { taskId } });
    if (items?.length) {
      await db.subtask.createMany({
        data: items.map((s, index) => ({
          id: s.id ?? `st-${Date.now()}-${index}`,
          taskId,
          title: s.title,
          done: Boolean(s.done),
          position: index,
        })),
      });
    }
  }

  private async replaceComments(
    db: Prisma.TransactionClient,
    taskId: string,
    items: any[],
  ) {
    await db.taskComment.deleteMany({ where: { taskId } });
    if (items?.length) {
      await db.taskComment.createMany({
        data: items.map((c) => ({
          id:
            c.id ??
            `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          taskId,
          authorId: c.authorId,
          content: c.content,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        })),
      });
    }
  }

  async create(data: any) {
    const db = this.prisma;
    const task = await db.task.create({
      data: {
        id: data.id,
        workspaceId: data.workspaceId,
        projectId: data.projectId ?? null,
        title: data.title,
        description: data.description ?? '',
        status: data.status ?? 'todo',
        priority: data.priority ?? 'medium',
        category: data.category ?? 'General',
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assigneeId ?? null,
        creatorId: data.creatorId,
        tags: data.tags ?? [],
        estimateMinutes: data.estimateMinutes ?? null,
        trackedMinutes: data.trackedMinutes ?? 0,
        recurrence: data.recurrence ?? 'none',
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
      },
      include: { subtasks: true, comments: true, timeEntries: true },
    });

    const db2 = this.prisma;
    if (data.subtasks?.length) {
      await this.replaceSubtasks(db2, task.id, data.subtasks);
    }
    if (data.comments?.length) {
      await this.replaceComments(db2, task.id, data.comments);
    }
    return this.findById(task.id, true);
  }

  async update(id: string, patch: any, _task: any) {
    const db = this.prisma;
    const _updated = await db.task.update({
      where: { id },
      data: {
        ...(patch.projectId !== undefined
          ? { projectId: patch.projectId }
          : {}),
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description }
          : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
        ...(patch.category !== undefined ? { category: patch.category } : {}),
        ...(patch.startDate !== undefined
          ? { startDate: patch.startDate ? new Date(patch.startDate) : null }
          : {}),
        ...(patch.dueDate !== undefined
          ? { dueDate: patch.dueDate ? new Date(patch.dueDate) : null }
          : {}),
        ...(patch.assigneeId !== undefined
          ? { assigneeId: patch.assigneeId }
          : {}),
        ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
        ...(patch.estimateMinutes !== undefined
          ? { estimateMinutes: patch.estimateMinutes }
          : {}),
        ...(patch.trackedMinutes !== undefined
          ? { trackedMinutes: patch.trackedMinutes }
          : {}),
        ...(patch.recurrence !== undefined
          ? { recurrence: patch.recurrence }
          : {}),
        ...(patch.completedAt !== undefined
          ? {
              completedAt: patch.completedAt
                ? new Date(patch.completedAt)
                : null,
            }
          : {}),
        ...(patch.updatedAt !== undefined
          ? { updatedAt: new Date(patch.updatedAt) }
          : {}),
        ...(patch.projectId === undefined ? {} : {}),
      },
    });

    const db2 = this.prisma;
    if (patch.subtasks !== undefined) {
      await this.replaceSubtasks(db2, id, patch.subtasks);
    }
    if (patch.comments !== undefined) {
      await this.replaceComments(db2, id, patch.comments);
    }
    return this.findById(id, true);
  }

  async softDelete(id: string) {
    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async bulkUpdate(ids: string[], patch: any) {
    await this.prisma.task.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.completedAt !== undefined
          ? {
              completedAt: patch.completedAt
                ? new Date(patch.completedAt)
                : null,
            }
          : {}),
      },
    });
    return Promise.all(ids.map((id) => this.findById(id, true)));
  }

  async addTimeEntry(taskId: string, minutes: number, note?: string) {
    await this.prisma.timeEntry.create({ data: { taskId, minutes, note } });
    const agg = await this.prisma.timeEntry.aggregate({
      where: { taskId },
      _sum: { minutes: true },
    });
    await this.prisma.task.update({
      where: { id: taskId },
      data: { trackedMinutes: agg._sum.minutes ?? 0 },
    });
    return this.findById(taskId, true);
  }
}
