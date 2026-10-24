import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { AiOrbStage } from '@/features/ai/AiOrbStage';
import { AiComposer } from '@/features/ai/AiComposer';
import { MessageBubble } from '@/features/ai/MessageBubble';
import { useAssistant } from '@/features/ai/useAssistant';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export default function AiPage() {
  const { t, i18n } = useTranslation();
  const {
    messages,
    mode,
    loading,
    sendPrompt,
    handleAddPlanTasks,
    handleMoveOverdue,
    handleApplyAllOverdue,
    handleAddSubtasks,
    clearChat,
  } = useAssistant();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageRowsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const isFollowingRef = useRef(true);
  const reduceMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  // Auto-scroll to newest message ONLY when user is within 120px of bottom, instant
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  // Scroll effect applying ONLY to message rows (.message-row)
  const handleScroll = useCallback(() => {
    if (reduceMotion) return;
    const list = scrollContainerRef.current;
    if (!list) return;

    requestAnimationFrame(() => {
      const scrollTop = list.scrollTop;
      messageRowsRef.current.forEach((el) => {
        if (!el) return;
        const rowBottom = el.offsetTop + el.offsetHeight - scrollTop;
        const fadeZone = 170;

        if (rowBottom >= fadeZone) {
          el.style.transform = 'scale(1) translateX(0px)';
          el.style.opacity = '1';
        } else {
          const tVal = Math.max(0, Math.min(1, rowBottom / fadeZone));
          const scale = 0.6 + 0.4 * tVal;
          const opacity = tVal;
          const translateX = -(1 - tVal) * 40;

          el.style.transform = `scale(${scale}) translateX(${translateX}px)`;
          el.style.opacity = `${opacity}`;
          el.style.willChange = 'transform, opacity';
          el.style.transformOrigin = 'left top';
        }
      });
    });
  }, [reduceMotion]);

  // Follow mode scroll tracking and pagination scroll effect
  const handleScrollEvent = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom > 80) {
      isFollowingRef.current = false;
    } else if (distanceToBottom < 40) {
      isFollowingRef.current = true;
    }
    handleScroll();
  }, [handleScroll]);

  // Handle user send with immediate instant scroll and enabling follow mode
  const handleUserSend = useCallback((text: string) => {
    isFollowingRef.current = true;
    sendPrompt(text);
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      handleScroll();
    }
  }, [sendPrompt, handleScroll]);

  // Follow mode auto-scroll on updates and streaming / plan cards appearing
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (isFollowingRef.current) {
      el.scrollTop = el.scrollHeight;
      handleScroll();
      const timer = setTimeout(() => {
        if (isFollowingRef.current && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          handleScroll();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [messages, loading, handleScroll]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScrollEvent, { passive: true });
    handleScroll();
    const handleResize = () => handleScroll();
    window.addEventListener('resize', handleResize);
    return () => {
      container.removeEventListener('scroll', handleScrollEvent);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleScrollEvent, messages]);

  const hasStarted = messages.length > 0;
  const sortedMessages = [...messages].reverse();

  const suggestionItems = [
    t('ai.suggestions.card1', 'Plan my day (3 hours)'),
    t('ai.suggestions.card2', 'What are my overdue tasks?'),
    t('ai.suggestions.card3', 'Break down a big task'),
    t('ai.suggestions.card4', 'Summarize my productivity'),
  ];

  const statusLabel =
    mode === 'thinking'
      ? t('ai.core.thinking')
      : mode === 'answering'
      ? t('ai.core.answering')
      : t('ai.core.ready');

  return (
    <div className="relative h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-5rem)] min-h-0 overflow-hidden flex flex-col -mx-4 -mt-6 -mb-28 sm:-mx-6 lg:-mb-10 bg-bg">
      {/* Background glow layer */}
      <div className="absolute inset-0 -z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(var(--accent-rgb)/0.12),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,212,232,0.08),transparent_50%)]" />

      {/* TWO PANELS SIDE BY SIDE (dir="ltr") */}
      <div className="flex h-full min-h-0 dir='ltr' w-full relative z-10" dir="ltr">
        {/* 1. LEFT PANEL (orb + suggestions): flex column, h-full min-h-0 overflow-hidden, p-4, gap-3 */}
        <div className="hidden lg:flex flex-none w-[42%] max-w-[560px] h-full min-h-0 overflow-hidden flex-col p-4 gap-3 relative bg-bg">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(var(--accent-rgb)/0.18),transparent_65%)]" />
          
          {/* Orb area: flex-1 min-h-[140px] min-w-0 */}
          <div className="flex-1 min-h-[140px] min-w-0 relative flex items-center justify-center">
            <div className="w-full h-full max-h-[380px] aspect-square relative overflow-hidden rounded-full shadow-[0_0_60px_-10px_rgba(var(--accent-rgb)/0.35)] mx-auto flex items-center justify-center">
              <AiOrbStage mode={mode} />
            </div>
          </div>

          {/* Status pill: flex-none (normal sans font, 12px, no uppercase, no tracking) */}
          <div className="flex-none flex items-center justify-center">
            <div className="flex items-center gap-2 bg-surface/80 border border-border/30 px-3 py-1 rounded-full">
              <span className="size-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs text-muted font-normal">{statusLabel}</span>
            </div>
          </div>

          {/* Suggestions: flex-none */}
          <div className="flex-none w-full max-w-[340px] mx-auto flex flex-col gap-2">
            {suggestionItems.map((itemText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleUserSend(itemText)}
                disabled={loading}
                className="w-full text-start rounded-xl border border-white/10 bg-fg/[0.03] px-4 py-2 text-sm text-text hover:bg-fg/10 focus-visible:ring-2 focus-visible:ring-accent transition-all disabled:opacity-50"
              >
                {itemText}
              </button>
            ))}
          </div>
        </div>

        {/* 2. RIGHT PANEL (chat): flex-1 min-w-0 flex flex-col min-h-0 */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-bg" dir={i18n.dir()}>
          {/* Header */}
          <header className="flex-none h-[52px] z-30 bg-bg flex items-center justify-between gap-4 px-6 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="lg:hidden size-12 shrink-0 relative overflow-hidden rounded-full">
                <div className="absolute inset-0 scale-[0.25] origin-center">
                  <AiOrbStage mode={mode} compact />
                </div>
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-text m-0">{t('ai.assistantName', 'TaskFlow AI')}</h2>
                <div className="lg:hidden flex items-center gap-1.5 mt-0.5">
                  <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs text-muted font-normal">{statusLabel}</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!hasStarted}
              onClick={() => setConfirmOpen(true)}
              aria-label={t('ai.clearChat', 'Clear chat')}
              className="rounded-xl text-[13px] gap-1.5 text-danger hover:bg-danger/10 hover:border-danger/35 h-7 px-2.5"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">{t('ai.clearChat', 'Clear chat')}</span>
            </Button>
          </header>

          {/* Stage */}
          <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
            {!hasStarted ? (
              /* START state (no messages): title 28px, subtitle 15px, vertically centered, no suggestion chips inside chat */
              <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-6 px-4 space-y-3 max-w-[720px] w-full mx-auto">
                <div className="space-y-1.5 max-w-lg">
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-text tracking-tight">
                    {t('ai.startTitle', 'How can I help you today?')}
                  </h1>
                  <p className="text-[15px] text-muted">
                    {t('ai.startSubtitle', 'Your intelligent partner for planning, breaking down tasks, and staying on track.')}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Top fade over list */}
                <div className="absolute top-0 inset-x-0 h-10 pointer-events-none z-10 bg-gradient-to-b from-bg to-transparent" />

                {/* Message list */}
                <div
                  ref={scrollContainerRef}
                  className="absolute inset-0 overflow-y-auto overflow-x-hidden pt-6 pb-6 px-4 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [overscroll-behavior:contain] max-w-[720px] w-full mx-auto z-0"
                  aria-live="polite"
                >
                  {sortedMessages.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      ref={(el) => {
                        if (el) messageRowsRef.current.set(msg.id || String(index), el);
                        else messageRowsRef.current.delete(msg.id || String(index));
                      }}
                      className="message-row exchange transition-transform duration-75 ease-out w-full flex flex-col"
                    >
                      <MessageBubble
                        message={msg}
                        onSend={handleUserSend}
                        onAddPlanTasks={handleAddPlanTasks}
                        onMoveOverdue={handleMoveOverdue}
                        onApplyAllOverdue={handleApplyAllOverdue}
                        onAddSubtasks={handleAddSubtasks}
                      />
                    </div>
                  ))}

                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="message-row flex flex-col self-start rtl:self-end ltr:self-start w-full"
                    >
                      <div dir="auto" className="max-w-[90%] bg-surface/80 border border-border/30 backdrop-blur-xl text-text px-4 py-2.5 rounded-2xl rounded-tl-sm text-[15px] leading-[1.7] shadow-xl space-y-3 mr-auto">
                        <div className="flex items-center gap-2">
                          <div className="size-5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#c9ffe8,var(--accent)_45%,#0a6b4a)] shadow-[0_0_12px_rgb(var(--accent-rgb)/0.6)] shrink-0" />
                          <b className="font-display text-xs font-semibold text-text">{t('ai.assistantName', 'TaskFlow AI')}</b>
                        </div>
                        <div className="flex items-center gap-1.5 py-1 px-1">
                          <span className="size-2 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
                          <span className="size-2 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
                          <span className="size-2 rounded-full bg-accent animate-bounce" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={scrollContainerRef} />
                </div>
              </>
            )}
          </div>

          {/* Composer: height 52px, text 15px, send button 36px tall, note under it 12px (normal sans font, no mono, no uppercase, no tracking) */}
          <div className="flex-none z-30 py-2.5 px-4 flex flex-col items-center space-y-1 bg-bg">
            <div className="max-w-[720px] w-full mx-auto flex flex-col items-center space-y-1">
              <AiComposer onSend={handleUserSend} loading={loading} />
              <span className="text-xs text-muted font-normal">
                {t('ai.simPill', 'Local assistant · simulated, provider integration later')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Chat */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('ai.clearConfirmTitle', 'Clear chat history?')}
        description={t('ai.clearConfirmDesc', 'This will remove all messages and return you to the start screen.')}
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setConfirmOpen(false)}
            className="rounded-xl"
          >
            {t('ai.cancel', 'Cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              clearChat();
              setConfirmOpen(false);
            }}
            className="rounded-xl bg-danger text-danger-fg hover:bg-danger/90"
          >
            {t('ai.confirm', 'Confirm')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
