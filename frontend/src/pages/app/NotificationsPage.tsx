import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, Trash2, Filter, Settings, Check, AlertCircle, Calendar, MessageSquare, AtSign, FolderGit2, UserPlus, Shield, Info, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore, selectUnreadCount } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import type { AppNotification, NotificationType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const typeIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  task_assigned: Check,
  task_completed: CheckCheck,
  deadline: Calendar,
  mention: AtSign,
  message: MessageSquare,
  project_update: FolderGit2,
  invitation: UserPlus,
  role_change: Shield,
  security: AlertCircle,
  system: Info,
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore(selectUnreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const remove = useNotificationStore((s) => s.remove);
  const pushNotification = useNotificationStore((s) => s.pushNotification);
  const user = useAuthStore((s) => s.session?.user);
  const toast = useToastStore();

  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (tab === 'unread' && n.read) return false;
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      return true;
    });
  }, [items, tab, typeFilter]);

  const grouped = useMemo(() => {
    const today: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    filtered.forEach((n) => {
      const date = parseISO(n.createdAt);
      if (isToday(date)) today.push(n);
      else if (isYesterday(date)) yesterday.push(n);
      else earlier.push(n);
    });

    return { today, yesterday, earlier };
  }, [filtered]);

  const handleDelete = async (n: AppNotification) => {
    await remove(n.id);
    toast.push({
      tone: 'info',
      message: t('notifications.deleted'),
      actionLabel: t('common.undo'),
      onAction: () => {
        if (user) {
          void pushNotification({
            userId: user.id,
            type: n.type,
            title: n.title,
            body: n.body,
            href: n.href,
          });
        }
      },
    });
  };

  const handleClearRead = async () => {
    const readIds = items.filter((n) => n.read).map((n) => n.id);
    for (const id of readIds) {
      await remove(id);
    }
    setClearModalOpen(false);
    toast.push({ tone: 'success', message: t('notifications.clearedRead') });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <Bell className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-fg">{t('nav.notifications')}</h1>
            <p className="text-sm text-muted">{t('notifications.subtitle', { count: unread })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPrefsOpen(true)}>
            <Settings className="size-4" aria-hidden />
            {t('notifications.preferences')}
          </Button>
          {unread > 0 && (
            <Button variant="secondary" size="sm" onClick={() => void markAllRead()}>
              <CheckCheck className="size-4" aria-hidden />
              {t('notifications.markAllRead')}
            </Button>
          )}
          {items.some((n) => n.read) && (
            <Button variant="ghost" size="sm" onClick={() => setClearModalOpen(true)}>
              <Trash2 className="size-4" aria-hidden />
              {t('notifications.clearRead')}
            </Button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-fg/[0.03] p-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('all')}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
              tab === 'all' ? 'bg-accent text-accent-fg' : 'text-muted hover:bg-fg/5 hover:text-fg',
            )}
          >
            {t('notifications.all')} ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('unread')}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
              tab === 'unread' ? 'bg-accent text-accent-fg' : 'text-muted hover:bg-fg/5 hover:text-fg',
            )}
          >
            {t('notifications.unread')} ({unread})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted" aria-hidden />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
            aria-label={t('notifications.filterByType')}
            className="h-8 rounded-xl border border-white/10 bg-bg px-2.5 text-xs text-fg focus:outline-none"
          >
            <option value="all">{t('notifications.allTypes')}</option>
            <option value="task_assigned">{t('notifications.types.task_assigned')}</option>
            <option value="task_completed">{t('notifications.types.task_completed')}</option>
            <option value="deadline">{t('notifications.types.deadline')}</option>
            <option value="mention">{t('notifications.types.mention')}</option>
            <option value="message">{t('notifications.types.message')}</option>
            <option value="project_update">{t('notifications.types.project_update')}</option>
            <option value="invitation">{t('notifications.types.invitation')}</option>
            <option value="role_change">{t('notifications.types.role_change')}</option>
            <option value="security">{t('notifications.types.security')}</option>
            <option value="system">{t('notifications.types.system')}</option>
          </select>
        </div>
      </div>

      <ScrollArea variant="hidden" className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-fg/[0.03] p-4">
        {filtered.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <EmptyState
              icon={Bell}
              title={items.length === 0 ? t('notifications.empty') : t('notifications.noResults')}
              body={items.length === 0 ? t('notifications.emptyBody') : t('notifications.noResultsBody')}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {(['today', 'yesterday', 'earlier'] as const).map((groupKey) => {
              const groupItems = grouped[groupKey];
              if (groupItems.length === 0) return null;
              const groupLabel = t(`notifications.groups.${groupKey}`);

              return (
                <div key={groupKey} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{groupLabel}</h3>
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {groupItems.map((n, index) => {
                        const Icon = typeIcons[n.type] || Info;
                        return (
                          <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ delay: Math.min(index, 10) * 0.02, duration: 0.15 }}
                            className={cn(
                              'group relative flex items-start gap-4 rounded-2xl border p-4 transition-colors',
                              !n.read ? 'border-accent/30 bg-accent/5' : 'border-white/10 bg-bg hover:border-white/20',
                            )}
                          >
                            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-fg/5 text-muted">
                              <Icon className="size-5" aria-hidden />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-fg">
                                  <bdi>{n.title}</bdi>
                                </h4>
                                {!n.read && <span className="size-2 rounded-full bg-accent" aria-hidden />}
                              </div>
                              {n.body && <p className="mt-1 text-xs text-muted">{n.body}</p>}
                              <span className="mt-2 block text-[11px] text-muted">
                                {format(parseISO(n.createdAt), 'PPpp')}
                              </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-2 opacity-80 group-hover:opacity-100">
                              {!n.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void markRead(n.id, true)}
                                  aria-label={t('notifications.markRead')}
                                >
                                  <CheckCheck className="size-4" aria-hidden />
                                </Button>
                              )}
                              {n.href && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    void markRead(n.id, true);
                                    navigate(n.href!);
                                  }}
                                  aria-label={t('common.view')}
                                >
                                  <ArrowUpRight className="size-4" aria-hidden />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void handleDelete(n)}
                                aria-label={t('common.delete')}
                                className="text-danger hover:bg-danger/10"
                              >
                                <Trash2 className="size-4" aria-hidden />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Clear read confirmation modal */}
      <Modal
        open={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title={t('notifications.confirmClearRead')}
        description={t('notifications.confirmClearReadBody')}
      >
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setClearModalOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={() => void handleClearRead()} className="bg-danger text-danger-fg">
            {t('common.delete')}
          </Button>
        </div>
      </Modal>

      {/* Preferences modal */}
      <Modal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        title={t('notifications.preferencesTitle')}
        description={t('notifications.preferencesSubtitle')}
      >
        <div className="space-y-4 py-2 text-sm">
          <p className="text-muted">{t('notifications.preferencesHint')}</p>
          <div className="flex items-center justify-between rounded-xl border border-white/10 p-3">
            <div>
              <p className="font-medium text-fg">{t('notifications.emailAlerts')}</p>
              <p className="text-xs text-muted">{t('notifications.emailAlertsHint')}</p>
            </div>
            <input type="checkbox" defaultChecked className="size-4 rounded accent-accent" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 p-3">
            <div>
              <p className="font-medium text-fg">{t('notifications.pushAlerts')}</p>
              <p className="text-xs text-muted">{t('notifications.pushAlertsHint')}</p>
            </div>
            <input type="checkbox" className="size-4 rounded accent-accent" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={() => setPrefsOpen(false)}>
              {t('common.done')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
