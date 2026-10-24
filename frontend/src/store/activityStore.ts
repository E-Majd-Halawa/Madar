import { create } from 'zustand';
import { activityService } from '@/services/activityService';
import type { ActivityEvent, FocusSession } from '@/types';

interface ActivityState {
  events: ActivityEvent[];
  focusSessions: FocusSession[];
  load: (workspaceId: string, userId: string) => Promise<void>;
  reset: () => void;
}

export const useActivityStore = create<ActivityState>()((set) => ({
  events: [],
  focusSessions: [],
  load: async (workspaceId, userId) => {
    const [events, focusSessions] = await Promise.all([
      activityService.listByWorkspace(workspaceId),
      activityService.listFocusSessions(userId),
    ]);
    set({ events, focusSessions });
  },
  reset: () => set({ events: [], focusSessions: [] }),
}));
