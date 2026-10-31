import type { CalendarFilter, CalendarItem } from '@/api/contracts';
import { http } from './httpClient';
import type { CalendarService } from '@/api/contracts';

export const httpCalendarService: CalendarService = {
  getItems(workspaceId, filter) {
    const q = new URLSearchParams();
    if (filter?.projectId) q.set('projectId', filter.projectId);
    if (filter?.priority) q.set('priority', filter.priority);
    if (filter?.assigneeId) q.set('assigneeId', filter.assigneeId);
    if (filter?.type) q.set('type', filter.type);
    if (filter?.month) q.set('month', String(filter.month));
    if (filter?.year) q.set('year', String(filter.year));
    const qs = q.toString();
    return http<CalendarItem[]>(`/workspaces/${workspaceId}/calendar${qs ? `?${qs}` : ''}`);
  },
};
