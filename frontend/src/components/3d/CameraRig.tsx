import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import { MathUtils, type PerspectiveCamera } from 'three';
import { useScene } from './SceneContext';

export interface SceneBounds {
  center: [number, number, number];
  size: [number, number, number];
}

interface CameraRigProps {
  isMobile?: boolean;
  bounds?: SceneBounds | null;
}

const MOBILE_FIT_FACTOR = 1.15;

/**
 * Mouse parallax: horizontal pointer -> camera X, vertical pointer -> depth (Z).
 * Scroll progress adds a gentle zoom-in as the hero leaves the viewport.
 */
export function CameraRig({ isMobile = false, bounds = null }: CameraRigProps) {
  const { progress } = useScene();
  const size = useThree((state) => state.size);
  const camera = useThree((state) => state.camera);

  // Mobile fits the measured scene box to the real canvas aspect at every resize.
  useLayoutEffect(() => {
    if (!isMobile || !bounds || size.width <= 0 || size.height <= 0) return;
    const aspect = size.width / size.height;
    const halfFov = (((camera as PerspectiveCamera).fov * Math.PI) / 180) / 2;
    const halfHorizontalFov = Math.atan(Math.tan(halfFov) * aspect);
    const halfWidth = bounds.size[0] / 2;
    const halfHeight = bounds.size[1] / 2;
    const distanceToFitHeight = halfHeight / Math.tan(halfFov);
    const distanceToFitWidth = halfWidth / Math.tan(halfHorizontalFov);
    const distance = Math.max(distanceToFitHeight, distanceToFitWidth) * MOBILE_FIT_FACTOR;
    const [x, y, z] = bounds.center;

    camera.position.set(x, y, z + distance);
    camera.lookAt(x, y, z);
    camera.updateMatrixWorld();
  }, [isMobile, bounds, size.width, size.height, camera]);

  useFrame((state, dt) => {
    if (isMobile) return;

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
