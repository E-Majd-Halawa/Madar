import React from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, Lock, Users } from 'lucide-react';
import type { Channel } from '@/types';

export function ChannelHeader({ channel }: { channel: Channel }) {
  const { t } = useTranslation();
  const isReadOnly = channel.kind === 'announcements';

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-fg/5 text-muted">
          {isReadOnly ? <Lock className="size-4" aria-hidden /> : <Hash className="size-4" aria-hidden />}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-fg">
            <bdi>{channel.name}</bdi>
          </h3>
          <p className="truncate text-xs text-muted">{channel.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted">
        <Users className="size-4" aria-hidden />
        <span>{t('chat.members', { count: 30 })}</span>
      </div>
    </div>
  );
}
