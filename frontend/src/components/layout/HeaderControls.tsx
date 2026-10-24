import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/themeStore';
import { resolveTheme } from '@/utils/theme';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

/** Quick theme (light/dark) and language toggles. Full options live in Settings. */
export function HeaderControls() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const isLight = resolveTheme(theme) === 'light';

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setTheme(isLight ? 'midnight' : 'light')}
        aria-label={t('landing.nav.toggleTheme')}
        className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
      >
        {isLight ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
      </button>
      <LanguageToggle />
    </div>
  );
}
