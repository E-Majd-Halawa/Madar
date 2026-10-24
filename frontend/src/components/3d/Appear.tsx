import { useFrame } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import { MathUtils, type Group } from 'three';
import { clamp01, easeOutBack } from '@/utils/math';
import { useScene } from './SceneContext';
import type { Vec3 } from './types';

interface AppearProps {
  /** seconds after the scene starts */
  delay: number;
  position: Vec3;
  rotation?: Vec3;
  scale?: number;
  /** offset the object drifts by as the hero scrolls out of view */
  exit?: Vec3;
  children: ReactNode;
}

/** Entrance pop-in plus scroll-driven exit drift for any scene object. */
export function Appear({ delay, position, rotation = [0, 0, 0], scale = 1, exit = [0, 0, 0], children }: AppearProps) {
  const ref = useRef<Group>(null);
  const { instant, progress } = useScene();

  useFrame((state) => {
    const group = ref.current;
    if (!group) return;
    const p = progress.get();
    const t = instant ? 99 : state.clock.elapsedTime;
    const k = easeOutBack(clamp01((t - delay) / 0.8));
    group.scale.setScalar(Math.max(0.0001, k * scale * MathUtils.lerp(1, 0.75, p)));
    group.position.set(position[0] + exit[0] * p, position[1] + exit[1] * p, position[2] + exit[2] * p);
  });

  return (
    <group ref={ref} position={position} rotation={rotation}>
      {children}
    </group>
  );
}
