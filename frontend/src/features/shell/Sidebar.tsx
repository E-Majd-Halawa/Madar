import { HelpCircle, LogOut, Settings, Shield, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { PRIMARY_NAV, type NavItem } from '@/constants/navigation';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { selectUnreadCount, useNotificationStore } from '@/store/notificationStore';
import { hasRole } from '@/utils/permissions';
import { cn } from '@/utils/cn';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

export const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
    isActive ? 'bg-accent/12 font-medium text-accent shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.25)]' : 'text-muted hover:bg-surface-2 hover:text-fg',
  );

function Item({ item, badge }: { item: NavItem; badge?: number }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  return (
    <NavLink to={item.to} className={navLinkClass}>
      <Icon className="size-[18px] shrink-0" aria-hidden />
      <span className="flex-1 truncate">{t(item.labelKey)}</span>
      {!!badge && <span className="rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-fg">{badge}</span>}
    </NavLink>
  );
}

/** Desktop sidebar content; also rendered inside the mobile drawer. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const session = useAuthStore((s) => s.session);
  const showAdmin = session && !session.isDemo && hasRole(session.user.role, 'moderator');
  const unread = useNotificationStore(selectUnreadCount);

  const bottom: NavItem[] = [
    ...(showAdmin ? [{ to: ROUTES.admin.root, labelKey: 'nav.admin', icon: Shield }] : []),
    { to: ROUTES.app.profile, labelKey: 'nav.profile', icon: User },
    { to: ROUTES.app.settings, labelKey: 'nav.settings', icon: Settings },
  ];

  return (
    <div className="flex h-full flex-col gap-4 p-4" onClick={(e) => (e.target as HTMLElement).closest('a') && onNavigate?.()}>
      <Link to={ROUTES.app.dashboard} aria-label={t('brand.homeLabel', { brand: t('app.name') })} className="px-1 text-lg font-semibold tracking-tight block hover:text-accent transition">
        {t('app.name')}
      </Link>
      <WorkspaceSwitcher />
      <nav aria-label={t('nav.primary')} className="-mx-1 flex-1 space-y-0.5 overflow-y-auto px-1">
        {PRIMARY_NAV.map((item) => (
          <Item key={item.to} item={item} badge={item.to === ROUTES.app.notifications ? unread : undefined} />
        ))}
      </nav>
      <div className="space-y-0.5 border-t pt-3">
        {bottom.map((item) => (
          <Item key={item.to} item={item} />
        ))}
        <a href="/#features" className={navLinkClass({ isActive: false })}>
          <HelpCircle className="size-[18px]" aria-hidden />
          {t('nav.help')}
        </a>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate(ROUTES.home, { replace: true });
          }}
          className={cn(navLinkClass({ isActive: false }), 'w-full')}
        >
          <LogOut className="size-[18px]" aria-hidden />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="glass sticky top-0 hidden h-dvh w-64 shrink-0 rounded-none border-y-0 border-s-0 lg:block">
      <SidebarContent />
    </aside>
  );
}
