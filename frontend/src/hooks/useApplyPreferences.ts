import { useEffect } from 'react';
import i18n from '@/i18n';
import { resolveDirection, useSettingsStore } from '@/store/settingsStore';
import { useThemeStore } from '@/store/themeStore';
import { applyThemePreferences } from '@/utils/theme';

/** Writes theme, accent, animation and 3D preferences onto <html>. Re-applies when the OS changes. */
export function useApplyTheme(): void {
  const theme = useThemeStore((s) => s.theme);
  const accent = useThemeStore((s) => s.accent);
  const animation = useThemeStore((s) => s.animation);
  const effects3d = useThemeStore((s) => s.effects3d);

  useEffect(() => {
    const apply = () => applyThemePreferences({ theme, accent, animation, effects3d });
    apply();

    const queries = [
      window.matchMedia('(prefers-color-scheme: light)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
    ];
    queries.forEach((q) => q.addEventListener('change', apply));
    return () => queries.forEach((q) => q.removeEventListener('change', apply));
  }, [theme, accent, animation, effects3d]);
}

/** Keeps i18next, <html lang> and <html dir> in sync with the language settings. */
export function useApplyLocale(): void {
  const language = useSettingsStore((s) => s.language);
  const direction = useSettingsStore((s) => s.direction);

  useEffect(() => {
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = resolveDirection(language, direction);
  }, [language, direction]);
}
