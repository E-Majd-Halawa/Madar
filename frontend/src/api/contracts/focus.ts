import type { FocusSession } from '@/types';

export interface FocusService {
  /** GET /api/focus/sessions?userId=... */
  listSessions(userId: string): Promise<FocusSession[]>;
  /** POST /api/focus/sessions */
  logSession(session: Omit<FocusSession, 'id'>): Promise<FocusSession>;
}
