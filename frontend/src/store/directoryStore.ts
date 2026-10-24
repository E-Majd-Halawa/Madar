import { create } from 'zustand';
import { userService } from '@/services/userService';
import type { User } from '@/types';

interface DirectoryState {
  byId: Record<string, User>;
  load: () => Promise<void>;
}

/** Lookup table so lists can show names and avatars for ids (assignees, actors). */
export const useDirectoryStore = create<DirectoryState>()((set, get) => ({
  byId: {},
  load: async () => {
    if (Object.keys(get().byId).length) return;
    const { items } = await userService.list({ pageSize: 200 });
    set({ byId: Object.fromEntries(items.map((u) => [u.id, u])) });
  },
}));

export const useUserName = (id: string | null | undefined): string => useDirectoryStore((s) => (id ? s.byId[id]?.fullName : undefined) ?? '…');
