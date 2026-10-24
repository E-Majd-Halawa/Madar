import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trash2, X, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import type { TaskStatus } from '@/types';

interface TaskBulkBarProps {
  selectedIds: string[];
  onClear: () => void;
}

const STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'completed'];

export function TaskBulkBar({ selectedIds, onClear }: TaskBulkBarProps) {
  const { t } = useTranslation();
  const bulkUpdateStatus = useTaskStore((s) => s.bulkUpdateStatus);
  const bulkDelete = useTaskStore((s) => s.bulkDelete);

  if (selectedIds.length === 0) return null;

  const handleMarkComplete = async () => {
    await bulkUpdateStatus(selectedIds, 'completed');
    toast.success(t('tasks.completed'));
    onClear();
  };

  const handleMoveStatus = async (status: TaskStatus) => {
    await bulkUpdateStatus(selectedIds, status);
    toast.success(t('tasks.statuses.' + status));
    onClear();
  };

  const handleDelete = async () => {
    await bulkDelete(selectedIds);
    toast.success(t('tasks.deleted'));
    onClear();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 start-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface-2 border border-border/30 shadow-depth backdrop-blur-md"
      >
        <span className="text-xs font-semibold text-fg">
          {t('tasks.bulk.selected', { count: selectedIds.length })}
        </span>

        <div className="h-4 w-px bg-border/20" />

        {/* Mark Done button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void handleMarkComplete()}
          className="text-xs h-8"
        >
          <CheckCircle2 className="size-3.5 me-1.5 text-accent" />
          {t('tasks.bulk.markComplete')}
        </Button>

        {/* Change status select */}
        <div className="flex items-center gap-1.5">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                void handleMoveStatus(e.target.value as TaskStatus);
              }
            }}
            aria-label={t('tasks.bulk.moveTo')}
            className="rounded-lg bg-surface border border-border/30 px-2.5 py-1.5 text-xs text-fg focus:outline-none focus:border-accent"
          >
            <option value="" disabled>
              {t('tasks.bulk.moveTo')}
            </option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {t(`tasks.statuses.${st}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Delete button */}
        <Button
          variant="danger"
          size="sm"
          onClick={() => void handleDelete()}
          className="text-xs h-8"
        >
          <Trash2 className="size-3.5 me-1.5" />
          {t('tasks.bulk.delete')}
        </Button>

        {/* Deselect button */}
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 text-muted hover:text-fg rounded-lg transition"
          title={t('tasks.bulk.clearSelection')}
        >
          <X className="size-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
