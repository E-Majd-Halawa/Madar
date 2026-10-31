import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
  find(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }
  findDuplicate(userId: string, type: string, title: string, since: Date) {
    return this.prisma.notification.findFirst({
      where: { userId, type: type as any, title, createdAt: { gte: since } },
    });
  }
  create(data: any) {
    return this.prisma.notification.create({ data });
  }
  update(id: string, data: any) {
    return this.prisma.notification.update({ where: { id }, data });
  }
  delete(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }
  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }
}
