import type { AnalyticsService } from '@/api/contracts/analytics';
import { mockAnalyticsService } from '@/api/mock/mockAnalyticsService';

// Swap point: replace mockAnalyticsService with a backend analytics service when available.
export const analyticsService: AnalyticsService = mockAnalyticsService;
