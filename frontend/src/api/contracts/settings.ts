import type { UserPreferences } from '@/types';

/** GET /me/preferences  ·  PATCH /me/preferences */
export interface SettingsService {
  getPreferences(userId: string): Promise<UserPreferences>;
  savePreferences(userId: string, patch: Partial<UserPreferences>): Promise<UserPreferences>;
}
