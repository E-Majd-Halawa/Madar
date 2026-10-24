import type { Color } from 'three';
import type { Vec3 } from '../types';

interface Checkmark3DProps {
  color: Color;
  position?: Vec3;
  scale?: number;
  intensity?: number;
}

/** Two extruded strokes forming a check. Reused by task cards and (later) the task-complete animation. */
export function Checkmark3D({ color, position = [0, 0, 0], scale = 1, intensity = 0.8 }: Checkmark3DProps) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[-0.18, -0.17, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.5, 0.16, 0.16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} />
      </mesh>
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1, 0.16, 0.16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} />
      </mesh>
    </group>
  );
}
