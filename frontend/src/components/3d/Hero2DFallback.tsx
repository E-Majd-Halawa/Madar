import { motion } from 'framer-motion';
import { Calendar, Check, Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/hooks/useMotion';
import { cn } from '@/utils/cn';

const CARDS = [
  { key: 'a', done: true, className: 'start-[8%] top-[12%] lg:start-[4%]', delay: 0 },
  { key: 'b', done: false, className: 'end-[6%] top-[4%] lg:end-[8%]', delay: 0.6 },
  { key: 'c', done: false, className: 'start-[14%] top-[58%] lg:start-[10%]', delay: 1.1 },
] as const;

/** Premium 2D stand-in: used without WebGL, with reduced motion, or with 3D effects switched off. */
export function Hero2DFallback() {
  const { t } = useTranslation();
  const { enabled } = useMotion();

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="absolute end-[-8%] top-1/2 size-[34rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.55),rgb(var(--accent)/0.12)_45%,transparent_70%)] blur-2xl lg:end-[6%]" />
      <div className="absolute end-[12%] top-1/2 size-56 -translate-y-1/2 rounded-full border border-accent-2/40 lg:end-[16%]" />
      <div className="absolute end-[8%] top-1/2 size-80 -translate-y-1/2 rounded-full border border-accent/25 lg:end-[12%]" />

      <div className="absolute inset-y-0 end-0 w-full lg:w-[55%]">
        {CARDS.map(({ key, done, className, delay }) => (
          <motion.div
            key={key}
            className={cn('glass absolute flex w-56 items-center gap-3 rounded-xl p-3', className)}
            animate={enabled ? { y: [0, -10, 0] } : undefined}
            transition={enabled ? { duration: 6, delay, repeat: Infinity, ease: 'easeInOut' } : undefined}
          >
            <span
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full border',
                done ? 'border-accent bg-accent text-accent-fg' : 'border-border/30',
              )}
            >
              {done && <Check className="size-4" />}
            </span>
            <span className="truncate text-sm">{t(`landing.preview.tasks.items.${key}`)}</span>
          </motion.div>
        ))}
        <div className="glass absolute end-[10%] top-[42%] grid size-16 place-items-center rounded-2xl text-accent-2 lg:end-[22%]">
          <Calendar className="size-8" />
        </div>
        <div className="glass absolute end-[34%] bottom-[10%] grid size-14 place-items-center rounded-2xl text-accent lg:end-[8%]">
          <Folder className="size-7" />
        </div>
      </div>
    </div>
  );
}
