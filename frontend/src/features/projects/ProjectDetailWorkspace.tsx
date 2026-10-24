import { useMemo, useState } from 'react';
import { differenceInDays, format, isPast, isToday, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCode,
  FileIcon,
  FileImage,
  FileText,
  FolderOpen,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  Plus,
  Share2,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { KanbanBoard } from '@/features/tasks/kanban/KanbanBoard';
import { TaskList } from '@/features/tasks/TaskList';
import { useActivityStore } from '@/store/activityStore';
import { useAuthStore } from '@/store/authStore';
import { useDirectoryStore } from '@/store/directoryStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import { useUiStore } from '@/store/uiStore';
import type { Project, ProjectFile, ProjectStatus, Task } from '@/types';
import { cn } from '@/utils/cn';
import { ProjectTimeline } from './ProjectTimeline';

type WorkspaceTab = 'overview' | 'tasks' | 'timeline' | 'members' | 'activity' | 'files';

interface ProjectDetailWorkspaceProps {
  project: Project;
}

const FILE_TYPE_ICONS = {
  document: FileText,
  design: FileIcon,
  code: FileCode,
  image: FileImage,
  archive: FileIcon,
  other: FileIcon,
};

export function ProjectDetailWorkspace({ project }: ProjectDetailWorkspaceProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.session?.user);
  const tasks = useTaskStore((s) => s.tasks);
  const createTask = useTaskStore((s) => s.create);
  const setTaskModal = useUiStore((s) => s.setTaskModal);
  const setProjectModal = useUiStore((s) => s.setProjectModal);
  const removeProject = useProjectStore((s) => s.remove);
  const updateProject = useProjectStore((s) => s.update);
  const files = useProjectStore((s) => s.filesByProjectId[project.id] || []);
  const addFile = useProjectStore((s) => s.addFile);
  const removeFile = useProjectStore((s) => s.removeFile);
  const directoryUsers = useDirectoryStore((s) => s.byId);
  const activities = useActivityStore((s) => s.events);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'list'>('kanban');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<ProjectFile['type']>('document');
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [selectedNewMember, setSelectedNewMember] = useState('');

  // Project tasks
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === project.id && t.status !== 'archived'),
    [tasks, project.id],
  );

  const completedTasks = useMemo(
    () => projectTasks.filter((t) => t.status === 'completed'),
    [projectTasks],
  );

  const inProgressTasks = useMemo(
    () => projectTasks.filter((t) => t.status === 'in_progress' || t.status === 'review'),
    [projectTasks],
  );

  const totalCount = projectTasks.length;
  const doneCount = completedTasks.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Project Activity
  const projectActivities = useMemo(() => {
    return activities.filter((act) => {
      if (act.metadata?.projectId === project.id) return true;
      if (act.targetType === 'project' && act.targetName === project.name) return true;
      // Task inside this project
      const linkedTask = projectTasks.find((t) => t.title === act.targetName);
      return !!linkedTask;
    });
  }, [activities, project.id, project.name, projectTasks]);

  // Days remaining calculation
  const daysInfo = useMemo(() => {
    if (!project.dueDate) return null;
    const due = parseISO(project.dueDate);
    const today = new Date();
    const diff = differenceInDays(due, today);
    const overdue = isPast(due) && !isToday(due) && project.status !== 'completed';
    return { diff, overdue };
  }, [project.dueDate, project.status]);

  // Handle Quick Task Add in Project
  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || !currentUser) return;

    const task = await createTask(
      {
        workspaceId: project.workspaceId,
        creatorId: currentUser.id,
        title: quickTaskTitle.trim(),
        priority: 'medium',
        projectId: project.id,
        dueDate: project.dueDate,
      },
      currentUser.id,
    );

    if (task) {
      toast.success(t('tasks.created'));
      setQuickTaskTitle('');
    }
  };

  // Handle Project Deletion
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    const ok = await removeProject(project.id, currentUser?.id);
    if (ok) {
      toast.success(t('projects.deleted'));
      navigate('/app/projects');
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !currentUser) return;

    const ext = newFileName.split('.').pop() || 'dat';
    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      projectId: project.id,
      name: newFileName.trim(),
      size: Math.floor(Math.random() * 5_000_000) + 100_000,
      type: newFileType,
      extension: ext,
      uploadedBy: currentUser.id,
      uploadedAt: new Date().toISOString(),
    };

    addFile(newFile);
    toast.success(`${newFileName} uploaded.`);
    setNewFileName('');
    setUploadModalOpen(false);
  };

  // Handle Member Add
  const handleAddMember = async () => {
    if (!selectedNewMember || project.memberIds.includes(selectedNewMember)) return;
    const nextMembers = [...project.memberIds, selectedNewMember];
    await updateProject(project.id, { memberIds: nextMembers }, currentUser?.id);
    toast.success('Team member added to project.');
    setAddMemberModalOpen(false);
    setSelectedNewMember('');
  };

  // Handle Member Remove
  const handleRemoveMember = async (memberId: string) => {
    if (project.memberIds.length <= 1) {
      toast.error('Projects must have at least one team member.');
      return;
    }
    const nextMembers = project.memberIds.filter((id) => id !== memberId);
    await updateProject(project.id, { memberIds: nextMembers }, currentUser?.id);
    toast.success('Member removed from project.');
  };

  const projectOwner = directoryUsers[project.ownerId];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-fg transition"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          <span>{t('projects.workspace.back')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setProjectModal(true, project)}>
            <Pencil className="size-3.5 me-1.5" />
            <span className="text-xs">{t('projects.edit')}</span>
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="size-3.5 me-1.5" />
            <span className="text-xs">{t('projects.delete')}</span>
          </Button>
        </div>
      </div>

      {/* Project Banner Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/20 bg-surface/60 p-6 shadow-sm backdrop-blur-md">
        {/* Color accent highlight */}
        <div
          className="absolute -top-12 -end-12 size-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: project.color }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Title & Metadata */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className="size-4 shrink-0 rounded-full shadow ring-4 ring-surface"
                style={{ backgroundColor: project.color }}
              />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
                {project.name}
              </h1>
              <Badge tone={project.status === 'active' ? 'accent' : 'neutral'} className="text-xs">
                {t(`projects.statuses.${project.status}`)}
              </Badge>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm text-muted leading-relaxed">
              {project.description || t('projects.subtitle')}
            </p>

            {/* Dates & Owner */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted">
              {project.startDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted" />
                  <span>
                    {t('timeline.start')}: <strong>{format(parseISO(project.startDate), 'MMM d, yyyy')}</strong>
                  </span>
                </div>
              )}
              {project.dueDate && (
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted" />
                  <span>
                    {t('timeline.due')}: <strong>{format(parseISO(project.dueDate), 'MMM d, yyyy')}</strong>
                  </span>
                </div>
              )}
              {daysInfo && (
                <Badge tone={daysInfo.overdue ? 'danger' : 'neutral'} className="text-[11px]">
                  {daysInfo.overdue
                    ? t('projects.card.overdue', { count: Math.abs(daysInfo.diff) })
                    : t('projects.card.dueIn', { count: daysInfo.diff })}
                </Badge>
              )}
              {projectOwner && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted">{t('projects.workspace.members.ownerBadge')}:</span>
                  <Avatar name={projectOwner.fullName} size="xs" />
                  <strong className="text-fg">{projectOwner.fullName}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Overall Progress Widget */}
          <div className="flex flex-col items-start md:items-end justify-center min-w-[200px] border-t md:border-t-0 md:border-s border-border/10 pt-4 md:pt-0 md:ps-6">
            <span className="text-xs font-medium text-muted">{t('projects.workspace.overview.stats.completion')}</span>
            <span className="text-3xl font-extrabold text-fg">{progressPct}%</span>
            <div className="w-full max-w-[180px] mt-2">
              <ProgressBar value={progressPct} label={project.name} color={project.color} />
            </div>
            <span className="mt-1 text-[11px] text-muted">
              {t('projects.card.tasksCount', { done: doneCount, total: totalCount })}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border/20">
        <div className="flex space-x-2 rtl:space-x-reverse overflow-x-auto scrollbar-none pb-px">
          {(
            [
              { key: 'overview', label: t('projects.workspace.tabs.overview') },
              { key: 'tasks', label: `${t('projects.workspace.tabs.tasks')} (${totalCount})` },
              { key: 'timeline', label: t('projects.workspace.tabs.timeline') },
              { key: 'members', label: `${t('projects.workspace.tabs.members')} (${project.memberIds.length})` },
              { key: 'activity', label: t('projects.workspace.tabs.activity') },
              { key: 'files', label: `${t('projects.workspace.tabs.files')} (${files.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'whitespace-nowrap border-b-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition',
                activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:border-border hover:text-fg',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border/20 bg-surface/40 p-4">
              <span className="text-xs text-muted">{t('projects.workspace.overview.stats.tasksTotal')}</span>
              <p className="mt-1 text-2xl font-bold text-fg">{totalCount}</p>
            </div>
            <div className="rounded-2xl border border-border/20 bg-surface/40 p-4">
              <span className="text-xs text-muted">{t('projects.workspace.overview.stats.completed')}</span>
              <p className="mt-1 text-2xl font-bold text-accent">{doneCount}</p>
            </div>
            <div className="rounded-2xl border border-border/20 bg-surface/40 p-4">
              <span className="text-xs text-muted">{t('projects.workspace.overview.stats.inProgress')}</span>
              <p className="mt-1 text-2xl font-bold text-fg">{inProgressTasks.length}</p>
            </div>
            <div className="rounded-2xl border border-border/20 bg-surface/40 p-4">
              <span className="text-xs text-muted">{t('projects.workspace.overview.stats.daysLeft')}</span>
              <p className="mt-1 text-2xl font-bold text-fg">{daysInfo ? Math.max(0, daysInfo.diff) : '—'}</p>
            </div>
          </div>

          {/* Timeline preview in overview */}
          <ProjectTimeline projects={[project]} />

          {/* Recent Activity for this project */}
          <div className="rounded-2xl border border-border/20 bg-surface/40 p-5">
            <h3 className="text-sm font-bold text-fg mb-4">
              {t('projects.workspace.overview.recentActivity')}
            </h3>
            {projectActivities.length === 0 ? (
              <p className="text-xs text-muted">{t('projects.workspace.overview.noActivity')}</p>
            ) : (
              <ul className="divide-y divide-border/10 space-y-3">
                {projectActivities.slice(0, 5).map((act) => {
                  const actor = directoryUsers[act.actorId];
                  return (
                    <li key={act.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Avatar name={actor?.fullName || 'User'} size="xs" />
                        <span className="font-semibold text-fg">{actor?.fullName || 'User'}</span>
                        <span className="text-muted">{t(`activity.${act.action}`)}</span>
                        <span className="font-medium text-fg">{act.targetName}</span>
                      </div>
                      <span className="text-[11px] text-muted">
                        {format(parseISO(act.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: TASKS & KANBAN */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Quick Add and View Mode Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/20 bg-surface/40 p-3">
            {/* Quick Add Input */}
            <form onSubmit={handleQuickAddTask} className="flex-1 min-w-[240px] max-w-md flex items-center gap-2">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder={t('tasks.today.quickAdd')}
                className="w-full rounded-xl border border-border/20 bg-surface-2/60 px-3 py-1.5 text-xs text-fg placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none"
              />
              <Button type="submit" size="sm" variant="primary" disabled={!quickTaskTitle.trim()}>
                <Plus className="size-3.5" />
              </Button>
            </form>

            {/* View Switcher */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-border/20 bg-surface-2/60 p-1">
                <button
                  type="button"
                  onClick={() => setTaskViewMode('kanban')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                    taskViewMode === 'kanban' ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
                  )}
                >
                  <LayoutGrid className="size-3.5" />
                  <span>{t('projects.workspace.tasks.viewKanban')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskViewMode('list')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                    taskViewMode === 'list' ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
                  )}
                >
                  <List className="size-3.5" />
                  <span>{t('projects.workspace.tasks.viewList')}</span>
                </button>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setTaskModal(true)}
              >
                <Plus className="size-4 me-1.5" />
                <span className="text-xs">{t('tasks.new')}</span>
              </Button>
            </div>
          </div>

          {/* Render Kanban or List */}
          {taskViewMode === 'kanban' ? (
            <KanbanBoard />
          ) : (
            <TaskList tasks={projectTasks} viewMode="list" />
          )}
        </div>
      )}

      {/* Tab 3: TIMELINE (GANTT) */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <ProjectTimeline projects={[project]} />
        </div>
      )}

      {/* Tab 4: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-fg">{t('projects.workspace.members.title')}</h2>
              <p className="text-xs text-muted">{t('projects.workspace.members.subtitle')}</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setAddMemberModalOpen(true)}>
              <UserPlus className="size-4 me-1.5" />
              <span className="text-xs">{t('projects.workspace.members.addMember')}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {project.memberIds.map((memberId) => {
              const member = directoryUsers[memberId];
              const memberTasks = projectTasks.filter((t) => t.assigneeId === memberId);
              const isOwner = project.ownerId === memberId;

              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between rounded-2xl border border-border/20 bg-surface/40 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={member?.fullName || 'User'} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-fg">{member?.fullName || 'User'}</h4>
                        {isOwner && (
                          <Badge tone="accent" className="text-[10px]">
                            {t('projects.workspace.members.ownerBadge')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted">{member?.email || 'member@taskflow.com'}</p>
                      <span className="text-[11px] text-accent font-medium mt-1 block">
                        {t('projects.workspace.members.tasksAssigned', { count: memberTasks.length })}
                      </span>
                    </div>
                  </div>

                  {!isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(memberId)}
                      className="p-1.5 text-muted hover:text-danger rounded-lg hover:bg-danger/10 transition"
                      title={t('projects.workspace.members.remove')}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="rounded-2xl border border-border/20 bg-surface/40 p-5">
          <h2 className="text-base font-bold text-fg mb-4">{t('projects.workspace.tabs.activity')}</h2>
          {projectActivities.length === 0 ? (
            <p className="text-xs text-muted">{t('projects.workspace.overview.noActivity')}</p>
          ) : (
            <ul className="divide-y divide-border/10 space-y-3">
              {projectActivities.map((act) => {
                const actor = directoryUsers[act.actorId];
                return (
                  <li key={act.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={actor?.fullName || 'User'} size="sm" />
                      <div>
                        <span className="font-semibold text-fg">{actor?.fullName || 'User'}</span>{' '}
                        <span className="text-muted">{t(`activity.${act.action}`)}</span>{' '}
                        <span className="font-medium text-fg">{act.targetName}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted">
                      {format(parseISO(act.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Tab 6: FILES */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-fg">{t('projects.workspace.files.title')}</h2>
              <p className="text-xs text-muted">{t('projects.workspace.files.subtitle')}</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setUploadModalOpen(true)}>
              <Plus className="size-4 me-1.5" />
              <span className="text-xs">{t('projects.workspace.files.upload')}</span>
            </Button>
          </div>

          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/30 bg-surface/20">
              <FolderOpen className="size-10 text-muted/50 mb-3" />
              <h4 className="text-sm font-semibold text-fg">{t('projects.workspace.files.empty')}</h4>
              <p className="text-xs text-muted mt-1">{t('projects.workspace.files.emptyBody')}</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => setUploadModalOpen(true)}>
                {t('projects.workspace.files.upload')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {files.map((file) => {
                const IconComponent = FILE_TYPE_ICONS[file.type] || FileIcon;
                const uploader = directoryUsers[file.uploadedBy];
                return (
                  <div
                    key={file.id}
                    className="flex flex-col justify-between rounded-2xl border border-border/20 bg-surface/40 p-4 backdrop-blur-sm hover:border-accent/30 transition group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                          <IconComponent className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-fg truncate" title={file.name}>
                            {file.name}
                          </h4>
                          <span className="text-[10px] text-muted uppercase">
                            {(file.size / 1_000_000).toFixed(2)} MB • {file.type}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(project.id, file.id)}
                        className="p-1 text-muted hover:text-danger rounded opacity-0 group-hover:opacity-100 transition"
                        title={t('projects.delete')}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/10 pt-3 text-[11px] text-muted">
                      <span>{uploader ? uploader.fullName : 'Team'}</span>
                      <button
                        type="button"
                        onClick={() => toast.success(`Downloaded ${file.name}`)}
                        className="flex items-center gap-1 text-accent hover:underline font-medium"
                      >
                        <Download className="size-3" />
                        <span>{t('projects.workspace.files.download')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* File Upload Modal */}
      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title={t('projects.workspace.files.uploadModalTitle')}
      >
        <form onSubmit={handleFileUpload} className="space-y-4">
          <Field
            label={t('projects.workspace.files.fileName')}
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g. system-architecture-v1.pdf"
            autoFocus
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">
              {t('projects.workspace.files.fileType')}
            </label>
            <select
              value={newFileType}
              onChange={(e) => setNewFileType(e.target.value as ProjectFile['type'])}
              className={inputClass}
            >
              <option value="document">{t('projects.workspace.files.fileTypes.document')}</option>
              <option value="design">{t('projects.workspace.files.fileTypes.design')}</option>
              <option value="code">{t('projects.workspace.files.fileTypes.code')}</option>
              <option value="image">{t('projects.workspace.files.fileTypes.image')}</option>
              <option value="other">{t('projects.workspace.files.fileTypes.other')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setUploadModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={!newFileName.trim()}>
              {t('projects.workspace.files.upload')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        open={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        title={t('projects.workspace.members.addMember')}
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-fg">
            Select Workspace Collaborator
          </label>
          <select
            value={selectedNewMember}
            onChange={(e) => setSelectedNewMember(e.target.value)}
            className={inputClass}
          >
            <option value="">-- Choose member --</option>
            {Object.values(directoryUsers)
              .filter((u) => !project.memberIds.includes(u.id))
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setAddMemberModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAddMember}
              disabled={!selectedNewMember}
            >
              {t('projects.workspace.members.addMember')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t('projects.deleteConfirmTitle', 'Delete Project')}
        message={t('projects.deleteConfirm', { name: project.name })}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
