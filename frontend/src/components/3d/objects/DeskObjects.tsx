import { Float, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { Appear } from '../Appear';
import { useScene } from '../SceneContext';
import type { Vec3 } from '../types';
import { PanelMaterial } from './materials';

interface PlacedProps {
  position: Vec3;
  rotation?: Vec3;
  delay: number;
  exit?: Vec3;
}

/** 3D clock: the hands keep moving, faster than real time so it reads as alive. */
export function ClockObject({ position, rotation, delay, exit }: PlacedProps) {
  const { colors } = useScene();
  const hour = useRef<Group>(null);
  const minute = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (minute.current) minute.current.rotation.z = -t * 0.9;
    if (hour.current) hour.current.rotation.z = -t * 0.075;
  });

  return (
    <Appear position={position} rotation={rotation} delay={delay} exit={exit}>
      <Float speed={1.6} rotationIntensity={0.2} floatIntensity={0.7}>
        <mesh>
          <torusGeometry args={[0.7, 0.05, 16, 48]} />
          <meshStandardMaterial color={colors.accent2} emissive={colors.accent2} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0, -0.02]}>
          <circleGeometry args={[0.66, 48]} />
          <meshStandardMaterial color={colors.surface2} roughness={0.5} />
        </mesh>
        <group ref={hour}>
          <mesh position={[0, 0.17, 0.03]}>
            <boxGeometry args={[0.06, 0.34, 0.03]} />
            <meshStandardMaterial color={colors.fg} />
          </mesh>
        </group>
        <group ref={minute}>
          <mesh position={[0, 0.26, 0.05]}>
            <boxGeometry args={[0.04, 0.52, 0.03]} />
            <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.6} />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.06]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color={colors.fg} />
        </mesh>
      </Float>
    </Appear>
  );
}

/** Project folder built from three rounded boxes. */
export function FolderObject({ position, rotation, delay, exit }: PlacedProps) {
  const { colors } = useScene();
  return (
    <Appear position={position} rotation={rotation} delay={delay} exit={exit}>
      <Float speed={1.3} rotationIntensity={0.15} floatIntensity={0.55}>
        <RoundedBox args={[1.35, 0.95, 0.1]} radius={0.06} smoothness={3} position={[0, 0, -0.04]}>
          <meshStandardMaterial color={colors.accent2} roughness={0.45} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[0.55, 0.16, 0.1]} radius={0.05} smoothness={3} position={[-0.38, 0.52, -0.04]}>
          <meshStandardMaterial color={colors.accent2} roughness={0.45} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[1.35, 0.78, 0.08]} radius={0.06} smoothness={3} position={[0, -0.08, 0.06]}>
          <PanelMaterial opacity={0.95} />
        </RoundedBox>
      </Float>
    </Appear>
  );
}

/** Notification bubble with an unread badge. */
export function NotificationBubble({ position, delay, exit }: Omit<PlacedProps, 'rotation'>) {
  const { colors, tier } = useScene();
  const segments = tier === 'low' ? 16 : 28;
  return (
    <Appear position={position} delay={delay} exit={exit}>
      <Float speed={2} rotationIntensity={0.3} floatIntensity={1}>
        <mesh>
          <sphereGeometry args={[0.32, segments, segments]} />
          <meshStandardMaterial color={colors.accent2} emissive={colors.accent2} emissiveIntensity={0.35} roughness={0.3} />
        </mesh>
        <mesh position={[0.24, 0.24, 0.1]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.7} />
        </mesh>
      </Float>
    </Appear>
  );
}
