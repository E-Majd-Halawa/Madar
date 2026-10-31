import type {
  PendingInvite,
  WorkspaceRole,
} from '../contracts/api.contracts.js';

export interface InvitationRecord {
  id: string;
  email: string;
  role: string;
  department: string | null;
  invitedById: string;
  invitedAt: Date;
}

/** Explicit mapper to frontend/src/types/members.ts:16-22. */
export function toPendingInviteDto(
  invitation: InvitationRecord,
): PendingInvite {
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role as WorkspaceRole,
    department: invitation.department ?? '',
    invitedBy: invitation.invitedById,
    invitedAt: invitation.invitedAt.toISOString(),
  };
}
