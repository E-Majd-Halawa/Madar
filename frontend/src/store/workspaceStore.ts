import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isSessionValid, useAuthStore } from '@/store/authStore';
import { workspaceService } from '@/services/workspaceService';
import { safeStateStorage } from '@/services/storage/persistStorage';
import type { Workspace } from '@/types';
import type { CreateWorkspaceInput } from '@/api/contracts/workspaces';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  load: (userId: string, options?: { preferDemo?: boolean }) => Promise<void>;
  createWorkspace: (input: CreateWorkspaceInput) => Promise<Workspace | null>;
  setActive: (workspaceId: string) => void;
  reset: () => void;
}

/**
 * Invalidates in-flight list requests when a newer action wins, so a slow
 * `/workspaces` response can never overwrite a just-created workspace or a reset.
 */
let loadSequence = 0;

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      status: 'idle',
      load: async (userId, { preferDemo = false } = {}) => {
        // Never call authenticated endpoints with an expired/absent session.
        if (!isSessionValid(useAuthStore.getState().session)) {
          set({ workspaces: [], activeWorkspaceId: null, status: 'idle' });
          return;
        }
        set({ status: 'loading' });
        const sequence = ++loadSequence;
        try {
          const workspaces = await workspaceService.listForUser(userId);
          if (sequence !== loadSequence) return;
          if (!isSessionValid(useAuthStore.getState().session)) {
            set({ workspaces: [], activeWorkspaceId: null, status: 'idle' });
            return;
          }
          const remembered = workspaces.find((w) => w.id === get().activeWorkspaceId);
          const demo = preferDemo ? workspaces.find((w) => w.id === 'ws-demo') : undefined;
          const active = remembered ?? demo ?? workspaces[0] ?? null;
          set({ workspaces, activeWorkspaceId: active?.id ?? null, status: 'ready' });
        } catch {
          if (sequence !== loadSequence) return;
          if (!isSessionValid(useAuthStore.getState().session)) {
            set({ workspaces: [], activeWorkspaceId: null, status: 'idle' });
          } else {
            set({ status: 'error' });
          }
        }
      },
      setActive: (activeWorkspaceId) => set({ activeWorkspaceId }),
      createWorkspace: async (input) => {
        if (!isSessionValid(useAuthStore.getState().session)) return null;
        try {
          const created = await workspaceService.create(input);
          if (!isSessionValid(useAuthStore.getState().session)) return null;
          loadSequence += 1; // any in-flight list is now stale
          // One atomic update: the guard must never observe the new id without its workspace.
          set((state) => ({
            workspaces: state.workspaces.some((w) => w.id === created.id)
              ? state.workspaces.map((w) => (w.id === created.id ? created : w))
              : [...state.workspaces, created],
            activeWorkspaceId: created.id,
            status: 'ready',
          }));
          return created;
        } catch {
          // Creation errors are reported by the caller; leave the current workspace intact.
          return null;
        }
      },
      reset: () => {
        loadSequence += 1;
        set({ workspaces: [], activeWorkspaceId: null, status: 'idle' });
      },
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
