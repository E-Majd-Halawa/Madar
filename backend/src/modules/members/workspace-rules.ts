import type { WorkspaceRole } from '../../common/contracts/api.contracts.js';

/** Invitations can never grant ownership. */
export const INVITATION_ROLES = ['admin', 'member', 'guest'] as const;
export type InvitationRole = (typeof INVITATION_ROLES)[number];

export function isInvitationRole(role: WorkspaceRole): role is InvitationRole {
  return (INVITATION_ROLES as readonly string[]).includes(role);
}

/**
 * Owner may manage every role. Admin may manage only member and guest; this
 * also blocks an admin from modifying another admin or the owner.
 */
export function canManageMember(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole,
): boolean {
  if (actorRole === 'owner') return true;
  if (actorRole === 'admin') {
    return targetRole === 'member' || targetRole === 'guest';
  }
  return false;
}

/**
 * Least privilege: only an owner may grant admin or owner. Admins may assign
 * only member and guest roles.
 */
export function canAssignRole(
  actorRole: WorkspaceRole,
  nextRole: WorkspaceRole,
): boolean {
  if (actorRole === 'owner') return true;
  if (actorRole === 'admin') {
    return nextRole === 'member' || nextRole === 'guest';
  }
  return false;
}
