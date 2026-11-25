export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'guest';

export interface WorkspaceMemberItem {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: WorkspaceRole;
  department: string;
  avatarUrl?: string;
  joinedAt: string;
  lastActiveAt: string;
  status: 'active' | 'invited' | 'suspended' | 'banned';
}

/** Minimal user projection returned by the workspace candidate search. */
export interface CandidateUser {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
}
