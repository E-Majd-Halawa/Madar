import { useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { createPresets, MOTION_SCALE } from '@/animations/presets';
import { useThemeStore } from '@/store/themeStore';

/** Motion presets that already respect the user's intensity setting and prefers-reduced-motion. */
export function useMotion() {
  const level = useThemeStore((s) => s.animation);
  const prefersReduced = useReducedMotion();
  const effective = prefersReduced ? 'off' : level;

  return useMemo(
    () => ({
      level: effective,
      enabled: effective !== 'off',
      presets: createPresets(MOTION_SCALE[effective]),
    }),
    [effective],
  );
}
