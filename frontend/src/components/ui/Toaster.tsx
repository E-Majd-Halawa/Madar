import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/hooks/useMotion';
import { useToastStore, type ToastTone } from '@/store/toastStore';
import { cn } from '@/utils/cn';

const ICONS = { success: CheckCircle2, info: Info, error: TriangleAlert } as const;
const TONES: Record<ToastTone, string> = { success: 'text-success', info: 'text-accent-2', error: 'text-danger' };

/** Global toast region. Polite live region so screen readers announce changes without stealing focus. */
export function Toaster() {
  const { t } = useTranslation();
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const { presets } = useMotion();

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={t('common.notifications')}
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6"
    >
      <AnimatePresence>
        {toasts.map((item) => {
          const Icon = ICONS[item.tone];
          return (
            <motion.div
              key={item.id}
              layout
              variants={presets.modal}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-depth"
            >
              <Icon className={cn('size-4 shrink-0', TONES[item.tone])} aria-hidden />
              <span className="min-w-0 flex-1">{item.message}</span>
              {item.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    item.onAction?.();
                    dismiss(item.id);
                  }}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-accent hover:bg-accent/10"
                >
                  {item.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label={t('common.dismiss')}
                className="text-muted hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
