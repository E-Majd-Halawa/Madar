import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useNotificationStore, selectUnreadCount } from '@/store/notificationStore';
import { cn } from '@/utils/cn';
import { format, parseISO } from 'date-fns';

export function NotificationPopover() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore(selectUnreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const toggle = () => {
    if (open) {
      setOpen(false);
    } else {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        const width = 360;
        const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
        const top = rect.bottom + 6;
        setPos({ top, left });
      }
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const latest = items.slice(0, 6);

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unread ? `${t('nav.notifications')} (${unread})` : t('nav.notifications')}
        className="relative grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <Bell className="size-[18px]" aria-hidden />
        {unread > 0 && <span className="absolute end-1 top-1 size-2 rounded-full bg-accent ring-2 ring-bg" />}
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={popoverRef}
            role="menu"
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: 360 }}
            className="glass z-50 rounded-2xl border border-white/10 p-3 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-semibold text-fg">{t('nav.notifications')}</h3>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              {latest.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">{t('notifications.empty')}</div>
              ) : (
                <div className="space-y-1">
                  {latest.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'flex items-start gap-3 rounded-xl p-2.5 transition-colors',
                        !n.read ? 'bg-accent/5' : 'hover:bg-fg/5',
                      )}
                    >
                      <div className="mt-0.5 size-2 shrink-0 rounded-full bg-accent opacity-0 data-[unread=true]:opacity-100" data-unread={!n.read} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-fg">
                          <bdi>{n.title}</bdi>
                        </p>
                        {n.body && <p className="mt-0.5 truncate text-[11px] text-muted">{n.body}</p>}
                        <span className="mt-1 block text-[10px] text-muted">
                          {format(parseISO(n.createdAt), 'HH:mm')}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => void markRead(n.id, true)}
                            aria-label={t('notifications.markRead')}
                            className="grid size-7 place-items-center rounded-lg text-muted hover:bg-fg/10 hover:text-fg"
                          >
                            <CheckCheck className="size-3.5" aria-hidden />
                          </button>
                        )}
                        {n.href && (
                          <Link
                            to={n.href}
                            onClick={() => {
                              markRead(n.id, true);
                              setOpen(false);
                            }}
                            aria-label={t('common.view')}
                            className="grid size-7 place-items-center rounded-lg text-muted hover:bg-fg/10 hover:text-fg"
                          >
                            <ExternalLink className="size-3.5" aria-hidden />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-2 text-center">
              <Link
                to={ROUTES.app.notifications}
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-accent hover:underline"
              >
                {t('notifications.viewAll')}
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
