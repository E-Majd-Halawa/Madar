export type QualityTier = 'high' | 'medium' | 'low';

export interface QualitySettings {
  dpr: number;
  particles: number;
  segments: number;
  environment: boolean;
  contactShadows: boolean;
  physicalMaterials: boolean;
  /** clock, panels, shapes, node graph, extra spheres */
  extras: boolean;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: { dpr: 2, particles: 520, segments: 48, environment: true, contactShadows: true, physicalMaterials: true, extras: true },
  medium: { dpr: 1.5, particles: 240, segments: 32, environment: true, contactShadows: false, physicalMaterials: false, extras: true },
  low: { dpr: 1, particles: 90, segments: 20, environment: false, contactShadows: false, physicalMaterials: false, extras: false },
};

/** Desktop -> high, tablet or modest hardware -> medium, phone -> low. */
export function detectTier(): QualityTier {
  const width = window.innerWidth;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (width < 768) return 'low';
  if (width < 1200 || cores <= 4 || memory <= 4) return 'medium';
  return 'high';
}

export const lowerTier = (tier: QualityTier): QualityTier => (tier === 'high' ? 'medium' : 'low');

/** Mobile-only canvas pixel ratio: sharp but capped, lower on very low-memory devices. */
export function getMobileDpr(): number {
  const pixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const memory = typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory !== undefined && memory <= 2) return 1.25;
  return Math.min(pixelRatio, 2);
}
