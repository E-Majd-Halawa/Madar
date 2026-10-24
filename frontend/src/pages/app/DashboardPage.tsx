import { Activity, AlertTriangle, CheckCircle2, FolderKanban, ListChecks, Loader, Percent, RefreshCw, Target, Timer } from 'lucide-react';
import { startOfWeek } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/constants/routes';
import { ActiveProjects } from '@/features/dashboard/ActiveProjects';
import { ActivityFeed } from '@/features/dashboard/ActivityFeed';
import { DashboardSkeleton } from '@/features/dashboard/DashboardSkeleton';
import { FocusStats } from '@/features/dashboard/FocusStats';
import { PriorityDonut } from '@/features/dashboard/PriorityDonut';
import { ProductivityChart } from '@/features/dashboard/ProductivityChart';
import { QuickActions } from '@/features/dashboard/QuickActions';
import { StatCard } from '@/features/dashboard/StatCard';
import { Widget } from '@/features/dashboard/Widget';
import { TaskRow } from '@/features/tasks/TaskRow';
import { useActivityStore } from '@/store/activityStore';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { selectActiveWorkspace, useWorkspaceStore } from '@/store/workspaceStore';
import { computeStats, formatMinutes, isDueToday, isOverdue } from '@/utils/taskStats';

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.session?.user);
  const isDemo = useAuthStore((s) => s.session?.isDemo);
  const workspace = useWorkspaceStore(selectActiveWorkspace);
  const { tasks, status, load } = useTaskStore();
  const projects = useProjectStore((s) => s.projects);
  const { events, focusSessions } = useActivityStore();

  // Memoized load function to prevent unnecessary re-renders
  const handleLoad = useCallback(() => {
    if (workspace) void load(workspace.id);
  }, [load, workspace]);

  // Derived data with proper memoization
  const mine = useMemo(() => tasks.filter((x) => x.assigneeId === user?.id), [tasks, user?.id]);
  const stats = useMemo(() => computeStats(mine), [mine]);

  const week = useMemo(() => {
    const from = startOfWeek(new Date(), { weekStartsOn: 1 });
    return {
      done: mine.filter((x) => x.completedAt && new Date(x.completedAt) >= from).length,
      focus: focusSessions.filter((s) => new Date(s.startedAt) >= from).reduce((sum, s) => sum + s.minutes, 0),
    };
  }, [mine, focusSessions]);

  const today = useMemo(
    () =>
      mine.filter(
        (x) =>
          isDueToday(x) ||
          isOverdue(x) ||
          (x.status === 'completed' && x.dueDate && new Date(x.dueDate).toDateString() === new Date().toDateString()),
      ),
    [mine],
  );

  const upcoming = useMemo(
    () =>
      mine
        .filter((x) => x.status !== 'completed' && x.status !== 'archived' && x.dueDate && !isDueToday(x) && !isOverdue(x))
        .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
        .slice(0, 5),
    [mine],
  );

  const mineEvents = useMemo(() => events.filter((e) => e.actorId === user?.id), [events, user?.id]);
  const teamEvents = useMemo(() => events.filter((e) => e.actorId !== user?.id), [events, user?.id]);
  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active').length, [projects]);
  const focusHours = useMemo(() => Math.round(week.focus / 6) / 10, [week.focus]);

  // Loading and error states
  if (!user || !workspace) return <DashboardSkeleton />;
  if (status === 'loading' || status === 'idle') return <DashboardSkeleton />;

  if (status === 'error') {
    return (
      <div className="glass rounded-2xl" role="alert">
        <EmptyState
          icon={AlertTriangle}
          title={t('errors.somethingWrong')}
          body={t('dashboard.error')}
          action={
            <Button variant="primary" onClick={handleLoad} aria-label={t('common.retry')}>
              <RefreshCw className="size-4" aria-hidden />
              {t('common.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  const hour = new Date().getHours();
  const part = t(hour < 12 ? 'dashboard.morning' : hour < 18 ? 'dashboard.afternoon' : 'dashboard.evening');
  const todayPct = stats.todayTotal ? Math.round((stats.todayDone / stats.todayTotal) * 100) : 0;

  return (
    <div className="space-y-6" dir="auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('dashboard.greeting', { part, name: user.fullName.split(' ')[0] })}</h1>
          <p className="mt-1 text-sm text-muted">{t('dashboard.subtitle', { workspace: workspace.name })}</p>
        </div>
        {isDemo && <Badge tone="warning">{t('common.demoMode')}</Badge>}
      </header>

      <QuickActions />

      <section aria-label={t('dashboard.stats.label')} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('dashboard.stats.total')} value={stats.total} icon={ListChecks} />
        <StatCard label={t('dashboard.stats.completed')} value={stats.completed} icon={CheckCircle2} />
        <StatCard label={t('dashboard.stats.inProgress')} value={stats.inProgress} icon={Loader} tone="info" />
        <StatCard label={t('dashboard.stats.overdue')} value={stats.overdue} icon={AlertTriangle} tone="danger" />
        <StatCard label={t('dashboard.stats.rate')} value={stats.completionRate} suffix="%" icon={Percent} />
        <StatCard label={t('dashboard.stats.projects')} value={activeProjects} icon={FolderKanban} tone="info" />
        <StatCard
          label={t('dashboard.stats.today')}
          value={todayPct}
          suffix="%"
          icon={Target}
          hint={t('dashboard.tasksCount', { done: stats.todayDone, total: stats.todayTotal })}
        />
        <StatCard
          label={t('dashboard.stats.focus')}
          value={focusHours}
          suffix="h"
          icon={Timer}
          tone="info"
          hint={`${t('dashboard.stats.week')}: ${week.done}`}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Widget title={t('dashboard.widgets.productivity')} to={ROUTES.app.analytics} className="lg:col-span-2">
          <ProductivityChart tasks={mine} sessions={focusSessions} />
        </Widget>
        <Widget title={t('dashboard.widgets.priority')}>
          <PriorityDonut tasks={mine} />
        </Widget>

        <Widget title={t('dashboard.widgets.today')} to={ROUTES.app.today}>
          {today.length ? (
            <ul className="divide-y divide-border/10" role="list" aria-label={t('dashboard.widgets.today')}>
              {today.slice(0, 6).map((x) => <TaskRow key={x.id} task={x} />)}
            </ul>
          ) : (
            <EmptyState icon={CheckCircle2} title={t('dashboard.empty.today')} body={t('dashboard.empty.todayBody')} />
          )}
        </Widget>
        <Widget title={t('dashboard.widgets.upcoming')} to={ROUTES.app.upcoming}>
          {upcoming.length ? (
            <ul className="divide-y divide-border/10" role="list" aria-label={t('dashboard.widgets.upcoming')}>
              {upcoming.map((x) => <TaskRow key={x.id} task={x} />)}
            </ul>
          ) : (
            <p className="py-4 text-sm text-muted">{t('dashboard.empty.upcoming')}</p>
          )}
        </Widget>
        <Widget title={t('dashboard.widgets.focusStats')} to={ROUTES.app.focus}>
          <FocusStats sessions={focusSessions} />
        </Widget>

        <Widget title={t('dashboard.widgets.projects')} to={ROUTES.app.projects}>
          <ActiveProjects projects={projects} tasks={tasks} />
        </Widget>
        <Widget title={t('dashboard.widgets.activity')} to={ROUTES.app.activity}>
          <ActivityFeed events={mineEvents.length ? mineEvents : events} emptyKey="dashboard.empty.activity" />
        </Widget>
        <Widget title={t('dashboard.widgets.team')} to={ROUTES.app.members}>
          <ActivityFeed events={teamEvents} emptyKey="dashboard.teamEmpty" />
        </Widget>
      </div>

      {isDemo && (
        <p className="flex items-center gap-2 text-xs text-muted" role="status">
          <Activity className="size-3.5" aria-hidden />
          {t('dashboard.demoNote')}
        </p>
      )}
      <span className="sr-only">{formatMinutes(week.focus)}</span>
    </div>
  );
}
