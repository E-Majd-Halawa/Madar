import { useState } from 'react';
import { differenceInDays, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProgressBar } from '@/components/ui/ProgressBar';
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

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation();
  const tasks = useTaskStore((s) => s.tasks);
  const removeProject = useProjectStore((s) => s.remove);
  const setProjectModal = useUiStore((s) => s.setProjectModal);
  const directoryUsers = useDirectoryStore((s) => s.byId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Compute task statistics for this project
  const projectTasks = tasks.filter((t) => t.projectId === project.id && t.status !== 'archived');
  const completedTasks = projectTasks.filter((t) => t.status === 'completed');
  const totalCount = projectTasks.length;
  const doneCount = completedTasks.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Due date calculation
  const getDueBadge = () => {
    if (!project.dueDate) {
      return { label: t('projects.card.noDueDate'), tone: 'neutral' as const };
    }
    const due = parseISO(project.dueDate);
    const today = new Date();

    if (project.status === 'completed') {
      return { label: t('projects.statuses.completed'), tone: 'accent' as const };
    }

    if (isPast(due) && !isToday(due)) {
      const days = differenceInDays(today, due);
      return { label: t('projects.card.overdue', { count: days || 1 }), tone: 'danger' as const };
    }
    if (isToday(due)) {
      return { label: t('projects.card.dueToday'), tone: 'warning' as const };
    }
    if (isTomorrow(due)) {
      return { label: t('projects.card.dueTomorrow'), tone: 'warning' as const };
    }
    const days = differenceInDays(due, today);
    return { label: t('projects.card.dueIn', { count: days }), tone: 'neutral' as const };
  };

  const dueBadge = getDueBadge();

  // Delete handler
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    const success = await removeProject(project.id);
    if (success) {
      toast.success(t('projects.deleted'));
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen(false);
    setProjectModal(true, project);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="group relative flex flex-col justify-between rounded-2xl border border-border/30 bg-surface/50 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-accent/40 hover:bg-surface/80 hover:shadow-md"
    >
      {/* Top Accent Strip */}
      <div
        className="absolute inset-x-5 top-0 h-1 rounded-b-md opacity-80 transition-all duration-300 group-hover:h-1.5 group-hover:opacity-100"
        style={{ backgroundColor: project.color }}
      />

      <div>
        {/* Header: Project status and menu */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <Badge tone={STATUS_TONES[project.status]} className="text-[11px] font-semibold tracking-wide uppercase">
            {t(`projects.statuses.${project.status}`)}
          </Badge>

          {/* Quick Actions Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg transition"
              aria-label={t('common.menu')}
            >
              <MoreVertical className="size-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute end-0 top-full z-30 mt-1 w-36 rounded-xl border border-border/40 bg-surface p-1 shadow-lg backdrop-blur-md">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-fg hover:bg-surface-2 transition text-start"
                  >
                    <Pencil className="size-3.5 text-muted" />
                    <span>{t('projects.edit')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-danger hover:bg-danger/10 transition text-start"
                  >
                    <Trash2 className="size-3.5" />
                    <span>{t('projects.delete')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title and Description */}
        <Link to={`/app/projects/${project.id}`} className="block mt-3 group/link">
          <div className="flex items-center gap-2.5">
            <span
              className="size-3 shrink-0 rounded-full shadow-sm ring-2 ring-surface"
              style={{ backgroundColor: project.color }}
            />
            <h3 className="text-base font-bold text-fg group-hover/link:text-accent transition line-clamp-1">
              {project.name}
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted line-clamp-2 min-h-[2rem]">
            {project.description || t('projects.card.open')}
          </p>
        </Link>

        {/* Progress bar and tasks count */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-accent" />
              {t('projects.card.tasksCount', { done: doneCount, total: totalCount })}
            </span>
            <span className="font-bold text-fg">{progressPct}%</span>
          </div>
          <ProgressBar value={progressPct} label={project.name} color={project.color} />
        </div>
      </div>

      {/* Footer: Due date, Members stack and Open link */}
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/10 pt-4">
        {/* Due date badge */}
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className="size-3.5 text-muted" />
          <Badge tone={dueBadge.tone} className="text-[11px] px-2 py-0.5">
            {dueBadge.label}
          </Badge>
        </div>

        {/* Members avatar stack */}
        <div className="flex items-center">
          <div className="flex -space-x-1.5 rtl:space-x-reverse overflow-hidden">
            {project.memberIds.slice(0, 3).map((memberId) => {
              const u = directoryUsers[memberId];
              return (
                <div key={memberId} title={u?.fullName || memberId} className="ring-2 ring-surface rounded-full">
                  <Avatar name={u?.fullName || 'User'} size="xs" />
                </div>
              );
            })}
            {project.memberIds.length > 3 && (
              <span className="inline-grid size-6 place-items-center rounded-full bg-surface-2 ring-2 ring-surface text-[10px] font-semibold text-muted">
                +{project.memberIds.length - 3}
              </span>
            )}
          </div>

          <Link
            to={`/app/projects/${project.id}`}
            className="ms-3 inline-flex size-7 items-center justify-center rounded-lg bg-surface-2/60 text-muted transition hover:bg-accent hover:text-accent-fg"
            title={t('projects.card.open')}
          >
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t('projects.deleteConfirmTitle', 'Delete Project')}
        message={t('projects.deleteConfirm', { name: project.name })}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </motion.div>
  );
}
