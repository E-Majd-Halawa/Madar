import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStateStorage } from '@/services/storage/persistStorage';
import type { DirectionChoice, Language } from '@/types';

interface SettingsState {
  language: Language;
  direction: DirectionChoice;
  setLanguage: (language: Language) => void;
  setDirection: (direction: DirectionChoice) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      direction: 'auto',
      setLanguage: (language) => set({ language }),
      setDirection: (direction) => set({ direction }),
    }),
    { name: 'tf3d.settings', version: 1, storage: createJSONStorage(() => safeStateStorage) },
  ),
);

export const resolveDirection = (language: Language, direction: DirectionChoice): 'ltr' | 'rtl' =>
  direction === 'auto' ? (language === 'ar' ? 'rtl' : 'ltr') : direction;
