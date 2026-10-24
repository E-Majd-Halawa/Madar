import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { projectSchema, type ProjectForm } from '@/schemas/projects';
import { useAuthStore } from '@/store/authStore';
import { useDirectoryStore } from '@/store/directoryStore';
import { useProjectStore } from '@/store/projectStore';
import { toast } from '@/store/toastStore';
import { useUiStore } from '@/store/uiStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { ProjectStatus } from '@/types';
import { cn } from '@/utils/cn';

const COLOR_PRESETS = [
  '#10b981', // emerald
  '#22d3ee', // cyan
  '#a78bfa', // violet
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#ec4899', // pink
  '#6366f1', // indigo
];

const STATUS_OPTIONS: ProjectStatus[] = ['planning', 'active', 'on_hold', 'completed', 'archived'];

export function ProjectModal() {
  const { t } = useTranslation();
  const open = useUiStore((s) => s.projectModalOpen);
  const editingProject = useUiStore((s) => s.editingProject);
  const setOpen = useUiStore((s) => s.setProjectModal);
  const user = useAuthStore((s) => s.session?.user);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const directoryUsers = useDirectoryStore((s) => s.byId);

  const createProject = useProjectStore((s) => s.create);
  const updateProject = useProjectStore((s) => s.update);

  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
      color: COLOR_PRESETS[0],
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
    },
  });

  // Populate form if editing
  useEffect(() => {
    if (editingProject) {
      reset({
        name: editingProject.name,
        description: editingProject.description,
        status: editingProject.status,
        color: editingProject.color,
        startDate: editingProject.startDate ? editingProject.startDate.split('T')[0] : '',
        dueDate: editingProject.dueDate ? editingProject.dueDate.split('T')[0] : '',
        memberIds: editingProject.memberIds,
      });
      setSelectedColor(editingProject.color);
      setSelectedMembers(editingProject.memberIds || []);
    } else {
      const today = new Date().toISOString().split('T')[0];
      reset({
        name: '',
        description: '',
        status: 'active',
        color: COLOR_PRESETS[0],
        startDate: today,
        dueDate: '',
        memberIds: user ? [user.id] : [],
      });
      setSelectedColor(COLOR_PRESETS[0]);
      setSelectedMembers(user ? [user.id] : []);
    }
  }, [editingProject, open, reset, user]);

  const close = () => {
    setOpen(false, null);
  };

  const handleColorChange = (c: string) => {
    setSelectedColor(c);
    setValue('color', c);
  };

  const toggleMember = (userId: string) => {
    const next = selectedMembers.includes(userId)
      ? selectedMembers.filter((id) => id !== userId)
      : [...selectedMembers, userId];
    setSelectedMembers(next);
    setValue('memberIds', next);
  };

  const submit = async (values: ProjectForm) => {
    if (!user || !workspaceId) return;

    const startIso = values.startDate ? new Date(`${values.startDate}T09:00:00`).toISOString() : new Date().toISOString();
    const dueIso = values.dueDate ? new Date(`${values.dueDate}T18:00:00`).toISOString() : null;

    if (editingProject) {
      const res = await updateProject(
        editingProject.id,
        {
          name: values.name.trim(),
          description: values.description?.trim() || '',
          status: values.status,
          color: selectedColor,
          startDate: startIso,
          dueDate: dueIso,
          memberIds: selectedMembers,
        },
        user.id,
      );
      if (res) {
        toast.success(t('projects.updated'));
        close();
      } else {
        toast.error(t('errors.auth.unknown'));
      }
    } else {
      const project = await createProject(
        {
          workspaceId,
          ownerId: user.id,
          name: values.name.trim(),
          description: values.description?.trim() || '',
          status: values.status,
          color: selectedColor,
          startDate: startIso,
          dueDate: dueIso,
          memberIds: selectedMembers.length > 0 ? selectedMembers : [user.id],
        },
        user.id,
      );
      if (project) {
        toast.success(t('projects.created'));
        close();
      } else {
        toast.error(t('errors.auth.unknown'));
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={editingProject ? t('projects.edit') : t('projects.new')}
      description={editingProject ? t('projects.editBody') : t('projects.newBody')}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        {/* Name */}
        <Field
          label={t('projects.form.name')}
          placeholder={t('projects.form.namePlaceholder')}
          autoFocus
          error={errors.name?.message ? t(errors.name.message) : undefined}
          {...register('name')}
        />

        {/* Description */}
        <div>
          <label htmlFor="project-desc" className="mb-1.5 block text-sm font-medium text-fg">
            {t('projects.form.description')}
          </label>
          <textarea
            id="project-desc"
            rows={3}
            placeholder={t('projects.form.descPlaceholder')}
            className={cn(inputClass, 'resize-none py-2')}
            {...register('description')}
          />
        </div>

        {/* Status & Color Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="project-status" className="mb-1.5 block text-sm font-medium text-fg">
              {t('projects.form.status')}
            </label>
            <select id="project-status" className={inputClass} {...register('status')}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {t(`projects.statuses.${status}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">
              {t('projects.form.color')}
            </label>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange(color)}
                  className="relative size-6 rounded-full transition-transform hover:scale-110 focus:outline-none ring-1 ring-border/20"
                  style={{ backgroundColor: color }}
                  aria-label={color}
                >
                  {selectedColor === color && (
                    <Check className="absolute inset-0 m-auto size-3 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('color')} value={selectedColor} />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('projects.form.startDate')} type="date" dir="ltr" {...register('startDate')} />
          <Field label={t('projects.form.dueDate')} type="date" dir="ltr" {...register('dueDate')} />
        </div>

        {/* Assign Team Members */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg">
            {t('projects.form.members')} ({selectedMembers.length})
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 rounded-xl border border-border/20 bg-surface-2/40 scrollbar-thin">
            {Object.values(directoryUsers).map((member) => {
              const selected = selectedMembers.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition border',
                    selected
                      ? 'bg-accent/15 border-accent text-accent font-semibold'
                      : 'border-border/10 bg-surface text-muted hover:border-border hover:text-fg',
                  )}
                >
                  <Avatar name={member.fullName} size="xs" />
                  <span>{member.fullName}</span>
                  {selected ? <Check className="size-3" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border/10">
          <Button type="button" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {editingProject ? t('projects.edit') : t('projects.new')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
