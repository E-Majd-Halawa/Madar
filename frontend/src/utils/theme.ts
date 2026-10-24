import type { AnimationLevel, ThemeChoice, ThemeName } from '@/types';

export interface ThemePreferences {
  theme: ThemeChoice;
  accent: string | null;
  animation: AnimationLevel;
  effects3d: boolean;
}

export function resolveTheme(choice: ThemeChoice): ThemeName {
  if (choice !== 'system') return choice;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'midnight';
}

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Readable text color (as RGB triplet) to place on top of the accent. */
function contrastOn([r, g, b]: [number, number, number]): string {
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? '3 12 9' : '255 255 255';
}

export function applyThemePreferences(prefs: ThemePreferences): void {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.dataset.theme = resolveTheme(prefs.theme);
  root.dataset.motion = reducedMotion ? 'off' : prefs.animation;
  root.dataset.fx = prefs.effects3d ? 'on' : 'off';

  const rgb = prefs.accent ? hexToRgb(prefs.accent) : null;
  if (rgb) {
    root.style.setProperty('--accent', rgb.join(' '));
    root.style.setProperty('--accent-fg', contrastOn(rgb));
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-fg');
  }
}
