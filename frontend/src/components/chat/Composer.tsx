import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Paperclip, Send, Smile } from 'lucide-react';
import { cn } from '@/utils/cn';

const ICON_BTN =
  'grid size-9 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-fg/10 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50';

export function Composer({
  onSend,
  disabled,
  disabledNotice,
  placeholder,
}: {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  disabledNotice?: string;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleSend = async () => {
    if (!content.trim() || disabled) return;
    const text = content.trim();
    setContent('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (disabled) {
    return (
      <div className="border-t border-white/10 p-4 text-center text-sm text-muted">
        {disabledNotice ?? t('chat.readOnlyNotice')}
      </div>
    );
  }

  return (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-fg/[0.03] p-2 focus-within:border-accent/50">
        <button type="button" aria-label={t('chat.addReaction')} className={ICON_BTN}>
          <Smile className="size-5" aria-hidden />
        </button>
        <button type="button" aria-label={t('messages.attachFile')} className={ICON_BTN}>
          <Paperclip className="size-5" aria-hidden />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t('chat.messagePlaceholder')}
          aria-label={t('chat.messagePlaceholder')}
          rows={1}
          className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-sm text-fg placeholder:text-muted focus:outline-none"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim()}
          aria-label={t('chat.send')}
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rtl:-scale-x-100',
            !content.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90',
          )}
        >
          <Send className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
