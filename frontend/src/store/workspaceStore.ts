import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { workspaceService } from '@/services/workspaceService';
import { safeStateStorage } from '@/services/storage/persistStorage';
import type { Workspace } from '@/types';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  load: (userId: string, options?: { preferDemo?: boolean }) => Promise<void>;
  setActive: (workspaceId: string) => void;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      status: 'idle',
      load: async (userId, { preferDemo = false } = {}) => {
        set({ status: 'loading' });
        try {
          const workspaces = await workspaceService.listForUser(userId);
          const remembered = workspaces.find((w) => w.id === get().activeWorkspaceId);
          const demo = preferDemo ? workspaces.find((w) => w.id === 'ws-demo') : undefined;
          const active = remembered ?? demo ?? workspaces[0] ?? null;
          set({ workspaces, activeWorkspaceId: active?.id ?? null, status: 'ready' });
        } catch {
          set({ status: 'error' });
        }
      },
      setActive: (activeWorkspaceId) => set({ activeWorkspaceId }),
      reset: () => set({ workspaces: [], activeWorkspaceId: null, status: 'idle' }),
    }),
    {
      name: 'tf3d.workspace',
      version: 1,
      storage: createJSONStorage(() => safeStateStorage),
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
    },
  ),
);

export const selectActiveWorkspace = (state: WorkspaceState): Workspace | null =>
  state.workspaces.find((w) => w.id === state.activeWorkspaceId) ?? null;
