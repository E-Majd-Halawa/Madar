import type { WorkspaceService } from '@/api/contracts';
import { SEED_WORKSPACES } from '@/data/workspaces';
import { useAuthStore } from '@/store/authStore';
import type { Workspace } from '@/types';
import { delay } from './delay';
import { getAllUsers } from './userRegistry';

/** Mirrors the backend's HttpError shape closely enough for the UI to map 404/409. */
const apiError = (message: string, status: number): Error =>
  Object.assign(new Error(message), { status });

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
    const users = getAllUsers();
    const invitedIds = (input.initialMembers ?? [])
      .map((value) => {
        const needle = value.trim().toLowerCase();
        return users.find((u) => u.email.toLowerCase() === needle || u.username.toLowerCase() === needle)?.id;
      })
      .filter((id): id is string => !!id && id !== ownerId);
    const workspace: Workspace = {
      id: `ws-${Date.now()}`,
      name: input.name,
      description: input.description ?? '',
      type: input.type,
      ownerId,
      memberIds: Array.from(new Set([ownerId, ...invitedIds])),
      color: input.color ?? '#10b981',
      createdAt: new Date().toISOString(),
    };
    SEED_WORKSPACES.push(workspace as any);
    return workspace;
  },

  async listMembers(_workspaceId) {
    await delay();
    return [];
  },

  async searchCandidateUsers(workspaceId, query) {
    await delay(200);
    const workspace = SEED_WORKSPACES.find((w) => w.id === workspaceId);
    const needle = query.trim().toLowerCase();
    if (!workspace || !needle) return [];
    return getAllUsers()
      .filter((u) => !workspace.memberIds.includes(u.id))
      .filter(
        (u) =>
          u.username.toLowerCase().includes(needle) ||
          u.fullName.toLowerCase().includes(needle),
      )
      .slice(0, 8)
      .map((u) => ({
        id: u.id,
        username: u.username,
        name: u.fullName,
        avatar: u.avatarUrl ?? null,
      }));
  },

  async addMember(workspaceId, input) {
    await delay();
    const username = input.username.trim();
    const target = getAllUsers().find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );
    if (!target) throw apiError(`No user found with username @${username}.`, 404);

    const workspace = SEED_WORKSPACES.find((w) => w.id === workspaceId);
    if (!workspace) throw apiError('Workspace not found.', 404);
    if (workspace.memberIds.includes(target.id)) {
      throw apiError(`@${username} is already a member of this workspace.`, 409);
    }

    workspace.memberIds = [...workspace.memberIds, target.id];
    return {
      id: target.id,
      fullName: target.fullName,
      username: target.username,
      email: target.email,
      role: input.role,
      department: input.department ?? 'General',
      avatarUrl: target.avatarUrl,
      joinedAt: new Date().toISOString(),
      lastActiveAt: target.lastActiveAt,
      status: target.status,
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
