import type { ActivityService } from '@/api/contracts';
import { mockActivityService } from '@/api/mock/mockActivityService';
import { httpActivityService } from '@/api/adapters/http/httpActivityService';

export const activityService: ActivityService =
  import.meta.env.VITE_API_URL ? httpActivityService : mockActivityService;
