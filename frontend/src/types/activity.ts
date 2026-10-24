export type ActivityAction =
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'project_created'
  | 'member_invited'
  | 'message_sent'
  | 'role_changed'
  | 'user_suspended'
  | 'settings_changed'
  | 'file_uploaded'
  | 'file_deleted'
  | 'comment_added';

export type ActivityTargetType = 'task' | 'project' | 'member' | 'channel' | 'workspace' | 'file' | 'comment';

export interface ActivityEvent {
  id: string;
  workspaceId: string;
  actorId: string;
  action: ActivityAction;
  targetType: ActivityTargetType;
  targetName: string;
  createdAt: string;
  metadata?: Record<string, string>;
}

export interface FocusSession {
  id: string;
  userId: string;
  workspaceId: string;
  taskId: string | null;
  startedAt: string;
  minutes: number;
}
