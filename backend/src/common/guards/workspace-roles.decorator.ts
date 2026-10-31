import { SetMetadata } from '@nestjs/common';
import type { WorkspaceRole } from '../contracts/api.contracts.js';

export const WORKSPACE_ROLES_KEY = 'madar:workspaceRoles';

/**
 * Declares the minimum workspace roles allowed to hit a route.
 *
 * This is a workspace-level check only. Global roles (`user`, `moderator`,
 * `admin`, `super_admin`) are handled by PermissionsGuard and intentionally do
 * NOT bypass workspace membership or workspace roles in Phase 3.
 *
 * The admin suite (Phase 10) is the only place where a global admin may get
 * cross-workspace access.
 */
export const WorkspaceRoles = (...roles: WorkspaceRole[]) =>
  SetMetadata(WORKSPACE_ROLES_KEY, roles);
