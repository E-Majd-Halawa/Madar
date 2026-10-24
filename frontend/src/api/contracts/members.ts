import type { WorkspaceRole } from '@/types';

/**
 * Workspace membership and invitations.
 * Signatures mirror the data operations already exposed by `memberStore`.
 */
export interface MembersService {
  load(workspaceId: string): Promise<void>;
  inviteMember(email: string, role: WorkspaceRole, department: string): Promise<void>;
  updateRole(userId: string, role: WorkspaceRole): Promise<void>;
  removeMember(userId: string): Promise<void>;
  cancelInvite(inviteId: string): void;
  resendInvite(inviteId: string): void;
}
