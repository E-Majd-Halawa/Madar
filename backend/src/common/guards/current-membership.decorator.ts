import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { WorkspaceMembership } from './workspace-scope.guard.js';

/**
 * Reads the membership resolved by WorkspaceScopeGuard.
 * Only valid on routes protected by that guard.
 */
export const CurrentMembership = createParamDecorator(
  (_data: unknown, context: ExecutionContext): WorkspaceMembership => {
    const request = context.switchToHttp().getRequest<{
      workspaceMembership?: WorkspaceMembership;
    }>();
    return request.workspaceMembership as WorkspaceMembership;
  },
);
