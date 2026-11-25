import type { Workspace } from '@/types';
import type {
  CandidateUser,
  WorkspaceMemberItem,
} from '@/types/members';
import type {
  AddWorkspaceMemberInput,
  CreateWorkspaceInput,
  UpdateWorkspaceMemberInput,
  WorkspaceService,
} from '@/api/contracts/workspaces';
import { http, HttpError } from './httpClient';

interface BackendWorkspace {
  id: string;
  name: string;
  description: string;
  type: 'personal' | 'team';
  ownerId: string;
  color: string;
  createdAt: string;
  memberIds: string[];
}

interface BackendMember {
  id: string;
  membershipId: string;
  userId: string;
  fullName: string;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  department: string | null;
  status: 'active' | 'suspended' | 'invited' | 'banned';
  joinedAt: string;
  lastActiveAt: string;
  avatarUrl?: string;
}

function mapWorkspace(w: BackendWorkspace): Workspace {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    type: w.type,
    ownerId: w.ownerId,
    memberIds: w.memberIds ?? [],
    color: w.color,
    createdAt: w.createdAt,
  };
}

function mapMember(m: BackendMember): WorkspaceMemberItem {
  return {
    id: m.id,
    fullName: m.fullName,
    username: m.username,
    email: m.email,
    role: m.role,
    department: m.department ?? '',
    avatarUrl: m.avatarUrl,
    joinedAt: m.joinedAt,
    lastActiveAt: m.lastActiveAt,
    status: m.status,
  };
}

export const httpWorkspaceService: WorkspaceService = {
  async listForUser(_userId: string): Promise<Workspace[]> {
    const data = await http<BackendWorkspace[]>('/workspaces');
    return data.map(mapWorkspace);
  },

  async getById(id: string): Promise<Workspace | null> {
    try {
      const data = await http<BackendWorkspace>(`/workspaces/${id}`);
      return mapWorkspace(data);
    } catch (err: any) {
      if (err?.status === 404) return null;
      throw err;
    }
  },

  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const data = await http<BackendWorkspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapWorkspace(data);
  },

  async listMembers(workspaceId: string): Promise<WorkspaceMemberItem[]> {
    const data = await http<BackendMember[]>(`/workspaces/${workspaceId}/members`);
    return data.map(mapMember);
  },

  async searchCandidateUsers(workspaceId: string, query: string): Promise<CandidateUser[]> {
    const params = new URLSearchParams({ q: query });
    return http<CandidateUser[]>(
      `/workspaces/${workspaceId}/candidate-users?${params.toString()}`,
    );
  },

  async addMember(workspaceId: string, input: AddWorkspaceMemberInput): Promise<WorkspaceMemberItem> {
    const data = await http<BackendMember>(`/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify({
        username: input.username,
        role: input.role,
        department: input.department,
      }),
    });
    return mapMember(data);
  },

  async updateMember(workspaceId: string, memberId: string, input: UpdateWorkspaceMemberInput): Promise<WorkspaceMemberItem> {
    const data = await http<BackendMember>(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapMember(data);
  },

  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await http<void>(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },
};