import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { TaskPriority, TaskStatus } from '@/types';

interface KanbanQuickAddProps {
  status: TaskStatus;
}

export function KanbanQuickAdd({ status }: KanbanQuickAddProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUser = useAuthStore((s) => s.session?.user);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const createTask = useTaskStore((s) => s.create);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !currentUser || !activeWorkspaceId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const task = await createTask(
        {
          workspaceId: activeWorkspaceId,
          creatorId: currentUser.id,
          title: trimmed,
          status,
          priority,
          assigneeId: currentUser.id,
        },
        currentUser.id,
      );

      if (task) {
        toast.success(t('tasks.created'));
        setTitle('');
        inputRef.current?.focus();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setTitle('');
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/20 py-2.5 text-xs font-medium text-muted hover:border-accent hover:text-accent hover:bg-accent/5 transition duration-150"
      >
        <Plus className="size-4" />
        <span>{t('tasks.kanban.quickAdd')}</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-2 rounded-xl border border-accent/40 bg-surface p-3 shadow-md transition"
    >
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('tasks.titlePlaceholder')}
        className="w-full bg-transparent text-xs text-fg placeholder:text-muted focus:outline-none"
      />

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/10">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          aria-label={t('tasks.priority')}
          className="rounded-md bg-surface-2 border border-border/20 px-2 py-1 text-[11px] font-medium text-fg focus:outline-none"
        >
          <option value="low">{t('tasks.priorities.low')}</option>
          <option value="medium">{t('tasks.priorities.medium')}</option>
          <option value="high">{t('tasks.priorities.high')}</option>
          <option value="urgent">{t('tasks.priorities.urgent')}</option>
        </select>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setTitle('');
            }}
            className="p-1 text-muted hover:text-fg rounded transition"
            title={t('common.cancel')}
          >
            <X className="size-3.5" />
          </button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!title.trim() || isSubmitting}
            className="h-7 px-2.5 text-xs"
          >
            {t('common.create')}
          </Button>
        </div>
      </div>
    </form>
  );
}
