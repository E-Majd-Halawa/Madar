import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Send,
  MoreVertical,
  Archive,
  Trash2,
  Bell,
  Flag,
  MessageSquare,
  Paperclip,
  Mic2,
  Smile,
  Phone,
  Video,
  CheckCheck,
  ChevronLeft,
} from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useDirectoryStore } from '@/store/directoryStore';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Conversation, ChatMessage } from '@/types';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

const ICON_BTN =
  'grid size-9 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-fg/10 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50';

type ConvAction = 'archive' | 'delete' | 'mute' | 'pin';

const MENU_W = 176;
const MENU_H = 164;

/** Small popover menu rendered in a portal so no scroll container can clip it. UI only. */
function ActionMenu({
  onAction,
  className,
}: {
  onAction: (action: ConvAction) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setPos(null), []);

  const toggle = () => {
    if (pos) {
      close();
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const rtl = document.documentElement.dir === 'rtl';
    const rawLeft = rtl ? r.left : r.right - MENU_W;
    const left = Math.min(Math.max(8, rawLeft), window.innerWidth - MENU_W - 8);
    const below = r.bottom + 4;
    const top = below + MENU_H > window.innerHeight - 8 ? Math.max(8, r.top - MENU_H - 4) : below;
    setPos({ top, left });
  };

  useEffect(() => {
    if (!pos) return;
    const onDown = (e: MouseEvent) => {
      const n = e.target as Node;
      if (menuRef.current?.contains(n) || btnRef.current?.contains(n)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [pos, close]);

  const items: { action: ConvAction; label: string; icon: typeof Flag; danger?: boolean }[] = [
    { action: 'pin', label: t('messages.pin'), icon: Flag },
    { action: 'mute', label: t('messages.mute'), icon: Bell },
    { action: 'archive', label: t('messages.archive'), icon: Archive },
    { action: 'delete', label: t('messages.delete'), icon: Trash2, danger: true },
  ];

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={pos !== null}
        aria-label={t('common.more')}
        className={className}
      >
        <MoreVertical className="size-4" aria-hidden />
      </button>
      {pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: MENU_W }}
            className="glass z-50 rounded-xl p-1"
          >
            {items.map(({ action, label, icon: Icon, danger }) => (
              <button
                key={action}
                type="button"
                role="menuitem"
                onClick={() => {
                  onAction(action);
                  close();
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm transition-colors hover:bg-fg/10 focus-visible:bg-fg/10 focus-visible:outline-none',
                  danger ? 'text-danger' : 'text-fg',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  totalUnread,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  totalUnread: number;
}) {
  const { t, i18n } = useTranslation();
  const directory = useDirectoryStore((s) => s.byId);
  const me = useAuthStore((s) => s.session?.user);
  const [search, setSearch] = useState('');
  const isRtl = i18n.dir() === 'rtl';

  const filtered = conversations.filter((c) => {
    if (c.type === 'direct') {
      const other = c.participantIds.find((id) => id !== me?.id);
      const user = other ? directory[other] : null;
      return user?.fullName.toLowerCase().includes(search.toLowerCase());
    }
    return c.name?.toLowerCase().includes(search.toLowerCase());
  });

  // UI only: real archive/mute/pin/delete are not wired to the store yet.
  const handleConversationAction = (conversationId: string, action: ConvAction) => {
  };

  return (
    <aside
      className={cn(
        'h-full min-h-0 w-full flex-col border-e border-white/10 lg:w-80 lg:shrink-0',
        activeId ? 'hidden lg:flex' : 'flex',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-3">
        <h2 className="flex-1 text-base font-semibold text-fg">{t('messages.inbox')}</h2>
        {totalUnread > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent/15 px-1.5 text-[11px] font-semibold text-accent">
            {totalUnread}
          </span>
        )}
      </div>

      <div className="shrink-0 px-3 pb-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('messages.searchConversations')}
            aria-label={t('messages.searchConversations')}
            className="h-9 w-full rounded-xl border border-transparent bg-fg/5 ps-9 pe-3 text-sm text-fg placeholder:text-muted focus:border-accent/50 focus:outline-none"
          />
        </div>
      </div>

      <ScrollArea variant="hidden" className="min-h-0 flex-1 overflow-y-auto border-t border-white/10 p-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center px-6"
            >
              <EmptyState
                icon={MessageSquare}
                title={search ? t('messages.noResults') : t('messages.noConversations')}
                body={search ? t('messages.noResultsBody') : t('messages.noConversationsBody')}
              />
            </motion.div>
          ) : (
            <motion.ul
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0.5"
              role="list"
              aria-label={t('messages.conversations')}
            >
              {filtered.map((conv, index) => {
                const isActive = conv.id === activeId;
                const otherId = conv.participantIds.find((id) => id !== me?.id);
                const other = otherId ? directory[otherId] : null;
                const lastMsg = conv.lastMessage;
                const lastMsgTime = lastMsg ? new Date(lastMsg.createdAt).getTime() : 0;
                const time = lastMsg
                  ? format(new Date(lastMsg.createdAt), lastMsgTime > Date.now() - 86400000 ? 'HH:mm' : 'MMM d')
                  : '';
                const title = other?.fullName ?? conv.name ?? t('chat.unknown');

                return (
                  <motion.li
                    key={conv.id}
                    className="group relative"
                    initial={{ opacity: 0, x: isRtl ? 12 : -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(index, 8) * 0.02, duration: 0.15 }}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(conv.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                        isActive ? 'bg-accent/10' : 'hover:bg-fg/5',
                      )}
                    >
                      {isActive && (
                        <span
                          className="absolute inset-y-2.5 start-0 w-0.5 rounded-full bg-accent"
                          aria-hidden
                        />
                      )}

                      <div className="relative shrink-0">
                        <Avatar name={title} size="sm" />
                        {other && (
                          <span
                            className={cn(
                              'absolute bottom-0 end-0 size-2.5 rounded-full border-2 border-bg',
                              other.status === 'active' ? 'bg-success' : 'bg-muted',
                            )}
                            aria-hidden
                          />
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            dir="auto"
                            className={cn(
                              'truncate text-sm font-medium',
                              isActive ? 'text-accent' : 'text-fg',
                            )}
                          >
                            {title}
                          </span>
                          <span className="shrink-0 text-xs text-muted transition-opacity group-focus-within:opacity-0 group-hover:opacity-0">
                            {time}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1 text-xs text-muted">
                            {lastMsg ? (
                              <>
                                {lastMsg.senderId === me?.id && (
                                  <span className="shrink-0">{t('chat.you')}:</span>
                                )}
                                <span dir="auto" className="min-w-0 truncate">
                                  {lastMsg.content}
                                </span>
                              </>
                            ) : (
                              <span className="truncate">{t('chat.noMessagesYet')}</span>
                            )}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span
                              className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-fg"
                              aria-label={t('chat.unreadCount', { count: conv.unreadCount })}
                            >
                              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <ActionMenu
                      onAction={(action) => handleConversationAction(conv.id, action)}
                      className="absolute end-2 top-2 grid size-7 place-items-center rounded-lg text-muted opacity-0 transition-opacity hover:bg-fg/10 hover:text-fg focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                    />
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </ScrollArea>
    </aside>
  );
}

function MessageDetail({
  conversationId,
  messages,
  onSend,
  onLoadMore,
  onBack,
}: {
  conversationId: string | null;
  messages: ChatMessage[];
  onSend: (content: string) => void;
  onLoadMore: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.session?.user);
  const directory = useDirectoryStore((s) => s.byId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showLoadMore, setShowLoadMore] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setInput('');
    } finally {
      setSending(false);
    }
  };

  if (!conversationId) {
    return (
      <div className="hidden h-full min-h-0 min-w-0 flex-1 flex-col items-center justify-center px-6 text-center lg:flex">
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-fg/5">
          <MessageSquare className="size-7 text-accent" aria-hidden />
        </div>
        <h3 className="mb-1 text-base font-semibold text-fg">{t('messages.selectConversation')}</h3>
        <p className="max-w-xs text-sm text-muted">{t('messages.selectConversationBody')}</p>
      </div>
    );
  }

  const conversation = useChatStore.getState().conversations.find((c) => c.id === conversationId);
  const otherId = conversation?.participantIds.find((id) => id !== me?.id);
  const other = otherId ? directory[otherId] : null;
  const otherName = other?.fullName ?? t('chat.unknown');

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('common.back')}
          className={cn(ICON_BTN, 'lg:hidden')}
        >
          <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
        </button>
        <Avatar name={otherName} size="sm" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">
            <bdi>{otherName}</bdi>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className={cn('size-1.5 rounded-full', other?.status === 'active' ? 'bg-success' : 'bg-muted')}
              aria-hidden
            />
            {other?.status === 'active' ? t('chat.activeNow') : t('chat.offline')}
          </p>
        </div>
        <button type="button" className={ICON_BTN} aria-label={t('messages.call')}>
          <Phone className="size-4" aria-hidden />
        </button>
        <button type="button" className={ICON_BTN} aria-label={t('messages.videoCall')}>
          <Video className="size-4" aria-hidden />
        </button>
        <ActionMenu
          onAction={() => {}}
          className={ICON_BTN}
        />
      </header>

      <ScrollArea
        ref={scrollAreaRef}
        variant="hidden"
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-4"
        onScroll={() => {
          const el = scrollAreaRef.current;
          if (el && el.scrollTop === 0 && messages.length > 0) {
            setShowLoadMore(true);
          }
        }}
      >
        <div className="flex-1" aria-hidden="true" />

        {showLoadMore && (
          <div className="flex justify-center py-2">
            <button
              type="button"
              onClick={() => {
                onLoadMore();
                setShowLoadMore(false);
              }}
              className="rounded-full border border-white/10 bg-fg/5 px-3 py-1.5 text-xs text-muted transition-colors hover:text-fg"
            >
              {t('chat.loadMore')}
            </button>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMine = msg.senderId === me?.id;
          const sender = isMine ? undefined : directory[msg.senderId];
          const time = format(new Date(msg.createdAt), 'HH:mm');
          const prevMsg = messages[index - 1];
          const nextMsg = messages[index + 1];
          const startsGroup = index === 0 || prevMsg?.senderId !== msg.senderId;
          const endsGroup = index === messages.length - 1 || nextMsg?.senderId !== msg.senderId;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'flex max-w-[85%] items-end gap-2 sm:max-w-[70%]',
                isMine ? 'ms-auto' : 'me-auto',
                startsGroup && index > 0 && 'mt-3',
              )}
            >
              {!isMine &&
                (endsGroup ? (
                  <Avatar
                    name={sender?.fullName ?? t('chat.unknown')}
                    size="sm"
                    className="shrink-0"
                  />
                ) : (
                  <div className="size-8 shrink-0" aria-hidden />
                ))}

              <div className={cn('flex min-w-0 flex-col gap-0.5', isMine ? 'items-end' : 'items-start')}>
                {!isMine && startsGroup && (
                  <span className="px-1 text-xs text-muted">{sender?.fullName ?? t('chat.unknown')}</span>
                )}

                <div
                  dir="auto"
                  className={cn(
                    'whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    isMine ? 'bg-accent text-accent-fg' : 'bg-fg/[0.07] text-fg',
                    endsGroup && (isMine ? 'rounded-ee-md' : 'rounded-es-md'),
                  )}
                >
                  {msg.content}
                </div>

                {endsGroup && (
                  <div className="flex items-center gap-1.5 px-1 text-xs text-muted">
                    <span>{time}</span>
                    {isMine && msg.read && (
                      <CheckCheck className="size-3.5 text-accent" aria-label={t('chat.read')} />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        <div ref={messagesEndRef} />
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-1.5 border-t border-white/10 p-3"
      >
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          aria-pressed={showEmoji}
          aria-label={t('chat.emoji')}
          className={ICON_BTN}
        >
          <Smile className="size-5" aria-hidden />
        </button>
        <button type="button" aria-label={t('chat.attach')} className={ICON_BTN}>
          <Paperclip className="size-5" aria-hidden />
        </button>
        <button type="button" aria-label={t('chat.voice')} className={ICON_BTN}>
          <Mic2 className="size-5" aria-hidden />
        </button>

        <input
          type="text"
          dir="auto"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat.messagePlaceholder')}
          aria-label={t('chat.messagePlaceholder')}
          disabled={sending}
          autoComplete="off"
          className="h-10 min-w-0 flex-1 rounded-xl border border-transparent bg-fg/5 px-3 text-sm text-fg placeholder:text-muted focus:border-accent/50 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label={t('chat.send')}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-40"
        >
          <Send className="size-4 rtl:-scale-x-100" aria-hidden />
        </button>
      </form>
    </div>
  );
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const {
    conversations,
    messages,
    activeConversationId,
    loadConversations,
    loadMessages,
    sendMessage,
    setActiveConversation,
    markAsRead,
  } = useChatStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
      markAsRead(activeConversationId);
    }
  }, [activeConversationId, loadMessages, markAsRead]);

  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="relative flex h-[calc(100dvh-12rem)] min-h-[480px] flex-col gap-3 bg-ambient lg:h-[calc(100dvh-7.5rem)]">
      <header className="flex shrink-0 items-center gap-2.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent/15">
          <MessageSquare className="size-4 text-accent" aria-hidden />
        </div>
        <h1 className="truncate text-lg font-semibold tracking-tight text-fg">{t('nav.messages')}</h1>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-fg/[0.03]">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={setActiveConversation}
          totalUnread={totalUnread}
        />
        <MessageDetail
          conversationId={activeConversationId}
          messages={currentMessages}
          onSend={(content) => sendMessage(activeConversationId!, content)}
          onLoadMore={() => {}}
          onBack={() => setActiveConversation(null)}
        />
      </div>
    </div>
  );
}