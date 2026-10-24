import type { ActivityService } from '@/api/contracts';
import { mockActivityService } from '@/api/mock/mockActivityService';

// Swap point: export a REST adapter built on '@/api/adapters/http/httpClient' when VITE_API_URL is set.
export const activityService: ActivityService = mockActivityService;
