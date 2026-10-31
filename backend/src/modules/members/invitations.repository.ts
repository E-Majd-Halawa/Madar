import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class InvitationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Prisma.TransactionClient): Prisma.TransactionClient {
    return (tx ?? this.prisma) as unknown as Prisma.TransactionClient;
  }

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  listPending(workspaceId: string, now: Date, tx?: Prisma.TransactionClient) {
    return this.db(tx).invitation.findMany({
      where: { workspaceId, status: 'pending', expiresAt: { gt: now } },
      orderBy: [{ invitedAt: 'desc' }, { id: 'asc' }],
    });
  }

  findPendingByEmail(
    workspaceId: string,
    email: string,
    now: Date,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).invitation.findFirst({
      where: {
        workspaceId,
        email,
        status: 'pending',
        expiresAt: { gt: now },
      },
    });
  }

  findById(
    workspaceId: string,
    invitationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).invitation.findFirst({
      where: { id: invitationId, workspaceId },
    });
  }

  findByTokenHash(tokenHash: string, tx?: Prisma.TransactionClient) {
    return this.db(tx).invitation.findUnique({
      where: { tokenHash },
      include: { workspace: true },
    });
  }

  create(
    data: {
      workspaceId: string;
      email: string;
      role: 'admin' | 'member' | 'guest';
      department: string | null;
      invitedById: string;
      tokenHash: string;
      expiresAt: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).invitation.create({ data });
  }

  /** Expires stale pending rows so the partial unique index accepts a new one. */
  expireStale(
    workspaceId: string,
    email: string,
    now: Date,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).invitation.updateMany({
      where: {
        workspaceId,
        email,
        status: 'pending',
        expiresAt: { lte: now },
      },
      data: { status: 'expired' },
    });
  }

  revokePending(
    workspaceId: string,
    invitationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).invitation.updateMany({
      where: { id: invitationId, workspaceId, status: 'pending' },
      data: { status: 'revoked' },
    });
  }

  rotatePending(
    workspaceId: string,
    invitationId: string,
    tokenHash: string,
    expiresAt: Date,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).invitation.updateMany({
      where: { id: invitationId, workspaceId, status: 'pending' },
      data: { tokenHash, expiresAt },
    });
  }

  markExpired(invitationId: string, now: Date, tx?: Prisma.TransactionClient) {
    return this.db(tx).invitation.updateMany({
      where: { id: invitationId, status: 'pending', expiresAt: { lte: now } },
      data: { status: 'expired' },
    });
  }

  /** Conditional claim: at most one concurrent accept can win. */
  claim(invitationId: string, acceptedAt: Date, tx?: Prisma.TransactionClient) {
    return this.db(tx).invitation.updateMany({
      where: { id: invitationId, status: 'pending' },
      data: { status: 'accepted', acceptedAt },
    });
  }
}
