import type { Transition, Variants } from 'framer-motion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Animation intensity -> duration multiplier. 0 disables motion entirely. */
export const MOTION_SCALE = { off: 0, low: 0.6, medium: 1, high: 1.3 } as const;

/** Build the shared motion vocabulary for a given scale (see useMotion). */
export function createPresets(scale: number) {
  const d = (seconds: number) => seconds * scale;

  const spring: Transition =
    scale === 0 ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 };

  const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: d(0.3), ease: EASE } },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: scale === 0 ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: d(0.45), ease: EASE } },
  };

  const scaleIn: Variants = {
    hidden: { opacity: 0, scale: scale === 0 ? 1 : 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: d(0.3), ease: EASE } },
  };

  const slideIn = (from: 'left' | 'right' | 'up' | 'down' = 'left'): Variants => {
    const distance = scale === 0 ? 0 : 24;
    const offset = {
      left: { x: -distance },
      right: { x: distance },
      up: { y: -distance },
      down: { y: distance },
    }[from];
    return {
      hidden: { opacity: 0, ...offset },
      visible: { opacity: 1, x: 0, y: 0, transition: { duration: d(0.35), ease: EASE } },
    };
  };

  const modal: Variants = {
    hidden: { opacity: 0, scale: scale === 0 ? 1 : 0.94, y: scale === 0 ? 0 : 12 },
    visible: { opacity: 1, scale: 1, y: 0, transition: spring },
    exit: { opacity: 0, scale: scale === 0 ? 1 : 0.97, transition: { duration: d(0.15) } },
  };

  const pageTransition: Variants = {
    hidden: { opacity: 0, y: scale === 0 ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: { duration: d(0.25), ease: EASE } },
    exit: { opacity: 0, transition: { duration: d(0.15) } },
  };

  const stagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: d(0.06) } },
  };

  const cardHover =
    scale === 0
      ? {}
      : { whileHover: { y: -3, transition: spring }, whileTap: { scale: 0.985 } };

  return { fadeIn, fadeUp, scaleIn, slideIn, modal, pageTransition, stagger, spring, cardHover };
}

export type MotionPresets = ReturnType<typeof createPresets>;
