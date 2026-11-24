import type { ActivityService } from '@/api/contracts';
import { mockActivityService } from '@/api/mock/mockActivityService';
import { useMocks } from '@/services/serviceMode';
import { unimplementedService } from '@/services/unimplementedService';

// Swap point: export a REST adapter built on '@/api/adapters/http/httpClient' when VITE_API_URL is set.
export const activityService: ActivityService = useMocks() ? mockActivityService : unimplementedService<ActivityService>('activityService');
