import type { WorkspaceService } from '@/api/contracts';
import { SEED_WORKSPACES } from '@/data/workspaces';
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
};
