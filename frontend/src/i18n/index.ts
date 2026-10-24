import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useSettingsStore } from '@/store/settingsStore';
import ar from './locales/ar.json';
import arApp from './locales/ar.app.json';
import arLanding from './locales/ar.landing.json';
import en from './locales/en.json';
import enApp from './locales/en.app.json';
import enLanding from './locales/en.landing.json';

type Tree = { [key: string]: string | Tree };

/** Merges translation files so feature files can extend shared groups like "common" and "nav". */
function merge(base: Tree, extra: Tree): Tree {
  const out: Tree = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const existing = out[key];
    out[key] =
      typeof value === 'object' && typeof existing === 'object' ? merge(existing, value) : value;
  }
  return out;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: merge(merge(en as Tree, enApp as Tree), { landing: enLanding }) },
    ar: { translation: merge(merge(ar as Tree, arApp as Tree), { landing: arLanding }) },
  },
  lng: useSettingsStore.getState().language,
  fallbackLng: 'en',
  // Permission ids contain ":" (e.g. "tasks:manage_own"), so the namespace separator is disabled.
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
