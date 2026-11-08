import type { NotificationService } from '@/api/contracts';
import { mockNotificationService } from '@/api/mock/mockNotificationService';
import { httpNotificationService } from '@/api/adapters/http/httpNotificationService';

export const notificationService: NotificationService =
  import.meta.env.VITE_API_URL ? httpNotificationService : mockNotificationService;
