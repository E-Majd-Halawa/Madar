import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { ChannelSidebar } from '@/components/chat/ChannelSidebar';
import { ChannelHeader } from '@/components/chat/ChannelHeader';
import { MessageList } from '@/components/chat/MessageList';
import { Composer } from '@/components/chat/Composer';
import { EmptyState } from '@/components/ui/EmptyState';
import { hasPermission } from '@/utils/permissions';
import { useDirectoryStore } from '@/store/directoryStore';
import { cn } from '@/utils/cn';

export default function ChatPage() {
  const { t } = useTranslation();
  const channels = useChatStore((s) => s.channels);
  const activeChannelId = useChatStore((s) => s.activeChannelId);
  const loadChannels = useChatStore((s) => s.loadChannels);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);
  const channelMessages = useChatStore((s) => s.channelMessages);
  const sendChannelMessage = useChatStore((s) => s.sendChannelMessage);
  const toggleReaction = useChatStore((s) => s.toggleReaction);
  const openThread = useChatStore((s) => s.openThread);
  const typingUsers = useChatStore((s) => s.typingUsers);

  const role = useAuthStore((s) => s.session?.user?.role) ?? 'user';
  const directory = useDirectoryStore((s) => s.byId);
  const canCreate = hasPermission(role, 'chat:create_channel');

  // Mobile shows one pane at a time (like Telegram); desktop shows both.
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      setActiveChannel(channels[0].id);
    }
  }, [channels, activeChannelId, setActiveChannel]);

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const messages = activeChannelId ? channelMessages[activeChannelId] || [] : [];
  const channelTyping = activeChannelId ? typingUsers[activeChannelId] || [] : [];

  const typingNames = channelTyping.map((id) => directory[id]?.fullName).filter(Boolean);

  const isAnnouncementReadOnly = activeChannel?.kind === 'announcements' && role === 'user';

  const handleSend = async (content: string) => {
    if (!activeChannelId) return;
    await sendChannelMessage(activeChannelId, content);
  };

  const handleSelectChannel = (id: string) => {
    setActiveChannel(id);
    setMobileView('chat');
  };

  return (
    <div
      className={cn(
        'group/chat relative flex h-[calc(100dvh-8.5rem)] min-h-[480px] overflow-hidden rounded-2xl',
        'border border-border/20 bg-surface/70 backdrop-blur-xl',
        'shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] transition-shadow duration-500',
        'hover:shadow-glow lg:h-[calc(100dvh-6rem)]',
      )}
    >
      {/* Conversations column */}
      <aside
        aria-label={t('chat.channels')}
        className={cn(
          'relative z-10 flex min-h-0 w-full shrink-0 flex-col border-e border-border/20 bg-surface-2/40',
          'lg:w-[340px]',
          mobileView === 'chat' ? 'hidden lg:flex' : 'flex',
          // let the existing sidebar fill this column whatever width it sets internally
          '[&>*]:!w-full [&>*]:!max-w-none [&>*]:!border-0 [&>*]:flex-1',
        )}
      >
        <ChannelSidebar
          channels={channels}
          activeChannelId={activeChannelId}
          onSelectChannel={handleSelectChannel}
          onCreateChannel={() => {}}
          canCreate={canCreate}
        />
      </aside>

      {/* Conversation pane */}
      <section
        className={cn(
          'relative flex min-w-0 flex-1 flex-col overflow-hidden bg-bg',
          mobileView === 'list' ? 'hidden lg:flex' : 'flex',
        )}
      >
        {/* Ambient wallpaper: soft accent light, no images, follows theme */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 start-1/4 size-72 rounded-full bg-accent/[0.07] blur-3xl" />
          <div className="absolute -bottom-32 end-0 size-80 rounded-full bg-accent/[0.05] blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg/60" />
        </div>

        {activeChannel ? (
          <>
            <div className="relative z-10 flex items-center border-b border-border/20 bg-surface/60 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setMobileView('list')}
                aria-label={t('common.back')}
                className={cn(
                  'ms-2 grid size-9 shrink-0 place-items-center rounded-xl text-muted transition-colors lg:hidden',
                  'hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                )}
              >
                <ArrowLeft className="size-5 rtl:rotate-180" aria-hidden />
              </button>
              <div className="min-w-0 flex-1">
                <ChannelHeader channel={activeChannel} />
              </div>
            </div>

            <div
              className={cn(
                'relative z-10 flex min-h-0 flex-1 flex-col',
                // gentle hover lift/glow on each message row, without touching MessageList internals
                '[&_[data-message]]:transition-[background-color,box-shadow] [&_[data-message]]:duration-200',
                '[&_[data-message]:hover]:bg-accent/[0.06] [&_[data-message]:hover]:shadow-[inset_0_0_0_1px_rgb(var(--accent,16_185_129)/0.18)]',
              )}
            >
              <MessageList
                messages={messages}
                onOpenThread={(rootId: string) => openThread(activeChannel.id, rootId)}
                onToggleReaction={(msgId: string, emoji: string) =>
                  toggleReaction(activeChannel.id, msgId, emoji)
                }
              />
            </div>

            {typingNames.length > 0 && (
              <div aria-live="polite" className="relative z-10 px-4 pb-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/20 bg-surface-2/70 px-3 py-1 text-xs text-muted backdrop-blur">
                  <span className="flex gap-0.5" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="size-1 animate-bounce rounded-full bg-accent motion-reduce:animate-none"
                        style={{ animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </span>
                  {typingNames.length === 1
                    ? t('chat.typing', { name: typingNames[0] })
                    : t('chat.typingMultiple', { count: typingNames.length })}
                </span>
              </div>
            )}

            {/* Floating composer */}
            <div
              className={cn(
                'relative z-10 m-3 mt-1 rounded-2xl border border-border/20 bg-surface-2/70 backdrop-blur-xl',
                'transition-[box-shadow,border-color] duration-300',
                'focus-within:border-accent/50 focus-within:shadow-glow hover:border-accent/30',
                '[&>*]:!bg-transparent [&>*]:!border-0',
              )}
            >
              <Composer
                onSend={handleSend}
                disabled={isAnnouncementReadOnly}
                disabledNotice={t('chat.onlyModeratorsCanPost')}
              />
            </div>
          </>
        ) : (
          <div className="relative z-10 flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={MessageSquare}
              title={t('chat.selectConversation')}
              body={t('chat.selectConversationBody')}
            />
          </div>
        )}
      </section>
    </div>
  );
}