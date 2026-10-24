import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import './index.css';
import './i18n';
import { App } from './app/App';
import { enforceRememberMe } from './store/authStore';
import { registerServiceWorker } from './utils/registerServiceWorker';

enforceRememberMe();
registerServiceWorker();

try {
  const raw = window.localStorage.getItem('tf3d.settings');
  if (raw) {
    const parsed = JSON.parse(raw);
    const lang = parsed?.state?.language;
    const dir = parsed?.state?.direction;
    if (lang === 'ar' || lang === 'en') {
      document.documentElement.lang = lang;
      const resolvedDir = dir === 'auto' ? (lang === 'ar' ? 'rtl' : 'ltr') : (dir || 'ltr');
      document.documentElement.dir = resolvedDir;
    }
  }
} catch {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
