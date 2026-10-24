import { useEffect, useState } from 'react';
import { useMotion } from './useMotion';

/** Animates a number toward `target`. Jumps instantly when animation is off or reduced motion is requested. */
export function useCountUp(target: number, durationMs = 700): number {
  const { enabled } = useMotion();
  const [value, setValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const from = value;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, enabled, durationMs]);

  return value;
}
