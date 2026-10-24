import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { useScene } from './SceneContext';

/**
 * Mouse parallax: horizontal pointer -> camera X, vertical pointer -> depth (Z).
 * Scroll progress adds a gentle zoom-in as the hero leaves the viewport.
 */
export function CameraRig() {
  const { progress } = useScene();

  useFrame((state, dt) => {
    const p = progress.get();
    const { camera, pointer } = state;
    const targetX = pointer.x * 0.7;
    const targetY = pointer.y * 0.3 - p * 0.6;
    const targetZ = 7.5 - p * 2.2 + pointer.y * 0.5;
    camera.position.x = MathUtils.damp(camera.position.x, targetX, 3, dt);
    camera.position.y = MathUtils.damp(camera.position.y, targetY, 3, dt);
    camera.position.z = MathUtils.damp(camera.position.z, targetZ, 3, dt);
    camera.lookAt(0, -p * 0.4, 0);
  });

  return null;
}
