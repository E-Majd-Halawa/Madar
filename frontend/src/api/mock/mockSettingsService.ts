import type { SettingsService } from '@/api/contracts';
import { storage } from '@/services/storage/storageAdapter';
import type { UserPreferences } from '@/types';
import { delay } from './delay';

export const DEFAULT_PREFERENCES: UserPreferences = {
  onboardingCompleted: false,
  usage: [],
  workspaceType: 'personal',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  workStart: '09:00',
  workEnd: '17:00',
  workDays: [1, 2, 3, 4, 5],
  notificationLevel: 'all',
  emailNotifications: true,
  pushNotifications: false,
  categoryLevels: {
    taskReminders: 'all',
    mentions: 'all',
    messages: 'all',
    projectUpdates: 'all',
    securityAlerts: 'important',
  },
};

const keyFor = (userId: string) => `mock.prefs.${userId}`;

export const mockSettingsService: SettingsService = {
  async getPreferences(userId) {
    await delay(100);
    const saved = storage.get<UserPreferences>(keyFor(userId));
    const seededAccount = userId === 'u-001' || userId === 'u-002' || userId === 'u-003';
    return saved ?? { ...DEFAULT_PREFERENCES, onboardingCompleted: seededAccount };
  },
  async savePreferences(userId, patch) {
    const current = await this.getPreferences(userId);
    const next = { ...current, ...patch };
    storage.set(keyFor(userId), next);
    return next;
  },
};
