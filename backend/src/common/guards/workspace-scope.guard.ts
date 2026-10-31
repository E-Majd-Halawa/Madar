import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { WorkspaceRole } from '../contracts/api.contracts.js';
import { PrismaService } from '../../database/prisma.service.js';
import { WORKSPACE_ROLES_KEY } from './workspace-roles.decorator.js';

export interface WorkspaceMembership {
  workspaceId: string;
  workspaceRole: WorkspaceRole;
  /** workspace_members.id */
  memberId: string;
  userId: string;
}

type WorkspaceRequest = Request & {
  user?: { id?: string };
  params: Record<string, string | undefined>;
  workspaceMembership?: WorkspaceMembership;
};

/**
 * Resolves the caller's workspace membership from `:workspaceId` (or `:id` on
 * `/workspaces/:id` routes) and attaches it to the request.
 *
 * Rules:
 *  - Unknown workspace and non-membership both return 403 `not_a_member`
 *    (workspace existence is never revealed).
 *  - A membership whose status is not `active` is treated as a non-member.
 *  - Insufficient workspace role returns 403 `insufficient_workspace_role`.
 *  - Global roles never bypass this guard in Phase 3.
 */
@Injectable()
export class WorkspaceScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<WorkspaceRequest>();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException({
        code: 'unauthorized',
        message: 'Authentication is required.',
      });
    }

    const workspaceId = request.params.workspaceId ?? request.params.id;
    if (!workspaceId) {
      throw new ForbiddenException({
        code: 'not_a_member',
        message: 'You are not a member of this workspace.',
      });
    }

    const membership = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId, status: 'active' },
      select: { id: true, role: true },
    });

    if (!membership) {
      throw new ForbiddenException({
        code: 'not_a_member',
        message: 'You are not a member of this workspace.',
      });
    }

    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      requiredRoles &&
      requiredRoles.length > 0 &&
      !requiredRoles.includes(membership.role)
    ) {
      throw new ForbiddenException({
        code: 'insufficient_workspace_role',
        message: 'Your workspace role cannot perform this action.',
      });
    }

    request.workspaceMembership = {
      workspaceId,
      workspaceRole: membership.role,
      memberId: membership.id,
      userId,
    };

    return true;
  }
}
