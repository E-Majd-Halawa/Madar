import type { WorkspaceRole } from '@/types';

/**
 * Workspace membership operations. Signatures mirror `memberStore`.
 * Adding a member targets an existing account by username.
 */
export interface MembersService {
  load(workspaceId: string): Promise<void>;
  addMember(username: string, role: WorkspaceRole, department: string): Promise<void>;
  updateRole(userId: string, role: WorkspaceRole): Promise<void>;
  removeMember(userId: string): Promise<void>;
}
