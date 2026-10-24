import { useMemo, useState } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProjectCard } from '@/features/projects/ProjectCard';
import {
  ProjectFilterBar,
  type ProjectFilterState,
  type ProjectViewMode,
} from '@/features/projects/ProjectFilterBar';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { ProjectTimeline } from '@/features/projects/ProjectTimeline';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDirectoryStore } from '@/store/directoryStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import { useUiStore } from '@/store/uiStore';
import type { Project, ProjectStatus } from '@/types';
import { cn } from '@/utils/cn';

const STATUS_TONES: Record<ProjectStatus, 'neutral' | 'accent' | 'warning' | 'danger'> = {
  planning: 'neutral',
  active: 'accent',
  on_hold: 'warning',
  completed: 'accent',
  archived: 'neutral',
};

export default function ProjectsPage() {
  const { t } = useTranslation();
  const projects = useProjectStore((s) => s.projects);
  const tasks = useTaskStore((s) => s.tasks);
  const removeProject = useProjectStore((s) => s.remove);
  const setProjectModal = useUiStore((s) => s.setProjectModal);
  const directoryUsers = useDirectoryStore((s) => s.byId);

  const [viewMode, setViewMode] = useState<ProjectViewMode>('grid');
  const [filters, setFilters] = useState<ProjectFilterState>({
    search: '',
    status: 'all',
    sort: 'dueDate',
  });

  // Calculate task counts per project
  const projectStats = useMemo(() => {
    const stats: Record<string, { total: number; done: number; pct: number }> = {};
    for (const p of projects) {
      const pTasks = tasks.filter((t) => t.projectId === p.id && t.status !== 'archived');
      const done = pTasks.filter((t) => t.status === 'completed').length;
      const total = pTasks.length;
      stats[p.id] = {
        total,
        done,
        pct: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    }
    return stats;
  }, [projects, tasks]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = projects.filter((project) => {
      // Status filter
      if (filters.status !== 'all' && project.status !== filters.status) {
        return false;
      }

      // Search filter
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchesName = project.name.toLowerCase().includes(q);
        const matchesDesc = project.description.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      switch (filters.sort) {
        case 'dueDate': {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress': {
          const aPct = projectStats[a.id]?.pct || 0;
          const bPct = projectStats[b.id]?.pct || 0;
          return bPct - aPct;
        }
        case 'createdAt':
          return b.createdAt.localeCompare(a.createdAt);
        default:
          return 0;
      }
    });

    return result;
  }, [projects, filters, projectStats]);

  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setProjectToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    const ok = await removeProject(projectToDelete.id);
    if (ok) toast.success(t('projects.deleted'));
    setProjectToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            {t('projects.title')}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t('projects.subtitle')}
          </p>
        </div>

        <Button variant="primary" onClick={() => setProjectModal(true)}>
          <Plus className="size-4 me-1.5" />
          <span>{t('projects.new')}</span>
        </Button>
      </header>

      {/* Filter and View Mode Bar */}
      <ProjectFilterBar
        filters={filters}
        onChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={projects.length}
      />

      {/* Main Content Area */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/30 bg-surface/20">
          <FolderKanban className="size-12 text-muted/50 mb-3" />
          <h3 className="text-base font-semibold text-fg">{t('projects.empty')}</h3>
          <p className="text-xs text-muted max-w-sm mt-1">{t('projects.emptyBody')}</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={() => setProjectModal(true)}>
            <Plus className="size-4 me-1.5" />
            <span>{t('projects.new')}</span>
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-border/20 bg-surface/40 backdrop-blur-sm scrollbar-thin">
          <table className="w-full text-start text-xs">
            <thead className="border-b border-border/20 bg-surface-2/40 text-[11px] font-semibold text-muted uppercase tracking-wider">
              <tr>
                <th className="py-3 ps-4 pe-3 text-start">{t('projects.title')}</th>
                <th className="py-3 px-3 text-start">{t('projects.filterStatus')}</th>
                <th className="py-3 px-3 text-start">{t('projects.card.progress')}</th>
                <th className="py-3 px-3 text-start">{t('projects.workspace.overview.stats.tasksTotal')}</th>
                <th className="py-3 px-3 text-start">{t('projects.form.dueDate')}</th>
                <th className="py-3 px-3 text-start">{t('projects.form.members')}</th>
                <th className="py-3 pe-4 ps-3 text-end">{t('common.menu')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {filteredProjects.map((project) => {
                const stat = projectStats[project.id] || { total: 0, done: 0, pct: 0 };
                return (
                  <tr key={project.id} className="hover:bg-surface-2/30 transition">
                    <td className="py-3.5 ps-4 pe-3">
                      <Link
                        to={`/app/projects/${project.id}`}
                        className="flex items-center gap-2.5 font-bold text-fg hover:text-accent transition"
                      >
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                        <span className="truncate max-w-xs">{project.name}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge tone={STATUS_TONES[project.status]} className="text-[11px]">
                        {t(`projects.statuses.${project.status}`)}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={stat.pct} label={project.name} color={project.color} className="flex-1" />
                        <span className="font-semibold text-fg text-[11px]">{stat.pct}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-muted">
                      {stat.done}/{stat.total}
                    </td>
                    <td className="py-3.5 px-3 text-muted">
                      {project.dueDate ? format(parseISO(project.dueDate), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex -space-x-1 rtl:space-x-reverse">
                        {project.memberIds.slice(0, 3).map((mId) => (
                          <Avatar key={mId} name={directoryUsers[mId]?.fullName || 'User'} size="xs" />
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 pe-4 ps-3 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setProjectModal(true, project)}
                          className="p-1 text-muted hover:text-fg rounded"
                          title={t('projects.edit')}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(project.id, project.name)}
                          className="p-1 text-muted hover:text-danger rounded"
                          title={t('projects.delete')}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <ProjectTimeline projects={filteredProjects} />
      )}

      {/* Global Project Modal */}
      <ProjectModal />

      <ConfirmDialog
        open={!!projectToDelete}
        title={t('projects.deleteConfirmTitle', 'Delete Project')}
        message={t('projects.deleteConfirm', { name: projectToDelete?.name })}
        onConfirm={confirmDelete}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
}
