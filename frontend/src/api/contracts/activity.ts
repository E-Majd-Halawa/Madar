import type { ActivityEvent, FocusSession } from '@/types';

/** GET /workspaces/:id/activity  ·  GET /users/:id/focus-sessions */
export interface ActivityService {
  listByWorkspace(workspaceId: string): Promise<ActivityEvent[]>;
  record(event: Omit<ActivityEvent, 'id' | 'createdAt'>): Promise<ActivityEvent>;
  listFocusSessions(userId: string): Promise<FocusSession[]>;
}
