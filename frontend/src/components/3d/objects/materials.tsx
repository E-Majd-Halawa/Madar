import type { Color } from 'three';
import { QUALITY } from '@/utils/quality';
import { useScene } from '../SceneContext';

/** Glass-like surface. Physical material on high tier, cheaper standard material elsewhere. */
export function PanelMaterial({ color, opacity = 0.92 }: { color?: Color; opacity?: number }) {
  const { colors, tier } = useScene();
  const base = color ?? colors.surface2;

  return QUALITY[tier].physicalMaterials ? (
    <meshPhysicalMaterial
      color={base}
      roughness={0.25}
      metalness={0.3}
      clearcoat={1}
      clearcoatRoughness={0.2}
      transparent
      opacity={opacity}
    />
  ) : (
    <meshStandardMaterial color={base} roughness={0.4} metalness={0.25} transparent opacity={opacity} />
  );
}
