import type { MotionValue } from 'framer-motion';
import { createContext, useContext } from 'react';
import type { QualityTier } from '@/utils/quality';
import type { SceneColors } from './useSceneColors';

export interface SceneContextValue {
  tier: QualityTier;
  /** true when animation intensity is "off": objects appear immediately */
  instant: boolean;
  colors: SceneColors;
  /** 0 at the top of the page, 1 once the hero has scrolled out */
  progress: MotionValue<number>;
  /** true when Arabic or RTL direction is active */
  isRtl: boolean;
}

export const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene(): SceneContextValue {
  const value = useContext(SceneContext);
  if (!value) throw new Error('useScene must be used inside <HeroScene>');
  return value;
}
