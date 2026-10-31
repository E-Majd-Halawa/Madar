import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  WorkspaceMemberItem,
  WorkspaceRole,
} from '../../common/contracts/api.contracts.js';
import { toWorkspaceMemberDto } from '../../common/mappers/member.mapper.js';
import { DomainEvents } from '../../common/events/domain-events.js';
import { MembersRepository } from './members.repository.js';
import { WorkspacesRepository } from '../workspaces/workspaces.repository.js';
import { canAssignRole, canManageMember } from './workspace-rules.js';

export interface RequestContext {
  ip?: string;
  device?: string;
}

@Injectable()
export class MembersService {
  constructor(
    private readonly members: MembersRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly events: DomainEvents,
  ) {}

  async list(workspaceId: string): Promise<WorkspaceMemberItem[]> {
    const rows = await this.members.list(workspaceId);
    return rows.map(toWorkspaceMemberDto);
  }

  async updateRole(
    workspaceId: string,
    actorId: string,
    targetUserId: string,
    nextRole: WorkspaceRole,
    context: RequestContext = {},
  ): Promise<WorkspaceMemberItem> {
    const result = await this.members.transaction(async (tx) => {
      const workspace = await this.workspaces.findById(workspaceId, tx);
      if (!workspace) {
        throw new ForbiddenException({
          code: 'not_a_member',
          message: 'You are not a member of this workspace.',
        });
      }

      if (workspace.type === 'personal') {
        throw new ConflictException({
          code: 'personal_workspace_restricted',
          message: 'Personal workspaces do not allow role changes.',
        });
      }

      const actor = await this.members.findActiveMembership(
        workspaceId,
        actorId,
        tx,
      );
      if (!actor) {
        throw new ForbiddenException({
          code: 'not_a_member',
          message: 'You are not a member of this workspace.',
        });
      }

      const target = await this.members.findMembership(
        workspaceId,
        targetUserId,
        tx,
      );
      if (!target || target.status !== 'active') {
        throw new NotFoundException({
          code: 'member_not_found',
          message: 'Member not found.',
        });
      }

      if (
        !canManageMember(actor.role, target.role) ||
        !canAssignRole(actor.role, nextRole)
      ) {
        throw new ForbiddenException({
          code: 'insufficient_workspace_role',
          message: 'Your workspace role cannot perform this action.',
        });
      }

      if (target.role === 'owner' && nextRole !== 'owner') {
        const owners = await this.members.countActiveOwners(workspaceId, tx);
        if (owners <= 1) {
          throw new ConflictException({
            code: 'cannot_remove_last_owner',
            message: 'A workspace must keep at least one owner.',
          });
        }
      }

      if (target.role === nextRole) {
        return { member: target, previousRole: target.role, changed: false };
      }

      const updated = await this.members.updateRole(
        workspaceId,
        targetUserId,
        nextRole,
        tx,
      );

      // Keep Workspace.ownerId aligned with an active owner membership.
      if (target.role === 'owner' && workspace.ownerId === targetUserId) {
        const other = await this.members.findOtherActiveOwner(
          workspaceId,
          targetUserId,
          tx,
        );
        if (!other) {
          throw new ConflictException({
            code: 'cannot_remove_last_owner',
            message: 'A workspace must keep at least one owner.',
          });
        }
        await this.workspaces.updateOwnerId(workspaceId, other.userId, tx);
      }

      await this.members.recordRoleChange(
        {
          actorId,
          workspaceId,
          targetUserId,
          fromRole: target.role,
          toRole: nextRole,
          ip: context.ip,
          device: context.device,
        },
        tx,
      );

      return { member: updated, previousRole: target.role, changed: true };
    });

    if (result.changed) {
      this.events.emit('member.role_changed', {
        workspaceId,
        userId: targetUserId,
        fromRole: result.previousRole,
        toRole: nextRole,
        actorId,
      });
    }

    return toWorkspaceMemberDto(result.member);
  }

  async removeMember(
    workspaceId: string,
    actorId: string,
    targetUserId: string,
  ): Promise<void> {
    const removed = await this.members.transaction(async (tx) => {
      const workspace = await this.workspaces.findById(workspaceId, tx);
      if (!workspace) {
        throw new ForbiddenException({
          code: 'not_a_member',
          message: 'You are not a member of this workspace.',
        });
      }

      const actor = await this.members.findActiveMembership(
        workspaceId,
        actorId,
        tx,
      );
      if (!actor) {
        throw new ForbiddenException({
          code: 'not_a_member',
          message: 'You are not a member of this workspace.',
        });
      }

      const target = await this.members.findMembership(
        workspaceId,
        targetUserId,
        tx,
      );
      if (!target || target.status !== 'active') {
        throw new NotFoundException({
          code: 'member_not_found',
          message: 'Member not found.',
        });
      }

      const self = actorId === targetUserId;

      if (workspace.type === 'personal' && target.role === 'owner') {
        throw new ConflictException({
          code: 'personal_workspace_restricted',
          message: 'The owner of a personal workspace cannot be removed.',
        });
      }

      if (!self && !canManageMember(actor.role, target.role)) {
        throw new ForbiddenException({
          code: 'insufficient_workspace_role',
          message: 'Your workspace role cannot perform this action.',
        });
      }

      if (target.role === 'owner') {
        const owners = await this.members.countActiveOwners(workspaceId, tx);
        if (owners <= 1) {
          throw new ConflictException({
            code: 'cannot_remove_last_owner',
            message: 'A workspace must keep at least one owner.',
          });
        }
      }

      await this.members.deleteMembership(workspaceId, targetUserId, tx);

      if (workspace.ownerId === targetUserId) {
        const other = await this.members.findOtherActiveOwner(
          workspaceId,
          targetUserId,
          tx,
        );
        if (!other) {
          throw new ConflictException({
            code: 'cannot_remove_last_owner',
            message: 'A workspace must keep at least one owner.',
          });
        }
        await this.workspaces.updateOwnerId(workspaceId, other.userId, tx);
      }

      return { targetUserId, role: target.role, self };
    });

    this.events.emit('member.removed', {
      workspaceId,
      userId: removed.targetUserId,
      actorId,
      self: removed.self,
    });
  }
}
