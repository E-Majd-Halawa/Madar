import { toast } from '@/store/toastStore';
import i18n from '@/i18n';

export function registerServiceWorker() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      try {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  const t = i18n.t.bind(i18n);
                  toast.success(t('pwa.updateAvailable'), {
                    actionLabel: t('pwa.reload'),
                    onAction: () => {
                      installingWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    },
                  });
                }
              }
            };
          };
        }).catch(() => {});
      } catch {}
    });
  }
}
