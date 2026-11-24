import type { AnalyticsService } from '@/api/contracts/analytics';
import { mockAnalyticsService } from '@/api/mock/mockAnalyticsService';
import { useMocks } from '@/services/serviceMode';
import { unimplementedService } from '@/services/unimplementedService';

// Swap point: replace mockAnalyticsService with a backend analytics service when available.
export const analyticsService: AnalyticsService = useMocks() ? mockAnalyticsService : unimplementedService<AnalyticsService>('analyticsService');
