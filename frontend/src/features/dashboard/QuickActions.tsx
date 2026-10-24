import { CalendarDays, FolderPlus, MessageCircle, Plus, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useUiStore } from '@/store/uiStore';

const tile = 'glass flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition hover:-translate-y-0.5 hover:border-accent/40';

export function QuickActions() {
  const { t } = useTranslation();
  const setTaskModal = useUiStore((s) => s.setTaskModal);
  const links = [
    { to: ROUTES.app.projects, icon: FolderPlus, label: t('dashboard.quick.newProject') },
    { to: ROUTES.app.focus, icon: Timer, label: t('dashboard.quick.focus') },
    { to: ROUTES.app.calendar, icon: CalendarDays, label: t('dashboard.quick.calendar') },
    { to: ROUTES.app.chat, icon: MessageCircle, label: t('dashboard.quick.chat') },
  ];
  return (
    <div className="flex flex-wrap gap-2.5">
      <button type="button" onClick={() => setTaskModal(true)} className={`${tile} bg-accent/15 text-accent`}>
        <Plus className="size-4" aria-hidden />
        {t('dashboard.quick.newTask')}
      </button>
      {links.map(({ to, icon: Icon, label }) => (
        <Link key={to} to={to} className={tile}>
          <Icon className="size-4 text-accent" aria-hidden />
          {label}
        </Link>
      ))}
    </div>
  );
}
