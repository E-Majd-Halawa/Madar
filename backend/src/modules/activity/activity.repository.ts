import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}
  findForWorkspace(workspaceId: string) {
    return this.prisma.activityEvent.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }
  create(data: any) {
    return this.prisma.activityEvent.create({ data });
  }
  findFocusSessions(userId: string) {
    return this.prisma.focusSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });
  }
  createFocusSession(data: any) {
    return this.prisma.focusSession.create({ data });
  }
}
