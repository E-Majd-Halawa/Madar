import type { AnimationLevel, ThemeChoice, ThemeName } from '@/types';

export const THEMES: ThemeName[] = ['midnight', 'obsidian', 'emerald', 'ocean', 'aurora', 'light'];
export const THEME_CHOICES: ThemeChoice[] = [...THEMES, 'system'];
export const ANIMATION_LEVELS: AnimationLevel[] = ['off', 'low', 'medium', 'high'];

export const ACCENTS = [
  { id: 'emerald', hex: '#10b981' },
  { id: 'cyan', hex: '#22d3ee' },
  { id: 'blue', hex: '#3b82f6' },
  { id: 'violet', hex: '#a78bfa' },
  { id: 'amber', hex: '#f59e0b' },
  { id: 'rose', hex: '#f43f5e' },
] as const;
