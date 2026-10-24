import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Send } from 'lucide-react';

interface AiComposerProps {
  onSend: (prompt: string) => void;
  loading: boolean;
}

export function AiComposer({ onSend, loading }: AiComposerProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full h-[52px] flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/40 bg-surface/90 backdrop-blur-xl shadow-xl focus-within:border-accent/80 focus-within:shadow-[0_0_32px_-6px_rgba(var(--accent-rgb)/0.45)] transition-all"
      autoComplete="off"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t('ai.placeholder', 'Ask about your day, tasks, or plan…')}
        aria-label="Message the assistant"
        disabled={loading}
        className="flex-1 min-w-0 bg-transparent border-0 text-text font-normal text-[15px] px-3 py-1.5 focus:outline-none placeholder:text-text-muted"
      />
      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={loading || !input.trim()}
        className="rounded-full px-5 h-[36px] font-semibold bg-accent text-accent-fg shadow-md hover:shadow-glow transition-all shrink-0 text-sm"
      >
        <Send className="w-3.5 h-3.5" /> {t('ai.send', 'Send')}
      </Button>
    </form>
  );
}
