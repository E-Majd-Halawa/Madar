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
  status: 'active' | 'invited' | 'suspended';
}

export interface PendingInvite {
  id: string;
  email: string;
  role: WorkspaceRole;
  department: string;
  invitedBy: string;
  invitedAt: string;
}
