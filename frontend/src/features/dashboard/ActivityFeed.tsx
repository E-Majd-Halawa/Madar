import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { useDirectoryStore } from '@/store/directoryStore';
import type { ActivityEvent } from '@/types';

export function ActivityFeed({ events, emptyKey, limit = 6 }: { events: ActivityEvent[]; emptyKey: string; limit?: number }) {
  const { t, i18n } = useTranslation();
  const users = useDirectoryStore((s) => s.byId);
  const locale = i18n.language === 'ar' ? ar : enUS;

  if (!events.length) return <p className="py-4 text-sm text-muted">{t(emptyKey)}</p>;
  return (
    <ul className="space-y-3">
      {events.slice(0, limit).map((e) => {
        const name = users[e.actorId]?.fullName ?? '…';
        return (
          <li key={e.id} className="flex items-start gap-3">
            <Avatar name={name} size="sm" />
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-medium">{name}</span> <span className="text-muted">{t(`activity.${e.action}`)}</span>{' '}
              <span className="font-medium">{e.targetName}</span>
              <span className="block text-xs text-muted">{formatDistanceToNow(new Date(e.createdAt), { addSuffix: true, locale })}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
