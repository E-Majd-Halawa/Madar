import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

const SESSION_SECONDS = 25 * 60;
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const format = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function FocusPreview() {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(SESSION_SECONDS);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining <= 0) {
      setRunning(false);
      setCompleted((c) => c + 1);
      setRemaining(SESSION_SECONDS);
    }
  }, [remaining]);

  const elapsed = (SESSION_SECONDS - remaining) / SESSION_SECONDS;

  return (
    <div className="flex flex-col items-center gap-6 py-4 sm:flex-row sm:justify-center sm:gap-12">
      <div className="relative size-44">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgb(var(--border) / 0.12)" strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="rgb(var(--accent))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - elapsed)}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span dir="ltr" className="text-3xl font-semibold tabular-nums" role="timer" aria-live="off">
            {format(remaining)}
          </span>
        </div>
      </div>

      <div className="text-center sm:text-start">
        <p className="text-xs text-muted">{t('landing.preview.focus.session')}</p>
        <p className="mt-1 text-lg font-semibold">{t('landing.preview.focus.task')}</p>
        <div className="mt-5 flex justify-center gap-3 sm:justify-start">
          <Button variant="primary" onClick={() => setRunning((v) => !v)}>
            {running ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            {running ? t('landing.preview.focus.pause') : t('landing.preview.focus.start')}
          </Button>
          <Button
            onClick={() => {
              setRunning(false);
              setRemaining(SESSION_SECONDS);
            }}
          >
            <RotateCcw className="size-4" aria-hidden />
            {t('landing.preview.focus.reset')}
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted" aria-live="polite">
          {t('landing.preview.focus.completed', { count: completed })}
        </p>
      </div>
    </div>
  );
}
