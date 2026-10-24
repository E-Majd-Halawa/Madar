import { useInView, useReducedMotion, type MotionValue } from 'framer-motion';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { resolveDirection, useSettingsStore } from '@/store/settingsStore';
import { useThemeStore } from '@/store/themeStore';
import { detectTier, lowerTier, type QualityTier } from '@/utils/quality';
import { isWebGLAvailable } from '@/utils/webgl';
import { Hero2DFallback } from './Hero2DFallback';
import { SceneErrorBoundary } from './SceneErrorBoundary';

const HeroScene = lazy(() => import('./HeroScene'));

export type HeroIntro = 'pending' | 'cinematic' | 'instant';

export interface HeroVisualProps {
  progress: MotionValue<number>;
  /** Tells the hero text which timeline to follow */
  onIntro: (intro: Exclude<HeroIntro, 'pending'>) => void;
  /** Whether the layout is currently in RTL / Arabic mode */
  isRtl?: boolean;
}

/**
 * Chooses between the 3D scene and the 2D fallback and keeps the 3D one cheap:
 * rendering pauses off-screen, and quality steps down automatically on slow devices.
 */
export function HeroVisual({ progress, onIntro, isRtl: isRtlProp }: HeroVisualProps) {
  const language = useSettingsStore((s) => s.language);
  const direction = useSettingsStore((s) => s.direction);
  const isRtl = isRtlProp ?? (resolveDirection(language, direction) === 'rtl');
  const effects3d = useThemeStore((s) => s.effects3d);
  const animation = useThemeStore((s) => s.animation);
  const prefersReduced = useReducedMotion();

  const wrapper = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapper, { margin: '200px' });

  const [webgl] = useState(isWebGLAvailable);
  const [failed, setFailed] = useState(false);
  const [tier, setTier] = useState<QualityTier>(detectTier);

  const use3d = webgl && effects3d && !prefersReduced && !failed;

  useEffect(() => {
    if (!use3d) onIntro('instant');
  }, [use3d, onIntro]);

  const handleCreated = useCallback(
    (canvas: HTMLCanvasElement) => {
      onIntro(animation === 'off' ? 'instant' : 'cinematic');
      canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        setFailed(true);
      });
    },
    [animation, onIntro],
  );

  return (
    <div ref={wrapper} className="absolute inset-0">
      {use3d ? (
        <SceneErrorBoundary onError={() => setFailed(true)}>
          <Suspense fallback={null}>
            <HeroScene
              tier={tier}
              instant={animation === 'off'}
              active={inView}
              progress={progress}
              onCreated={handleCreated}
              onDecline={() => setTier(lowerTier)}
              isRtl={isRtl}
            />
          </Suspense>
        </SceneErrorBoundary>
      ) : (
        <Hero2DFallback />
      )}
    </div>
  );
}
