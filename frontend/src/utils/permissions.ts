import { ROLE_ORDER, ROLE_PERMISSIONS, type Permission } from '@/constants/permissions';
import type { Role, Workspace } from '@/types';

export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && ROLE_PERMISSIONS[role].has(permission);
}

/** True when `role` is `min` or higher in the hierarchy. */
export function hasRole(role: Role | null | undefined, min: Role): boolean {
  return !!role && ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(min);
}

/**
 * Members management is limited to the owner of a team workspace.
 * Personal workspaces have no membership management.
 */
export function canManageWorkspaceMembers(
  workspace: Workspace | null | undefined,
  userId: string | null | undefined,
): boolean {
  return !!workspace && !!userId && workspace.type === 'team' && workspace.ownerId === userId;
}
