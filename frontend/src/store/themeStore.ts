import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStateStorage } from '@/services/storage/persistStorage';
import type { AnimationLevel, ThemeChoice } from '@/types';

interface ThemeState {
  theme: ThemeChoice;
  /** hex color, or null to use the theme's own accent */
  accent: string | null;
  animation: AnimationLevel;
  effects3d: boolean;
  setTheme: (theme: ThemeChoice) => void;
  setAccent: (accent: string | null) => void;
  setAnimation: (animation: AnimationLevel) => void;
  setEffects3d: (enabled: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'midnight',
      accent: null,
      animation: 'medium',
      effects3d: true,
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setAnimation: (animation) => set({ animation }),
      setEffects3d: (effects3d) => set({ effects3d }),
    }),
    { name: 'tf3d.theme', version: 1, storage: createJSONStorage(() => safeStateStorage) },
  ),
);
