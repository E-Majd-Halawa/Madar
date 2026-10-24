import { Float, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { AdditiveBlending, MathUtils, type Group, type MeshBasicMaterial } from 'three';
import { Appear } from '../Appear';
import { getGlowTexture } from '../glowTexture';
import { useScene } from '../SceneContext';
import type { Vec3 } from '../types';
import { useHover } from '../useHover';
import { Checkmark3D } from './Checkmark3D';
import { PanelMaterial } from './materials';

interface TaskCardProps {
  position: Vec3;
  rotation?: Vec3;
  delay: number;
  done?: boolean;
  exit?: Vec3;
  /** widths of the title and description bars */
  lines?: [number, number];
}

/** Floating task card. Hover: moves toward the camera and glows. */
export function TaskCard({ position, rotation, delay, done = false, exit, lines = [1, 0.65] }: TaskCardProps) {
  const { colors } = useScene();
  const { hovered, handlers } = useHover();
  const lift = useRef<Group>(null);
  const halo = useRef<MeshBasicMaterial>(null);

  useFrame((_, dt) => {
    const h = hovered.current;
    if (lift.current) lift.current.position.z = MathUtils.damp(lift.current.position.z, h ? 0.5 : 0, 6, dt);
    if (halo.current) halo.current.opacity = MathUtils.damp(halo.current.opacity, h ? 0.55 : 0.12, 6, dt);
  });

  return (
    <Appear position={position} rotation={rotation} delay={delay} exit={exit}>
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.6}>
        <group ref={lift} {...handlers}>
          <mesh position={[0, 0, -0.1]} scale={[3.4, 2.5, 1]} raycast={() => null}>
            <planeGeometry />
            <meshBasicMaterial
              ref={halo}
              map={getGlowTexture()}
              color={colors.accent}
              transparent
              opacity={0.12}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </mesh>

          <RoundedBox args={[1.7, 1.05, 0.08]} radius={0.08} smoothness={3}>
            <PanelMaterial />
          </RoundedBox>

          <mesh position={[-0.8, 0, 0.05]}>
            <boxGeometry args={[0.05, 0.7, 0.02]} />
            <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.9} />
          </mesh>

          <mesh position={[-0.6, 0.22, 0.05]}>
            <torusGeometry args={[0.11, 0.02, 8, 24]} />
            <meshStandardMaterial color={done ? colors.accent : colors.muted} emissive={done ? colors.accent : colors.muted} emissiveIntensity={done ? 0.7 : 0.1} />
          </mesh>
          {done && <Checkmark3D color={colors.accent} position={[-0.6, 0.22, 0.06]} scale={0.085} />}

          <mesh position={[-0.42 + lines[0] * 0.5 * 0.9, 0.22, 0.05]}>
            <boxGeometry args={[lines[0] * 0.9, 0.08, 0.02]} />
            <meshStandardMaterial color={colors.fg} roughness={0.6} />
          </mesh>
          <mesh position={[-0.42 + lines[1] * 0.5 * 0.9, 0.02, 0.05]}>
            <boxGeometry args={[lines[1] * 0.9, 0.055, 0.02]} />
            <meshStandardMaterial color={colors.muted} roughness={0.6} />
          </mesh>
          <mesh position={[-0.5, -0.26, 0.05]}>
            <boxGeometry args={[0.36, 0.11, 0.02]} />
            <meshStandardMaterial color={colors.accent2} emissive={colors.accent2} emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0.62, -0.26, 0.05]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.4} />
          </mesh>
        </group>
      </Float>
    </Appear>
  );
}
