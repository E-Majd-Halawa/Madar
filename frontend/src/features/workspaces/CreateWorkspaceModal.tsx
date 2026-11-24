import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { toast } from '@/store/toastStore';
import type { WorkspaceType } from '@/types';

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
}

const COLORS = ['#10b981', '#22d3ee', '#a78bfa', '#f59e0b', '#f43f5e', '#3b82f6'];

export function CreateWorkspaceModal({ open, onClose }: CreateWorkspaceModalProps) {
  const { t } = useTranslation();
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);

  const [name, setName] = useState('');
  const [type, setType] = useState<WorkspaceType>('team');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [initialMembers, setInitialMembers] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('workspaces.nameRequired', 'Workspace name is required'));
      return;
    }
    setSubmitting(true);
    try {
      const created = await createWorkspace({
        name: name.trim(),
        description: description.trim(),
        type,
        color,
        initialMembers: initialMembers
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      });
      if (!created) throw new Error('create_failed');
      toast.success(t('workspaces.created', 'Workspace created'));
      setName('');
      setDescription('');
      setInitialMembers('');
      onClose();
    } catch {
      toast.error(t('common.error', 'Something went wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('workspaces.createTitle', 'New Workspace / Team')} className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('workspaces.name', 'Name')} required>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('workspaces.namePlaceholder', 'e.g. Product Team')}
            className={inputClass}
          />
        </Field>

        <Field label={t('workspaces.type', 'Type')}>
          <div className="grid grid-cols-2 gap-2">
            {(['personal', 'team'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  type === value ? 'border-accent bg-accent/10 text-accent' : 'border-border/30 bg-surface-2/30 hover:border-border/50'
                }`}
              >
                {t(`workspaces.type.${value}`, value === 'personal' ? 'Personal' : 'Team')}
              </button>
            ))}
          </div>
        </Field>

        <Field label={t('workspaces.description', 'Description')}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={inputClass}
          />
        </Field>

        <Field label={t('workspaces.color', 'Color')}>
          <div className="flex gap-2">
            {COLORS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setColor(value)}
                className={`size-7 rounded-full border-2 transition ${color === value ? 'border-accent scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: value }}
                aria-label={value}
              />
            ))}
          </div>
        </Field>

        <Field label={t('workspaces.initialMembers', 'Initial members (emails/usernames, comma-separated)')}>
          <input
            type="text"
            value={initialMembers}
            onChange={(e) => setInitialMembers(e.target.value)}
            placeholder="colleague@company.com, another.user"
            className={inputClass}
          />
        </Field>

        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? t('common.creating', 'Creating...') : t('workspaces.create', 'Create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}