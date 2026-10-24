import { FolderPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ROUTES } from '@/constants/routes';
import type { Project, Task } from '@/types';

export function ActiveProjects({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  const { t } = useTranslation();
  const active = projects.filter((p) => p.status === 'active' || p.status === 'planning').slice(0, 4);

  if (!active.length) {
    return (
      <EmptyState
        icon={FolderPlus}
        title={t('dashboard.empty.projects')}
        action={<ButtonLink to={ROUTES.app.projects} variant="primary" size="sm">{t('dashboard.quick.newProject')}</ButtonLink>}
      />
    );
  }

  return (
    <ul className="space-y-4">
      {active.map((p) => {
        const own = tasks.filter((task) => task.projectId === p.id && task.status !== 'archived');
        const done = own.filter((task) => task.status === 'completed').length;
        const pct = own.length ? (done / own.length) * 100 : 0;
        return (
          <li key={p.id}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Link to={`/app/projects/${p.id}`} className="flex min-w-0 items-center gap-2 text-sm font-medium hover:text-accent">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                <span className="truncate">{p.name}</span>
              </Link>
              <Badge tone={p.status === 'active' ? 'accent' : 'neutral'}>{t(`projects.statuses.${p.status}`)}</Badge>
            </div>
            <ProgressBar value={pct} label={p.name} color={p.color} />
            <p className="mt-1 text-xs text-muted">{t('dashboard.tasksCount', { done, total: own.length })}</p>
          </li>
        );
      })}
    </ul>
  );
}
