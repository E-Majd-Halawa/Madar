import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { MessageItem } from './MessageItem';
import type { ChannelMessage } from '@/types';

export function MessageList({
  messages,
  onOpenThread,
  onToggleReaction,
}: {
  messages: ChannelMessage[];
  onOpenThread?: (rootMessageId: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <ScrollArea variant="hidden" className="min-h-0 flex-1 overflow-y-auto py-4">
      <div className="flex flex-col">
        <div className="flex-1" />
        {messages.map((msg, index) => (
          <MessageItem
            key={msg.id}
            message={msg}
            prevMessage={index > 0 ? messages[index - 1] : undefined}
            onOpenThread={onOpenThread}
            onToggleReaction={onToggleReaction}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
