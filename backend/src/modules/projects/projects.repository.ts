import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(_tx?: Prisma.TransactionClient): Prisma.TransactionClient {
    return (_tx ?? this.prisma) as unknown as Prisma.TransactionClient;
  }

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async findForWorkspace(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId },
      include: { members: true },
      orderBy: [{ createdAt: 'asc' }],
    });
  }

  async findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });
  }

  async create(data: {
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    status: any;
    color: string;
    ownerId: string;
    memberIds: string[];
    startDate: Date;
    dueDate: Date | null;
  }) {
    const db = this.prisma;
    const project = await db.project.create({
      data: {
        id: data.id,
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description,
        status: data.status,
        color: data.color,
        ownerId: data.ownerId,
        startDate: data.startDate,
        dueDate: data.dueDate,
        members: {
          create: data.memberIds.map((userId) => ({ userId })),
        },
      },
      include: { members: true },
    });
    return project;
  }

  async replaceMembers(projectId: string, memberIds: string[]) {
    await this.prisma.projectMember.deleteMany({ where: { projectId } });
    if (memberIds.length) {
      await this.prisma.projectMember.createMany({
        data: memberIds.map((userId) => ({ projectId, userId })),
        skipDuplicates: true,
      });
    }
    return this.findById(projectId);
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      status: any;
      color: string;
      startDate: Date;
      dueDate: Date | null;
      ownerId: string;
    }>,
  ) {
    return this.prisma.project.update({
      where: { id },
      data,
      include: { members: true },
    });
  }

  async delete(id: string) {
    await this.prisma.project.delete({ where: { id } });
  }
}
