import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import type { WorkspaceRole } from '../contracts/api.contracts.js';

export interface DomainEventMap {
  'member.invited': {
    workspaceId: string;
    invitationId: string;
    email: string;
    role: WorkspaceRole;
    invitedById: string;
  };
  'member.joined': {
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
    invitationId: string;
  };
  'member.role_changed': {
    workspaceId: string;
    userId: string;
    fromRole: WorkspaceRole;
    toRole: WorkspaceRole;
    actorId: string;
  };
  'member.removed': {
    workspaceId: string;
    userId: string;
    actorId: string;
    self: boolean;
  };
  'task.created': {
    workspaceId: string;
    taskId: string;
    actorId: string;
    title: string;
    assigneeId?: string | null;
  };
  'task.assigned': {
    workspaceId: string;
    taskId: string;
    actorId: string;
    title: string;
    assigneeId: string;
  };
  'task.completed': {
    workspaceId: string;
    taskId: string;
    actorId: string;
    title: string;
    assigneeId?: string | null;
  };
  'task.updated': {
    workspaceId: string;
    taskId: string;
    actorId: string;
    title: string;
  };
  'task.comment_added': {
    workspaceId: string;
    taskId: string;
    authorId: string;
    title: string;
  };
  'project.created': {
    workspaceId: string;
    projectId: string;
    actorId: string;
    name: string;
  };
  'project.updated': {
    workspaceId: string;
    projectId: string;
    actorId: string;
    name: string;
  };
  'project.removed': {
    workspaceId: string;
    projectId: string;
    actorId: string;
    name: string;
  };
  'file.uploaded': {
    workspaceId: string;
    projectId?: string;
    actorId: string;
    name: string;
  };
  'file.deleted': {
    workspaceId: string;
    projectId?: string;
    actorId: string;
    name: string;
  };
  'invitation.revoked': {
    workspaceId: string;
    invitationId: string;
    email: string;
    actorId: string;
  };
}

/**
 * In-process, typed domain events. No subscribers exist in Phase 3.
 *
 * Phase 6 will subscribe here to write activity_events and notifications.
 * Phase 3 MUST NOT write to any activity/notification table.
 */
@Injectable()
export class DomainEvents {
  private readonly emitter = new EventEmitter();

  emit<K extends keyof DomainEventMap>(
    name: K,
    payload: DomainEventMap[K],
  ): void {
    this.emitter.emit(name, payload);
  }

  on<K extends keyof DomainEventMap>(
    name: K,
    listener: (payload: DomainEventMap[K]) => void,
  ): this {
    this.emitter.on(name, listener);
    return this;
  }
}
