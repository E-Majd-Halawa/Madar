export type UsagePurpose = 'personal' | 'study' | 'work' | 'freelance' | 'team';
export type NotificationLevel = 'all' | 'important' | 'none';
export type CategoryNotificationLevel = 'all' | 'important' | 'none';

export interface UserPreferences {
  onboardingCompleted: boolean;
  usage: UsagePurpose[];
  workspaceType: 'personal' | 'team';
  timezone: string;
  /** "HH:mm" 24h */
  workStart: string;
  workEnd: string;
  /** 0 = Sunday ... 6 = Saturday */
  workDays: number[];
  notificationLevel: NotificationLevel;
  emailNotifications: boolean;
  pushNotifications: boolean;
  categoryLevels: {
    taskReminders: CategoryNotificationLevel;
    mentions: CategoryNotificationLevel;
    messages: CategoryNotificationLevel;
    projectUpdates: CategoryNotificationLevel;
    securityAlerts: CategoryNotificationLevel;
  };
}
