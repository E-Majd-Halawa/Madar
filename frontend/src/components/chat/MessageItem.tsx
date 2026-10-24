import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Smile } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils/cn';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import type { ChannelMessage } from '@/types';
import { useDirectoryStore } from '@/store/directoryStore';
import { useAuthStore } from '@/store/authStore';

const ICON_BTN =
  'grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-fg/10 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50';

export function MessageItem({
  message,
  prevMessage,
  onOpenThread,
  onToggleReaction,
}: {
  message: ChannelMessage;
  prevMessage?: ChannelMessage;
  onOpenThread?: (rootMessageId: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
}) {
  const { t } = useTranslation();
  const directory = useDirectoryStore((s) => s.byId);
  const me = useAuthStore((s) => s.session?.user);

  const sender = directory[message.senderId];
  const senderName = sender?.fullName ?? t('chat.unknown');
  const time = message.createdAt ? format(parseISO(message.createdAt), 'HH:mm') : '';

  const isConsecutive =
    prevMessage &&
    prevMessage.senderId === message.senderId &&
    !message.threadRootId &&
    !prevMessage.threadRootId &&
    Math.abs(differenceInMinutes(parseISO(message.createdAt), parseISO(prevMessage.createdAt))) < 5;

  const isDeleted = !!message.deletedAt;

  return (
    <div className={cn('group relative flex gap-3 px-4 py-2 hover:bg-fg/5 transition-colors')}>
      <div className="shrink-0 w-9 pt-0.5">
        {!isConsecutive ? (
          <Avatar name={senderName} size="sm" />
        ) : (
          <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100">{time}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {!isConsecutive && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-fg">
              <bdi>{senderName}</bdi>
            </span>
            <span className="text-xs text-muted">{time}</span>
          </div>
        )}

        {isDeleted ? (
          <p className="text-sm italic text-muted">{t('chat.deletedMessage')}</p>
        ) : (
          <div>
            <p className="text-sm text-fg whitespace-pre-wrap break-words" dir="auto">
              {message.content}
            </p>
            {message.editedAt && (
              <span className="ms-1 text-[10px] text-muted">{t('chat.edited')}</span>
            )}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {Object.entries(message.reactions).map(([emoji, userIds]) => {
              const hasReacted = me ? userIds.includes(me.id) : false;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onToggleReaction?.(message.id, emoji)}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                    hasReacted
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-white/10 bg-fg/[0.03] text-muted hover:border-white/20 hover:text-fg',
                  )}
                >
                  <span>{emoji}</span>
                  <span className="font-medium">{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread replies preview button */}
        {!message.threadRootId && (message.replyCount ?? 0) > 0 && onOpenThread && (
          <button
            type="button"
            onClick={() => onOpenThread(message.id)}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            <MessageSquare className="size-3.5" aria-hidden />
            <span>{t('chat.replies', { count: message.replyCount })}</span>
          </button>
        )}
      </div>

      {/* Hover toolbar */}
      <div className="absolute end-4 top-2 hidden items-center gap-1 rounded-xl border border-white/10 bg-bg p-1 shadow-sm group-hover:flex">
        <button
          type="button"
          onClick={() => onToggleReaction?.(message.id, '👍')}
          aria-label={t('chat.addReaction')}
          className={ICON_BTN}
        >
          <Smile className="size-4" aria-hidden />
        </button>
        {!message.threadRootId && onOpenThread && (
          <button
            type="button"
            onClick={() => onOpenThread(message.id)}
            aria-label={t('chat.replyInThread')}
            className={ICON_BTN}
          >
            <MessageSquare className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
