import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ProjectsRepository } from './projects.repository.js';
import { toProjectDto } from './projects.mapper.js';
import { DomainEvents } from '../../common/events/domain-events.js';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projects: ProjectsRepository,
    private readonly prisma: PrismaService,
    private readonly events: DomainEvents,
  ) {}

  private async workspaceRole(userId: string, workspaceId: string) {
    const m = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId, status: 'active' },
    });
    return (m?.role ?? null) as string | null;
  }

  private async ensureActiveMember(workspaceId: string, userId: string) {
    const member = await this.activeMember(workspaceId, userId);
    if (!member)
      throw new BadRequestException({
        code: 'invalid_assignee',
        message: 'User must be an active workspace member.',
      });
  }

  private async activeMember(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId, status: 'active' },
    });
  }

  async list(workspaceId: string, userId: string) {
    const role = await this.workspaceRole(userId, workspaceId);
    if (!role)
      throw new ForbiddenException({
        code: 'not_a_member',
        message: 'You are not a member of this workspace.',
      });
    const rows = await this.projects.findForWorkspace(workspaceId);
    return rows.map(toProjectDto);
  }

  async getById(id: string, userId: string) {
    const row = await this.projects.findById(id);
    if (!row)
      throw new NotFoundException({
        code: 'project_not_found',
        message: 'Project not found.',
      });
    const role = await this.workspaceRole(userId, row.workspaceId);
    if (!role)
      throw new NotFoundException({
        code: 'project_not_found',
        message: 'Project not found.',
      });
    return toProjectDto(row);
  }

  async create(data: any, userId: string) {
    const workspaceId = data.workspaceId;
    const role = await this.workspaceRole(userId, workspaceId);
    if (!role || role === 'guest')
      throw new ForbiddenException({
        code: 'insufficient_workspace_role',
        message: 'Your workspace role cannot perform this action.',
      });
    if (data.ownerId) await this.ensureActiveMember(workspaceId, data.ownerId);
    if (data.memberIds?.length) {
      for (const memberId of data.memberIds)
        await this.ensureActiveMember(workspaceId, memberId);
    }
    if (data.memberIds?.length) {
      const members = await this.prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          userId: { in: data.memberIds },
          status: 'active',
        },
        select: { userId: true },
      });
      if (members.length !== new Set(data.memberIds).size) {
        // allow owner to be included even if not active? keep strict
      }
    }
    const id = `p-${Date.now().toString(36)}`;
    const dtoData = {
      id,
      workspaceId,
      name: data.name,
      description: data.description ?? '',
      status: data.status ?? 'active',
      color: data.color,
      ownerId: data.ownerId ?? userId,
      memberIds: data.memberIds?.length ? data.memberIds : [userId],
      startDate: new Date(data.startDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    };

    await this.projects.create(dtoData);
    try {
      this.events.emit('project.created', {
        workspaceId,
        projectId: id,
        actorId: userId,
        name: dtoData.name,
      });
    } catch {
      /* noop */
    }
    // Ensure only active members
    await this.prisma.projectMember.deleteMany({
      where: {
        projectId: id,
        userId: {
          notIn: await this.activeMembers(workspaceId, dtoData.memberIds),
        },
      },
    });
    const row = await this.projects.findById(id);
    return toProjectDto(row!);
  }

  private async activeMembers(
    workspaceId: string,
    ids: string[],
  ): Promise<string[]> {
    const rows = await this.prisma.workspaceMember.findMany({
      where: { workspaceId, userId: { in: ids }, status: 'active' },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  async update(id: string, data: any, userId: string) {
    const row = await this.projects.findById(id);
    if (!row)
      throw new NotFoundException({
        code: 'project_not_found',
        message: 'Project not found.',
      });
    const role = await this.workspaceRole(userId, row.workspaceId);
    if (!role)
      throw new NotFoundException({
        code: 'project_not_found',
        message: 'Project not found.',
      });
    const isManager = role === 'owner' || role === 'admin';
    const isOwner = row.ownerId === userId;
    if (!isManager && !isOwner)
      throw new ForbiddenException({
        code: 'insufficient_workspace_role',
        message: 'Your workspace role cannot perform this action.',
      });

    if (data.memberIds) {
      // validate active workspace members
      const valid = await this.activeMembers(row.workspaceId, data.memberIds);
      await this.projects.replaceMembers(id, valid);
    }

    const updated = await this.projects.update(id, {
      name: data.name,
      description: data.description,
      status: data.status,
      color: data.color,
      ownerId: data.ownerId,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      dueDate:
        data.dueDate === undefined
          ? undefined
          : data.dueDate
            ? new Date(data.dueDate)
            : null,
    });
    const withMembers = await this.projects.findById(updated.id);
    try {
      this.events.emit('project.updated', {
        workspaceId: row.workspaceId,
        projectId: id,
        actorId: userId,
        name: updated.name,
      });
    } catch {
      /* noop */
    }
    return toProjectDto(withMembers!);
  }

  async remove(id: string, userId: string) {
    const row = await this.projects.findById(id);
    if (!row)
      throw new NotFoundException({
        code: 'project_not_found',
        message: 'Project not found.',
      });
    const role = await this.workspaceRole(userId, row.workspaceId);
    if (!role)
      throw new NotFoundException({
        code: 'project_not_found',
        message: 'Project not found.',
      });
    if (role !== 'owner' && role !== 'admin')
      throw new ForbiddenException({
        code: 'insufficient_workspace_role',
        message: 'Your workspace role cannot perform this action.',
      });
    await this.projects.delete(id);
    try {
      this.events.emit('project.removed', {
        workspaceId: row.workspaceId,
        projectId: id,
        actorId: userId,
        name: row.name,
      });
    } catch {
      /* noop */
    }
    return;
  }
}
