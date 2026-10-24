import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import { useSceneColors } from '@/components/3d/useSceneColors';
import { detectTier, QUALITY } from '@/utils/quality';
import type { OrbMode } from './types';

interface AiOrbStageProps {
  mode: OrbMode;
  compact?: boolean;
}

type PointerRef = React.MutableRefObject<{ x: number; y: number }>;

const TARGETS = {
  idle: { speed: 1, think: 0, glow: 1, scale: 1 },
  thinking: { speed: 8, think: 1, glow: 2.2, scale: 1.14 },
  answering: { speed: 2.6, think: 0.4, glow: 1.4, scale: 1.07 },
} as const;

const VERT = /* glsl */ `
uniform float uTime;
uniform float uThink;
varying vec3 vN;
varying vec3 vP;
void main() {
  vN = normalize(normalMatrix * normal);
  vec3 p = position;
  float d = sin(p.x * 3.0 + uTime * 2.0) * sin(p.y * 3.0 + uTime * 1.7) * sin(p.z * 3.0 + uTime * 2.3);
  p += normal * d * 0.10 * uThink;
  vP = p;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uColor2;
uniform float uTime;
uniform float uGlow;
varying vec3 vN;
varying vec3 vP;
void main() {
  float f = pow(1.0 - max(dot(normalize(vN), vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
  float band = 0.5 + 0.5 * sin(vP.y * 6.0 - uTime * 1.5);
  vec3 col = mix(uColor2, uColor, clamp(f + band * 0.3, 0.0, 1.0));
  float a = clamp(0.28 + f * 0.95 * uGlow, 0.0, 1.0);
  gl_FragColor = vec4(col * (0.55 + f * uGlow), a);
  #include <colorspace_fragment>
}`;

function OrbMesh({ mode, pointer, reduce }: { mode: OrbMode; pointer: PointerRef; reduce: boolean }) {
  const colors = useSceneColors();
  const groupRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const ringARef = useRef<THREE.Group>(null);
  const ringBRef = useRef<THREE.Group>(null);
  const ptsRef = useRef<THREE.Points>(null);
  const modeRef = useRef<OrbMode>(mode);
  const sim = useRef({ speed: 1, think: 0, glow: 1, scale: 1 });

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uThink: { value: 0 },
      uGlow: { value: 1 },
      uColor: { value: new THREE.Color(0x2ee59d) },
      uColor2: { value: new THREE.Color(0x0b5c6b) },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uColor.value.copy(colors.accent);
  }, [colors, uniforms]);

  const particlesGeometry = useMemo(() => {
    const tier = detectTier();
    const count = QUALITY[tier].particles || 520;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const th = 2 * Math.PI * Math.random();
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 1.7 + Math.random() * 1.3;
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.8;
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geom;
  }, []);

  useEffect(() => () => particlesGeometry.dispose(), [particlesGeometry]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const m = modeRef.current;
    const base = TARGETS[m];
    const s = sim.current;

    const tSpeed = reduce ? 0.3 : base.speed;
    const tThink = reduce ? 0 : base.think;
    const tScale = m === 'idle' ? 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.025 : base.scale;
    const ease = 1 - Math.pow(1 - (m === 'thinking' ? 0.14 : 0.07), dt * 60);

    s.speed += (tSpeed - s.speed) * ease;
    s.think += (tThink - s.think) * ease;
    s.glow += (base.glow - s.glow) * ease;
    s.scale += (tScale - s.scale) * ease;

    uniforms.uTime.value += dt * (1 + (s.speed - 1) * 0.7);
    uniforms.uThink.value = s.think;
    uniforms.uGlow.value = s.glow;
    g.scale.setScalar(s.scale);

    if (shellRef.current) {
      shellRef.current.rotation.y += dt * 0.25 * s.speed;
      shellRef.current.rotation.x += dt * 0.1 * s.speed;
    }
    if (ringARef.current) ringARef.current.rotation.z += dt * 0.5 * s.speed;
    if (ringBRef.current) ringBRef.current.rotation.z -= dt * 0.35 * s.speed;
    if (ptsRef.current) ptsRef.current.rotation.y += dt * 0.06 * s.speed;

    const px = reduce ? 0 : pointer.current.x;
    const py = reduce ? 0 : pointer.current.y;
    g.rotation.y += (px * 0.45 - g.rotation.y) * 0.05;
    g.rotation.x += (py * 0.25 - g.rotation.x) * 0.05;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={VERT}
          fragmentShader={FRAG}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={shellRef}>
        <icosahedronGeometry args={[1.35, 2]} />
        <meshBasicMaterial color={0x38d4e8} wireframe transparent opacity={0.16} toneMapped={false} />
      </mesh>

      <group rotation={[1.2, 0.3, 0]}>
        <group ref={ringARef}>
          <mesh>
            <torusGeometry args={[1.75, 0.008, 8, 160]} />
            <meshBasicMaterial color={0x2ee59d} transparent opacity={0.55} toneMapped={false} />
          </mesh>
        </group>
      </group>

      <group rotation={[0.4, -0.8, 0.5]}>
        <group ref={ringBRef}>
          <mesh>
            <torusGeometry args={[2.05, 0.008, 8, 160]} />
            <meshBasicMaterial color={0x38d4e8} transparent opacity={0.55} toneMapped={false} />
          </mesh>
        </group>
      </group>

      <points ref={ptsRef} geometry={particlesGeometry} frustumCulled={false}>
        <pointsMaterial
          color={0x9dfcd2}
          size={0.028}
          sizeAttenuation
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

export function AiOrbStage({ mode, compact }: AiOrbStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [webglSupported, setWebglSupported] = useState(true);
  const [visible, setVisible] = useState(true);
  const reduce = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current.x = THREE.MathUtils.clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      pointer.current.y = THREE.MathUtils.clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => {
      window.removeEventListener('pointermove', onMove);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={stageRef} className="relative h-full w-full">
      {webglSupported && !reduce ? (
        <Canvas
          flat
          dpr={[1, 2]}
          frameloop={visible ? 'always' : 'never'}
          camera={{ fov: 45, position: [0, 0, 5.8], near: 0.1, far: 50 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          className="absolute inset-0 h-full w-full"
          style={{ pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <OrbMesh mode={mode} pointer={pointer} reduce={reduce} />
        </Canvas>
      ) : (
        <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <div className="size-[150px] animate-pulse rounded-full bg-gradient-to-br from-accent/40 via-accent to-accent/60 shadow-glow motion-reduce:animate-none" />
        </div>
      )}
    </div>
  );
}
