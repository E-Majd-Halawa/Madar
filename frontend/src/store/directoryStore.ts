import { create } from 'zustand';
import { userService } from '@/services/userService';
import type { User } from '@/types';

/** Backend caps `pageSize` at 100 (backend/src/modules/users/dto/users.dto.ts:10). */
const DIRECTORY_PAGE_SIZE = 100;

interface DirectoryState {
  byId: Record<string, User>;
  status: 'idle' | 'loading' | 'ready';
  load: () => Promise<void>;
  reset: () => void;
}

/** Lookup table so lists can show names and avatars for ids (assignees, actors). */
export const useDirectoryStore = create<DirectoryState>()((set, get) => ({
  byId: {},
  status: 'idle',
  load: async () => {
    if (get().status === 'loading' || get().status === 'ready') return;
    set({ status: 'loading' });
    try {
      const { items } = await userService.list({ pageSize: DIRECTORY_PAGE_SIZE });
      set({ byId: Object.fromEntries(items.map((u) => [u.id, u])), status: 'ready' });
    } catch {
      // Best-effort lookup: leave the placeholder names in place and allow a retry.
      set({ status: 'idle' });
    }
  },
  reset: () => set({ byId: {}, status: 'idle' }),
}));

export const useUserName = (id: string | null | undefined): string => useDirectoryStore((s) => (id ? s.byId[id]?.fullName : undefined) ?? '…');
