import type { CalendarService } from '@/api/contracts';
import { mockCalendarService } from '@/api/mock/mockCalendarService';

// Swap point: export a REST adapter built on '@/api/adapters/http/httpClient' when VITE_API_URL is set.
export const calendarService: CalendarService = mockCalendarService;
