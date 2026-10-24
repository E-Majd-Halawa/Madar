import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { taskSchema, type TaskForm } from '@/schemas/auth';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import { useUiStore } from '@/store/uiStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { TaskPriority } from '@/types';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

function TaskModalForm({
  form,
  projects,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  form: UseFormReturn<TaskForm>;
  projects: { id: string; name: string }[];
  onSubmit: (v: TaskForm) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  // Type-safe translation function that always returns string
  const tr = (key: string): string => t(key) ?? key;
  const { register, handleSubmit, watch, formState: { errors } } = form;

  const close = useCallback(() => {
    onClose();
    form.reset({ priority: 'medium', title: '', dueDate: '', projectId: '' });
  }, [form, onClose]);

  // Focus title input on mount
  useEffect(() => {
    const input = document.getElementById('task-title');
    input?.focus();
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4" dir="auto">
      <Field
        id="task-title"
        label={tr('tasks.title')}
        placeholder={tr('tasks.titlePlaceholder')}
        autoFocus
        error={errors.title?.message ? tr(errors.title.message) : undefined}
        {...register('title')}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="task-priority" className="mb-1.5 block text-sm font-medium">
            {tr('tasks.priority')}
          </label>
          <select
            id="task-priority"
            className={inputClass}
            {...register('priority')}
            aria-describedby={errors.priority ? 'task-priority-error' : undefined}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {tr(`tasks.priorities.${p}`)}
              </option>
            ))}
          </select>
          {errors.priority && (
            <p id="task-priority-error" role="alert" className="mt-1.5 text-xs text-danger">
              {tr(errors.priority.message ?? '')}
            </p>
          )}
        </div>
        <Field
          id="task-due-date"
          label={tr('tasks.dueDate')}
          type="date"
          dir="ltr"
          error={errors.dueDate?.message ? tr(errors.dueDate.message) : undefined}
          {...register('dueDate')}
        />
      </div>
      <div>
        <label htmlFor="task-project" className="mb-1.5 block text-sm font-medium">
          {tr('tasks.project')}
        </label>
        <select
          id="task-project"
          className={inputClass}
          {...register('projectId')}
          aria-describedby={errors.projectId ? 'task-project-error' : undefined}
        >
          <option value="">{tr('tasks.noProject')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {errors.projectId && (
          <p id="task-project-error" role="alert" className="mt-1.5 text-xs text-danger">
            {tr(errors.projectId.message ?? '')}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="task-recurrence" className="mb-1.5 block text-sm font-medium">
          {tr('tasks.recurrence')}
        </label>
        <select
          id="task-recurrence"
          className={inputClass}
          {...register('recurrence')}
        >
          <option value="none">{tr('tasks.recurrenceOptions.none')}</option>
          <option value="daily">{tr('tasks.recurrenceOptions.daily')}</option>
          <option value="weekly">{tr('tasks.recurrenceOptions.weekly')}</option>
          <option value="monthly">{tr('tasks.recurrenceOptions.monthly')}</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" onClick={close} disabled={isSubmitting}>
          {tr('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          {tr('tasks.create')}
        </Button>
      </div>
    </form>
  );
}

TaskModalForm.displayName = 'TaskModalForm';

/** Global "New task" dialog, opened from the top bar, mobile bar, dashboard and the N shortcut. */
export function TaskModal() {
  const { t } = useTranslation();
  const open = useUiStore((s) => s.taskModalOpen);
  const setOpen = useUiStore((s) => s.setTaskModal);
  const user = useAuthStore((s) => s.session?.user);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const projects = useProjectStore((s) => s.projects.filter((p) => p.status !== 'archived'));
  const createTask = useTaskStore((s) => s.create);

  const form = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'medium', title: '', dueDate: '', projectId: '' },
  });

  const { formState: { isSubmitting } } = form;

  const handleSubmit = useCallback(
    async (v: TaskForm) => {
      if (!user || !workspaceId) return;
      try {
        const task = await createTask(
          {
            workspaceId,
            creatorId: user.id,
            title: v.title.trim(),
            priority: v.priority,
            projectId: v.projectId || null,
            dueDate: v.dueDate ? new Date(`${v.dueDate}T17:00:00`).toISOString() : null,
            recurrence: v.recurrence && v.recurrence !== 'none' ? v.recurrence : undefined,
          },
          user.id,
        );
        if (task) {
          toast.success(t('tasks.created'));
          form.reset({ priority: 'medium', title: '', dueDate: '', projectId: '', recurrence: 'none' });
          setOpen(false);
        } else {
          toast.error(t('errors.auth.unknown'));
        }
      } catch {
        toast.error(t('errors.auth.unknown'));
      }
    },
    [user, workspaceId, createTask, t, form, setOpen]
  );

  const close = useCallback(() => {
    setOpen(false);
    form.reset({ priority: 'medium', title: '', dueDate: '', projectId: '', recurrence: 'none' });
  }, [form, setOpen]);

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('tasks.new')}
      description={t('tasks.newBody')}
      className="max-w-md"
    >
      <TaskModalForm
        form={form}
        projects={projects}
        onSubmit={handleSubmit}
        onClose={close}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
}