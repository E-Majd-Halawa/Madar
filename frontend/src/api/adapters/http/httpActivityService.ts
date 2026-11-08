import type { ActivityService } from '@/api/contracts';
import type { ActivityEvent } from '@/types';
import { http } from './httpClient';
import { mockActivityService } from '@/api/mock/mockActivityService';

export const httpActivityService: ActivityService = {
  async listByWorkspace(workspaceId: string) {
    return http<ActivityEvent[]>(`/workspaces/${workspaceId}/activity`);
  },
  async record(event) {
    return http<ActivityEvent>(`/workspaces/${event.workspaceId}/activity`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },
  listFocusSessions(userId: string) {
    return mockActivityService.listFocusSessions(userId);
  },
};
