import type { NotificationService } from '@/api/contracts';
import type { AppNotification } from '@/types';
import { http } from './httpClient';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const httpNotificationService: NotificationService = {
  async list() {
    return http<AppNotification[]>('/notifications');
  },
  async markRead(id: string, read: boolean) {
    await http<void>(`/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ read }),
    });
  },
  async markAllRead() {
    await http<void>('/notifications/read-all', { method: 'POST' });
  },
  async remove(id: string) {
    await http<void>(`/notifications/${id}`, { method: 'DELETE' });
  },
  async push(input) {
    return http<AppNotification>('/notifications', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  subscribe(callback: (notification: AppNotification) => void) {
    let closed = false;
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;
    let backoffMs = 1000;
    let lastEventId: string | null = null;

    const connect = async () => {
      if (closed) return;
      try {
        const ticketRes = await http<{ ticket: string }>('/notifications/stream-ticket', {
          method: 'POST',
        });
        if (closed) return;
        const ticket = ticketRes.ticket;
        const url = `${BASE_URL}/notifications/stream?ticket=${ticket}${
          lastEventId ? `&lastEventId=${encodeURIComponent(lastEventId)}` : ''
        }`;
        eventSource = new EventSource(url);

        eventSource.onopen = () => {
          backoffMs = 1000;
        };

        eventSource.onmessage = (event) => {
          try {
            if (event.lastEventId) {
              lastEventId = event.lastEventId;
            }
            const data: AppNotification = JSON.parse(event.data);
            if (data.id) {
              lastEventId = data.id;
            }
            callback(data);
          } catch {
            // ignore parse error
          }
        };

        eventSource.addEventListener('notification:new', (event: any) => {
          try {
            if (event.lastEventId) {
              lastEventId = event.lastEventId;
            }
            const data: AppNotification = JSON.parse(event.data);
            if (data.id) {
              lastEventId = data.id;
            }
            callback(data);
          } catch {
            // ignore parse error
          }
        });

        eventSource.onerror = () => {
          cleanupEventSource();
          scheduleReconnect();
        };
      } catch {
        scheduleReconnect();
      }
    };

    const cleanupEventSource = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };

    const scheduleReconnect = () => {
      if (closed) return;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        connect();
      }, backoffMs);
      backoffMs = Math.min(backoffMs * 2, 30000);
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      cleanupEventSource();
    };
  },
};
