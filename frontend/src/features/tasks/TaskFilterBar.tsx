import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  X,
  Plus,
  ArrowUpDown,
  LayoutList,
  Table as TableIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import type { FilterState } from '@/types';
import { cn } from '@/utils/cn';

interface TaskFilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  viewMode?: 'list' | 'table';
  onViewModeChange?: (mode: 'list' | 'table') => void;
  hideStatusFilter?: boolean;
}

export function TaskFilterBar({
  filters: externalFilters,
  onChange,
  viewMode = 'list',
  onViewModeChange,
  hideStatusFilter = false,
}: TaskFilterBarProps) {
  const { t } = useTranslation();
  const {
    filters,
    update,
    showAdvanced,
    setShowAdvanced,
    hasActiveFilters,
    handleClearFilters,
    toggleSortDirection,
    filterOptions,
    setTaskModal,
    hideStatusFilter: hookHideStatusFilter,
  } = useTaskFilters({ initialFilters: externalFilters, hideStatusFilter });

  // Sync external filters with internal state when they change
  React.useEffect(() => {
    onChange(filters);
  }, [filters, onChange]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface/50 p-4 border border-border/20 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder={t('tasks.filter.search')}
            className="w-full rounded-xl bg-surface-2/60 border border-border/20 py-2 ps-10 pe-9 text-xs text-fg placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none transition"
            aria-label={t('tasks.filter.search')}
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => update('search', '')}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-fg"
              aria-label={t('common.clear')}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>

        {/* Action Controls & Layout Switcher */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          {onViewModeChange && (
            <div className="flex items-center rounded-xl bg-surface-2/60 border border-border/20 p-1" role="group" aria-label={t('tasks.views.viewMode')}>
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                title={t('tasks.views.list')}
                className={cn(
                  'p-1.5 rounded-lg text-xs transition',
                  viewMode === 'list'
                    ? 'bg-surface text-fg shadow-sm'
                    : 'text-muted hover:text-fg',
                )}
              >
                <LayoutList className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                title={t('tasks.views.table')}
                className={cn(
                  'p-1.5 rounded-lg text-xs transition',
                  viewMode === 'table'
                    ? 'bg-surface text-fg shadow-sm'
                    : 'text-muted hover:text-fg',
                )}
              >
                <TableIcon className="size-4" aria-hidden />
              </button>
            </div>
          )}

          {/* Toggle filters button */}
          <Button
            variant={showAdvanced ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
            aria-controls="task-filters"
          >
            <SlidersHorizontal className="size-3.5 me-1.5" aria-hidden />
            <span className="text-xs">{t('common.menu')}</span>
            {hasActiveFilters && (
              <span className="ms-1.5 size-2 rounded-full bg-accent animate-pulse" aria-hidden />
            )}
          </Button>

          {/* New Task button */}
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

      {/* Filter and Sort Row */}
      {(showAdvanced || hasActiveFilters) && (
        <div
          id="task-filters"
          className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/10 text-xs"
          role="region"
          aria-label={t('tasks.filter.filters')}
        >
          {/* Status filter */}
          {!hideStatusFilter && !hookHideStatusFilter && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted font-medium">{t('tasks.statuses.todo')}:</span>
              <select
                value={filters.status}
                onChange={(e) => update('status', e.target.value)}
                className="rounded-lg bg-surface border border-border/20 px-2.5 py-1 text-xs text-fg focus:outline-none focus:border-accent"
                aria-label={t('tasks.statuses.todo')}
              >
                {filterOptions.statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted font-medium">{t('tasks.priority')}:</span>
            <select
              value={filters.priority}
              onChange={(e) => update('priority', e.target.value)}
              className="rounded-lg bg-surface border border-border/20 px-2.5 py-1 text-xs text-fg focus:outline-none focus:border-accent"
              aria-label={t('tasks.priority')}
            >
              {filterOptions.priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Project filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted font-medium">{t('tasks.project')}:</span>
            <select
              value={filters.project}
              onChange={(e) => update('project', e.target.value)}
              className="rounded-lg bg-surface border border-border/20 px-2.5 py-1 text-xs text-fg focus:outline-none focus:border-accent"
              aria-label={t('tasks.project')}
            >
              {filterOptions.projects.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted font-medium">{t('tasks.drawer.assignee')}:</span>
            <select
              value={filters.assignee}
              onChange={(e) => update('assignee', e.target.value)}
              className="rounded-lg bg-surface border border-border/20 px-2.5 py-1 text-xs text-fg focus:outline-none focus:border-accent"
              aria-label={t('tasks.drawer.assignee')}
            >
              {filterOptions.assignees.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Field */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted font-medium">{t('tasks.sort.sortBy')}:</span>
            <select
              value={filters.sortField}
              onChange={(e) => update('sortField', e.target.value as typeof filters.sortField)}
              className="rounded-lg bg-surface border border-border/20 px-2.5 py-1 text-xs text-fg focus:outline-none focus:border-accent"
              aria-label={t('tasks.sort.sortBy')}
            >
              {filterOptions.sortFields.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={toggleSortDirection}
              title={filters.sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              className="p-1 rounded-lg border border-border/20 bg-surface text-muted hover:text-fg hover:border-accent transition"
              aria-label={filters.sortDirection === 'asc' ? t('tasks.sort.ascending') : t('tasks.sort.descending')}
            >
              <ArrowUpDown className="size-3.5" aria-hidden />
            </button>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-xs text-accent hover:underline ms-auto font-medium"
            >
              <X className="size-3" aria-hidden />
              {t('tasks.filter.clear')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}