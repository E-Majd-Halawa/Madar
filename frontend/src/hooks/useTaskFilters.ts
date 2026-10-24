import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDirectoryStore } from '@/store/directoryStore';
import { useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';
import type { TaskPriority, TaskSortField, TaskStatus } from '@/types';

export interface FilterState {
  search: string;
  status: string;
  priority: string;
  project: string;
  assignee: string;
  sortField: TaskSortField;
  sortDirection: 'asc' | 'desc';
}

interface UseTaskFiltersOptions {
  initialFilters?: Partial<FilterState>;
  hideStatusFilter?: boolean;
}

export function useTaskFilters({ initialFilters = {}, hideStatusFilter = false }: UseTaskFiltersOptions = {}) {
  const { t } = useTranslation();
  const setTaskModal = useUiStore((s) => s.setTaskModal);
  const projects = useProjectStore((s) => s.projects);
  const directoryUsers = useDirectoryStore((s) => s.byId);

  const defaultFilters: FilterState = useMemo(
    () => ({
      search: '',
      status: 'all',
      priority: 'all',
      project: 'all',
      assignee: 'all',
      sortField: 'dueDate',
      sortDirection: 'asc',
      ...initialFilters,
    }),
    [initialFilters]
  );

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters = useMemo(
    () =>
      filters.search.trim() !== '' ||
      filters.status !== 'all' ||
      filters.priority !== 'all' ||
      filters.project !== 'all' ||
      filters.assignee !== 'all',
    [filters]
  );

  const update = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, [defaultFilters]);

  const toggleSortDirection = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const filterOptions = useMemo(
    () => ({
      priorities: [
        { value: 'all', label: t('tasks.filter.allPriorities') },
        { value: 'low', label: t('tasks.priorities.low') },
        { value: 'medium', label: t('tasks.priorities.medium') },
        { value: 'high', label: t('tasks.priorities.high') },
        { value: 'urgent', label: t('tasks.priorities.urgent') },
      ],
      statuses: [
        { value: 'all', label: t('tasks.filter.allStatuses') },
        { value: 'backlog', label: t('tasks.statuses.backlog') },
        { value: 'todo', label: t('tasks.statuses.todo') },
        { value: 'in_progress', label: t('tasks.statuses.in_progress') },
        { value: 'review', label: t('tasks.statuses.review') },
        { value: 'completed', label: t('tasks.statuses.completed') },
      ],
      projects: [
        { value: 'all', label: t('tasks.filter.allProjects') },
        { value: 'none', label: t('tasks.noProject') },
        ...projects.map((p) => ({ value: p.id, label: p.name })),
      ],
      assignees: [
        { value: 'all', label: t('tasks.filter.allAssignees') },
        { value: 'unassigned', label: t('tasks.drawer.unassigned') },
        ...Object.values(directoryUsers).map((u) => ({ value: u.id, label: u.fullName })),
      ],
      sortFields: [
        { value: 'dueDate', label: t('tasks.sort.dueDate') },
        { value: 'priority', label: t('tasks.sort.priority') },
        { value: 'title', label: t('tasks.sort.title') },
        { value: 'createdAt', label: t('tasks.sort.createdAt') },
      ],
    }),
    [projects, directoryUsers, t]
  );

  return {
    filters,
    setFilters,
    update,
    showAdvanced,
    setShowAdvanced,
    hasActiveFilters,
    handleClearFilters,
    toggleSortDirection,
    filterOptions,
    setTaskModal,
    hideStatusFilter,
  };
}