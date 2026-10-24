export interface AnalyticsOverview {
  completedTasks: number;
  completionRate: number;
  avgCompletionDays: number;
  focusSessionsCount: number;
  focusHours: number;
  overdueTasks: number;
  dailyProductivity: Array<{ date: string; completed: number; focusMinutes: number }>;
  taskDistribution: Array<{ status: string; count: number }>;
  projectProgress: Array<{ id: string; name: string; status: string; memberCount: number }>;
}

export interface AnalyticsService {
  /** GET /api/analytics/overview?userId=...&range=... */
  getOverview(userId: string, range: string): Promise<AnalyticsOverview>;
}
