import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
// no external date library; helpers below
import { PrismaService } from '../../database/prisma.service.js';
import { DomainEvents } from '../../common/events/domain-events.js';
import { TasksRepository } from './tasks.repository.js';
import { toTaskDto } from './tasks.mapper.js';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasks: TasksRepository,
    private readonly prisma: PrismaService,
    private readonly events: DomainEvents,
  ) {}

  private async activeMember(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId, status: 'active' },
    });
  }

  private async workspaceRole(userId: string, workspaceId: string) {
    const m = await this.activeMember(workspaceId, userId);
    return (m?.role ?? null) as string | null;
  }

  private isManager(role: string | null) {
    return role === 'owner' || role === 'admin';
  }

  private ensureMember(role: string | null) {
    if (!role || role === 'guest') {
      throw new ForbiddenException({
        code: 'insufficient_workspace_role',
        message: 'Your workspace role cannot perform this action.',
      });
    }
  }

  private async validateAssignee(
    workspaceId: string,
    assigneeId: string | null | undefined,
  ) {
    if (assigneeId === undefined || assigneeId === null) return;
    const member = await this.activeMember(workspaceId, assigneeId);
    if (!member) {
      throw new BadRequestException({
        code: 'invalid_assignee',
        message: 'Assignee must be an active workspace member.',
      });
    }
  }

  private async validateProject(
    workspaceId: string,
    projectId: string | null | undefined,
  ) {
    if (projectId === undefined || projectId === null) return;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.workspaceId !== workspaceId) {
      throw new BadRequestException({
        code: 'invalid_project',
        message: 'Project must belong to the same workspace.',
      });
    }
  }

  async listByWorkspace(
    workspaceId: string,
    userId: string,
    filters: {
      search?: string;
      status?: string;
      priority?: string;
      project?: string;
      assignee?: string;
      sort?: string;
      direction?: string;
    },
  ) {
    const role = await this.workspaceRole(userId, workspaceId);
    if (!role)
      throw new ForbiddenException({
        code: 'not_a_member',
        message: 'You are not a member of this workspace.',
      });
    let tasks = await this.tasks.findForWorkspace(workspaceId);
    const f = filters ?? {};
    if (f.search) {
      const q = f.search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    if (f.status && f.status !== 'all')
      tasks = tasks.filter((t) => t.status === f.status);
    if (f.priority && f.priority !== 'all')
      tasks = tasks.filter((t) => t.priority === f.priority);
    if (f.project && f.project !== 'all')
      tasks = tasks.filter((t) => t.projectId === f.project);
    if (f.assignee && f.assignee !== 'all') {
      if (f.assignee === 'unassigned')
        tasks = tasks.filter((t) => !t.assigneeId);
      else tasks = tasks.filter((t) => t.assigneeId === f.assignee);
    }
    const sort = f.sort ?? 'createdAt';
    const dir = f.direction === 'asc' ? 1 : -1;
    tasks.sort((a, b) => {
      const va =
        sort === 'dueDate'
          ? (a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER)
          : sort === 'priority'
            ? a.priority
            : sort === 'title'
              ? a.title.toLowerCase()
              : a.createdAt.getTime();
      const vb =
        sort === 'dueDate'
          ? (b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER)
          : sort === 'priority'
            ? b.priority
            : sort === 'title'
              ? b.title.toLowerCase()
              : b.createdAt.getTime();
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return tasks.map((t) => toTaskDto(t));
  }

  async getById(id: string, userId: string) {
    const task = await this.tasks.findById(id);
    if (!task || task.deletedAt)
      throw new NotFoundException({
        code: 'task_not_found',
        message: 'Task not found.',
      });
    const role = await this.workspaceRole(userId, task.workspaceId);
    if (!role)
      throw new NotFoundException({
        code: 'task_not_found',
        message: 'Task not found.',
      });
    return toTaskDto(task);
  }

  async create(input: any, userId: string) {
    const workspaceId = input.workspaceId;
    const role = await this.workspaceRole(userId, workspaceId);
    this.ensureMember(role);
    if (role === 'guest')
      throw new ForbiddenException({
        code: 'insufficient_workspace_role',
        message: 'Your workspace role cannot perform this action.',
      });
    if (role === null)
      throw new ForbiddenException({
        code: 'not_a_member',
        message: 'You are not a member of this workspace.',
      });

    await this.validateAssignee(workspaceId, input.assigneeId);
    await this.validateProject(workspaceId, input.projectId);

    const initialStatus = input.status ?? 'todo';
    const data = {
      id: `tsk-${randomUUID()}`,
      workspaceId,
      projectId: input.projectId ?? null,
      title: input.title,
      description: input.description ?? '',
      status: initialStatus,
      priority: input.priority ?? 'medium',
      category:
        input.category ??
        (input.projectId
          ? 'General'
          : workspaceId === `ws-personal-${userId}`
            ? 'Personal'
            : 'General'),
      startDate: input.startDate ?? null,
      dueDate: input.dueDate ?? null,
      assigneeId: input.assigneeId ?? null,
      creatorId: userId, // ignore client-supplied
      tags: input.tags ?? [],
      subtasks: input.subtasks ?? [],
      comments: input.comments ?? [],
      estimateMinutes: input.estimateMinutes ?? null,
      trackedMinutes: input.trackedMinutes ?? 0,
      recurrence: input.recurrence ?? 'none',
      completedAt:
        input.completedAt ??
        (initialStatus === 'completed' ? new Date().toISOString() : null),
    };

    const created = await this.tasks.create(data);
    try {
      this.events.emit('task.created', {
        workspaceId,
        taskId: created!.id,
        actorId: userId,
        title: data.title,
        assigneeId: data.assigneeId,
      });
    } catch {
      /* noop */
    }
    let spawned: any = null;
    if (
      initialStatus === 'completed' &&
      (data.recurrence ?? 'none') !== 'none'
    ) {
      spawned = await this.spawnRecurrence(
        toTaskDto(created!) as any,
        created!.workspaceId,
        userId,
      );
    }
    const refreshed = await this.tasks.findById(created!.id);
    const child = spawned;
    return toTaskDto(refreshed!, child);
  }

  private recurrenceNextDate(recurrence: string, dueDate: string | null) {
    const base = dueDate ? new Date(dueDate) : new Date();
    if (recurrence === 'daily') {
      const out = new Date(base);
      out.setUTCDate(out.getUTCDate() + 1);
      return out.toISOString();
    }
    if (recurrence === 'weekly') {
      const out = new Date(base);
      out.setUTCDate(out.getUTCDate() + 7);
      return out.toISOString();
    }
    if (recurrence === 'monthly') {
      const out = new Date(base);
      const origDay = out.getUTCDate();
      let month = out.getUTCMonth() + 1;
      let year = out.getUTCFullYear();
      if (month > 11) {
        month = 0;
        year += 1;
      }
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const day = Math.min(origDay, daysInMonth);
      return new Date(
        Date.UTC(
          year,
          month,
          day,
          out.getUTCHours(),
          out.getUTCMinutes(),
          out.getUTCSeconds(),
          out.getUTCMilliseconds(),
        ),
      ).toISOString();
    }
    return null;
  }

  private async spawnRecurrence(
    parent: any,
    workspaceId: string,
    userId: string,
  ) {
    const recurrence = parent.recurrence;
    if (!recurrence || recurrence === 'none') return null;
    const nextDue = this.recurrenceNextDate(recurrence, parent.dueDate);
    const childData = {
      id: `tsk-${randomUUID()}`,
      workspaceId: parent.workspaceId,
      projectId: parent.projectId,
      title: parent.title,
      description: parent.description,
      status: 'todo',
      priority: parent.priority,
      category: parent.category,
      startDate: null,
      dueDate: nextDue,
      assigneeId: parent.assigneeId,
      creatorId: userId,
      tags: parent.tags,
      subtasks: (parent.subtasks ?? []).map((s: any) => ({
        id: `st-${Math.random().toString(36).slice(2, 8)}`,
        title: s.title,
        done: false,
      })),
      estimateMinutes: parent.estimateMinutes,
      trackedMinutes: 0,
      recurrence: parent.recurrence,
      completedAt: null,
    };
    const child = await this.tasks.create(childData as any);
    return toTaskDto(child);
  }

  private completionTransition(old: any, patch: any) {
    return patch?.status === 'completed' && old.status !== 'completed';
  }

  async update(id: string, patch: any, userId: string) {
    const task = await this.tasks.findById(id);
    if (!task || task.deletedAt)
      throw new NotFoundException({
        code: 'task_not_found',
        message: 'Task not found.',
      });
    const role = await this.workspaceRole(userId, task.workspaceId);
    if (!role)
      throw new NotFoundException({
        code: 'task_not_found',
        message: 'Task not found.',
      });
    const isManager = this.isManager(role);
    const canUpdate =
      isManager || task.creatorId === userId || task.assigneeId === userId;
    if (!canUpdate)
      throw new ForbiddenException({
        code: 'insufficient_workspace_role',
        message: 'Your workspace role cannot perform this action.',
      });

    await this.validateAssignee(task.workspaceId, patch.assigneeId);
    await this.validateProject(task.workspaceId, patch.projectId);

    const oldStatus = task.status;
    const oldRecurrence = task.recurrence;
    const updated = await this.tasks.update(id, patch, task);

    let spawnedDto: any = null;
    const patchStatus = patch.status ?? task.status;
    if (
      patchStatus === 'completed' &&
      oldStatus !== 'completed' &&
      (patch.recurrence ?? oldRecurrence) !== 'none'
    ) {
      spawnedDto = await this.spawnRecurrence(
        toTaskDto(updated) as any,
        task.workspaceId,
        userId,
      );
    }
    if (patchStatus === 'completed' && oldStatus !== 'completed') {
      try {
        this.events.emit('task.completed', {
          workspaceId: task.workspaceId,
          taskId: id,
          actorId: userId,
          title: task.title,
          assigneeId: task.assigneeId,
        });
      } catch {
        /* noop */
      }
    }
    if (
      patch.assigneeId !== undefined &&
      patch.assigneeId !== task.assigneeId &&
      patch.assigneeId &&
      patch.assigneeId !== userId
    ) {
      try {
        this.events.emit('task.assigned', {
          workspaceId: task.workspaceId,
          taskId: id,
          actorId: userId,
          title: updated!.title,
          assigneeId: patch.assigneeId,
        });
      } catch {
        /* noop */
      }
    }
    try {
      this.events.emit('task.updated', {
        workspaceId: task.workspaceId,
        taskId: id,
        actorId: userId,
        title: updated!.title,
      });
    } catch {
      /* noop */
    }
    return toTaskDto(updated!, spawnedDto);
  }

  async softDelete(id: string, userId: string) {
    const task = await this.tasks.findById(id);
    if (!task || task.deletedAt)
      throw new NotFoundException({
        code: 'task_not_found',
        message: 'Task not found.',
      });
    const role = await this.workspaceRole(userId, task.workspaceId);
    if (!role)
      throw new NotFoundException({
        code: 'task_not_found',
        message: 'Task not found.',
      });
    const canDelete =
      this.isManager(role) ||
      task.creatorId === userId ||
      task.assigneeId === userId;
    if (!canDelete)
      throw new ForbiddenException({
        code: 'insufficient_workspace_role',
        message: 'Your workspace role cannot perform this action.',
      });
    await this.tasks.softDelete(id);
    try {
      this.events.emit('task.updated', {
        workspaceId: task.workspaceId,
        taskId: id,
        actorId: userId,
        title: task.title,
      });
    } catch {
      /* noop */
    }
  }

  async restore(id: string, userId: string) {
    const task = await this.tasks.findById(id, true);
    if (!task)
      throw new NotFoundException({
        code: 'task_not_found',
        message: 'Task not found.',
      });
    const role = await this.workspaceRole(userId, task.workspaceId);
    if (!role)
      throw new NotFoundException({
        code: 'task_not_found',
        message: 'Task not found.',
      });
    const canRestore =
      this.isManager(role) ||
      task.creatorId === userId ||
      task.assigneeId === userId;
    if (!canRestore)
      throw new ForbiddenException({
        code: 'insufficient_workspace_role',
        message: 'Your workspace role cannot perform this action.',
      });
    await this.tasks.restore(id);
    try {
      this.events.emit('task.updated', {
        workspaceId: task.workspaceId,
        taskId: id,
        actorId: userId,
        title: task.title,
      });
    } catch {
      /* noop */
    }
  }

  async bulkStatus(ids: string[], status: string, userId: string) {
    // validate all
    const tasks = await Promise.all(ids.map((id) => this.tasks.findById(id)));
    for (const t of tasks) {
      if (!t || t.deletedAt)
        throw new NotFoundException({
          code: 'task_not_found',
          message: 'Task not found.',
        });
      const role = await this.workspaceRole(userId, t.workspaceId);
      if (!role || role === 'guest')
        throw new ForbiddenException({
          code: 'insufficient_workspace_role',
          message: 'Your workspace role cannot perform this action.',
        });
      const canUpdate =
        this.isManager(role) ||
        t.creatorId === userId ||
        t.assigneeId === userId;
      if (!canUpdate)
        throw new ForbiddenException({
          code: 'insufficient_workspace_role',
          message: 'Your workspace role cannot perform this action.',
        });
    }
    const completedAt =
      status === 'completed' ? new Date().toISOString() : null;
    await this.tasks.bulkUpdate(ids, { status, completedAt });
    for (const t of tasks) {
      if (!t) continue;
      if (
        status === 'completed' &&
        t.status !== 'completed' &&
        t.recurrence &&
        t.recurrence !== 'none'
      ) {
        const fresh = await this.tasks.findById(t.id);
        if (fresh)
          await this.spawnRecurrence(
            toTaskDto(fresh) as any,
            fresh.workspaceId,
            userId,
          );
      }
    }
    const updated = await Promise.all(ids.map((id) => this.tasks.findById(id)));
    return updated.map((t) => toTaskDto(t!));
  }

  async bulkDelete(ids: string[], userId: string) {
    const tasks = await Promise.all(ids.map((id) => this.tasks.findById(id)));
    for (const t of tasks) {
      if (!t || t.deletedAt)
        throw new NotFoundException({
          code: 'task_not_found',
          message: 'Task not found.',
        });
      const role = await this.workspaceRole(userId, t.workspaceId);
      if (!role || role === 'guest')
        throw new ForbiddenException({
          code: 'insufficient_workspace_role',
          message: 'Your workspace role cannot perform this action.',
        });
      const canDelete =
        this.isManager(role) ||
        t.creatorId === userId ||
        t.assigneeId === userId;
      if (!canDelete)
        throw new ForbiddenException({
          code: 'insufficient_workspace_role',
          message: 'Your workspace role cannot perform this action.',
        });
    }
    for (const id of ids) await this.tasks.softDelete(id);
  }

  async addComment(
    taskId: string,
    authorId: string,
    content: string,
    userId: string,
  ) {
    const task = await this.tasks.findById(taskId);
    if (!task || task.deletedAt)
      throw new NotFoundException({
        code: 'task_not_found',
        message: 'Task not found.',
      });
    const role = await this.workspaceRole(userId, task.workspaceId);
    this.ensureMember(role);
    // add via repository pattern using direct prisma
    await this.prisma.taskComment.create({
      data: { id: `cmt-${randomUUID()}`, taskId, authorId, content },
    });
    try {
      this.events.emit('task.comment_added', {
        workspaceId: task.workspaceId,
        taskId,
        authorId,
        title: task.title,
      });
    } catch {
      /* noop */
    }
    const updated = await this.tasks.findById(taskId);
    return toTaskDto(updated!);
  }

  async addTimeEntry(
    taskId: string,
    minutes: number,
    note: string | undefined,
    userId: string,
  ) {
    const task = await this.tasks.findById(taskId);
    if (!task || task.deletedAt)
      throw new NotFoundException({
        code: 'task_not_found',
        message: 'Task not found.',
      });
    const role = await this.workspaceRole(userId, task.workspaceId);
    this.ensureMember(role);
    const updated = await this.tasks.addTimeEntry(taskId, minutes, note);
    try {
      this.events.emit('task.updated', {
        workspaceId: task.workspaceId,
        taskId,
        actorId: userId,
        title: task.title,
      });
    } catch {
      /* noop */
    }
    return toTaskDto(updated!);
  }
}
