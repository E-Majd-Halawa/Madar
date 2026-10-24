import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import { useMemo } from 'react';
import { HERO_TIMELINE } from '@/constants/heroTimeline';
import { QUALITY, type QualityTier } from '@/utils/quality';
import { CameraRig } from './CameraRig';
import { CalendarObject } from './objects/CalendarObject';
import { ClockObject, FolderObject, NotificationBubble } from './objects/DeskObjects';
import { GeometricShape, GlassSphere, NodeCluster, UiPanel } from './objects/Decor';
import { Orb } from './objects/Orb';
import { Particles } from './objects/Particles';
import { TaskCard } from './objects/TaskCard';
import { SceneContext, useScene, type SceneContextValue } from './SceneContext';
import { useSceneColors } from './useSceneColors';

/**
 * Scene layout lives here as data so composition is easy to tune.
 * Coordinates are relative to the orb; `exit` is how far each object drifts as the hero scrolls away.
 */
const { cards, objects } = HERO_TIMELINE;

function Lights() {
  const { colors, tier, isRtl } = useScene();
  const q = QUALITY[tier];
  return (
    <>
      <fog attach="fog" args={[colors.bg, 9, 26]} />
      <ambientLight intensity={colors.isLight ? 0.9 : 0.4} />
      <directionalLight position={isRtl ? [-4, 6, 5] : [4, 6, 5]} intensity={colors.isLight ? 1.6 : 1.2} />
      <pointLight position={isRtl ? [4, -2, 3] : [-4, -2, 3]} color={colors.accent2} intensity={6} distance={12} decay={2} />
      {q.environment && (
        <Environment resolution={64} frames={1}>
          <Lightformer intensity={2.2} position={[0, 5, -5]} scale={[10, 3, 1]} />
          <Lightformer intensity={1.4} color={colors.accent2} position={isRtl ? [6, 1, 2] : [-6, 1, 2]} scale={[3, 6, 1]} />
          <Lightformer intensity={1.2} color={colors.accent} position={isRtl ? [-6, -1, 2] : [6, -1, 2]} scale={[3, 6, 1]} />
        </Environment>
      )}
      {q.contactShadows && (
        <ContactShadows position={[0, -3.2, 0]} opacity={0.35} scale={14} blur={2.6} far={5} resolution={256} frames={Infinity} />
      )}
    </>
  );
}

function SceneContent() {
  const { tier, isRtl } = useScene();
  const extras = QUALITY[tier].extras;
  const width = useThree((s) => s.size.width);
  const wide = width >= 900;

  // Symmetrically mirror placement, rotation and drift across the YZ plane in RTL
  const flip = (v: [number, number, number]): [number, number, number] => (isRtl ? [-v[0], v[1], v[2]] : v);
  const flipRot = (r?: [number, number, number]): [number, number, number] | undefined =>
    r && isRtl ? [r[0], -r[1], -r[2]] : r;
  const flipExit = (e?: [number, number, number]): [number, number, number] | undefined =>
    e && isRtl ? [-e[0], e[1], e[2]] : e;

  const groupX = wide ? (isRtl ? -2.1 : 2.1) : 0;
  const groupY = wide ? 0 : 1.1;

  return (
    <>
      <CameraRig />
      <Lights />
      <Particles />

      <group position={[groupX, groupY, 0]} scale={wide ? 1 : 0.7}>
        <Orb />

        <TaskCard position={flip([-1.9, 1.3, 0.8])} rotation={flipRot([0.05, 0.35, -0.05])} delay={cards} done exit={flipExit([-3, 0.6, 0])} />
        <TaskCard position={flip([2.5, 1.5, -0.4])} rotation={flipRot([0, -0.3, 0.04])} delay={cards + 0.12} exit={flipExit([3, 0.6, 0])} lines={[0.8, 0.5]} />
        <TaskCard position={flip([-1.7, -1.6, 0.4])} rotation={flipRot([0, 0.25, 0.03])} delay={cards + 0.24} exit={flipExit([-3, -0.6, 0])} lines={[0.9, 0.7]} />
        {extras && (
          <TaskCard position={flip([2.4, -1.3, 1])} rotation={flipRot([0, -0.35, -0.03])} delay={cards + 0.36} done exit={flipExit([3, -0.6, 0])} />
        )}

        <CalendarObject position={flip([-0.4, 2.3, -0.8])} rotation={flipRot([0.1, 0.15, 0])} delay={objects} exit={flipExit([0, 2.5, 0])} />
        <FolderObject position={flip([-0.6, -2.4, -0.4])} rotation={flipRot([0.15, 0.2, 0])} delay={objects + 0.12} exit={flipExit([0, -2.5, 0])} />
        <NotificationBubble position={flip([1.4, 1.7, 1.4])} delay={objects + 0.24} exit={flipExit([2, 1.5, 0])} />

        {extras && (
          <>
            <ClockObject position={flip([3.1, 0.1, -0.6])} rotation={flipRot([0, -0.3, 0])} delay={objects + 0.1} exit={flipExit([3.5, 0, 0])} />
            <FolderObject position={flip([3.2, -2.1, -1])} rotation={flipRot([0.1, -0.35, 0])} delay={objects + 0.3} exit={flipExit([3, -2, 0])} />
            <UiPanel position={flip([-3.2, -0.5, -1.8])} rotation={flipRot([0, 0.4, 0])} delay={objects + 0.2} exit={flipExit([-3.5, 0, 0])} />
            <NotificationBubble position={flip([-1.6, 0.3, 1.6])} delay={objects + 0.35} exit={flipExit([-2, 0.5, 0])} />
            <GlassSphere position={flip([1.9, -0.4, 1.5])} radius={0.35} delay={objects + 0.15} exit={flipExit([2.5, 0, 0])} />
            <GlassSphere position={flip([-2.3, -0.9, -1.5])} radius={0.5} delay={objects + 0.25} exit={flipExit([-2.5, -1, 0])} />
            <GlassSphere position={flip([0.6, -1.8, 1.9])} radius={0.22} delay={objects + 0.35} exit={flipExit([0, -2, 0])} />
            <GeometricShape kind="octahedron" position={flip([-0.6, 1.7, -2])} delay={objects + 0.3} exit={flipExit([-1, 2, 0])} />
            <GeometricShape kind="icosahedron" position={flip([2.6, 2.6, -2.2])} delay={objects + 0.4} exit={flipExit([1, 2.5, 0])} />
            <GeometricShape kind="torus" position={flip([-3, 1.9, -1.6])} delay={objects + 0.45} exit={flipExit([-2, 2, 0])} />
            <NodeCluster position={flip([-0.4, -0.3, -2.6])} delay={objects + 0.5} exit={flipExit([0, -1, 0])} />
          </>
        )}
      </group>
    </>
  );
}

interface HeroSceneProps {
  tier: QualityTier;
  instant: boolean;
  active: boolean;
  progress: MotionValue<number>;
  onCreated: (canvas: HTMLCanvasElement) => void;
  onDecline: () => void;
  isRtl?: boolean;
}

/** Owns the <Canvas>. Loaded lazily so three.js never blocks the first paint. */
export default function HeroScene({ tier, instant, active, progress, onCreated, onDecline, isRtl = false }: HeroSceneProps) {
  const colors = useSceneColors();
  const settings = QUALITY[tier];

  const context = useMemo<SceneContextValue>(
    () => ({ tier, instant, colors, progress, isRtl }),
    [tier, instant, colors, progress, isRtl],
  );

  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, settings.dpr]}
      camera={{ position: [0, 0, 7.5], fov: 42, near: 0.1, far: 60 }}
      gl={{ alpha: true, antialias: tier !== 'low', powerPreference: 'high-performance' }}
      onCreated={({ gl }) => onCreated(gl.domElement)}
    >
      <SceneContext.Provider value={context}>
        <PerformanceMonitor onDecline={onDecline} />
        <SceneContent />
      </SceneContext.Provider>
    </Canvas>
  );
}
