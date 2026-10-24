import { Plus, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { MOBILE_NAV } from '@/constants/navigation';
import { ROUTES } from '@/constants/routes';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

const tab = ({ isActive }: { isActive: boolean }) =>
  cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition', isActive ? 'text-accent' : 'text-muted');

/** Phone navigation: Home, Tasks, quick add, Calendar, Chat, Profile. */
export function MobileNav() {
  const { t } = useTranslation();
  const setTaskModal = useUiStore((s) => s.setTaskModal);
  const [home, tasks, calendar, chat] = MOBILE_NAV;
  const link = (item: (typeof MOBILE_NAV)[number]) => (
    <NavLink key={item.to} to={item.to} className={tab}>
      <item.icon className="size-5" aria-hidden />
      {t(item.labelKey)}
    </NavLink>
  );

  return (
    <nav
      aria-label={t('nav.mobile')}
      className="glass fixed inset-x-0 bottom-0 z-30 flex items-center rounded-none border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {link(home)}
      {link(tasks)}
      <button
        type="button"
        onClick={() => setTaskModal(true)}
        aria-label={t('tasks.new')}
        className="-mt-5 grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-fg shadow-glow transition active:scale-95"
      >
        <Plus className="size-6" aria-hidden />
      </button>
      {link(calendar)}
      {link(chat)}
      <NavLink to={ROUTES.app.profile} className={tab}>
        <User className="size-5" aria-hidden />
        {t('nav.profile')}
      </NavLink>
    </nav>
  );
}
