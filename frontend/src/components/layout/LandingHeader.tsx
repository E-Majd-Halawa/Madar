import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import { HeaderControls } from './HeaderControls';

export function LandingHeader() {
  const { t } = useTranslation();
  const signedIn = useAuthStore((s) => s.session !== null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const links = [
    { to: `${ROUTES.home}#features`, label: t('landing.nav.features') },
    { to: ROUTES.pricing, label: t('landing.nav.pricing') },
    { to: `${ROUTES.home}#security`, label: t('landing.nav.security') },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-colors',
        scrolled || open ? 'glass border-x-0 border-t-0' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <Link to={ROUTES.home} aria-label={t('brand.homeLabel', { brand: t('app.name') })} className="text-lg font-semibold tracking-tight">
          {t('app.name')}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <HeaderControls />
          {signedIn ? (
            <ButtonLink to={ROUTES.app.dashboard} variant="primary" size="sm" className="hidden sm:inline-flex">
              {t('landing.nav.openApp')}
            </ButtonLink>
          ) : (
            <>
              <ButtonLink to={ROUTES.login} variant="ghost" size="sm" className="hidden sm:inline-flex">
                {t('common.signIn')}
              </ButtonLink>
              <ButtonLink to={ROUTES.register} variant="primary" size="sm" className="hidden sm:inline-flex">
                {t('landing.hero.primary')}
              </ButtonLink>
            </>
          )}
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t('landing.nav.closeMenu') : t('landing.nav.menu')}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t px-6 pb-5 pt-3 md:hidden">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.label}>
                <Link to={link.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-base hover:bg-surface-2">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            {signedIn ? (
              <ButtonLink to={ROUTES.app.dashboard} variant="primary" className="flex-1">
                {t('landing.nav.openApp')}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to={ROUTES.login} className="flex-1">
                  {t('common.signIn')}
                </ButtonLink>
                <ButtonLink to={ROUTES.register} variant="primary" className="flex-1">
                  {t('landing.hero.primary')}
                </ButtonLink>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
