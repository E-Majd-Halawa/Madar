import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStateStorage } from '@/services/storage/persistStorage';
import { focusService } from '@/services/focusService';
import type { FocusSession } from '@/types';

export type FocusMode = 'focus' | 'shortBreak' | 'longBreak';
export type AmbientPreset = 'silence' | 'rain' | 'forest' | 'lofi' | 'whitenoise';

interface FocusState {
  mode: FocusMode;
  durations: { focus: number; shortBreak: number; longBreak: number };
  durationMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  selectedTaskId: string | null;
  dndEnabled: boolean;
  ambientPreset: AmbientPreset;
  volume: number;
  sessions: FocusSession[];
  
  setMode: (mode: FocusMode) => void;
  setDuration: (mode: FocusMode, minutes: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  setSelectedTask: (taskId: string | null) => void;
  setDndEnabled: (enabled: boolean) => void;
  setAmbientPreset: (preset: AmbientPreset) => void;
  setVolume: (volume: number) => void;
  loadSessions: (userId: string) => Promise<void>;
  logCompletedSession: (userId: string) => Promise<void>;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      mode: 'focus',
      durations: { focus: 25, shortBreak: 5, longBreak: 15 },
      durationMinutes: 25,
      remainingSeconds: 25 * 60,
      isRunning: false,
      selectedTaskId: null,
      dndEnabled: false,
      ambientPreset: 'silence',
      volume: 0.5,
      sessions: [],

      setMode: (mode) => {
        const durations = get().durations;
        const durationMinutes = durations[mode];
        set({
          mode,
          durationMinutes,
          remainingSeconds: durationMinutes * 60,
          isRunning: false,
        });
      },

      setDuration: (mode, minutes) => {
        const clamped = Math.max(1, Math.min(180, Math.round(minutes)));
        const durations = { ...get().durations, [mode]: clamped };
        set({ durations });
        if (get().mode === mode && !get().isRunning) {
          set({
            durationMinutes: clamped,
            remainingSeconds: clamped * 60,
          });
        }
      },

      startTimer: () => set({ isRunning: true }),
      pauseTimer: () => set({ isRunning: false }),
      resetTimer: () => set({ remainingSeconds: get().durationMinutes * 60, isRunning: false }),

      tick: () => {
        const { isRunning, remainingSeconds } = get();
        if (!isRunning) return;
        if (remainingSeconds > 1) {
          set({ remainingSeconds: remainingSeconds - 1 });
        } else {
          set({ remainingSeconds: 0, isRunning: false });
        }
      },

      setSelectedTask: (selectedTaskId) => set({ selectedTaskId }),
      setDndEnabled: (dndEnabled) => set({ dndEnabled }),
      setAmbientPreset: (ambientPreset) => set({ ambientPreset }),
      setVolume: (volume) => set({ volume }),

      loadSessions: async (userId) => {
        try {
          const sessions = await focusService.listSessions(userId);
          set({ sessions });
        } catch {
          // fallback
        }
      },

      logCompletedSession: async (userId) => {
        const { mode, durationMinutes, selectedTaskId } = get();
        if (mode !== 'focus') return;
        try {
          const newSession = await focusService.logSession({
            userId,
            workspaceId: 'ws-demo',
            taskId: selectedTaskId || null,
            minutes: durationMinutes,
            startedAt: new Date(Date.now() - durationMinutes * 60000).toISOString(),
          });
          set((s) => ({ sessions: [newSession, ...s.sessions] }));
        } catch {
          // ignore
        }
      },
    }),
    {
      name: 'tf3d.focus',
      version: 2,
      storage: createJSONStorage(() => safeStateStorage),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        durations: {
          focus: persistedState?.durations?.focus ?? currentState.durations.focus,
          shortBreak: persistedState?.durations?.shortBreak ?? currentState.durations.shortBreak,
          longBreak: persistedState?.durations?.longBreak ?? currentState.durations.longBreak,
        },
      }),
      partialize: (state) => ({
        dndEnabled: state.dndEnabled,
        ambientPreset: state.ambientPreset,
        volume: state.volume,
        sessions: state.sessions,
        durations: state.durations,
      }),
    },
  ),
);
