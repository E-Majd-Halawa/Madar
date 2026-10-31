import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class MembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Prisma.TransactionClient): Prisma.TransactionClient {
    return (tx ?? this.prisma) as unknown as Prisma.TransactionClient;
  }

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  findMembership(
    workspaceId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { user: true },
    });
  }

  findActiveMembership(
    workspaceId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).workspaceMember.findFirst({
      where: { workspaceId, userId, status: 'active' },
      include: { user: true },
    });
  }

  list(workspaceId: string, tx?: Prisma.TransactionClient) {
    return this.db(tx).workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }, { userId: 'asc' }],
    });
  }

  findActiveByEmail(
    workspaceId: string,
    email: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).workspaceMember.findFirst({
      where: {
        workspaceId,
        status: 'active',
        user: { email: { equals: email, mode: 'insensitive' } },
      },
      include: { user: true },
    });
  }

  countActiveOwners(workspaceId: string, tx?: Prisma.TransactionClient) {
    return this.db(tx).workspaceMember.count({
      where: { workspaceId, role: 'owner', status: 'active' },
    });
  }

  findOtherActiveOwner(
    workspaceId: string,
    exceptUserId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).workspaceMember.findFirst({
      where: {
        workspaceId,
        role: 'owner',
        status: 'active',
        userId: { not: exceptUserId },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  updateRole(
    workspaceId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member' | 'guest',
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
      include: { user: true },
    });
  }

  updateMembership(
    workspaceId: string,
    userId: string,
    data: {
      role: 'owner' | 'admin' | 'member' | 'guest';
      department?: string | null;
      status: 'active' | 'invited' | 'suspended';
      lastActiveAt?: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data,
      include: { user: true },
    });
  }

  createMembership(
    data: {
      workspaceId: string;
      userId: string;
      role: 'owner' | 'admin' | 'member' | 'guest';
      department?: string | null;
      status: 'active' | 'invited' | 'suspended';
      joinedAt: Date;
      lastActiveAt?: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).workspaceMember.create({
      data,
      include: { user: true },
    });
  }

  deleteMembership(
    workspaceId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  /** Existing security_events table; no new audit table in Phase 3. */
  recordRoleChange(
    data: {
      actorId: string;
      workspaceId: string;
      targetUserId: string;
      fromRole: string;
      toRole: string;
      ip?: string;
      device?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).securityEvent.create({
      data: {
        type: 'role_change',
        descriptionKey: 'security.workspace_role_changed',
        descriptionParams: {
          workspaceId: data.workspaceId,
          targetUserId: data.targetUserId,
          fromRole: data.fromRole,
          toRole: data.toRole,
        },
        userId: data.actorId,
        ip: data.ip,
        device: data.device,
      },
    });
  }
}
