import { useEffect, useMemo, useState } from 'react';
import { differenceInDays, differenceInHours, format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  FileText,
  Filter,
  FolderKanban,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Tag,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { inputClass } from '@/components/ui/Field';
import { useActivityStore } from '@/store/activityStore';
import { useAuthStore, selectUser } from '@/store/authStore';
import { useDirectoryStore } from '@/store/directoryStore';
import { toast } from '@/store/toastStore';
import { selectActiveWorkspace, useWorkspaceStore } from '@/store/workspaceStore';
import type { ActivityAction, ActivityEvent, ActivityTargetType } from '@/types';
import { cn } from '@/utils/cn';

type CategoryFilter = 'all' | 'task' | 'project' | 'file' | 'comment' | 'member';
type DateRangeFilter = 'all' | 'today' | 'week' | 'month';

export default function ActivityPage() {
  const { t } = useTranslation();
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const user = useAuthStore(selectUser);
  const directory = useDirectoryStore((s) => s.byId);
  const loadDirectory = useDirectoryStore((s) => s.load);

  const events = useActivityStore((s) => s.events);
  const loadActivity = useActivityStore((s) => s.load);

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void loadDirectory();
    if (activeWorkspace && user) {
      void loadActivity(activeWorkspace.id, user.id);
    }
  }, [activeWorkspace, user, loadActivity, loadDirectory]);

  const handleRefresh = async () => {
    if (!activeWorkspace || !user) return;
    setRefreshing(true);
    await loadActivity(activeWorkspace.id, user.id);
    setRefreshing(false);
    toast.info(t('activity.refreshed', 'Activity feed updated'));
  };

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Date,Actor,Action,Target,Category']
        .concat(
          filteredEvents.map(
            (e) =>
              `"${e.createdAt}","${directory[e.actorId]?.fullName || e.actorId}","${e.action}","${e.targetName.replace(/"/g, '""')}","${e.targetType}"`,
          ),
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `activity_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('activity.exported', 'Activity log exported to CSV'));
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter((e) => {
      // Category filter
      if (category === 'task' && e.targetType !== 'task') return false;
      if (category === 'project' && e.targetType !== 'project') return false;
      if (category === 'file' && e.targetType !== 'file') return false;
      if (category === 'comment' && e.targetType !== 'comment' && e.targetType !== 'channel') return false;
      if (category === 'member' && e.targetType !== 'member' && e.targetType !== 'workspace') return false;

      // Date range filter
      const eventDate = parseISO(e.createdAt);
      const hoursAgo = differenceInHours(now, eventDate);
      const daysAgo = differenceInDays(now, eventDate);

      if (dateRange === 'today' && hoursAgo > 24) return false;
      if (dateRange === 'week' && daysAgo > 7) return false;
      if (dateRange === 'month' && daysAgo > 30) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const actorName = directory[e.actorId]?.fullName?.toLowerCase() || '';
        const target = e.targetName.toLowerCase();
        if (!actorName.includes(q) && !target.includes(q)) return false;
      }

      return true;
    });
  }, [events, category, dateRange, search, directory]);

  // Group events by time period
  const groupedEvents = useMemo(() => {
    const now = new Date();
    const groups: { title: string; items: ActivityEvent[] }[] = [
      { title: t('activity.today', 'Today'), items: [] },
      { title: t('activity.yesterday', 'Yesterday'), items: [] },
      { title: t('activity.thisWeek', 'This Week'), items: [] },
      { title: t('activity.older', 'Earlier'), items: [] },
    ];

    filteredEvents.forEach((event) => {
      const date = parseISO(event.createdAt);
      const hours = differenceInHours(now, date);
      const days = differenceInDays(now, date);

      if (hours < 24) {
        groups[0].items.push(event);
      } else if (hours < 48) {
        groups[1].items.push(event);
      } else if (days <= 7) {
        groups[2].items.push(event);
      } else {
        groups[3].items.push(event);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  }, [filteredEvents, t]);

  // Statistics
  const stats = useMemo(() => {
    const taskDone = events.filter((e) => e.action === 'task_completed').length;
    const filesUploaded = events.filter((e) => e.action === 'file_uploaded').length;
    const uniqueActors = new Set(events.map((e) => e.actorId)).size;
    return { total: events.length, taskDone, filesUploaded, uniqueActors };
  }, [events]);

  const getActionConfig = (action: ActivityAction) => {
    switch (action) {
      case 'task_completed':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          label: t('activity.actionCompleted', 'completed task'),
        };
      case 'task_created':
        return {
          icon: CheckSquare,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
          label: t('activity.actionCreatedTask', 'created task'),
        };
      case 'task_updated':
        return {
          icon: CheckSquare,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          label: t('activity.actionUpdatedTask', 'updated task'),
        };
      case 'project_created':
        return {
          icon: FolderKanban,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          label: t('activity.actionCreatedProject', 'created project'),
        };
      case 'file_uploaded':
        return {
          icon: FileText,
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          label: t('activity.actionUploadedFile', 'uploaded file'),
        };
      case 'file_deleted':
        return {
          icon: FileText,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          label: t('activity.actionDeletedFile', 'removed file'),
        };
      case 'comment_added':
        return {
          icon: MessageSquare,
          color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
          label: t('activity.actionCommented', 'commented on'),
        };
      case 'member_invited':
        return {
          icon: UserPlus,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          label: t('activity.actionInvited', 'invited team member'),
        };
      case 'role_changed':
        return {
          icon: Shield,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          label: t('activity.actionRoleChanged', 'changed role for'),
        };
      case 'settings_changed':
        return {
          icon: Tag,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          label: t('activity.actionSettingsChanged', 'updated settings for'),
        };
      default:
        return {
          icon: Activity,
          color: 'text-muted bg-surface-2 border-border/20',
          label: t('activity.actionActivity', 'performed action'),
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t('nav.activity', 'Activity & Audit Log')}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t('activity.subtitle', 'Real-time record of all actions, milestones, task events, and file updates.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
            {t('activity.refresh', 'Refresh')}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="size-4" />
            {t('activity.exportCsv', 'Export CSV')}
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="glass rounded-2xl p-4 border shadow-sm">
          <span className="block text-xs font-medium text-muted">{t('activity.totalEvents', 'Total Events')}</span>
          <span className="mt-1 block text-2xl font-bold text-fg">{stats.total}</span>
        </div>
        <div className="glass rounded-2xl p-4 border shadow-sm">
          <span className="block text-xs font-medium text-muted">{t('activity.tasksCompleted', 'Tasks Completed')}</span>
          <span className="mt-1 block text-2xl font-bold text-emerald-400">{stats.taskDone}</span>
        </div>
        <div className="glass rounded-2xl p-4 border shadow-sm">
          <span className="block text-xs font-medium text-muted">{t('activity.filesShared', 'Files Uploaded')}</span>
          <span className="mt-1 block text-2xl font-bold text-accent">{stats.filesUploaded}</span>
        </div>
        <div className="glass rounded-2xl p-4 border shadow-sm">
          <span className="block text-xs font-medium text-muted">{t('activity.activeContributors', 'Contributors')}</span>
          <span className="mt-1 block text-2xl font-bold text-purple-400">{stats.uniqueActors}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 border shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('activity.searchPlaceholder', 'Filter by member name, task, file, or project…')}
            className={cn(inputClass, 'ps-9 py-1.5 text-sm')}
          />
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted shrink-0" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
            className={cn(inputClass, 'py-1.5 text-xs w-36')}
          >
            <option value="all">{t('activity.allTime', 'All Time')}</option>
            <option value="today">{t('activity.past24h', 'Past 24 Hours')}</option>
            <option value="week">{t('activity.past7days', 'Past 7 Days')}</option>
            <option value="month">{t('activity.past30days', 'Past 30 Days')}</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { key: 'all', label: t('common.all', 'All Activity') },
            { key: 'task', label: t('nav.tasks', 'Tasks') },
            { key: 'project', label: t('nav.projects', 'Projects') },
            { key: 'file', label: t('nav.files', 'Files') },
            { key: 'comment', label: t('activity.comments', 'Comments & Chat') },
            { key: 'member', label: t('nav.members', 'Team & Access') },
          ] as const
        ).map(({ key, label }) => {
          const active = category === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={cn(
                'rounded-full px-3.5 py-1 text-xs font-medium transition',
                active
                  ? 'bg-accent text-accent-fg font-semibold shadow-sm'
                  : 'border border-border/15 bg-surface-2/40 text-muted hover:border-border/30 hover:text-fg',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Feed Container */}
      {filteredEvents.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border">
          <EmptyState
            icon={Activity}
            title={t('activity.emptyTitle', 'No activities found')}
            description={
              search
                ? t('activity.noMatch', 'No events match your current filter and search term.')
                : t('activity.emptyBody', 'Activity events will appear here as your team works.')
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEvents.map((group) => (
            <div key={group.title} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  {group.title}
                </span>
                <div className="h-px flex-1 bg-border/10" />
                <span className="text-xs font-mono text-muted/60">{group.items.length}</span>
              </div>

              <div className="glass overflow-hidden rounded-2xl border divide-y divide-border/10">
                {group.items.map((event) => {
                  const actor = directory[event.actorId];
                  const cfg = getActionConfig(event.action);
                  const Icon = cfg.icon;

                  return (
                    <motion.div
                      key={event.id}
                      layout
                      className="flex items-start gap-3.5 p-4 transition hover:bg-surface-2/30 sm:items-center sm:gap-4"
                    >
                      {/* Actor Avatar */}
                      <Avatar
                        name={actor?.fullName || 'User'}
                        src={actor?.avatarUrl}
                        size="md"
                        className="shrink-0 mt-0.5 sm:mt-0"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-sm">
                          <span className="font-semibold text-fg">
                            {actor?.fullName || event.actorId}
                          </span>
                          <span className="text-muted text-xs sm:text-sm">{cfg.label}</span>
                          <span className="font-medium text-fg underline decoration-border/40 underline-offset-2 break-all sm:break-normal">
                            {event.targetName}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {format(parseISO(event.createdAt), 'MMM dd, yyyy · HH:mm')}
                          </span>
                          <span>·</span>
                          <span className="capitalize">{event.targetType}</span>
                        </div>
                      </div>

                      {/* Action Pill Badge */}
                      <div className={`hidden sm:grid size-9 place-items-center rounded-xl border shrink-0 shadow-sm ${cfg.color}`}>
                        <Icon className="size-4" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
