import { create } from 'zustand';
import { notificationService } from '@/services/notificationService';
import { useToastStore } from '@/store/toastStore';
import type { AppNotification, NotificationType } from '@/types';

interface NotificationState {
  userId: string | null;
  items: AppNotification[];
  unsubscribe: (() => void) | null;
  load: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  markRead: (id: string, read: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  pushNotification: (input: { userId: string; type: NotificationType; title: string; body?: string; href?: string }) => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  userId: null,
  items: [],
  unsubscribe: null,

  load: async (userId) => {
    const prevUnsub = get().unsubscribe;
    if (prevUnsub) prevUnsub();

    set({ userId });
    const items = await notificationService.list(userId);
    set({ items });

    const unsub = notificationService.subscribe((notification) => {
      if (notification.userId === get().userId) {
        set((s) => ({ items: [notification, ...s.items] }));
        useToastStore.getState().push({
          tone: 'info',
          message: notification.title,
        });
      }
    });

    set({ unsubscribe: unsub });
  },

  refresh: async () => {
    const { userId } = get();
    if (userId) set({ items: await notificationService.list(userId) });
  },

  markRead: async (id, read) => {
    set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read } : n)) }));
    await notificationService.markRead(id, read);
  },

  markAllRead: async () => {
    const { userId } = get();
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }));
    if (userId) await notificationService.markAllRead(userId);
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((n) => n.id !== id) }));
    await notificationService.remove(id);
  },

  pushNotification: async (input) => {
    const created = await notificationService.push(input);
    set((s) => {
      // Deduplicate by type + title within last 5 minutes
      const exists = s.items.some(
        (n) => n.type === input.type && n.title === input.title && Math.abs(Date.now() - new Date(n.createdAt).getTime()) < 300000,
      );
      if (exists) return s;
      return { items: [created, ...s.items] };
    });
  },

  reset: () => {
    const unsub = get().unsubscribe;
    if (unsub) unsub();
    set({ userId: null, items: [], unsubscribe: null });
  },
}));

export const selectUnreadCount = (s: NotificationState) => s.items.filter((n) => !n.read).length;
