import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

/** Loads the signed-in user's workspaces, and clears them on sign-out. */
export function useWorkspaceBootstrap(): void {
  const userId = useAuthStore((s) => s.session?.user.id);
  const isDemo = useAuthStore((s) => s.session?.isDemo ?? false);

  useEffect(() => {
    const { load, reset } = useWorkspaceStore.getState();
    if (userId) void load(userId, { preferDemo: isDemo });
    else reset();
  }, [userId, isDemo]);
}
