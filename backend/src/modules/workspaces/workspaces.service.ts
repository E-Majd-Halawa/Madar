import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { PrismaService } from '../../database/prisma.service.js';
import type {
  AddMemberInput,
  CreateWorkspaceInput,
  UpdateMemberInput,
} from './dto/workspaces.dto.js';

export interface MemberView {
  id: string;
  membershipId: string;
  userId: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  department: string | null;
  status: string;
  joinedAt: string;
  lastActiveAt: string;
  avatarUrl?: string;
}

export interface WorkspaceView {
  id: string;
  name: string;
  description: string;
  type: string;
  ownerId: string;
  color: string;
  createdAt: string;
  memberIds: string[];
}

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  private isGlobalAdmin(user: AuthenticatedUser): boolean {
    return user.role === 'admin' || user.role === 'super_admin';
  }

  private async getMembership(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  private async assertMember(workspaceId: string, user: AuthenticatedUser) {
    if (this.isGlobalAdmin(user)) return null;
    const membership = await this.getMembership(workspaceId, user.id);
    if (!membership) {
      throw new ForbiddenException({
        code: 'forbidden',
        message: 'You are not a member of this workspace.',
      });
    }
    return membership;
  }

  private async assertManager(workspaceId: string, user: AuthenticatedUser) {
    if (this.isGlobalAdmin(user)) return null;
    const membership = await this.getMembership(workspaceId, user.id);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new ForbiddenException({
        code: 'forbidden',
        message: 'You do not have permission to manage this workspace.',
      });
    }
    return membership;
  }

  private toWorkspace(workspace: {
    id: string;
    name: string;
    description: string;
    type: string;
    ownerId: string;
    color: string;
    createdAt: Date;
    members: { userId: string }[];
  }): WorkspaceView {
    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      type: workspace.type,
      ownerId: workspace.ownerId,
      color: workspace.color,
      createdAt: workspace.createdAt.toISOString(),
      memberIds: workspace.members.map((m) => m.userId),
    };
  }

  async listForUser(user: AuthenticatedUser): Promise<WorkspaceView[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId: user.id },
      select: { workspaceId: true },
    });
    const ids = memberships.map((m) => m.workspaceId);

    const workspaces = await this.prisma.workspace.findMany({
      where: this.isGlobalAdmin(user)
        ? undefined
        : { id: { in: ids } },
      include: { members: { select: { userId: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return workspaces.map((w) => this.toWorkspace(w));
  }

  async getById(id: string, user: AuthenticatedUser): Promise<WorkspaceView> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: { members: { select: { userId: true } } },
    });
    if (!workspace) {
      throw new NotFoundException({ code: 'not_found', message: 'Workspace not found.' });
    }
    await this.assertMember(id, user);
    return this.toWorkspace(workspace);
  }

  async create(input: CreateWorkspaceInput, user: AuthenticatedUser): Promise<WorkspaceView> {
    const color = input.color || '#10b981';

    // Resolve initial members (best-effort; unknown identifiers are skipped).
    const initialUsers = input.initialMembers.length
      ? await this.prisma.user.findMany({
          where: {
            OR: input.initialMembers.map((value) => ({
              OR: [{ email: value.toLowerCase() }, { username: value }],
            })),
          },
          select: { id: true },
        })
      : [];

    const workspace = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workspace.create({
        data: {
          id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: input.name,
          description: input.description || '',
          type: input.type,
          ownerId: user.id,
          color,
          createdAt: new Date(),
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: created.id,
          userId: user.id,
          role: 'owner',
          status: 'active',
          joinedAt: new Date(),
        },
      });

      for (const member of initialUsers) {
        if (member.id === user.id) continue;
        await tx.workspaceMember.create({
          data: {
            workspaceId: created.id,
            userId: member.id,
            role: 'member',
            status: 'active',
            joinedAt: new Date(),
          },
        }).catch(() => undefined);
      }

      return tx.workspace.findUniqueOrThrow({
        where: { id: created.id },
        include: { members: { select: { userId: true } } },
      });
    });

    return this.toWorkspace(workspace);
  }

  async listMembers(workspaceId: string, user: AuthenticatedUser): Promise<MemberView[]> {
    await this.assertMember(workspaceId, user);

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.user.id,
      membershipId: m.id,
      userId: m.user.id,
      fullName: m.user.fullName,
      username: m.user.username,
      email: m.user.email,
      role: m.role,
      department: m.department,
      status: m.status,
      joinedAt: m.joinedAt.toISOString(),
      lastActiveAt: m.user.lastActiveAt.toISOString(),
      avatarUrl: m.user.avatarUrl ?? undefined,
    }));
  }

  async addMember(
    workspaceId: string,
    input: AddMemberInput,
    user: AuthenticatedUser,
  ): Promise<MemberView> {
    await this.assertManager(workspaceId, user);

    const target = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: input.identifier.toLowerCase() },
          { username: input.identifier },
        ],
      },
    });
    if (!target) {
      throw new NotFoundException({ code: 'not_found', message: 'User not found.' });
    }

    const existing = await this.getMembership(workspaceId, target.id);
    if (existing) {
      throw new ConflictException({ code: 'conflict', message: 'User is already a member.' });
    }

    const member = await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: target.id,
        role: input.role,
        department: input.department,
        status: 'active',
        joinedAt: new Date(),
      },
      include: { user: true },
    });

    return {
      id: member.user.id,
      membershipId: member.id,
      userId: member.user.id,
      fullName: member.user.fullName,
      username: member.user.username,
      email: member.user.email,
      role: member.role,
      department: member.department,
      status: member.status,
      joinedAt: member.joinedAt.toISOString(),
      lastActiveAt: member.user.lastActiveAt.toISOString(),
      avatarUrl: member.user.avatarUrl ?? undefined,
    };
  }

  async updateMember(
    workspaceId: string,
    memberId: string,
    input: UpdateMemberInput,
    user: AuthenticatedUser,
  ): Promise<MemberView> {
    await this.assertManager(workspaceId, user);

    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        OR: [{ userId: memberId }, { id: memberId }],
      },
      include: { user: true },
    });
    if (!membership) {
      throw new NotFoundException({ code: 'not_found', message: 'Member not found.' });
    }

    // Prevent removing/demoting the last owner.
    if (membership.role === 'owner' && input.role) {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: { workspaceId, role: 'owner' },
      });
      if (ownerCount <= 1) {
        throw new ForbiddenException({
          code: 'forbidden',
          message: 'Cannot change role of the last owner.',
        });
      }
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { id: membership.id },
      data: {
        ...(input.role ? { role: input.role } : {}),
        ...(input.department !== undefined ? { department: input.department } : {}),
      },
      include: { user: true },
    });

    return {
      id: updated.user.id,
      membershipId: updated.id,
      userId: updated.user.id,
      fullName: updated.user.fullName,
      username: updated.user.username,
      email: updated.user.email,
      role: updated.role,
      department: updated.department,
      status: updated.status,
      joinedAt: updated.joinedAt.toISOString(),
      lastActiveAt: updated.user.lastActiveAt.toISOString(),
      avatarUrl: updated.user.avatarUrl ?? undefined,
    };
  }

  async removeMember(
    workspaceId: string,
    memberId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    await this.assertManager(workspaceId, user);

    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        OR: [{ userId: memberId }, { id: memberId }],
      },
    });
    if (!membership) {
      throw new NotFoundException({ code: 'not_found', message: 'Member not found.' });
    }

    if (membership.role === 'owner') {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: { workspaceId, role: 'owner' },
      });
      if (ownerCount <= 1) {
        throw new ForbiddenException({
          code: 'forbidden',
          message: 'Cannot remove the last owner.',
        });
      }
    }

    // Allow self-removal even if not manager? Already manager check above.
    await this.prisma.workspaceMember.delete({ where: { id: membership.id } });
  }
}