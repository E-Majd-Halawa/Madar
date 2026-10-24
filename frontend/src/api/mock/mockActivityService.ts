import type { ActivityService } from '@/api/contracts';
import { SEED_ACTIVITY, SEED_FOCUS_SESSIONS } from '@/data/activity';
import type { ActivityEvent } from '@/types';
import { createCollection, newId } from './collection';
import { delay } from './delay';

const table = createCollection<ActivityEvent>('mock.activity', SEED_ACTIVITY);

export const mockActivityService: ActivityService = {
  async listByWorkspace(workspaceId) {
    await delay(180);
    return table
      .read()
      .filter((e) => e.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async record(event) {
    const created: ActivityEvent = { ...event, id: newId('act'), createdAt: new Date().toISOString() };
    table.write([created, ...table.read()]);
    return created;
  },
  async listFocusSessions(userId) {
    await delay(150);
    return SEED_FOCUS_SESSIONS.filter((s) => s.userId === userId);
  },
};
