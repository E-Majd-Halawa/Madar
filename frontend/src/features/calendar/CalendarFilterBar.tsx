import { Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCalendarStore } from '@/store/calendarStore';
import { useDirectoryStore } from '@/store/directoryStore';
import { useProjectStore } from '@/store/projectStore';
import type { TaskPriority } from '@/types';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export function CalendarFilterBar() {
  const { t } = useTranslation();
  const filters = useCalendarStore((s) => s.filters);
  const setFilters = useCalendarStore((s) => s.setFilters);
  const resetFilters = useCalendarStore((s) => s.resetFilters);

  const projects = useProjectStore((s) => s.projects);
  const directoryUsers = useDirectoryStore((s) => s.byId);

  const hasActiveFilters =
    filters.projectId !== 'all' ||
    filters.priority !== 'all' ||
    filters.assigneeId !== 'all' ||
    filters.type !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/20 bg-surface/40 p-3 text-xs backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-muted font-semibold">
        <Filter className="size-3.5 text-accent" />
        <span>{t('tasks.filter.clear')}:</span>
      </div>

      {/* Project Filter */}
      <div className="flex items-center gap-1.5">
        <select
          value={filters.projectId}
          onChange={(e) => setFilters({ projectId: e.target.value })}
          className="rounded-lg border border-border/20 bg-surface px-2.5 py-1 text-xs text-fg focus:border-accent focus:outline-none"
        >
          <option value="all">{t('calendar.filter.allProjects')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-1.5">
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ priority: e.target.value })}
          className="rounded-lg border border-border/20 bg-surface px-2.5 py-1 text-xs text-fg focus:border-accent focus:outline-none"
        >
          <option value="all">{t('calendar.filter.allPriorities')}</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {t(`tasks.priorities.${p}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Assignee Filter */}
      <div className="flex items-center gap-1.5">
        <select
          value={filters.assigneeId}
          onChange={(e) => setFilters({ assigneeId: e.target.value })}
          className="rounded-lg border border-border/20 bg-surface px-2.5 py-1 text-xs text-fg focus:border-accent focus:outline-none"
        >
          <option value="all">{t('calendar.filter.allAssignees')}</option>
          <option value="unassigned">{t('tasks.drawer.unassigned')}</option>
          {Object.values(directoryUsers).map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* Event Type Filter */}
      <div className="flex items-center gap-1.5">
        <select
          value={filters.type}
          onChange={(e) => setFilters({ type: e.target.value as 'all' | 'task' | 'project' })}
          className="rounded-lg border border-border/20 bg-surface px-2.5 py-1 text-xs text-fg focus:border-accent focus:outline-none"
        >
          <option value="all">{t('calendar.filter.allTypes')}</option>
          <option value="task">{t('calendar.filter.tasksOnly')}</option>
          <option value="project">{t('calendar.filter.projectsOnly')}</option>
        </select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="ms-auto flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
        >
          <X className="size-3" />
          <span>{t('tasks.filter.clear')}</span>
        </button>
      )}
    </div>
  );
}
