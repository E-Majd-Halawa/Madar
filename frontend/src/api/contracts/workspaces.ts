import type { Workspace } from '@/types';
import type { CandidateUser, WorkspaceMemberItem } from '@/types/members';

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  type: 'personal' | 'team';
  color?: string;
  initialMembers?: string[];
}

export interface AddWorkspaceMemberInput {
  username: string;
  role: 'admin' | 'member' | 'guest';
  department?: string;
}

export interface UpdateWorkspaceMemberInput {
  role?: 'admin' | 'member' | 'guest';
  department?: string;
}

export interface WorkspaceService {
  listForUser(userId: string): Promise<Workspace[]>;
  getById(id: string): Promise<Workspace | null>;
  create(input: CreateWorkspaceInput): Promise<Workspace>;
  listMembers(workspaceId: string): Promise<WorkspaceMemberItem[]>;
  /** Owner/admin only; returns id, username, name and avatar for autocomplete. */
  searchCandidateUsers(workspaceId: string, query: string): Promise<CandidateUser[]>;
  addMember(workspaceId: string, input: AddWorkspaceMemberInput): Promise<WorkspaceMemberItem>;
  updateMember(workspaceId: string, memberId: string, input: UpdateWorkspaceMemberInput): Promise<WorkspaceMemberItem>;
  removeMember(workspaceId: string, memberId: string): Promise<void>;
}