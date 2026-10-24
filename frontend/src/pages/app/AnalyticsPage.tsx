import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { analyticsService } from '@/services/analyticsService';
import type { AnalyticsOverview } from '@/api/contracts/analytics';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { toast } from '@/store/toastStore';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, TrendingUp, CheckCircle2, Clock, AlertTriangle, Download, Calendar, ArrowUpRight 
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { session } = useAuthStore();
  const user = session?.user;

  const [range, setRange] = useState<'7' | '30' | '90'>('30');
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const overview = await analyticsService.getOverview(user?.id || 'u-001', range);
        if (mounted) setData(overview);
      } catch {
        toast.error(t('analytics.loadError', 'Failed to load analytics data.'));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user?.id, range, t]);

  const handleExportCsv = () => {
    if (!data) return;
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      ['Metric,Value', `Completed Tasks,${data.completedTasks}`, `Completion Rate,${data.completionRate}%`, `Focus Hours,${data.focusHours}`, `Overdue Tasks,${data.overdueTasks}`].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `taskflow-analytics-${range}d.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success(t('analytics.exportSuccess', 'Analytics CSV exported successfully.'));
  };

  if (loading || !data) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-pulse">
        <div className="h-8 bg-surface-muted rounded-xl w-1/3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-surface-muted rounded-xl" />)}
        </div>
        <div className="h-80 bg-surface-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header & Range Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" /> {t('analytics.title', 'Productivity Analytics')}
          </h1>
          <p className="text-sm text-text-muted">{t('analytics.subtitle', 'Comprehensive metrics and trends across your workspace projects and tasks.')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-muted p-1 rounded-xl border border-border">
            {(['7', '30', '90'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${range === r ? 'bg-primary text-primary-fg shadow-sm' : 'text-text-muted hover:text-text'}`}
              >
                {t(`analytics.timeframe.${r}`, `Last ${r} Days`)}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={handleExportCsv} className="flex items-center gap-2">
            <Download className="w-4 h-4" /> {t('analytics.exportCsv', 'Export CSV')}
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 space-y-1">
          <p className="text-xs text-text-muted font-medium">{t('analytics.completed', 'Completed')}</p>
          <p className="text-2xl font-bold text-text"><bdi>{data.completedTasks}</bdi></p>
          <span className="text-xs text-emerald-500 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> {t('analytics.vsLast', '+12% vs last')}</span>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs text-text-muted font-medium">{t('analytics.successRate', 'Success Rate')}</p>
          <p className="text-2xl font-bold text-text"><bdi>{data.completionRate}%</bdi></p>
          <span className="text-xs text-emerald-500 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> {t('analytics.optimal', 'Optimal')}</span>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs text-text-muted font-medium">{t('analytics.avgCompletion', 'Avg Completion')}</p>
          <p className="text-2xl font-bold text-text"><bdi>{data.avgCompletionDays}</bdi>d</p>
          <span className="text-xs text-text-muted">{t('analytics.fastTurnaround', 'Fast turnaround')}</span>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs text-text-muted font-medium">{t('analytics.focusSessions', 'Focus Sessions')}</p>
          <p className="text-2xl font-bold text-text"><bdi>{data.focusSessionsCount}</bdi></p>
          <span className="text-xs text-primary">{t('analytics.deepWork', 'Deep work')}</span>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs text-text-muted font-medium">{t('analytics.focusHours', 'Focus Hours')}</p>
          <p className="text-2xl font-bold text-text"><bdi>{data.focusHours}</bdi>h</p>
          <span className="text-xs text-amber-500">{t('analytics.totalLogged', 'Total logged')}</span>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs text-text-muted font-medium">{t('analytics.overdueTasks', 'Overdue Tasks')}</p>
          <p className="text-2xl font-bold text-text text-red-500"><bdi>{data.overdueTasks}</bdi></p>
          <span className="text-xs text-red-500">{t('analytics.actionNeeded', 'Action needed')}</span>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Productivity Line Chart */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text">{t('analytics.velocityTitle', 'Daily Task Velocity')}</h3>
            <p className="text-xs text-text-muted">{t('analytics.velocitySubtitle', 'Completed tasks per day over the selected window.')}</p>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border opacity-30" />
                <XAxis dataKey="date" stroke="currentColor" className="text-text-muted text-xs" />
                <YAxis stroke="currentColor" className="text-text-muted text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="completed" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Focus Minutes Bar Chart */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text">{t('analytics.focusMinutesTitle', 'Focus Minutes per Day')}</h3>
            <p className="text-xs text-text-muted">{t('analytics.focusMinutesSubtitle', 'Daily deep work duration in minutes.')}</p>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border opacity-30" />
                <XAxis dataKey="date" stroke="currentColor" className="text-text-muted text-xs" />
                <YAxis stroke="currentColor" className="text-text-muted text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                <Bar dataKey="focusMinutes" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Project Status Breakdown */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text">{t('analytics.projectsStatusTitle', 'Workspace Projects Status')}</h3>
          <p className="text-xs text-text-muted">{t('analytics.projectsStatusSubtitle', 'Active milestones and member allocations.')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {data.projectProgress.map((proj) => (
            <div key={proj.id} className="p-4 rounded-xl bg-surface-muted border border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text">{proj.name}</p>
                <Badge tone="accent" className="capitalize">{proj.status}</Badge>
              </div>
              <p className="text-xs text-text-muted">{t('analytics.teamMembers', { count: proj.memberCount })}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
