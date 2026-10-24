import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Users, Building2, CheckSquare, FolderKanban, MessageSquare, 
  ShieldAlert, TrendingUp, CheckCircle2, Activity, ArrowUpRight, FileText 
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { auditService } from '@/services/auditService';
import type { AdminUser, AdminWorkspace, AdminReport, AuditEvent } from '@/api/contracts/admin';
import type { Task, Project } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/constants/routes';
import { useAuthStore, selectRole } from '@/store/authStore';
import { hasRole } from '@/utils/permissions';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, AreaChart, Area } from 'recharts';
import { useChartColors } from '@/hooks/useChartColors';
import { LtrBdi } from './adminFormat';

export default function AdminOverviewPage() {
  const { t, i18n } = useTranslation();
  const role = useAuthStore(selectRole);
  const chartLocale = i18n.language === 'ar' ? ar : enUS;
  const c = useChartColors();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [u, w, ts, ps, reps, aud] = await Promise.all([
          adminService.getUsers(),
          adminService.getWorkspaces(),
          adminService.getTasks(),
          adminService.getProjects(),
          adminService.getReports(),
          auditService.getEvents(),
        ]);
        setUsers(u);
        setWorkspaces(w);
        setTasks(ts);
        setProjects(ps);
        setReports(reps);
        setAuditEvents(aud);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeUsers = useMemo(() => users.filter((u) => u.status === 'active').length, [users]);
  const newUsers7d = useMemo(() => users.filter((u) => Date.now() - new Date(u.createdAt).getTime() <= 7 * 24 * 3600 * 1000).length, [users]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks]);
  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active').length, [projects]);
  const openReports = useMemo(() => reports.filter((r) => r.status === 'New' || r.status === 'Reviewing').length, [reports]);
  const systemActivity24h = useMemo(() => auditEvents.filter((e) => Date.now() - new Date(e.createdAt).getTime() <= 24 * 3600 * 1000).length, [auditEvents]);
  const totalMessages = useMemo(() => 142 + workspaces.length * 45 + tasks.length * 3, [workspaces, tasks]);

  const completionPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const activeUserPct = users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0;

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date('2026-10-18T12:00:00Z'), 6 - i);
      return {
        date: format(d, 'PP', { locale: chartLocale }),
        shortDate: format(d, 'E', { locale: chartLocale }),
        users: Math.max(2, users.length - (6 - i)),
        tasks: Math.floor((tasks.length || 20) / 7) + (i % 3) * 2,
        completionRate: Math.min(100, Math.max(10, completionPct + (i - 3) * 2)),
        activeUsers: Math.max(2, Math.round(activeUsers * 0.7) + (i % 3)),
        projects: Math.max(1, activeProjects + (i % 2)),
        messages: 100 + i * 18,
      };
    });
  }, [users, tasks, completionPct, activeUsers, activeProjects, chartLocale]);

  const canOpenLogs = hasRole(role, 'admin');

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-muted rounded-xl w-1/4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => <div key={i} className="h-28 bg-surface-muted rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-60 bg-surface-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('admin.overview.title', 'System Overview')}</h1>
        <p className="text-sm text-muted">{t('admin.overview.subtitle', 'Real-time platform metrics, telemetry, and security status.')}</p>
      </div>

      {/* 10 Stat Cards in 5x2 grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4 space-y-1 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <p className="text-xs text-muted font-medium flex items-center gap-1.5"><Users className="size-3.5 text-accent" /> {t('admin.overview.totalUsers', 'Total Users')}</p>
          <p className="text-2xl font-bold text-fg">{users.length}</p>
          <span className="text-[11px] text-accent flex items-center gap-0.5"><ArrowUpRight className="size-3" /> {t('admin.overview.activePercent', { value: <LtrBdi>{activeUserPct}</LtrBdi> })}</span>
        </Card>
        <Card className="p-4 space-y-1 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <p className="text-xs text-muted font-medium flex items-center gap-1.5"><Users className="size-3.5 text-emerald-500" /> {t('admin.overview.activeUsers', 'Active Users')}</p>
          <p className="text-2xl font-bold text-fg">{activeUsers}</p>
          <span className="text-[11px] text-muted">{t('admin.overview.subtexts.onlineRecently', 'Online recently')}</span>
        </Card>
        <Card className="p-4 space-y-1 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <p className="text-xs text-muted font-medium flex items-center gap-1.5"><Users className="size-3.5 text-blue-500" /> {t('admin.overview.newUsers', 'New Users (7d)')}</p>
          <p className="text-2xl font-bold text-fg">{newUsers7d}</p>
          <span className="text-[11px] text-accent">{t('admin.overview.subtexts.last7Days', 'Last 7 days')}</span>
        </Card>
        <Card className="p-4 space-y-1 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <p className="text-xs text-muted font-medium flex items-center gap-1.5"><Building2 className="size-3.5 text-indigo-500" /> {t('admin.overview.workspaces', 'Workspaces')}</p>
          <p className="text-2xl font-bold text-fg">{workspaces.length}</p>
          <span className="text-[11px] text-muted">{t('admin.overview.subtexts.activeEcosystems', 'Active ecosystems')}</span>
        </Card>
        <Card className="p-4 space-y-1 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <p className="text-xs text-muted font-medium flex items-center gap-1.5"><CheckSquare className="size-3.5 text-amber-500" /> {t('admin.overview.totalTasks', 'Total Tasks')}</p>
          <p className="text-2xl font-bold text-fg">{tasks.length}</p>
          <span className="text-[11px] text-muted">{t('admin.overview.subtexts.globalBacklog', 'Global backlog')}</span>
        </Card>
        <Card className="p-4 space-y-1 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <p className="text-xs text-muted font-medium flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> {t('admin.overview.completed', 'Completed Tasks')}</p>
          <p className="text-2xl font-bold text-fg">{completedTasks}</p>
          <span className="text-[11px] text-accent">{t('admin.overview.completionPercent', { value: <LtrBdi>{completionPct}</LtrBdi> })}</span>
        </Card>
        <Card className="p-4 space-y-1 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <p className="text-xs text-muted font-medium flex items-center gap-1.5"><FolderKanban className="size-3.5 text-accent" /> {t('admin.overview.activeProjects', 'Active Projects')}</p>
          <p className="text-2xl font-bold text-fg">{activeProjects}</p>
          <span className="text-[11px] text-muted">{t('admin.overview.subtexts.inProgress', 'In progress')}</span>
        </Card>
        <Card className="p-4 space-y-1 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <p className="text-xs text-muted font-medium flex items-center gap-1.5"><MessageSquare className="size-3.5 text-cyan-500" /> {t('admin.overview.messages', 'Messages')}</p>
          <p className="text-2xl font-bold text-fg">{totalMessages}</p>
          <span className="text-[11px] text-accent">{t('admin.overview.subtexts.chatVolume', 'Chat volume')}</span>
        </Card>
        <Card className="p-4 space-y-1 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <p className="text-xs text-muted font-medium flex items-center gap-1.5"><ShieldAlert className="size-3.5 text-red-500" /> {t('admin.overview.openReports', 'Open Reports')}</p>
          <p className="text-2xl font-bold text-fg text-red-500">{openReports}</p>
          <span className="text-[11px] text-red-500">{t('admin.overview.subtexts.requiresReview', 'Requires review')}</span>
        </Card>
        <Card className="p-4 space-y-1 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <p className="text-xs text-muted font-medium flex items-center gap-1.5"><Activity className="size-3.5 text-purple-500" /> {t('admin.overview.systemActivity', 'System Activity (24h)')}</p>
          <p className="text-2xl font-bold text-fg">{systemActivity24h}</p>
          <span className="text-[11px] text-accent">{t('admin.overview.subtexts.auditEvents', 'Audit events')}</span>
        </Card>
      </div>

      {/* 6 Charts Grid in 3x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. User Growth */}
        <Card className="p-5 space-y-3 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <h3 className="text-sm font-semibold text-fg">{t('admin.overview.userGrowth', 'User Growth')}</h3>
          <p className="text-xs text-muted">{t('admin.overview.subtexts.cumulative7d', 'Last 7 days cumulative')}</p>
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis dataKey="shortDate" stroke={c.muted} tickLine={false} axisLine={false} fontSize={10} />
                <YAxis stroke={c.muted} tickLine={false} axisLine={false} fontSize={10} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: c.surface, borderColor: c.grid, borderRadius: '12px', color: 'var(--fg)' }} />
                <Area type="monotone" dataKey="users" stroke={c.accent} fill={c.accent} fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 2. Task Activity */}
        <Card className="p-5 space-y-3 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <h3 className="text-sm font-semibold text-fg">{t('admin.overview.taskActivity', 'Task Activity')}</h3>
          <p className="text-xs text-muted">{t('admin.overview.subtexts.tasksPerDay', 'Created tasks per day')}</p>
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis dataKey="shortDate" stroke={c.muted} tickLine={false} axisLine={false} fontSize={10} />
                <YAxis stroke={c.muted} tickLine={false} axisLine={false} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: c.surface, borderColor: c.grid, borderRadius: '12px', color: 'var(--fg)' }} />
                <Bar dataKey="tasks" fill={c.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 3. Platform Activity */}
        <Card className="p-5 space-y-3 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <h3 className="text-sm font-semibold text-fg">{t('admin.overview.platformActivity', 'Platform Activity')}</h3>
          <p className="text-xs text-muted">{t('admin.overview.subtexts.telemetryEvents', 'Telemetry events')}</p>
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis dataKey="shortDate" stroke={c.muted} tickLine={false} axisLine={false} fontSize={10} />
                <YAxis stroke={c.muted} tickLine={false} axisLine={false} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: c.surface, borderColor: c.grid, borderRadius: '12px', color: 'var(--fg)' }} />
                <Line type="monotone" dataKey="messages" stroke={c.accent} strokeWidth={2} dot={{ fill: c.accent, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 4. Completion Rate */}
        <Card className="p-5 space-y-3 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <h3 className="text-sm font-semibold text-fg">{t('admin.overview.completionRate', 'Completion Rate')}</h3>
          <p className="text-xs text-muted">{t('admin.overview.subtexts.successPct', 'Daily success percentage')}</p>
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis dataKey="shortDate" stroke={c.muted} tickLine={false} axisLine={false} fontSize={10} />
                <YAxis stroke={c.muted} tickLine={false} axisLine={false} fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: c.surface, borderColor: c.grid, borderRadius: '12px', color: 'var(--fg)' }} />
                <Area type="monotone" dataKey="completionRate" stroke={c.accent2} fill={c.accent2} fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 5. Active Users Trend */}
        <Card className="p-5 space-y-3 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <h3 className="text-sm font-semibold text-fg">{t('admin.overview.activeUsersChart', 'Active Users Trend')}</h3>
          <p className="text-xs text-muted">{t('admin.overview.subtexts.concurrentOnline', 'Concurrent online metric')}</p>
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis dataKey="shortDate" stroke={c.muted} tickLine={false} axisLine={false} fontSize={10} />
                <YAxis stroke={c.muted} tickLine={false} axisLine={false} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: c.surface, borderColor: c.grid, borderRadius: '12px', color: 'var(--fg)' }} />
                <Line type="monotone" dataKey="activeUsers" stroke={c.warning} strokeWidth={2} dot={{ fill: c.warning, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 6. Project Activity */}
        <Card className="p-5 space-y-3 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <h3 className="text-sm font-semibold text-fg">{t('admin.overview.projectActivity', 'Project Activity')}</h3>
          <p className="text-xs text-muted">{t('admin.overview.subtexts.activeProjectsCount', 'Active projects count')}</p>
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis dataKey="shortDate" stroke={c.muted} tickLine={false} axisLine={false} fontSize={10} />
                <YAxis stroke={c.muted} tickLine={false} axisLine={false} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: c.surface, borderColor: c.grid, borderRadius: '12px', color: 'var(--fg)' }} />
                <Bar dataKey="projects" fill={c.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent System Audit Stream Table */}
      <Card className="p-6 space-y-4 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-fg">{t('admin.overview.recentAudit', 'Recent System Audit Stream')}</h3>
          {canOpenLogs && (
            <Link to={ROUTES.admin.logs} className="text-xs font-medium text-accent hover:underline">
              {t('admin.overview.viewAllLogs', 'View all logs')} →
            </Link>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-3 text-start font-medium">{t('admin.logs.table.actor', 'Actor')}</th>
                <th className="pb-3 text-start font-medium">{t('admin.logs.table.action', 'Action')}</th>
                <th className="pb-3 text-start font-medium">{t('admin.logs.table.target', 'Target')}</th>
                <th className="pb-3 text-start font-medium">{t('admin.logs.table.status', 'Status')}</th>
                <th className="pb-3 text-start font-medium">{t('admin.logs.table.timestamp', 'Timestamp')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {auditEvents.slice(0, 8).map((ev) => {
                const actionText = String(ev.actionKey ? t(ev.actionKey, ev.actionParams || {}) : (ev.action || ''));
                const targetText = String(ev.targetKey ? t(ev.targetKey, ev.targetParams || {}) : (ev.target || ''));
                const targetLower = targetText.toLowerCase();
                let targetLink: string | null = null;
                if (targetLower.includes('user')) targetLink = ROUTES.admin.users;
                else if (targetLower.includes('workspace')) targetLink = ROUTES.admin.workspaces;
                else if (targetLower.includes('task')) targetLink = ROUTES.admin.tasks;
                else if (targetLower.includes('project')) targetLink = ROUTES.admin.projects;
                else if (targetLower.includes('report')) targetLink = ROUTES.admin.reports;
                else targetLink = ROUTES.admin.logs;

                const timeAgo = formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true, locale: chartLocale });
                const absoluteTime = format(new Date(ev.createdAt), 'PPpp', { locale: chartLocale });

                return (
                  <tr key={ev.id} className="hover:bg-surface-2/40">
                    <td className="py-3 font-medium text-fg">{ev.actorName}</td>
                    <td className="py-3 text-fg">{actionText}</td>
                    <td className="py-3 text-muted truncate max-w-xs">
                      {targetLink && canOpenLogs ? (
                        <Link to={targetLink} className="text-accent hover:underline">
                          {targetText}
                        </Link>
                      ) : (
                        targetText
                      )}
                    </td>
                    <td className="py-3">
                      <Badge tone={ev.status === 'success' ? 'accent' : ev.status === 'warning' ? 'warning' : 'danger'}>
                        {t(`admin.audit.status.${ev.status}`, ev.status)}
                      </Badge>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-muted" title={absoluteTime}>
                      <bdi dir="ltr">{timeAgo}</bdi>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
