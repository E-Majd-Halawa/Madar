import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/themeStore';

export interface ChartColors {
  accent: string;
  accent2: string;
  muted: string;
  grid: string;
  danger: string;
  warning: string;
  surface: string;
}

const read = (): ChartColors => {
  const style = getComputedStyle(document.documentElement);
  const rgb = (name: string, alpha = 1) => `rgb(${style.getPropertyValue(name).trim().split(/\s+/).join(' ')} / ${alpha})`;
  return {
    accent: rgb('--accent'),
    accent2: rgb('--accent-2'),
    muted: rgb('--muted'),
    grid: rgb('--border', 0.08),
    danger: rgb('--danger'),
    warning: rgb('--warning'),
    surface: rgb('--surface'),
  };
};

/** Resolved theme colors for Recharts (SVG attributes cannot use CSS variables directly). Updates when the theme changes. */
export function useChartColors(): ChartColors {
  const theme = useThemeStore((s) => s.theme);
  const accent = useThemeStore((s) => s.accent);
  const [colors, setColors] = useState(read);
  useEffect(() => {
    // Wait a frame so the theme attribute is applied to <html> first.
    const id = requestAnimationFrame(() => setColors(read()));
    return () => cancelAnimationFrame(id);
  }, [theme, accent]);
  return colors;
}
