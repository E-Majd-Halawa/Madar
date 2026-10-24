import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  X,
  Calendar,
  Clock,
  User as UserIcon,
  FolderKanban,
  Tag,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  Activity as ActivityIcon,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useActivityStore } from '@/store/activityStore';
import { useAuthStore } from '@/store/authStore';
import { useDirectoryStore } from '@/store/directoryStore';
import { useProjectStore } from '@/store/projectStore';
import { resolveDirection, useSettingsStore } from '@/store/settingsStore';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import { useUiStore } from '@/store/uiStore';
import type { TaskPriority, TaskStatus } from '@/types';
import { cn } from '@/utils/cn';
import { formatMinutes } from '@/utils/taskStats';

const STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'completed'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export function TaskDetailDrawer() {
  const { t } = useTranslation();
  const activeTaskId = useUiStore((s) => s.activeTaskId);
  const setActiveTaskId = useUiStore((s) => s.setActiveTaskId);

  const currentUser = useAuthStore((s) => s.session?.user);
  const language = useSettingsStore((s) => s.language);
  const direction = useSettingsStore((s) => s.direction);
  const isRtl = resolveDirection(language, direction) === 'rtl';

  const task = useTaskStore((s) => s.tasks.find((t) => t.id === activeTaskId));
  const updateTask = useTaskStore((s) => s.update);
  const setTaskStatus = useTaskStore((s) => s.setStatus);
  const addSubtask = useTaskStore((s) => s.addSubtask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const removeSubtask = useTaskStore((s) => s.removeSubtask);
  const addComment = useTaskStore((s) => s.addComment);
  const logTime = useTaskStore((s) => s.logTime);
  const removeTask = useTaskStore((s) => s.remove);
  const restoreTask = useTaskStore((s) => s.restore);

  const projects = useProjectStore((s) => s.projects);
  const directoryUsers = useDirectoryStore((s) => s.byId);
  const allEvents = useActivityStore((s) => s.events);

  // Local state for draft fields
  const [titleDraft, setTitleDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [customLogMinutes, setCustomLogMinutes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync draft states when active task changes
  useEffect(() => {
    if (task) {
      setTitleDraft(task.title);
      setDescriptionDraft(task.description || '');
      setNewSubtaskTitle('');
      setNewComment('');
      setConfirmDelete(false);
      setIsAddingTag(false);
    }
  }, [task?.id]);

  // Handle escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeTaskId) {
        setActiveTaskId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTaskId, setActiveTaskId]);

  if (!task) return null;

  const handleClose = () => {
    setActiveTaskId(null);
  };

  const handleTitleBlur = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== task.title) {
      void updateTask(task.id, { title: trimmed });
    } else {
      setTitleDraft(task.title);
    }
  };

  const handleDescriptionBlur = () => {
    if (descriptionDraft !== task.description) {
      void updateTask(task.id, { description: descriptionDraft.trim() });
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    void addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    void addComment(task.id, currentUser.id, newComment.trim());
    setNewComment('');
  };

  const handleQuickLogTime = (minutes: number) => {
    void logTime(task.id, minutes);
    toast.success(`+${formatMinutes(minutes)} logged`);
  };

  const handleCustomLogTime = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customLogMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      void logTime(task.id, mins);
      setCustomLogMinutes('');
      toast.success(`+${formatMinutes(mins)} logged`);
    }
  };

  const handleAddTag = () => {
    const tag = newTagInput.trim().toLowerCase();
    if (tag && !task.tags.includes(tag)) {
      void updateTask(task.id, { tags: [...task.tags, tag] });
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    void updateTask(task.id, { tags: task.tags.filter((t) => t !== tagToRemove) });
  };

  const handleDeleteTask = async () => {
    const deleted = await removeTask(task.id);
    handleClose();
    if (deleted) {
      toast.success(t('tasks.deleted'), {
        actionLabel: t('common.undo'),
        onAction: () => restoreTask(deleted),
      });
    }
  };

  // Subtask calculations
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.done).length;
  const subtasksPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  // Time calculations
  const estimate = task.estimateMinutes || 0;
  const tracked = task.trackedMinutes || 0;
  const timePercent = estimate > 0 ? Math.min(100, Math.round((tracked / estimate) * 100)) : 0;
  const isOverEstimate = estimate > 0 && tracked > estimate;

  // Task events
  const taskEvents = allEvents.filter(
    (e) => e.targetName === task.title || e.metadata?.taskId === task.id,
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Drawer panel */}
        <div className="fixed inset-y-0 end-0 flex max-w-full">
          <motion.div
            initial={{ x: isRtl ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-screen max-w-2xl bg-surface border-s border-border/20 shadow-depth flex flex-col h-full overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-task-title"
          >
            {/* Header Toolbar */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border/20 bg-surface/50 backdrop-blur-md">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status selector */}
                <select
                  aria-label={t('tasks.statuses.' + task.status)}
                  value={task.status}
                  onChange={(e) => void setTaskStatus(task.id, e.target.value as TaskStatus)}
                  className="rounded-lg bg-surface-2 border border-border/30 px-3 py-1.5 text-xs font-semibold focus:border-accent focus:outline-none transition"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {t(`tasks.statuses.${st}`)}
                    </option>
                  ))}
                </select>

                {/* Priority selector */}
                <select
                  aria-label={t('tasks.priorities.' + task.priority)}
                  value={task.priority}
                  onChange={(e) => void updateTask(task.id, { priority: e.target.value as TaskPriority })}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-semibold focus:outline-none transition',
                    task.priority === 'urgent' && 'border-danger/40 bg-danger/10 text-danger',
                    task.priority === 'high' && 'border-warning/40 bg-warning/10 text-warning',
                    task.priority === 'medium' && 'border-accent/40 bg-accent/10 text-accent',
                    task.priority === 'low' && 'border-border/30 bg-surface-2 text-muted',
                  )}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {t(`tasks.priorities.${p}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                {confirmDelete ? (
                  <div className="flex items-center gap-1.5 bg-danger/10 px-2 py-1 rounded-lg border border-danger/30">
                    <span className="text-xs text-danger font-medium">{t('tasks.drawer.confirmDelete')}</span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteTask()}
                      className="text-xs font-semibold bg-danger text-white px-2 py-0.5 rounded hover:bg-danger/90 transition"
                    >
                      {t('common.delete')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs text-muted hover:text-fg px-1 transition"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    title={t('tasks.drawer.delete')}
                    className="p-2 text-muted hover:text-danger rounded-lg hover:bg-surface-2 transition"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  aria-label={t('common.close')}
                  className="p-2 text-muted hover:text-fg rounded-lg hover:bg-surface-2 transition"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Title Input */}
              <div>
                <input
                  id="drawer-task-title"
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  placeholder={t('tasks.titlePlaceholder')}
                  className="w-full bg-transparent text-xl font-bold text-fg focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1 transition"
                />
              </div>

              {/* Meta Grid (Assignee, Project, Due Date) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface-2/60 border border-border/20 text-sm">
                {/* Assignee */}
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted flex items-center gap-1.5">
                    <UserIcon className="size-3.5" />
                    {t('tasks.drawer.assignee')}
                  </span>
                  <select
                    value={task.assigneeId || ''}
                    onChange={(e) => void updateTask(task.id, { assigneeId: e.target.value || null })}
                    className="w-full bg-surface border border-border/30 rounded-lg px-2.5 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
                  >
                    <option value="">{t('tasks.drawer.unassigned')}</option>
                    {Object.values(directoryUsers).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project */}
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted flex items-center gap-1.5">
                    <FolderKanban className="size-3.5" />
                    {t('tasks.project')}
                  </span>
                  <select
                    value={task.projectId || ''}
                    onChange={(e) => void updateTask(task.id, { projectId: e.target.value || null })}
                    className="w-full bg-surface border border-border/30 rounded-lg px-2.5 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
                  >
                    <option value="">{t('tasks.noProject')}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    {t('tasks.dueDate')}
                  </span>
                  <input
                    type="date"
                    dir="ltr"
                    value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                    onChange={(e) =>
                      void updateTask(task.id, {
                        dueDate: e.target.value ? new Date(`${e.target.value}T17:00:00`).toISOString() : null,
                      })
                    }
                    className="w-full bg-surface border border-border/30 rounded-lg px-2.5 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted flex items-center gap-1.5">
                  <Tag className="size-3.5" />
                  {t('tasks.drawer.tags')}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {task.tags.map((tg) => (
                    <span
                      key={tg}
                      className="inline-flex items-center gap-1 bg-surface-2 border border-border/30 px-2.5 py-1 rounded-full text-xs text-fg font-medium"
                    >
                      #{tg}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tg)}
                        className="text-muted hover:text-danger ml-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {isAddingTag ? (
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          } else if (e.key === 'Escape') {
                            setIsAddingTag(false);
                          }
                        }}
                        placeholder="tag..."
                        className="w-24 bg-surface border border-accent rounded-full px-2.5 py-0.5 text-xs text-fg focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="text-xs text-accent font-semibold px-1"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingTag(true)}
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent border border-dashed border-border/40 hover:border-accent px-2 py-0.5 rounded-full transition"
                    >
                      <Plus className="size-3" />
                      {t('tasks.drawer.addTag')}
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="drawer-description" className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {t('tasks.drawer.description')}
                </label>
                <textarea
                  id="drawer-description"
                  rows={3}
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  placeholder={t('tasks.drawer.descPlaceholder')}
                  className="w-full rounded-xl bg-surface-2/40 border border-border/20 p-3 text-sm text-fg placeholder:text-muted/60 focus:border-accent focus:bg-surface focus:outline-none transition resize-y"
                />
              </div>

              {/* Subtasks Checklist */}
              <div className="space-y-3 p-4 rounded-xl bg-surface-2/40 border border-border/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="size-4 text-accent" />
                    <span className="text-sm font-semibold text-fg">{t('tasks.drawer.subtasks')}</span>
                  </div>
                  <span className="text-xs text-muted font-medium">
                    {t('tasks.drawer.subtasksProgress', { done: completedSubtasks, total: subtasks.length })}
                  </span>
                </div>

                {subtasks.length > 0 && (
                  <ProgressBar
                    value={subtasksPercent}
                    label="Subtask progress"
                    className="h-1.5"
                  />
                )}

                {/* Subtask list */}
                <div className="space-y-1.5 pt-1">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="group flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-surface/70 border border-border/10 hover:border-border/30 transition"
                    >
                      <label className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={st.done}
                          onChange={() => void toggleSubtask(task.id, st.id)}
                          className="size-4 rounded border-border/40 text-accent focus:ring-accent/20 cursor-pointer"
                        />
                        <span
                          className={cn(
                            'text-sm truncate transition',
                            st.done ? 'line-through text-muted' : 'text-fg',
                          )}
                        >
                          {st.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => void removeSubtask(task.id, st.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-danger transition"
                        title={t('common.delete')}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Form */}
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder={t('tasks.drawer.newSubtaskPlaceholder')}
                    className="flex-1 bg-surface border border-border/30 rounded-lg px-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none transition"
                  />
                  <Button type="submit" variant="secondary" size="sm" disabled={!newSubtaskTitle.trim()}>
                    <Plus className="size-3.5 me-1" />
                    {t('common.create')}
                  </Button>
                </form>
              </div>

              {/* Time Tracking */}
              <div className="space-y-3 p-4 rounded-xl bg-surface-2/40 border border-border/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-accent-2" />
                    <span className="text-sm font-semibold text-fg">{t('tasks.drawer.timeTracking')}</span>
                  </div>
                  {isOverEstimate && (
                    <span className="inline-flex items-center gap-1 text-xs text-danger font-medium bg-danger/10 px-2 py-0.5 rounded-full">
                      <AlertCircle className="size-3" />
                      Over estimate
                    </span>
                  )}
                </div>

                {/* Stats Display */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface border border-border/20">
                    <span className="text-muted block">{t('tasks.drawer.tracked')}</span>
                    <span className="text-base font-bold text-fg mt-0.5 block">{formatMinutes(tracked)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface border border-border/20">
                    <span className="text-muted block">{t('tasks.drawer.estimate')}</span>
                    <span className="text-base font-bold text-fg mt-0.5 block">
                      {estimate > 0 ? formatMinutes(estimate) : '—'}
                    </span>
                  </div>
                </div>

                {estimate > 0 && (
                  <ProgressBar
                    value={timePercent}
                    label="Time tracked"
                    color={isOverEstimate ? 'rgb(var(--danger))' : undefined}
                    className="h-1.5"
                  />
                )}

                {/* Quick Log Buttons */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-xs text-muted font-medium">{t('tasks.drawer.logTime')}:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickLogTime(15)}
                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-surface hover:bg-surface-2 border border-border/30 transition text-fg"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogTime(30)}
                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-surface hover:bg-surface-2 border border-border/30 transition text-fg"
                  >
                    +30m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogTime(60)}
                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-surface hover:bg-surface-2 border border-border/30 transition text-fg"
                  >
                    +1h
                  </button>

                  {/* Custom Log Minutes Form */}
                  <form onSubmit={handleCustomLogTime} className="flex items-center gap-1.5 ms-auto">
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={customLogMinutes}
                      onChange={(e) => setCustomLogMinutes(e.target.value)}
                      placeholder={t('tasks.drawer.addMinutes')}
                      className="w-24 bg-surface border border-border/30 rounded-lg px-2 py-1 text-xs text-fg focus:border-accent focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!customLogMinutes}
                      className="text-xs font-semibold px-2 py-1 rounded-lg bg-accent text-accent-fg disabled:opacity-40 transition"
                    >
                      Log
                    </button>
                  </form>
                </div>
              </div>

              {/* Tabs for Comments & Activity */}
              <div className="space-y-4 pt-2">
                <div className="flex border-b border-border/20">
                  <button
                    type="button"
                    onClick={() => setActiveTab('comments')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition',
                      activeTab === 'comments'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-muted hover:text-fg',
                    )}
                  >
                    <MessageSquare className="size-4" />
                    {t('tasks.drawer.comments')} ({task.comments?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('activity')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition',
                      activeTab === 'activity'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-muted hover:text-fg',
                    )}
                  >
                    <ActivityIcon className="size-4" />
                    {t('tasks.drawer.activity')}
                  </button>
                </div>

                {/* Comments View */}
                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    {/* Add Comment Input */}
                    <form onSubmit={handleAddComment} className="flex gap-3">
                      {currentUser && <Avatar name={currentUser.fullName} size="sm" />}
                      <div className="flex-1 space-y-2">
                        <textarea
                          rows={2}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder={t('tasks.drawer.addComment')}
                          className="w-full rounded-xl bg-surface-2/50 border border-border/20 p-2.5 text-xs text-fg focus:border-accent focus:outline-none transition resize-none"
                        />
                        <div className="flex justify-end">
                          <Button type="submit" variant="primary" size="sm" disabled={!newComment.trim()}>
                            <Send className="size-3.5 me-1" />
                            {t('tasks.drawer.postComment')}
                          </Button>
                        </div>
                      </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-3 pt-2">
                      {(!task.comments || task.comments.length === 0) ? (
                        <p className="text-xs text-muted italic text-center py-4">
                          {t('tasks.drawer.noComments')}
                        </p>
                      ) : (
                        task.comments.map((cmt) => {
                          const author = directoryUsers[cmt.authorId];
                          const authorName = author?.fullName || 'User';
                          const timeStr = new Date(cmt.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                          return (
                            <div key={cmt.id} className="flex gap-3 p-3 rounded-xl bg-surface-2/30 border border-border/10">
                              <Avatar name={authorName} size="xs" />
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-fg">{authorName}</span>
                                  <span className="text-[11px] text-muted">{timeStr}</span>
                                </div>
                                <p className="text-xs text-fg whitespace-pre-wrap">{cmt.content}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Activity View */}
                {activeTab === 'activity' && (
                  <div className="space-y-2 pt-1">
                    {taskEvents.length === 0 ? (
                      <p className="text-xs text-muted italic text-center py-4">
                        {t('tasks.drawer.noActivity')}
                      </p>
                    ) : (
                      taskEvents.map((evt) => {
                        const actor = directoryUsers[evt.actorId];
                        const actorName = actor?.fullName || 'Someone';
                        return (
                          <div key={evt.id} className="flex items-center justify-between text-xs py-2 border-b border-border/10 last:border-none">
                            <span className="text-fg">
                              <span className="font-semibold">{actorName}</span>{' '}
                              <span className="text-muted">{t(`activity.${evt.action}`)}</span>
                            </span>
                            <span className="text-[11px] text-muted">
                              {new Date(evt.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
