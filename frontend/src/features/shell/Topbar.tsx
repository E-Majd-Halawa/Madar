import { Bell, Menu, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HeaderControls } from '@/components/layout/HeaderControls';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { selectUnreadCount, useNotificationStore } from '@/store/notificationStore';
import { useUiStore } from '@/store/uiStore';
import { NotificationPopover } from '@/features/notifications/NotificationPopover';

export function Topbar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.session?.user);
  const unread = useNotificationStore(selectUnreadCount);
  const { setTaskModal, setMobileMenu, setCommandPalette } = useUiStore();

  return (
    <header className="glass sticky top-0 z-20 flex h-14 items-center gap-2 rounded-none border-x-0 border-t-0 px-3 sm:px-5">
      <button
        type="button"
        onClick={() => setMobileMenu(true)}
        aria-label={t('common.menu')}
        className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* Search bar — clicking opens command palette */}
      <button
        type="button"
        id="topbar-search-btn"
        onClick={() => setCommandPalette(true)}
        aria-label={t('shell.searchPlaceholder')}
        className="flex h-9 min-w-0 max-w-md flex-1 items-center gap-2 rounded-xl border bg-surface-2/50 px-3 text-start text-sm text-muted transition hover:border-border/30 hover:bg-surface-2"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{t('shell.searchPlaceholder')}</span>
        <kbd className="ms-auto hidden rounded border px-1.5 text-[11px] sm:block" dir="ltr">
          Ctrl K
        </kbd>
      </button>

      <div className="ms-auto flex items-center gap-1">
        <Button variant="primary" size="sm" onClick={() => setTaskModal(true)} className="hidden sm:inline-flex">
          <Plus className="size-4" aria-hidden />
          {t('tasks.new')}
        </Button>
        <HeaderControls />
        <NotificationPopover />
        {user && (
          <Link to={ROUTES.app.profile} aria-label={t('shell.account')} className="ms-1 rounded-full">
            <Avatar name={user.fullName} />
          </Link>
        )}
      </div>
    </header>
  );
}
