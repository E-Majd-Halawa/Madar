import { Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEvents } from '../../common/events/domain-events.js';
import { ActivityService } from './activity.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ActivitySubscriber implements OnModuleInit {
  constructor(
    private readonly events: DomainEvents,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.events.on('member.invited', (p) => {
      this.activity
        .record(p.workspaceId, p.invitedById, {
          action: 'member_invited',
          targetType: 'member',
          targetName: p.email,
          metadata: { invitationId: p.invitationId },
        })
        .catch(() => undefined);
    });
    this.events.on('member.role_changed', (p) => {
      this.activity
        .record(p.workspaceId, p.actorId, {
          action: 'role_changed',
          targetType: 'member',
          targetName: p.userId,
        })
        .catch(() => undefined);
      this.prisma.user
        .findUnique({ where: { id: p.userId } })
        .then((user) => {
          if (!user) return;
          this.notifications
            .systemPush({
              userId: user.id,
              type: 'role_change',
              title: 'Your role was changed',
            })
            .catch(() => undefined);
        })
        .catch(() => undefined);
    });
    this.events.on('task.created', (p) => {
      this.activity
        .record(p.workspaceId, p.actorId, {
          action: 'task_created',
          targetType: 'task',
          targetName: p.title,
        })
        .catch(() => undefined);
      if (p.assigneeId && p.assigneeId !== p.actorId) {
        this.notifications
          .systemPush({
            userId: p.assigneeId,
            type: 'task_assigned',
            title: `You were assigned to ${p.title}`,
            href: '/app/tasks',
          })
          .catch(() => undefined);
      }
    });
    this.events.on('task.completed', (p) => {
      this.activity
        .record(p.workspaceId, p.actorId, {
          action: 'task_completed',
          targetType: 'task',
          targetName: p.title,
        })
        .catch(() => undefined);
    });
    this.events.on('task.updated', (p) => {
      this.activity
        .record(p.workspaceId, p.actorId, {
          action: 'task_updated',
          targetType: 'task',
          targetName: p.title,
        })
        .catch(() => undefined);
    });
    this.events.on('task.comment_added', (p) => {
      this.activity
        .record(p.workspaceId, p.authorId, {
          action: 'comment_added',
          targetType: 'task',
          targetName: p.title,
        })
        .catch(() => undefined);
    });
    this.events.on('project.created', (p) => {
      this.activity
        .record(p.workspaceId, p.actorId, {
          action: 'project_created',
          targetType: 'project',
          targetName: p.name,
          metadata: { projectId: p.projectId },
        })
        .catch(() => undefined);
    });
    this.events.on('project.updated', (p) => {
      this.activity
        .record(p.workspaceId, p.actorId, {
          action: 'settings_changed',
          targetType: 'project',
          targetName: p.name,
          metadata: { projectId: p.projectId },
        })
        .catch(() => undefined);
    });
    this.events.on('project.removed', (p) => {
      this.activity
        .record(p.workspaceId, p.actorId, {
          action: 'settings_changed',
          targetType: 'project',
          targetName: p.name,
          metadata: { projectId: p.projectId, deleted: 'true' },
        })
        .catch(() => undefined);
    });
    this.events.on('task.assigned', (p) => {
      this.activity
        .record(p.workspaceId, p.actorId, {
          action: 'task_updated',
          targetType: 'task',
          targetName: p.title,
        })
        .catch(() => undefined);
      if (p.assigneeId && p.assigneeId !== p.actorId) {
        this.notifications
          .systemPush({
            userId: p.assigneeId,
            type: 'task_assigned',
            title: `You were assigned to ${p.title}`,
            href: '/app/tasks',
          })
          .catch(() => undefined);
      }
    });
    this.events.on('member.removed', (p) => {
      this.activity
        .record(p.workspaceId, p.actorId, {
          action: 'role_changed',
          targetType: 'member',
          targetName: p.userId,
        })
        .catch(() => undefined);
    });
    this.events.on('member.joined', (p) => {
      this.activity
        .record(p.workspaceId, p.userId, {
          action: 'member_invited',
          targetType: 'member',
          targetName: p.userId,
        })
        .catch(() => undefined);
    });
    this.events.on('invitation.revoked', (p) => {
      this.activity
        .record(p.workspaceId, p.actorId, {
          action: 'settings_changed',
          targetType: 'member',
          targetName: p.email,
          metadata: { invitationId: p.invitationId },
        })
        .catch(() => undefined);
    });
    this.events.on('file.uploaded', (p) => {
      this.activity
        .record(p.workspaceId, p.actorId, {
          action: 'file_uploaded',
          targetType: 'file',
          targetName: p.name,
          metadata: { projectId: p.projectId },
        })
        .catch(() => undefined);
    });
    this.events.on('file.deleted', (p) => {
      this.activity
        .record(p.workspaceId, p.actorId, {
          action: 'file_deleted',
          targetType: 'file',
          targetName: p.name,
          metadata: { projectId: p.projectId },
        })
        .catch(() => undefined);
    });
  }
}
