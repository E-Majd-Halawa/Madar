import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { MOBILE_NAV } from '@/constants/navigation';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

const tab = ({ isActive }: { isActive: boolean }) =>
  cn('flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition w-full', isActive ? 'text-accent font-medium' : 'text-muted');

/** Phone navigation: Home, Tasks, quick add, Calendar, Chat (symmetric 5-column grid). */
export function MobileNav() {
  const { t } = useTranslation();
  const setTaskModal = useUiStore((s) => s.setTaskModal);
  const [home, tasks, calendar, chat] = MOBILE_NAV;
  const link = (item: (typeof MOBILE_NAV)[number]) => (
    <NavLink key={item.to} to={item.to} className={tab}>
      <item.icon className="size-5 shrink-0" aria-hidden />
      <span className="truncate max-w-full">{t(item.labelKey)}</span>
    </NavLink>
  );

  return (
    <nav
      aria-label={t('nav.mobile')}
      className="glass fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-center rounded-none border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden h-16 px-2"
    >
      {link(home)}
      {link(tasks)}
      <div className="flex items-center justify-center col-start-3">
        <button
          type="button"
          onClick={() => setTaskModal(true)}
          aria-label={t('tasks.new')}
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-fg shadow-glow transition active:scale-95"
        >
          <Plus className="size-6" aria-hidden />
        </button>
      </div>
      {link(calendar)}
      {link(chat)}
    </nav>
  );
}
