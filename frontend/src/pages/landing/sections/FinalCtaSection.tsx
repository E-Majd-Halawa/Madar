import { useTranslation } from 'react-i18next';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { ROUTES } from '@/constants/routes';

export function FinalCtaSection() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <RevealGroup>
        <RevealItem className="glass relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-16">
          <div aria-hidden className="bg-ambient absolute inset-0 opacity-80" />
          <div className="relative">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t('landing.cta.title')}</h2>
            <p className="mx-auto mt-3 max-w-md text-muted">{t('landing.cta.subtitle')}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink to={ROUTES.login} variant="primary" size="lg">
                {t('landing.cta.primary')}
              </ButtonLink>
            </div>
          </div>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
