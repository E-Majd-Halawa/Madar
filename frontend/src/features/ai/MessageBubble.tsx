import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { ChatMessage } from './types';
import { PlanCard } from './PlanCard';
import { PlanSummary } from './PlanSummary';
import { OverdueList } from './OverdueList';
import { SubtaskList } from './SubtaskList';

interface MessageBubbleProps {
  message: ChatMessage;
  onSend: (prompt: string) => void;
  onAddPlanTasks: (items: Array<{ title: string; durationMinutes: number; description: string; why?: string }>) => void;
  onMoveOverdue: (title: string) => void;
  onApplyAllOverdue: () => void;
  onAddSubtasks: (subtasks: string[]) => void;
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const reduce = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    if (reduce) {
      setDisplayed(text);
      return;
    }
    let i = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, 12);
    return () => clearInterval(timer);
  }, [text, reduce]);

  return <span>{displayed}</span>;
}

export function MessageBubble({
  message,
  onSend,
  onAddPlanTasks,
  onMoveOverdue,
  onApplyAllOverdue,
  onAddSubtasks,
}: MessageBubbleProps) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const [planItems, setPlanItems] = useState(message.plan?.items || []);
  const [added, setAdded] = useState(false);

  const handleDurationChange = (index: number, newMinutes: number) => {
    setPlanItems((prev) => prev.map((item, i) => (i === index ? { ...item, durationMinutes: newMinutes } : item)));
  };

  const totalMins = planItems.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const hours = message.plan?.totalMinutes ? Math.round(message.plan.totalMinutes / 60) : 3;

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col self-start rtl:self-start ltr:self-end w-full"
      >
        <div dir="auto" className="w-fit max-w-[75%] min-w-[5rem] shrink-0 bg-gradient-to-r from-accent to-emerald-500 text-accent-fg px-4 py-2.5 rounded-2xl rounded-tr-sm text-[15px] leading-[1.7] shadow-lg space-y-1 ml-auto">
          <div className="text-xs font-mono opacity-90">{t('ai.you', 'You')}</div>
          <div className="whitespace-normal break-words">{message.content}</div>
        </div>
      </motion.div>
    );
  }

  const resolvedSummary = message.content.startsWith('ai.') || message.content.includes('.')
    ? t(message.content, { hours })
    : message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col self-start rtl:self-end ltr:self-start w-full"
    >
      <div dir="auto" className="max-w-[90%] bg-surface/80 border border-border/30 backdrop-blur-xl text-text px-4 py-2.5 rounded-2xl rounded-tl-sm text-[15px] leading-[1.7] shadow-xl space-y-3 mr-auto">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#c9ffe8,var(--accent)_45%,#0a6b4a)] shadow-[0_0_12px_rgb(var(--accent-rgb)/0.6)] shrink-0" />
          <b className="font-display text-xs font-semibold text-text">{t('ai.assistantName', 'TaskFlow AI')}</b>
        </div>

        <div className="text-text text-[15px] leading-[1.7]">
          <TypewriterText text={resolvedSummary} />
        </div>

        {message.plan?.suggestionKeys && message.plan.suggestionKeys.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {message.plan.suggestionKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onSend(t(key))}
                className="px-3 py-1.5 rounded-full bg-surface-2 border border-border/40 text-xs text-text-muted hover:text-text hover:border-accent/50 transition-all"
              >
                {t(key)}
              </button>
            ))}
          </div>
        )}

        {message.plan && message.plan.items.length > 0 && (
          <div className="space-y-3 pt-2">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
              }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {planItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                  }}
                >
                  <PlanCard
                    item={item}
                    index={idx}
                    added={added}
                    onDurationChange={(mins) => handleDurationChange(idx, mins)}
                  />
                </motion.div>
              ))}
            </motion.div>
            <PlanSummary
              totalMinutes={totalMins}
              availableMinutes={hours * 60}
              added={added}
              onRegenerate={() => {
                const jitter = [-10, -5, 0, 5, 10];
                setPlanItems((prev) =>
                  prev.map((it, i) => ({
                    ...it,
                    durationMinutes: Math.max(5, (message.plan?.items[i]?.durationMinutes || 30) + jitter[Math.floor(Math.random() * jitter.length)]),
                  }))
                );
              }}
              onAddTasks={() => {
                setAdded(true);
                onAddPlanTasks(planItems);
              }}
            />
          </div>
        )}

        {message.type === 'overdue' && message.overdueItems && (
          <div className="pt-2">
            <OverdueList
              items={message.overdueItems}
              onApplyAll={onApplyAllOverdue}
              onMoveOne={onMoveOverdue}
            />
          </div>
        )}

        {message.type === 'subtasks' && message.subtasks && (
          <div className="pt-2">
            <SubtaskList subtasks={message.subtasks} onAddSubtasks={onAddSubtasks} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
