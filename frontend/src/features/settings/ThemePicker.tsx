import { useTranslation } from 'react-i18next';
import { THEME_CHOICES } from '@/constants/themes';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/cn';

export function ThemePicker() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <fieldset>
      <legend className="sr-only">{t('foundation.theme')}</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {THEME_CHOICES.map((id) => {
          const selected = theme === id;
          return (
            <label
              key={id}
              className="cursor-pointer rounded-xl has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg"
            >
              <input
                type="radio"
                name="theme"
                value={id}
                checked={selected}
                onChange={() => setTheme(id)}
                className="sr-only"
              />
              <span
                className={cn(
                  'block rounded-xl border p-2 transition',
                  selected ? 'border-accent shadow-glow' : 'border-border/10 hover:border-border/30',
                )}
              >
                {/* Scoped data-theme makes each swatch render in its own palette. */}
                {id === 'system' ? (
                  <span className="flex h-14 overflow-hidden rounded-lg">
                    <span data-theme="midnight" className="flex-1 bg-bg" />
                    <span data-theme="light" className="flex-1 bg-bg" />
                  </span>
                ) : (
                  <span data-theme={id} className="block h-14 rounded-lg bg-bg p-2">
                    <span className="block h-2 w-8 rounded bg-accent" />
                    <span className="mt-1.5 block h-2 w-12 rounded bg-surface-2" />
                    <span className="mt-1.5 block h-2 w-5 rounded bg-accent-2" />
                  </span>
                )}
                <span className="mt-2 block text-center text-xs font-medium">{t(`themes.${id}`)}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
