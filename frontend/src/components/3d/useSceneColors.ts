import { useEffect, useState } from 'react';
import { Color, SRGBColorSpace } from 'three';

export interface SceneColors {
  bg: Color;
  surface: Color;
  surface2: Color;
  fg: Color;
  muted: Color;
  accent: Color;
  accent2: Color;
  glow: number;
  isLight: boolean;
}

function readColors(): SceneColors {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const color = (name: string) => {
    const [r, g, b] = style.getPropertyValue(name).trim().split(/\s+/).map(Number);
    return new Color().setRGB((r || 0) / 255, (g || 0) / 255, (b || 0) / 255, SRGBColorSpace);
  };
  return {
    bg: color('--bg'),
    surface: color('--surface'),
    surface2: color('--surface-2'),
    fg: color('--fg'),
    muted: color('--muted'),
    accent: color('--accent'),
    accent2: color('--accent-2'),
    glow: Number(style.getPropertyValue('--glow')) || 0.5,
    isLight: root.dataset.theme === 'light',
  };
}

/** Reads the active CSS theme tokens, so the 3D scene follows theme, accent and glow changes. */
export function useSceneColors(): SceneColors {
  const [colors, setColors] = useState(readColors);

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(readColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-fx', 'style'],
    });
    setColors(readColors());
    return () => observer.disconnect();
  }, []);

  return colors;
}
