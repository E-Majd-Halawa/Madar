import { useState, useRef, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { AiPlanItem } from '@/api/contracts/ai';
import { formatDuration } from './formatDuration';

interface PlanCardProps {
  item: AiPlanItem;
  index: number;
  added: boolean;
  onDurationChange: (newMinutes: number) => void;
}

export function PlanCard({ item, index, added, onDurationChange }: PlanCardProps) {
  const { t, i18n } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);
  const [lift, setLift] = useState(0);

  const handlePointerMove = (e: MouseEvent<HTMLDivElement>) => {
    if (added || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRy(x * 9);
    setRx(-y * 9);
    setLift(26);
  };

  const handlePointerLeave = () => {
    setRy(0);
    setRx(0);
    setLift(0);
  };

  const resolvedTitle = item.title.startsWith('ai.') ? t(item.title) : item.title;
  const resolvedDesc = item.description?.startsWith('ai.') ? t(item.description) : (item.description || item.why || '');
  const resolvedWhy = item.why?.startsWith('ai.') ? t(item.why) : item.why;

  return (
    <div
      className="card-wrap transition-all duration-300"
      style={{ animationDelay: `${index * 110}ms` }}
    >
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={`relative h-full bg-gradient-to-br from-white/[0.07] to-white/[0.015] bg-surface border border-border/20 rounded-2xl p-3 backdrop-blur-md shadow-xl transition-all duration-200 ${
          added ? 'opacity-55 pointer-events-none' : 'hover:border-accent/50 hover:shadow-2xl'
        }`}
        style={{
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${lift}px)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {added && (
          <span className="absolute top-2.5 end-2.5 text-[10px] font-mono text-accent-fg bg-accent px-2 py-0.5 rounded-full z-10">
            {t('ai.added', 'Added')}
          </span>
        )}
        <div className="flex justify-between items-start gap-2.5" style={{ transform: 'translateZ(18px)' }}>
          <h4 className="m-0 font-display text-[15px] font-bold tracking-tight text-text">
            {resolvedTitle}
          </h4>
          <span className="text-xs text-accent bg-accent/10 border border-accent/25 px-2 py-0.5 rounded-full whitespace-nowrap">
            {formatDuration(item.durationMinutes, i18n.language)}
          </span>
        </div>
        <p className="my-1.5 text-[13px] text-text-muted" style={{ transform: 'translateZ(10px)' }}>
          {resolvedWhy || resolvedDesc}
        </p>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden my-2.5">
          <div
            className="h-full bg-gradient-to-r from-accent to-cyan-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (item.durationMinutes / 90) * 100)}%` }}
          />
        </div>
        {!added && (
          <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
            <button
              type="button"
              aria-label={`Less time for ${resolvedTitle}`}
              onClick={() => onDurationChange(Math.max(5, item.durationMinutes - 5))}
              className="w-7 h-7 rounded-lg border border-border/30 bg-white/[0.04] grid place-items-center hover:border-accent/50 hover:text-accent"
            >
              −
            </button>
            <span>{formatDuration(item.durationMinutes, i18n.language)}</span>
            <button
              type="button"
              aria-label={`More time for ${resolvedTitle}`}
              onClick={() => onDurationChange(item.durationMinutes + 5)}
              className="w-7 h-7 rounded-lg border border-border/30 bg-white/[0.04] grid place-items-center hover:border-accent/50 hover:text-accent"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
