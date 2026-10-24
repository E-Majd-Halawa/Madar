import type { AppNotification } from '@/types';

/** GET /notifications  ·  PATCH /notifications/:id/read  ·  DELETE /notifications/:id  ·  WS: notification:new */
export interface NotificationService {
  list(userId: string): Promise<AppNotification[]>;
  markRead(id: string, read: boolean): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  remove(id: string): Promise<void>;
  push(input: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<AppNotification>;
  subscribe(callback: (notification: AppNotification) => void): () => void;
}
