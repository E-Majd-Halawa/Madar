import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/store/authStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { TaskPriority } from '@/types';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export function QuickTaskDateModal() {
  const { t } = useTranslation();
  const quickAddDate = useCalendarStore((s) => s.quickAddDate);
  const setQuickAddDate = useCalendarStore((s) => s.setQuickAddDate);
  const user = useAuthStore((s) => s.session?.user);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const projects = useProjectStore((s) => s.projects.filter((p) => p.status !== 'archived'));
  const createTask = useTaskStore((s) => s.create);

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [projectId, setProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = () => {
    setQuickAddDate(null);
    setTitle('');
    setPriority('medium');
    setProjectId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user || !workspaceId || !quickAddDate) return;

    setIsSubmitting(true);
    const task = await createTask(
      {
        workspaceId,
        creatorId: user.id,
        title: title.trim(),
        priority,
        projectId: projectId || null,
        dueDate: new Date(`${quickAddDate}T17:00:00`).toISOString(),
      },
      user.id,
    );

    setIsSubmitting(false);
    if (task) {
      toast.success(t('tasks.created'));
      close();
    } else {
      toast.error(t('errors.auth.unknown'));
    }
  };

  return (
    <Modal
      open={!!quickAddDate}
      onClose={close}
      title={t('calendar.quickAdd.title', { date: quickAddDate || '' })}
      description={t('calendar.quickAdd.subtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label={t('calendar.quickAdd.taskTitle')}
          placeholder={t('calendar.quickAdd.taskTitlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">
              {t('tasks.priority')}
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className={inputClass}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {t(`tasks.priorities.${p}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">
              {t('tasks.project')}
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={inputClass}
            >
              <option value="">{t('tasks.noProject')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} disabled={!title.trim()}>
            {t('calendar.quickAdd.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
