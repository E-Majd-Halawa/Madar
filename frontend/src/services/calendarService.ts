import type { CalendarService } from '@/api/contracts';
import { mockCalendarService } from '@/api/mock/mockCalendarService';
import { httpCalendarService } from '@/api/adapters/http/httpCalendarService';

export const calendarService: CalendarService =
  import.meta.env.VITE_API_URL ? httpCalendarService : mockCalendarService;
