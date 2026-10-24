import type { NotificationService } from '@/api/contracts';
import { mockNotificationService } from '@/api/mock/mockNotificationService';

// Swap point: export a REST adapter built on '@/api/adapters/http/httpClient' when VITE_API_URL is set.
export const notificationService: NotificationService = mockNotificationService;
