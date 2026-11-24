import type { NotificationService } from '@/api/contracts';
import { mockNotificationService } from '@/api/mock/mockNotificationService';
import { useMocks } from '@/services/serviceMode';
import { unimplementedService } from '@/services/unimplementedService';

// Swap point: export a REST adapter built on '@/api/adapters/http/httpClient' when VITE_API_URL is set.
export const notificationService: NotificationService = useMocks() ? mockNotificationService : unimplementedService<NotificationService>('notificationService');
