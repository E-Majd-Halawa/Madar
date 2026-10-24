import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Calendar,
  Clock,
  Inbox,
  Search,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TaskListItem } from '@/features/tasks/TaskListItem';
import { TaskBulkBar } from '@/features/tasks/TaskBulkBar';
import { useDirectoryStore } from '@/store/directoryStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/types';
import { daysUntil } from '@/utils/taskStats';

export default function UpcomingPage() {
  const { t } = useTranslation();
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);
  const directoryUsers = useDirectoryStore((s) => s.byId);

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Exclude completed and archived
      if (task.status === 'completed' || task.status === 'archived') return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        const matchesTags = task.tags.some((tg) => tg.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      // Priority
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      // Project
      if (projectFilter !== 'all') {
        if (projectFilter === 'none' && task.projectId !== null) return false;
        if (projectFilter !== 'none' && task.projectId !== projectFilter) return false;
      }

      // Assignee
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && task.assigneeId !== null) return false;
        if (assigneeFilter !== 'unassigned' && task.assigneeId !== assigneeFilter) return false;
      }

      return true;
    });
  }, [tasks, search, priorityFilter, projectFilter, assigneeFilter]);

  // Group by horizon
  const horizons = useMemo(() => {
    const tomorrow: Task[] = [];
    const thisWeek: Task[] = [];
    const nextWeek: Task[] = [];
    const later: Task[] = [];
    const noDate: Task[] = [];

    for (const task of filteredTasks) {
      if (!task.dueDate) {
        noDate.push(task);
        continue;
      }

      const d = daysUntil(task.dueDate);
      if (d === 1) {
        tomorrow.push(task);
      } else if (d > 1 && d <= 7) {
        thisWeek.push(task);
      } else if (d > 7 && d <= 14) {
        nextWeek.push(task);
      } else if (d > 14) {
        later.push(task);
      }
    }

    // Sort by due date within groups
    const sortByDate = (a: Task, b: Task) => (a.dueDate || '').localeCompare(b.dueDate || '');
    tomorrow.sort(sortByDate);
    thisWeek.sort(sortByDate);
    nextWeek.sort(sortByDate);
    later.sort(sortByDate);

    return {
      tomorrow,
      thisWeek,
      nextWeek,
      later,
      noDate,
    };
  }, [filteredTasks]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const sections = [
    { key: 'tomorrow', label: t('tasks.upcoming.tomorrow'), items: horizons.tomorrow, tone: 'accent' },
    { key: 'thisWeek', label: t('tasks.upcoming.thisWeek'), items: horizons.thisWeek, tone: 'accent' },
    { key: 'nextWeek', label: t('tasks.upcoming.nextWeek'), items: horizons.nextWeek, tone: 'neutral' },
    { key: 'later', label: t('tasks.upcoming.later'), items: horizons.later, tone: 'neutral' },
    { key: 'noDate', label: t('tasks.upcoming.noDate'), items: horizons.noDate, tone: 'neutral' },
  ] as const;

  const totalUpcoming = filteredTasks.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
          <CalendarDays className="size-3.5" />
          <span>Timeline View</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-fg mt-1">
          {t('tasks.upcoming.title')}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {t('tasks.upcoming.subtitle')}
        </p>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-surface/50 border border-border/20 backdrop-blur-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('tasks.filter.search')}
            className="w-full rounded-xl bg-surface-2/60 border border-border/20 py-2 ps-9 pe-8 text-xs text-fg placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg bg-surface border border-border/20 px-2.5 py-1.5 text-xs text-fg focus:outline-none focus:border-accent"
          >
            <option value="all">{t('tasks.filter.allPriorities')}</option>
            <option value="low">{t('tasks.priorities.low')}</option>
            <option value="medium">{t('tasks.priorities.medium')}</option>
            <option value="high">{t('tasks.priorities.high')}</option>
            <option value="urgent">{t('tasks.priorities.urgent')}</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg bg-surface border border-border/20 px-2.5 py-1.5 text-xs text-fg focus:outline-none focus:border-accent"
          >
            <option value="all">{t('tasks.filter.allProjects')}</option>
            <option value="none">{t('tasks.noProject')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-lg bg-surface border border-border/20 px-2.5 py-1.5 text-xs text-fg focus:outline-none focus:border-accent"
          >
            <option value="all">{t('tasks.filter.allAssignees')}</option>
            <option value="unassigned">{t('tasks.drawer.unassigned')}</option>
            {Object.values(directoryUsers).map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Horizons Sections */}
      {totalUpcoming === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/20 bg-surface/30 p-12 text-center">
          <Inbox className="size-8 text-muted mx-auto mb-2" />
          <p className="text-sm font-medium text-fg">{t('tasks.upcoming.empty')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map(({ key, label, items }) => {
            if (items.length === 0) return null;
            return (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-accent" />
                    <h2 className="text-sm font-semibold text-fg">{label}</h2>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-muted">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((task) => (
                    <TaskListItem
                      key={task.id}
                      task={task}
                      isSelected={selectedIds.includes(task.id)}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk action toolbar */}
      <TaskBulkBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
      />
    </div>
  );
}
