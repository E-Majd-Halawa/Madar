export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'deadline'
  | 'mention'
  | 'message'
  | 'project_update'
  | 'invitation'
  | 'role_change'
  | 'security'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  createdAt: string;
  read: boolean;
  href?: string;
}
