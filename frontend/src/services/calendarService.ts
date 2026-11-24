import type { CalendarService } from '@/api/contracts';
import { mockCalendarService } from '@/api/mock/mockCalendarService';
import { useMocks } from '@/services/serviceMode';
import { unimplementedService } from '@/services/unimplementedService';

// Swap point: export a REST adapter built on '@/api/adapters/http/httpClient' when VITE_API_URL is set.
export const calendarService: CalendarService = useMocks() ? mockCalendarService : unimplementedService<CalendarService>('calendarService');
