import { useEffect } from 'react';
import { useDirectoryStore } from '@/store/directoryStore';
import { useActivityStore } from '@/store/activityStore';
import { isSessionValid, useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

/** Loads (and clears) tasks, projects, activity, notifications and preferences for the signed-in user and active workspace. */
export function useWorkspaceData(): void {
  const session = useAuthStore((s) => s.session);
  const userId = isSessionValid(session) ? session.user.id : null;
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  useEffect(() => {
    if (userId) {
      // These are background hydration calls: a failure must never surface as an
      // unhandled rejection (e.g. an expired token or a transient API error).
      void useDirectoryStore.getState().load().catch(() => undefined);
      void usePreferencesStore.getState().load(userId).catch(() => undefined);
      void useNotificationStore.getState().load(userId).catch(() => undefined);
    } else {
      useDirectoryStore.getState().reset();
      usePreferencesStore.getState().reset();
      useNotificationStore.getState().reset();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && workspaceId) {
      void useTaskStore.getState().load(workspaceId).catch(() => undefined);
      void useProjectStore.getState().load(workspaceId).catch(() => undefined);
      void useActivityStore.getState().load(workspaceId, userId).catch(() => undefined);
    } else {
      useTaskStore.getState().reset();
      useProjectStore.getState().reset();
      useActivityStore.getState().reset();
    }
  }, [userId, workspaceId]);
}
