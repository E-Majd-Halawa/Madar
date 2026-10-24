import { Float, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import { Color, MathUtils, Object3D, type Group, type InstancedMesh } from 'three';
import { Appear } from '../Appear';
import { useScene } from '../SceneContext';
import type { Vec3 } from '../types';
import { useHover } from '../useHover';
import { PanelMaterial } from './materials';

const ROWS = 5;
const COLS = 7;
const HIGHLIGHT = 17;

interface CalendarObjectProps {
  position: Vec3;
  rotation?: Vec3;
  delay: number;
  exit?: Vec3;
}

/** Floating calendar. The 35 day cells are one InstancedMesh (a single draw call). Hover: gentle turn. */
export function CalendarObject({ position, rotation, delay, exit }: CalendarObjectProps) {
  const { colors } = useScene();
  const { hovered, handlers } = useHover();
  const turn = useRef<Group>(null);
  const cells = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = cells.current;
    if (!mesh) return;
    const dummy = new Object3D();
    const dim = new Color().copy(colors.muted).lerp(colors.surface, 0.55);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const i = row * COLS + col;
        dummy.position.set(-0.78 + col * 0.26, 0.38 - row * 0.25, 0.07);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, i === HIGHLIGHT ? colors.accent : dim);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [colors]);

  useFrame((_, dt) => {
    if (turn.current) turn.current.rotation.y = MathUtils.damp(turn.current.rotation.y, hovered.current ? 0.5 : 0, 5, dt);
  });

  return (
    <Appear position={position} rotation={rotation} delay={delay} exit={exit} scale={0.95}>
      <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.5}>
        <group ref={turn} {...handlers}>
          <RoundedBox args={[2.1, 1.85, 0.1]} radius={0.09} smoothness={3}>
            <PanelMaterial />
          </RoundedBox>
          <mesh position={[0, 0.72, 0.07]}>
            <boxGeometry args={[2.1, 0.32, 0.05]} />
            <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.5} />
          </mesh>
          <instancedMesh ref={cells} args={[undefined, undefined, ROWS * COLS]}>
            <boxGeometry args={[0.19, 0.17, 0.03]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </instancedMesh>
        </group>
      </Float>
    </Appear>
  );
}
