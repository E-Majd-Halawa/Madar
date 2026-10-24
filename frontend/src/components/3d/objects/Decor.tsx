import { Float, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BufferGeometry, Vector3, type Mesh } from 'three';
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

/** Translucent sphere. Reflections come from the scene's environment lights. */
export function GlassSphere({ position, delay, exit, radius = 0.4 }: Omit<PlacedProps, 'rotation'> & { radius?: number }) {
  const { colors, tier } = useScene();
  const segments = tier === 'high' ? 40 : 24;
  return (
    <Appear position={position} delay={delay} exit={exit}>
      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={1}>
        <mesh>
          <sphereGeometry args={[radius, segments, segments]} />
          <meshPhysicalMaterial
            color={colors.accent2}
            transparent
            opacity={0.28}
            roughness={0.05}
            metalness={0.1}
            clearcoat={1}
            envMapIntensity={1.4}
          />
        </mesh>
      </Float>
    </Appear>
  );
}

/** Slowly spinning wireframe polyhedron. */
export function GeometricShape({
  position,
  delay,
  exit,
  kind,
}: Omit<PlacedProps, 'rotation'> & { kind: 'octahedron' | 'icosahedron' | 'torus' }) {
  const { colors } = useScene();
  const ref = useRef<Mesh>(null);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.3;
    ref.current.rotation.y += dt * 0.4;
  });

  return (
    <Appear position={position} delay={delay} exit={exit}>
      <Float speed={1.2} floatIntensity={0.8}>
        <mesh ref={ref}>
          {kind === 'octahedron' && <octahedronGeometry args={[0.4]} />}
          {kind === 'icosahedron' && <icosahedronGeometry args={[0.35, 0]} />}
          {kind === 'torus' && <torusGeometry args={[0.3, 0.1, 10, 24]} />}
          <meshBasicMaterial color={colors.accent2} wireframe transparent opacity={0.55} />
        </mesh>
      </Float>
    </Appear>
  );
}

const BAR_HEIGHTS = [0.35, 0.6, 0.45, 0.85, 0.65];

/** Floating UI panel drawn as a mini bar chart. */
export function UiPanel({ position, rotation, delay, exit }: PlacedProps) {
  const { colors } = useScene();
  return (
    <Appear position={position} rotation={rotation} delay={delay} exit={exit}>
      <Float speed={1.1} rotationIntensity={0.1} floatIntensity={0.4}>
        <RoundedBox args={[2.1, 1.3, 0.05]} radius={0.07} smoothness={3}>
          <PanelMaterial opacity={0.85} />
        </RoundedBox>
        <mesh position={[-0.55, 0.42, 0.04]}>
          <boxGeometry args={[0.7, 0.07, 0.02]} />
          <meshStandardMaterial color={colors.fg} />
        </mesh>
        {BAR_HEIGHTS.map((h, i) => (
          <mesh key={i} position={[-0.7 + i * 0.35, -0.42 + (h * 0.7) / 2, 0.04]}>
            <boxGeometry args={[0.2, h * 0.7, 0.03]} />
            <meshStandardMaterial
              color={i === 3 ? colors.accent : colors.muted}
              emissive={i === 3 ? colors.accent : colors.muted}
              emissiveIntensity={i === 3 ? 0.6 : 0.1}
            />
          </mesh>
        ))}
      </Float>
    </Appear>
  );
}

const NODE_POINTS: Vec3[] = [
  [0, 0, 0],
  [0.9, 0.5, -0.2],
  [1.6, -0.2, 0.2],
  [0.7, -0.9, 0],
  [-0.6, -0.6, 0.15],
];
const NODE_LINKS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 0],
  [0, 3],
];

/** Abstract productivity nodes: small spheres joined by thin lines. */
export function NodeCluster({ position, delay, exit }: Omit<PlacedProps, 'rotation'>) {
  const { colors } = useScene();
  const geometry = useMemo(() => {
    const points: Vector3[] = [];
    NODE_LINKS.forEach(([a, b]) => points.push(new Vector3(...NODE_POINTS[a]), new Vector3(...NODE_POINTS[b])));
    return new BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <Appear position={position} delay={delay} exit={exit}>
      <Float speed={1} floatIntensity={0.5}>
        <lineSegments geometry={geometry}>
          <lineBasicMaterial color={colors.accent2} transparent opacity={0.45} />
        </lineSegments>
        {NODE_POINTS.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[i === 0 ? 0.1 : 0.07, 14, 14]} />
            <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.8} />
          </mesh>
        ))}
      </Float>
    </Appear>
  );
}
