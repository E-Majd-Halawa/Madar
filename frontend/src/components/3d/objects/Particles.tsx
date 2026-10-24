import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Points, PointsMaterial } from 'three';
import { HERO_TIMELINE } from '@/constants/heroTimeline';
import { clamp01, seededRandom } from '@/utils/math';
import { QUALITY } from '@/utils/quality';
import { useScene } from '../SceneContext';

/** Drifting dust. One Points object; the whole cloud rotates, so there is no per-particle work per frame. */
export function Particles() {
  const { colors, tier, instant } = useScene();
  const count = QUALITY[tier].particles;
  const points = useRef<Points>(null);
  const material = useRef<PointsMaterial>(null);

  const positions = useMemo(() => {
    const random = seededRandom(7);
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      array[i * 3] = (random() - 0.5) * 16;
      array[i * 3 + 1] = (random() - 0.5) * 9;
      array[i * 3 + 2] = (random() - 0.5) * 9 - 1;
    }
    return array;
  }, [count]);

  useFrame((state, dt) => {
    if (points.current) points.current.rotation.y += dt * 0.02;
    if (material.current) {
      const ramp = instant ? 1 : clamp01((state.clock.elapsedTime - HERO_TIMELINE.particles) / 1.2);
      material.current.opacity = ramp * (colors.isLight ? 0.5 : 0.7);
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        ref={material}
        size={0.04}
        color={colors.accent2}
        transparent
        opacity={0}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
