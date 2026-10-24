import type { NotificationService } from '@/api/contracts';
import { SEED_NOTIFICATIONS } from '@/data/notifications';
import type { AppNotification } from '@/types';
import { createCollection, newId } from './collection';
import { delay } from './delay';

const table = createCollection<AppNotification>('mock.notifications', SEED_NOTIFICATIONS);
const listeners = new Set<(notification: AppNotification) => void>();

export const mockNotificationService: NotificationService = {
  async list(userId) {
    await delay(150);
    return table
      .read()
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async markRead(id, read) {
    table.write(table.read().map((n) => (n.id === id ? { ...n, read } : n)));
  },
  async markAllRead(userId) {
    table.write(table.read().map((n) => (n.userId === userId ? { ...n, read: true } : n)));
  },
  async remove(id) {
    table.write(table.read().filter((n) => n.id !== id));
  },
  async push(input) {
    const created: AppNotification = { ...input, id: newId('ntf'), createdAt: new Date().toISOString(), read: false };
    table.write([created, ...table.read()]);
    listeners.forEach((cb) => cb(created));
    return created;
  },
  subscribe(callback) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
};
