import { useTranslation } from 'react-i18next';
import { useSettingsStore, resolveDirection } from '@/store/settingsStore';
import i18n from '@/i18n';

export const LANGUAGE_NATIVE_NAMES = {
  en: 'English',
  ar: 'العربية',
} as const;

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const direction = useSettingsStore((s) => s.direction);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const targetLang = language === 'en' ? 'ar' : 'en';
  const targetNativeName = LANGUAGE_NATIVE_NAMES[targetLang];

  const handleToggle = () => {
    setLanguage(targetLang);
    void i18n.changeLanguage(targetLang);
    document.documentElement.lang = targetLang;
    document.documentElement.dir = resolveDirection(targetLang, direction);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={t('cmd.switchLanguage', { lang: targetNativeName })}
      lang={targetLang}
      className={`h-9 rounded-lg px-2.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg ${className}`}
    >
      {targetNativeName}
    </button>
  );
}
