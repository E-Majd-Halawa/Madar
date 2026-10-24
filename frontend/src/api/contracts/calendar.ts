import type { Project, Task } from '@/types';

export type CalendarItemType = 'task' | 'project' | 'milestone';

export interface CalendarItem {
  id: string;
  type: CalendarItemType;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD or full timestamp)
  startDate?: string | null;
  dueDate?: string | null;
  status?: string;
  priority?: string;
  color: string;
  projectId?: string | null;
  projectName?: string;
  assigneeId?: string | null;
  completed?: boolean;
  rawTask?: Task;
  rawProject?: Project;
}

export interface CalendarFilter {
  projectId?: string;
  priority?: string;
  assigneeId?: string;
  type?: 'all' | 'task' | 'project';
  month?: number;
  year?: number;
}

export interface CalendarService {
  getItems(workspaceId: string, filter?: CalendarFilter): Promise<CalendarItem[]>;
}
