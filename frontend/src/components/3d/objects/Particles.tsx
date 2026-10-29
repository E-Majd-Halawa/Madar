import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, type Points, type ShaderMaterial } from 'three';
import { HERO_TIMELINE } from '@/constants/heroTimeline';
import { clamp01, seededRandom } from '@/utils/math';
import { QUALITY } from '@/utils/quality';
import { useScene } from '../SceneContext';

/** Camera distance at which a particle has exactly its base size. */
const REF_DISTANCE = 7.5;

/** Drifting dust. One Points object; the whole cloud rotates, so there is no per-particle work per frame. */
export function Particles() {
  const { colors, tier, instant } = useScene();
  const count = QUALITY[tier].particles;
  const points = useRef<Points>(null);
  const material = useRef<ShaderMaterial>(null);

  const { positions, sizes } = useMemo(() => {
    const random = seededRandom(7);
    const posArray = new Float32Array(count * 3);
    const sizeArray = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      posArray[i * 3] = (random() - 0.5) * 16;
      posArray[i * 3 + 1] = (random() - 0.5) * 9;
      posArray[i * 3 + 2] = (random() - 0.5) * 9 - 1;

      // CSS px at REF_DISTANCE: ~85% are 1.0-2.0, ~15% are 2.0-3.0
      const r = random();
      sizeArray[i] = r < 0.85 ? 1.0 + random() * 1.0 : 2.0 + random() * 1.0;
    }
    return { positions: posArray, sizes: sizeArray };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(colors.accent2) },
      uOpacity: { value: 0 },
      uPixelRatio: { value: 1 },
      uRefDist: { value: REF_DISTANCE },
      uMinPx: { value: 1.0 },
      uMaxPx: { value: 4.0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state, dt) => {
    if (points.current) points.current.rotation.y += dt * 0.02;
    const mat = material.current;
    if (!mat) return;
    const ramp = instant ? 1 : clamp01((state.clock.elapsedTime - HERO_TIMELINE.particles) / 1.2);
    mat.uniforms.uOpacity.value = ramp * (colors.isLight ? 0.5 : 0.7);
    mat.uniforms.uColor.value.set(colors.accent2);
    const dpr = state.viewport.dpr;
    mat.uniforms.uPixelRatio.value = dpr;
    mat.uniforms.uMinPx.value = 1.0 * dpr;
    mat.uniforms.uMaxPx.value = 4.0 * dpr;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={`
          attribute float aSize;
          uniform float uPixelRatio;
          uniform float uRefDist;
          uniform float uMinPx;
          uniform float uMaxPx;

          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float depth = max(-mvPosition.z, 0.5);
            float px = aSize * uPixelRatio * (uRefDist / depth);
            gl_PointSize = clamp(px, uMinPx, uMaxPx);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uOpacity;

          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float edge = 1.0 - smoothstep(0.3, 0.5, dist);
            gl_FragColor = vec4(uColor, uOpacity * edge);
            #include <colorspace_fragment>
          }
        `}
        transparent
        depthWrite={false}
      />
    </points>
  );
}