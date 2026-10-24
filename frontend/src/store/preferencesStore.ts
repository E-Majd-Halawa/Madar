import { create } from 'zustand';
import { DEFAULT_PREFERENCES } from '@/api/mock/mockSettingsService';
import { settingsService } from '@/services/settingsService';
import type { UserPreferences } from '@/types';

interface PreferencesState {
  prefs: UserPreferences;
  status: 'idle' | 'loading' | 'ready';
  load: (userId: string) => Promise<void>;
  save: (userId: string, patch: Partial<UserPreferences>) => Promise<void>;
  reset: () => void;
}

export const usePreferencesStore = create<PreferencesState>()((set) => ({
  prefs: DEFAULT_PREFERENCES,
  status: 'idle',
  load: async (userId) => {
    set({ status: 'loading' });
    set({ prefs: await settingsService.getPreferences(userId), status: 'ready' });
  },
  save: async (userId, patch) => {
    set((s) => ({ prefs: { ...s.prefs, ...patch } }));
    await settingsService.savePreferences(userId, patch);
  },
  reset: () => set({ prefs: DEFAULT_PREFERENCES, status: 'idle' }),
}));
