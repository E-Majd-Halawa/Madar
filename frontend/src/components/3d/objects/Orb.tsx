import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { AdditiveBlending, MathUtils, NormalBlending, type Group, type Mesh, type MeshStandardMaterial, type PointLight, type SpriteMaterial } from 'three';
import { clamp01 } from '@/utils/math';
import { QUALITY } from '@/utils/quality';
import { HERO_TIMELINE } from '@/constants/heroTimeline';
import { getGlowTexture } from '../glowTexture';
import { useScene } from '../SceneContext';
import { useHover } from '../useHover';

/** The central productivity orb: glows at 0.5s, brightens on hover. */
export function Orb() {
  const { colors, tier, instant } = useScene();
  const { hovered, handlers } = useHover();
  const segments = QUALITY[tier].segments;

  const coreMat = useRef<MeshStandardMaterial>(null);
  const haloMat = useRef<SpriteMaterial>(null);
  const light = useRef<PointLight>(null);
  const shell = useRef<Mesh>(null);
  const ringA = useRef<Group>(null);
  const ringB = useRef<Group>(null);
  const glow = useRef(0);

  useFrame((state, dt) => {
    const ramp = instant ? 1 : clamp01((state.clock.elapsedTime - HERO_TIMELINE.orbGlow) / 1.2);
    const target = ramp * (0.7 + colors.glow) * (hovered.current ? 1.5 : 1);
    glow.current = MathUtils.damp(glow.current, target, 4, dt);

    if (coreMat.current) coreMat.current.emissiveIntensity = glow.current * 1.4;
    if (haloMat.current) haloMat.current.opacity = Math.min(0.9, glow.current * 0.45);
    if (light.current) light.current.intensity = glow.current * 14;
    if (shell.current) {
      shell.current.rotation.y += dt * 0.15;
      shell.current.rotation.x += dt * 0.08;
    }
    if (ringA.current) ringA.current.rotation.z += dt * 0.3;
    if (ringB.current) ringB.current.rotation.z -= dt * 0.2;
  });

  return (
    <group>
      <pointLight ref={light} color={colors.accent} distance={11} decay={2} />

      <sprite scale={[5.2, 5.2, 1]}>
        <spriteMaterial
          ref={haloMat}
          map={getGlowTexture()}
          color={colors.accent}
          transparent
          opacity={0}
          depthWrite={false}
          blending={colors.isLight ? NormalBlending : AdditiveBlending}
        />
      </sprite>

      <mesh {...handlers}>
        <sphereGeometry args={[0.9, segments, segments]} />
        <meshStandardMaterial
          ref={coreMat}
          color={colors.accent}
          emissive={colors.accent}
          emissiveIntensity={0}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>

      <mesh ref={shell}>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshBasicMaterial color={colors.accent2} wireframe transparent opacity={0.35} />
      </mesh>

      <group rotation={[1.2, 0.3, 0]}>
        <group ref={ringA}>
          <mesh>
            <torusGeometry args={[1.45, 0.012, 8, 96]} />
            <meshBasicMaterial color={colors.accent2} transparent opacity={0.6} />
          </mesh>
          <mesh position={[1.45, 0, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial color={colors.accent2} />
          </mesh>
        </group>
      </group>

      <group rotation={[0.4, -0.8, 0.5]}>
        <group ref={ringB}>
          <mesh>
            <torusGeometry args={[1.75, 0.01, 8, 96]} />
            <meshBasicMaterial color={colors.accent} transparent opacity={0.4} />
          </mesh>
          <mesh position={[-1.75, 0, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshBasicMaterial color={colors.accent} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
