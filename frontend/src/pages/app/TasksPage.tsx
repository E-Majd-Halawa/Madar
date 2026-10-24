import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskFilterBar } from '@/features/tasks/TaskFilterBar';
import { TaskList } from '@/features/tasks/TaskList';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import type { Task, TaskPriority, TaskSortField, FilterState } from '@/types';
import { cn } from '@/utils/cn';

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export default function TasksPage() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.session?.user);
  const tasks = useTaskStore((s) => s.tasks);

  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    project: 'all',
    assignee: 'all',
    sortField: 'dueDate',
    sortDirection: 'asc',
  });

  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter((task) => {
      // Tab filter
      if (activeTab === 'mine' && task.assigneeId !== currentUser?.id) return false;
      if (activeTab === 'completed' && task.status !== 'completed') return false;
      if (activeTab !== 'completed' && task.status === 'archived') return false;

      // Status filter
      if (filters.status !== 'all' && task.status !== filters.status) return false;

      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;

      // Project filter
      if (filters.project !== 'all') {
        if (filters.project === 'none' && task.projectId !== null) return false;
        if (filters.project !== 'none' && task.projectId !== filters.project) return false;
      }

      // Assignee filter
      if (filters.assignee !== 'all') {
        if (filters.assignee === 'unassigned' && task.assigneeId !== null) return false;
        if (filters.assignee !== 'unassigned' && task.assigneeId !== filters.assignee) return false;
      }

      // Search query filter
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        const matchesTags = task.tags.some((tg) => tg.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let cmp = 0;
      switch (filters.sortField) {
        case 'dueDate': {
          if (!a.dueDate && !b.dueDate) cmp = 0;
          else if (!a.dueDate) cmp = 1;
          else if (!b.dueDate) cmp = -1;
          else cmp = a.dueDate.localeCompare(b.dueDate);
          break;
        }
        case 'priority': {
          cmp = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
          break;
        }
        case 'title': {
          cmp = a.title.localeCompare(b.title);
          break;
        }
        case 'createdAt': {
          cmp = b.createdAt.localeCompare(a.createdAt);
          break;
        }
        default:
          cmp = 0;
      }

      return filters.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [tasks, activeTab, filters, currentUser?.id]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            {t('nav.myTasks')}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage, filter, and track progress across all tasks in your workspace.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex rounded-xl bg-surface-2/60 border border-border/20 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition',
              activeTab === 'all'
                ? 'bg-surface text-fg shadow-sm'
                : 'text-muted hover:text-fg',
            )}
          >
            {t('tasks.views.all')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mine')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition',
              activeTab === 'mine'
                ? 'bg-surface text-fg shadow-sm'
                : 'text-muted hover:text-fg',
            )}
          >
            {t('nav.myTasks')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition',
              activeTab === 'completed'
                ? 'bg-surface text-fg shadow-sm'
                : 'text-muted hover:text-fg',
            )}
          >
            {t('tasks.statuses.completed')}
          </button>
        </div>
      </header>

      {/* Filter and search bar */}
      <TaskFilterBar
        filters={filters}
        onChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hideStatusFilter={activeTab === 'completed'}
      />

      {/* Task List / Table */}
      <TaskList
        tasks={filteredAndSortedTasks}
        viewMode={viewMode}
      />
    </div>
  );
}
