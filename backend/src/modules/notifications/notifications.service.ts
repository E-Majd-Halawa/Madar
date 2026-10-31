import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationStreamService } from './notifications-stream.service.js';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repo: NotificationsRepository,
    private readonly stream: NotificationStreamService,
  ) {}

  async list(userId: string) {
    const rows = await this.repo.list(userId);
    return rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      type: r.type,
      title: r.title,
      body: r.body ?? undefined,
      createdAt: r.createdAt.toISOString(),
      read: r.read,
      href: r.href ?? undefined,
    }));
  }

  async markRead(id: string, userId: string, read: boolean) {
    const row = await this.repo.find(id);
    if (!row || row.userId !== userId)
      throw new NotFoundException({
        code: 'notification_not_found',
        message: 'Notification not found.',
      });
    await this.repo.update(id, { read });
  }

  async markAllRead(userId: string) {
    await this.repo.markAllRead(userId);
  }

  async unreadCount(userId: string) {
    return this.repo.unreadCount(userId);
  }

  async remove(id: string, userId: string) {
    const row = await this.repo.find(id);
    if (!row || row.userId !== userId)
      throw new NotFoundException({
        code: 'notification_not_found',
        message: 'Notification not found.',
      });
    await this.repo.delete(id);
  }

  async push(body: any, actorId: string) {
    const userId = body.userId;
    if (userId !== actorId) {
      throw new ForbiddenException({
        code: 'insufficient_workspace_role',
        message: 'Cannot push to another user.',
      });
    }
    const dedupeSince = new Date(Date.now() - 5 * 60 * 1000);
    const dup = await this.repo.findDuplicate(
      userId,
      body.type,
      body.title,
      dedupeSince,
    );
    if (dup) {
      const dto = {
        id: dup.id,
        userId: dup.userId,
        type: dup.type,
        title: dup.title,
        body: dup.body ?? undefined,
        createdAt: dup.createdAt.toISOString(),
        read: dup.read,
        href: dup.href ?? undefined,
      };
      return dto;
    }
    const row = await this.repo.create({
      userId,
      type: body.type,
      title: body.title,
      body: body.body,
      href: body.href,
      read: false,
    });
    const dto = {
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      body: row.body ?? undefined,
      createdAt: row.createdAt.toISOString(),
      read: row.read,
      href: row.href ?? undefined,
    };
    this.stream.publish(userId, dto);
    return dto;
  }

  async systemPush(body: any) {
    const userId = body.userId;
    const dedupeSince = new Date(Date.now() - 5 * 60 * 1000);
    const dup = await this.repo.findDuplicate(
      userId,
      body.type,
      body.title,
      dedupeSince,
    );
    if (dup) {
      return {
        id: dup.id,
        userId: dup.userId,
        type: dup.type,
        title: dup.title,
        body: dup.body ?? undefined,
        createdAt: dup.createdAt.toISOString(),
        read: dup.read,
        href: dup.href ?? undefined,
      };
    }
    const row = await this.repo.create({
      userId,
      type: body.type,
      title: body.title,
      body: body.body,
      href: body.href,
      read: false,
    });
    const dto = {
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      body: row.body ?? undefined,
      createdAt: row.createdAt.toISOString(),
      read: row.read,
      href: row.href ?? undefined,
    };
    this.stream.publish(userId, dto);
    return dto;
  }
}
