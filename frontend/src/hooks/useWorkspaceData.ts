import { useEffect } from 'react';
import { useDirectoryStore } from '@/store/directoryStore';
import { useActivityStore } from '@/store/activityStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

/** Loads (and clears) tasks, projects, activity, notifications and preferences for the signed-in user and active workspace. */
export function useWorkspaceData(): void {
  const userId = useAuthStore((s) => s.session?.user.id);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  useEffect(() => {
    if (userId) {
      void useDirectoryStore.getState().load();
      void usePreferencesStore.getState().load(userId);
      void useNotificationStore.getState().load(userId);
    } else {
      usePreferencesStore.getState().reset();
      useNotificationStore.getState().reset();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && workspaceId) {
      void useTaskStore.getState().load(workspaceId);
      void useProjectStore.getState().load(workspaceId);
      void useActivityStore.getState().load(workspaceId, userId);
    } else {
      useTaskStore.getState().reset();
      useProjectStore.getState().reset();
      useActivityStore.getState().reset();
    }
  }, [userId, workspaceId]);
}
