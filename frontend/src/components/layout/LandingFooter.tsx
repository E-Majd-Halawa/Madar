import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

export function LandingFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const productLinks = [
    { to: `${ROUTES.home}#features`, label: t('landing.nav.features') },
    { to: `${ROUTES.home}#preview`, label: t('landing.preview.title') },
    { to: ROUTES.pricing, label: t('landing.nav.pricing') },
    { to: `${ROUTES.home}#security`, label: t('landing.nav.security') },
  ];

  const accountLinks = [
    { to: ROUTES.login, label: t('common.signIn', 'Sign in') },
    { to: ROUTES.login, label: t('landing.cta.primary', 'Get started') },
  ];

  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="text-base font-semibold tracking-tight">
            <Link to={ROUTES.home} aria-label={t('brand.homeLabel', { brand: t('app.name') })} className="hover:text-accent transition">
              {t('app.name')}
            </Link>
            {' — '}{t('landing.footer.tagline')}
          </p>
          <div className="pt-2">
            <LanguageToggle />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">{t('landing.footer.product')}</p>
          <ul className="mt-3 space-y-2">
            {productLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-sm text-muted transition hover:text-fg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">{t('landing.footer.account')}</p>
          <ul className="mt-3 space-y-2">
            {accountLinks.map((link, idx) => (
              <li key={idx}>
                <Link to={link.to} className="text-sm text-muted transition hover:text-fg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-6 py-5 text-center text-xs text-muted">
        {t('landing.footer.rights', { year, brand: t('app.name') })}
      </div>
    </footer>
  );
}
