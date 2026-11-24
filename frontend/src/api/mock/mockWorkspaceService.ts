import type { WorkspaceService } from '@/api/contracts';
import { SEED_WORKSPACES } from '@/data/workspaces';
import { useAuthStore } from '@/store/authStore';
import type { Workspace } from '@/types';
import { delay } from './delay';

/** Every account owns a personal workspace, even ones created at registration. */
const personalWorkspaceFor = (userId: string): Workspace => ({
  id: `ws-personal-${userId}`,
  name: 'Personal Workspace',
  description: 'Your private space for personal tasks and goals.',
  type: 'personal',
  ownerId: userId,
  memberIds: [userId],
  color: '#10b981',
  createdAt: new Date().toISOString(),
});

export const mockWorkspaceService: WorkspaceService = {
  async listForUser(userId) {
    await delay();
    const joined = SEED_WORKSPACES.filter((w) => w.memberIds.includes(userId));
    const hasPersonal = joined.some((w) => w.type === 'personal' && w.ownerId === userId);
    return hasPersonal ? joined : [personalWorkspaceFor(userId), ...joined];
  },

  async getById(id) {
    await delay(150);
    return SEED_WORKSPACES.find((w) => w.id === id) ?? null;
  },

  async create(input) {
    await delay();
    const ownerId = useAuthStore.getState().session?.user.id ?? 'u-001';
    const workspace: Workspace = {
      id: `ws-${Date.now()}`,
      name: input.name,
      description: input.description ?? '',
      type: input.type,
      ownerId,
      memberIds: [ownerId, ...(input.initialMembers ?? [])],
      color: input.color ?? '#10b981',
      createdAt: new Date().toISOString(),
    };
    SEED_WORKSPACES.push(workspace as any);
    return workspace;
  },

  async listMembers(workspaceId) {
    await delay();
    return [];
  },

  async addMember(_workspaceId, input) {
    await delay();
    return {
      id: `u-${Date.now()}`,
      fullName: input.identifier,
      username: input.identifier,
      email: input.identifier.includes('@') ? input.identifier : `${input.identifier}@example.com`,
      role: input.role,
      department: input.department ?? 'General',
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'active',
    };
  },

  async updateMember(_workspaceId, memberId, input) {
    await delay();
    return {
      id: memberId,
      fullName: memberId,
      username: memberId,
      email: `${memberId}@example.com`,
      role: input.role ?? 'member',
      department: input.department ?? 'General',
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'active',
    };
  },

  async removeMember() {
    await delay();
  },
};
