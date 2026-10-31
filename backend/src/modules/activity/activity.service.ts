import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ActivityRepository } from './activity.repository.js';

@Injectable()
export class ActivityService {
  constructor(
    private readonly repo: ActivityRepository,
    private readonly prisma: PrismaService,
  ) {}
  private async activeMember(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId, status: 'active' },
    });
  }
  async listByWorkspace(workspaceId: string, userId: string) {
    const m = await this.activeMember(workspaceId, userId);
    if (!m)
      throw new ForbiddenException({
        code: 'not_a_member',
        message: 'You are not a member of this workspace.',
      });
    const rows = await this.repo.findForWorkspace(workspaceId);
    return rows.map((r: any) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      actorId: r.actorId ?? '',
      action: r.action,
      targetType: r.targetType,
      targetName: r.targetName,
      createdAt: r.createdAt.toISOString(),
      metadata: r.metadata ?? undefined,
    }));
  }
  async record(workspaceId: string, actorId: string, data: any) {
    const row = await this.repo.create({
      workspaceId,
      actorId,
      action: data.action,
      targetType: data.targetType,
      targetName: data.targetName,
      metadata: data.metadata ?? undefined,
    });
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      actorId: row.actorId ?? '',
      action: row.action,
      targetType: row.targetType,
      targetName: row.targetName,
      createdAt: row.createdAt.toISOString(),
      metadata: row.metadata ?? undefined,
    };
  }
  async listFocusSessions(userId: string) {
    const rows = await this.repo.findFocusSessions(userId);
    return rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      workspaceId: r.workspaceId,
      taskId: r.taskId,
      startedAt: r.startedAt.toISOString(),
      minutes: r.minutes,
    }));
  }
  async logFocusSession(data: any) {
    const row = await this.repo.createFocusSession({
      userId: data.userId,
      workspaceId: data.workspaceId,
      taskId: data.taskId ?? null,
      startedAt: new Date(data.startedAt),
      minutes: data.minutes,
    });
    return {
      id: row.id,
      userId: row.userId,
      workspaceId: row.workspaceId,
      taskId: row.taskId,
      startedAt: row.startedAt.toISOString(),
      minutes: row.minutes,
    };
  }
}
