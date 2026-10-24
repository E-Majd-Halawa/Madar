import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import {
  Filter,
  Plus,
  Search,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KanbanCard } from './KanbanCard';
import { KanbanColumn } from './KanbanColumn';
import { useDirectoryStore } from '@/store/directoryStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useUiStore } from '@/store/uiStore';
import type { Task, TaskPriority, TaskStatus } from '@/types';

const COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'completed'];

interface FilterState {
  search: string;
  priorityFilter: string;
  projectFilter: string;
  assigneeFilter: string;
}

export function KanbanBoard() {
  const { t } = useTranslation();
  const tasks = useTaskStore((s) => s.tasks);
  const moveTask = useTaskStore((s) => s.moveTask);
  const setTaskModal = useUiStore((s) => s.setTaskModal);

  const projects = useProjectStore((s) => s.projects);
  const directoryUsers = useDirectoryStore((s) => s.byId);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priorityFilter: 'all',
    projectFilter: 'all',
    assigneeFilter: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Filter tasks - memoized to avoid recalculation
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Exclude archived
      if (task.status === 'archived') return false;

      // Search query filter
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        const matchesTags = task.tags.some((tg) => tg.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      // Priority filter
      if (filters.priorityFilter !== 'all' && task.priority !== filters.priorityFilter) {
        return false;
      }

      // Project filter
      if (filters.projectFilter !== 'all') {
        if (filters.projectFilter === 'none' && task.projectId !== null) return false;
        if (filters.projectFilter !== 'none' && task.projectId !== filters.projectFilter) return false;
      }

      // Assignee filter
      if (filters.assigneeFilter !== 'all') {
        if (filters.assigneeFilter === 'unassigned' && task.assigneeId !== null) return false;
        if (filters.assigneeFilter !== 'unassigned' && task.assigneeId !== filters.assigneeFilter) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  const hasActiveFilters = useMemo(
    () =>
      filters.search.trim() !== '' ||
      filters.priorityFilter !== 'all' ||
      filters.projectFilter !== 'all' ||
      filters.assigneeFilter !== 'all',
    [filters]
  );

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      priorityFilter: 'all',
      projectFilter: 'all',
      assigneeFilter: 'all',
    });
  }, []);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Group filtered tasks by column
  const columnTasks = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      completed: [],
      archived: [],
    };

    for (const task of filteredTasks) {
      if (map[task.status]) {
        map[task.status].push(task);
      }
    }
    return map;
  }, [filteredTasks]);

  // Drag handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) {
        setActiveTask(task);
      }
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // 1. Dropped directly onto a Column container (e.g. "col-in_progress")
      if (overId.startsWith('col-')) {
        const targetStatus = overId.replace('col-', '') as TaskStatus;
        void moveTask(activeId, targetStatus);
        return;
      }

      // 2. Dropped over another Task card
      const targetTask = tasks.find((t) => t.id === overId);
      if (targetTask) {
        const targetColumnTasks = tasks.filter((t) => t.status === targetTask.status);
        const targetIndex = targetColumnTasks.findIndex((t) => t.id === overId);
        void moveTask(activeId, targetTask.status, targetIndex >= 0 ? targetIndex : undefined);
      }
    },
    [tasks, moveTask]
  );

  return (
    <div className="flex flex-col gap-6" dir="auto">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-surface/40 p-4 border border-border/20 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder={t('tasks.filter.search')}
              className="w-full rounded-xl bg-surface-2/60 border border-border/20 py-2 ps-10 pe-9 text-xs text-fg placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none transition"
              aria-label={t('tasks.filter.search')}
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => updateFilter('search', '')}
                className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-fg"
                aria-label={t('common.clear')}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-controls="kanban-filters"
            >
              <SlidersHorizontal className="size-3.5 me-1.5" aria-hidden />
              <span className="text-xs">{t('common.menu')}</span>
              {hasActiveFilters && (
                <span className="ms-1.5 size-2 rounded-full bg-accent animate-pulse" aria-hidden />
              )}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setTaskModal(true)}
            >
              <Plus className="size-4 me-1.5" aria-hidden />
              <span className="text-xs">{t('tasks.new')}</span>
            </Button>
          </div>
        </div>

        {/* Expandable Filter Row */}
        {(showFilters || hasActiveFilters) && (
          <div
            id="kanban-filters"
            className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/10 text-xs"
            role="region"
            aria-label={t('tasks.filter.filters')}
          >
            {/* Priority filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted font-medium">{t('tasks.priority')}:</span>
              <select
                value={filters.priorityFilter}
                onChange={(e) => updateFilter('priorityFilter', e.target.value)}
                className="rounded-lg bg-surface border border-border/20 px-2.5 py-1 text-xs text-fg focus:outline-none focus:border-accent"
                aria-label={t('tasks.priority')}
              >
                <option value="all">{t('tasks.filter.allPriorities')}</option>
                <option value="low">{t('tasks.priorities.low')}</option>
                <option value="medium">{t('tasks.priorities.medium')}</option>
                <option value="high">{t('tasks.priorities.high')}</option>
                <option value="urgent">{t('tasks.priorities.urgent')}</option>
              </select>
            </div>

            {/* Project filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted font-medium">{t('tasks.project')}:</span>
              <select
                value={filters.projectFilter}
                onChange={(e) => updateFilter('projectFilter', e.target.value)}
                className="rounded-lg bg-surface border border-border/20 px-2.5 py-1 text-xs text-fg focus:outline-none focus:border-accent"
                aria-label={t('tasks.project')}
              >
                <option value="all">{t('tasks.filter.allProjects')}</option>
                <option value="none">{t('tasks.noProject')}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted font-medium">{t('tasks.drawer.assignee')}:</span>
              <select
                value={filters.assigneeFilter}
                onChange={(e) => updateFilter('assigneeFilter', e.target.value)}
                className="rounded-lg bg-surface border border-border/20 px-2.5 py-1 text-xs text-fg focus:outline-none focus:border-accent"
                aria-label={t('tasks.drawer.assignee')}
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

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-accent hover:underline ms-auto font-medium"
              >
                <X className="size-3" aria-hidden />
                {t('tasks.filter.clear')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* DndContext Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none scrollbar-thin" role="list" aria-label={t('tasks.kanban.board')}>
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columnTasks[status] || []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}