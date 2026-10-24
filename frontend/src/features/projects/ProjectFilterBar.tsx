import { LayoutGrid, List, Plus, Search, SlidersHorizontal, Table, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { useUiStore } from '@/store/uiStore';
import type { ProjectStatus } from '@/types';
import { cn } from '@/utils/cn';

export type ProjectSortOption = 'dueDate' | 'name' | 'progress' | 'createdAt';
export type ProjectViewMode = 'grid' | 'table' | 'timeline';

export interface ProjectFilterState {
  search: string;
  status: 'all' | ProjectStatus;
  sort: ProjectSortOption;
}

interface ProjectFilterBarProps {
  filters: ProjectFilterState;
  onChange: (filters: ProjectFilterState) => void;
  viewMode: ProjectViewMode;
  onViewModeChange: (mode: ProjectViewMode) => void;
  totalCount: number;
}

const STATUS_KEYS: ('all' | ProjectStatus)[] = ['all', 'active', 'planning', 'on_hold', 'completed', 'archived'];

export function ProjectFilterBar({
  filters,
  onChange,
  viewMode,
  onViewModeChange,
  totalCount,
}: ProjectFilterBarProps) {
  const { t } = useTranslation();
  const setProjectModal = useUiStore((s) => s.setProjectModal);

  const setStatus = (status: 'all' | ProjectStatus) => {
    onChange({ ...filters, status });
  };

  const setSort = (sort: ProjectSortOption) => {
    onChange({ ...filters, sort });
  };

  const setSearch = (search: string) => {
    onChange({ ...filters, search });
  };

  return (
    <div className="space-y-4">
      {/* Top search, view mode toggle and new project button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('projects.search')}
            className="w-full rounded-xl border border-border/20 bg-surface-2/60 py-2 ps-10 pe-9 text-xs text-fg placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none transition"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Toggle & New Button */}
        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex rounded-xl border border-border/20 bg-surface-2/60 p-1">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                viewMode === 'grid' ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
              )}
              title={t('projects.views.grid')}
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">{t('projects.views.grid')}</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                viewMode === 'table' ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
              )}
              title={t('projects.views.table')}
            >
              <Table className="size-3.5" />
              <span className="hidden sm:inline">{t('projects.views.table')}</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('timeline')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                viewMode === 'timeline' ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
              )}
              title={t('projects.views.timeline')}
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">{t('projects.views.timeline')}</span>
            </button>
          </div>

          {/* New Project Button */}
          <Button variant="primary" size="sm" onClick={() => setProjectModal(true)}>
            <Plus className="size-4 me-1.5" />
            <span className="text-xs font-medium">{t('projects.new')}</span>
          </Button>
        </div>
      </div>

      {/* Status Filter Pills & Sort Select */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/10 pb-3">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_KEYS.map((statusKey) => (
            <button
              key={statusKey}
              type="button"
              onClick={() => setStatus(statusKey)}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-medium transition capitalize',
                filters.status === statusKey
                  ? 'bg-accent text-accent-fg font-semibold shadow-sm'
                  : 'bg-surface-2/40 text-muted hover:bg-surface-2 hover:text-fg',
              )}
            >
              {statusKey === 'all' ? t('projects.allStatuses') : t(`projects.statuses.${statusKey}`)}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted font-medium">{t('projects.sortBy')}:</span>
          <select
            value={filters.sort}
            onChange={(e) => setSort(e.target.value as ProjectSortOption)}
            className="rounded-lg border border-border/20 bg-surface px-2.5 py-1 text-xs text-fg focus:border-accent focus:outline-none"
          >
            <option value="dueDate">{t('projects.sort.dueDate')}</option>
            <option value="name">{t('projects.sort.name')}</option>
            <option value="progress">{t('projects.sort.progress')}</option>
            <option value="createdAt">{t('projects.sort.createdAt')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
