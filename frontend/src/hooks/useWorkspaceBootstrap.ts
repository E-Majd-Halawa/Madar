import { useEffect } from 'react';
import { isSessionValid, useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

/** Loads the signed-in user's workspaces, and clears them on sign-out or session expiry. */
export function useWorkspaceBootstrap(): void {
  const session = useAuthStore((s) => s.session);
  const validSession = isSessionValid(session) ? session : null;
  const userId = validSession?.user.id;
  const isDemo = validSession?.isDemo ?? false;

  useEffect(() => {
    const { load, reset } = useWorkspaceStore.getState();
    if (userId) void load(userId, { preferDemo: isDemo });
    else reset();
  }, [userId, isDemo]);
}
