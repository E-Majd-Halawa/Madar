import { useTranslation } from 'react-i18next';
import { KanbanBoard } from '@/features/tasks/kanban/KanbanBoard';

export default function KanbanPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">
          {t('tasks.kanban.title')}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {t('tasks.kanban.subtitle')}
        </p>
      </header>

      <KanbanBoard />
    </div>
  );
}
