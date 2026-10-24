import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, Lock, Plus, Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Channel } from '@/types';

const ICON_BTN =
  'grid size-9 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-fg/10 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50';

export function ChannelSidebar({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  canCreate,
}: {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  onCreateChannel: () => void;
  canCreate: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => channels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())),
    [channels, search],
  );

  return (
    <aside className="flex h-full min-h-0 w-72 shrink-0 flex-col border-e border-white/10">
      <div className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-3">
        <h2 className="flex-1 text-base font-semibold text-fg">{t('chat.channels')}</h2>
        {canCreate && (
          <button
            type="button"
            onClick={onCreateChannel}
            aria-label={t('chat.newChannel')}
            className={ICON_BTN}
          >
            <Plus className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="shrink-0 px-3 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('chat.searchChannels')}
            aria-label={t('chat.searchChannels')}
            className="h-9 w-full rounded-xl border border-transparent bg-fg/5 ps-9 pe-3 text-sm text-fg placeholder:text-muted focus:border-accent/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/10 p-2">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">{t('chat.noChannels')}</div>
        ) : (
          <ul className="space-y-0.5" role="list" aria-label={t('chat.channels')}>
            {filtered.map((channel) => {
              const isActive = channel.id === activeChannelId;
              const isReadOnly = channel.kind === 'announcements';
              return (
                <li key={channel.id}>
                  <button
                    type="button"
                    onClick={() => onSelectChannel(channel.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                      isActive ? 'bg-accent/10' : 'hover:bg-fg/5',
                    )}
                  >
                    {isActive && (
                      <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-accent" aria-hidden />
                    )}
                    <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-fg/5 text-muted">
                      {isReadOnly ? <Lock className="size-3.5" aria-hidden /> : <Hash className="size-3.5" aria-hidden />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        <bdi>{channel.name}</bdi>
                      </p>
                      <p className="truncate text-xs text-muted">{channel.description}</p>
                    </div>
                    {(channel.unreadCount ?? 0) > 0 && (
                      <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-fg">
                        {channel.unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
