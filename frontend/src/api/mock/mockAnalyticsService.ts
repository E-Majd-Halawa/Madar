import type { AnalyticsService, AnalyticsOverview } from '@/api/contracts/analytics';
import { delay } from './delay';

export const mockAnalyticsService: AnalyticsService = {
  async getOverview(_userId: string, range: string): Promise<AnalyticsOverview> {
    await delay(200);
    const multiplier = range === '90' ? 3 : range === '30' ? 1.5 : 1;
    return {
      completedTasks: Math.round(42 * multiplier),
      completionRate: 88,
      avgCompletionDays: 2.4,
      focusSessionsCount: Math.round(28 * multiplier),
      focusHours: Math.round(34 * multiplier * 10) / 10,
      overdueTasks: 3,
      dailyProductivity: [
        { date: 'Mon', completed: 6, focusMinutes: 120 },
        { date: 'Tue', completed: 8, focusMinutes: 150 },
        { date: 'Wed', completed: 5, focusMinutes: 90 },
        { date: 'Thu', completed: 9, focusMinutes: 180 },
        { date: 'Fri', completed: 7, focusMinutes: 140 },
        { date: 'Sat', completed: 4, focusMinutes: 60 },
        { date: 'Sun', completed: 3, focusMinutes: 45 },
      ],
      taskDistribution: [
        { status: 'Completed', count: 42 },
        { status: 'In Progress', count: 12 },
        { status: 'Todo', count: 18 },
        { status: 'Backlog', count: 8 },
      ],
      projectProgress: [
        { id: 'p-1', name: 'TaskFlow 3D SaaS', status: 'active', memberCount: 5 },
        { id: 'p-2', name: 'Node.js API Microservice', status: 'active', memberCount: 3 },
        { id: 'p-3', name: 'Design System V2', status: 'planning', memberCount: 4 },
      ],
    };
  },
};
