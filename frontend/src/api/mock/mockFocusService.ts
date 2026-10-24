import type { FocusService } from '@/api/contracts/focus';
import type { FocusSession } from '@/types';
import { SEED_FOCUS_SESSIONS } from '@/data/activity';
import { delay } from './delay';

let sessionsStore: FocusSession[] = [...SEED_FOCUS_SESSIONS];

export const mockFocusService: FocusService = {
  async listSessions(userId: string): Promise<FocusSession[]> {
    await delay(150);
    return sessionsStore.filter((s) => s.userId === userId || !s.userId);
  },

  async logSession(sessionData: Omit<FocusSession, 'id'>): Promise<FocusSession> {
    await delay(200);
    const newSession: FocusSession = {
      ...sessionData,
      id: `fs-${Date.now()}`,
    };
    sessionsStore = [newSession, ...sessionsStore];
    return newSession;
  },
};
