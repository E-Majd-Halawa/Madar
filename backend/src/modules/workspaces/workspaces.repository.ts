import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';

const activeMembers = {
  where: { status: 'active' as const },
  select: { userId: true },
  orderBy: [{ joinedAt: 'asc' as const }, { userId: 'asc' as const }],
};

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Prisma.TransactionClient): Prisma.TransactionClient {
    return (tx ?? this.prisma) as unknown as Prisma.TransactionClient;
  }

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  findPersonalByOwner(userId: string, tx?: Prisma.TransactionClient) {
    return this.db(tx).workspace.findFirst({
      where: { ownerId: userId, type: 'personal' },
      include: { members: activeMembers },
      orderBy: { createdAt: 'asc' },
    });
  }

  findForUser(userId: string, tx?: Prisma.TransactionClient) {
    return this.db(tx).workspace.findMany({
      where: { members: { some: { userId, status: 'active' } } },
      include: { members: activeMembers },
    });
  }

  findForMember(
    workspaceId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).workspace.findFirst({
      where: {
        id: workspaceId,
        members: { some: { userId, status: 'active' } },
      },
      include: { members: activeMembers },
    });
  }

  findById(workspaceId: string, tx?: Prisma.TransactionClient) {
    return this.db(tx).workspace.findUnique({ where: { id: workspaceId } });
  }

  findByIdWithActiveMembers(
    workspaceId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).workspace.findUnique({
      where: { id: workspaceId },
      include: { members: activeMembers },
    });
  }

  /**
   * Idempotent personal-workspace creation. The id is deterministic and both
   * writes are upserts, so concurrent calls converge on one workspace and one
   * owner membership. This is called inside a transaction by the service.
   */
  async createPersonalWorkspace(userId: string, tx?: Prisma.TransactionClient) {
    const db = this.db(tx);
    const id = `ws-personal-${userId}`;
    const now = new Date();

    await db.workspace.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name: 'Personal Workspace',
        description: 'Your private space for personal tasks and goals.',
        type: 'personal',
        ownerId: userId,
        color: '#10b981',
        createdAt: now,
      },
    });

    await db.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: id, userId } },
      update: {},
      create: {
        workspaceId: id,
        userId,
        role: 'owner',
        status: 'active',
        joinedAt: now,
        lastActiveAt: now,
      },
    });

    return db.workspace.findUniqueOrThrow({
      where: { id },
      include: { members: activeMembers },
    });
  }

  updateOwnerId(
    workspaceId: string,
    ownerId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).workspace.update({
      where: { id: workspaceId },
      data: { ownerId },
    });
  }
}
