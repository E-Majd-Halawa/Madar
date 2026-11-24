import { Check, User, Users } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { WorkspaceType } from '@/types';
import { cn } from '@/utils/cn';

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
}

const PRESET_COLORS = ['#10b981', '#22d3ee', '#a78bfa', '#f59e0b', '#f43f5e', '#3b82f6'] as const;

const TYPE_OPTIONS = [
  { value: 'personal', icon: User },
  { value: 'team', icon: Users },
] as const satisfies ReadonlyArray<{
  value: WorkspaceType;
  icon: React.ComponentType<{ className?: string }>;
}>;

export function CreateWorkspaceModal({ open, onClose }: CreateWorkspaceModalProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const session = useAuthStore((s) => s.session);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<WorkspaceType>('team');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(PRESET_COLORS[0]);
  const [initialMembers, setInitialMembers] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Never leave the dialog open over the sign-in screen after logout/session loss.
  useEffect(() => {
    if (!open) return;
    if (!session || location.pathname === ROUTES.login) onClose();
  }, [open, session, location.pathname, onClose]);

  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return t('workspaces.nameRequired');
    if (trimmed.length < 2) return t('workspaces.nameShort');
    if (trimmed.length > 80) return t('workspaces.nameLong');
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const error = validateName(name);
    setNameError(error);
    if (error) {
      nameRef.current?.focus();
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
          .split(/[,،]/)
          .map((value) => value.trim())
          .filter(Boolean),
      });
      if (!created) throw new Error('create_failed');
      toast.success(t('workspaces.created', { name: created.name }));
      setName('');
      setDescription('');
      setInitialMembers('');
      setNameError(null);
      setColor(PRESET_COLORS[0]);
      setType('team');
      onClose();
    } catch {
      toast.error(t('workspaces.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('workspaces.createTitle')}
      description={t('workspaces.createSubtitle')}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field
          ref={nameRef}
          label={t('workspaces.name')}
          required
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError) setNameError(null);
          }}
          placeholder={t('workspaces.namePlaceholder')}
          error={nameError ?? undefined}
          maxLength={80}
          autoFocus
        />

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium">{t('workspaces.type')}</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TYPE_OPTIONS.map(({ value, icon: Icon }) => {
              const selected = type === value;
              return (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition focus-within:ring-2 focus-within:ring-accent/60',
                    selected
                      ? 'border-accent bg-accent/10'
                      : 'border-border/40 bg-surface-2/30 hover:border-border/60',
                  )}
                >
                  <input
                    type="radio"
                    name="workspace-type"
                    value={value}
                    checked={selected}
                    onChange={() => setType(value)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-lg',
                      selected ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-muted',
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {t(`workspaces.typeOptions.${value}.label`)}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {t(`workspaces.typeOptions.${value}.hint`)}
                    </span>
                  </span>
                  {selected && <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${formId}-description`} className="mb-1.5 block text-sm font-medium">
            {t('workspaces.description')}{' '}
            <span className="text-xs font-normal text-muted">({t('common.optional')})</span>
          </label>
          <textarea
            id={`${formId}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            maxLength={500}
            placeholder={t('workspaces.descriptionPlaceholder')}
            className={cn(inputClass, 'h-auto min-h-20 resize-y py-2')}
          />
        </div>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium">{t('workspaces.color')}</legend>
          <div className="flex flex-wrap items-center gap-2.5">
            {PRESET_COLORS.map((value) => {
              const selected = color.toLowerCase() === value;
              return (
                <label
                  key={value}
                  className="cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-surface"
                >
                  <input
                    type="radio"
                    name="workspace-color"
                    value={value}
                    checked={selected}
                    onChange={() => setColor(value)}
                    aria-label={value}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'grid size-8 place-items-center rounded-full border-2 transition',
                      selected ? 'border-accent' : 'border-transparent hover:scale-105',
                    )}
                    style={{ backgroundColor: value }}
                  >
                    {selected && <Check className="size-4 text-white drop-shadow" aria-hidden />}
                  </span>
                </label>
              );
            })}
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border/40 bg-surface-2/40 py-1 ps-1 pe-2.5 transition focus-within:ring-2 focus-within:ring-accent/60">
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                aria-label={t('workspaces.customColor')}
                className="size-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
              <span className="font-mono text-xs uppercase text-muted">{color}</span>
            </label>
          </div>
          <p className="mt-1.5 text-xs text-muted">{t('workspaces.colorHint')}</p>
        </fieldset>

        <Field
          label={t('workspaces.initialMembers')}
          value={initialMembers}
          onChange={(event) => setInitialMembers(event.target.value)}
          placeholder={t('workspaces.initialMembersPlaceholder')}
          hint={t('workspaces.initialMembersHint')}
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {submitting ? t('workspaces.creating') : t('workspaces.createAction')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
