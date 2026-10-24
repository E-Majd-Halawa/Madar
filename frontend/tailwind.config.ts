import type { Config } from 'tailwindcss';

// Every color reads a CSS variable (RGB triplet) so themes, accent overrides and
// opacity modifiers (bg-accent/20) all work from one source of truth: src/index.css
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        border: token('border'),
        fg: token('fg'),
        muted: token('muted'),
        accent: token('accent'),
        'accent-2': token('accent-2'),
        'accent-fg': token('accent-fg'),
        danger: token('danger'),
        warning: token('warning'),
        success: token('success'),
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.25rem' },
      boxShadow: {
        glow: '0 0 32px -8px rgb(var(--accent) / calc(var(--glow) * 0.7))',
        depth: '0 24px 48px -24px rgb(0 0 0 / 0.55)',
      },
    },
  },
  plugins: [],
} satisfies Config;
