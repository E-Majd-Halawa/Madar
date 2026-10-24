import { differenceInCalendarDays, eachDayOfInterval, format, isSameDay, startOfDay, subDays } from 'date-fns';
import type { FocusSession, Task, TaskPriority } from '@/types';

const open = (t: Task) => t.status !== 'completed' && t.status !== 'archived';

export const isOverdue = (t: Task, now = new Date()): boolean =>
  open(t) && !!t.dueDate && startOfDay(new Date(t.dueDate)) < startOfDay(now);

export const isDueToday = (t: Task, now = new Date()): boolean =>
  open(t) && !!t.dueDate && isSameDay(new Date(t.dueDate), now);

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
  todayTotal: number;
  todayDone: number;
}

export function computeStats(tasks: Task[], now = new Date()): TaskStats {
  const live = tasks.filter((t) => t.status !== 'archived');
  const completed = live.filter((t) => t.status === 'completed').length;
  const todays = live.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), now));
  return {
    total: live.length,
    completed,
    inProgress: live.filter((t) => t.status === 'in_progress').length,
    overdue: live.filter((t) => isOverdue(t, now)).length,
    completionRate: live.length ? Math.round((completed / live.length) * 100) : 0,
    todayTotal: todays.length,
    todayDone: todays.filter((t) => t.status === 'completed').length,
  };
}

export const priorityDistribution = (tasks: Task[]): Array<{ priority: TaskPriority; count: number }> =>
  (['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((priority) => ({
    priority,
    count: tasks.filter((t) => open(t) && t.priority === priority).length,
  }));

/** Tasks completed and focus minutes for each of the last `days` days. */
export function dailyActivity(tasks: Task[], sessions: FocusSession[], days: number, now = new Date()) {
  return eachDayOfInterval({ start: subDays(now, days - 1), end: now }).map((day) => ({
    label: format(day, 'EEE'),
    date: format(day, 'MMM d'),
    completed: tasks.filter((t) => t.completedAt && isSameDay(new Date(t.completedAt), day)).length,
    focusMinutes: sessions.filter((s) => isSameDay(new Date(s.startedAt), day)).reduce((sum, s) => sum + s.minutes, 0),
  }));
}

export const daysUntil = (iso: string, now = new Date()): number => differenceInCalendarDays(new Date(iso), now);

export const formatMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h && m) return `${h}h ${m}m`;
  return h ? `${h}h` : `${m}m`;
};
