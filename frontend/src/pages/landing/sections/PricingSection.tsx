import { Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

type Billing = 'monthly' | 'yearly';

const PLANS = [
  { id: 'free', monthly: 0, yearly: 0, popular: false, perUser: false },
  { id: 'pro', monthly: 9, yearly: 7, popular: true, perUser: false },
  { id: 'team', monthly: 19, yearly: 15, popular: false, perUser: true },
] as const;

export function PricingSection() {
  const { t, i18n } = useTranslation();
  const [billing, setBilling] = useState<Billing>('monthly');

  const money = new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('landing.pricing.title')}</h2>
        <p className="mt-3 text-muted">{t('landing.pricing.subtitle')}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <SegmentedControl
            name="billing"
            legend={t('landing.pricing.billing')}
            value={billing}
            onChange={setBilling}
            options={[
              { value: 'monthly', label: t('landing.pricing.monthly') },
              { value: 'yearly', label: t('landing.pricing.yearly') },
            ]}
          />
          {billing === 'yearly' && <Badge tone="accent">{t('landing.pricing.yearlyNote')}</Badge>}
        </div>
      </div>

      <RevealGroup className="mt-12 grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <RevealItem key={plan.id}>
            <article className={cn('glass flex h-full flex-col rounded-2xl p-7', plan.popular && 'border-accent/50 shadow-glow')}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t(`landing.pricing.plans.${plan.id}.name`)}</h3>
                {plan.popular && <Badge tone="accent">{t('landing.pricing.popular')}</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted">{t(`landing.pricing.plans.${plan.id}.desc`)}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight">{money.format(plan[billing])}</span>
                <span className="text-sm text-muted">
                  {plan.perUser ? t('landing.pricing.perUserMonth') : t('landing.pricing.perMonth')}
                </span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {(['b1', 'b2', 'b3', 'b4'] as const).map((key) => (
                  <li key={key} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    {t(`landing.pricing.plans.${plan.id}.${key}`)}
                  </li>
                ))}
              </ul>
              <ButtonLink to={ROUTES.register} variant={plan.popular ? 'primary' : 'secondary'} className="mt-8 w-full">
                {t(`landing.pricing.plans.${plan.id}.cta`)}
              </ButtonLink>
            </article>
          </RevealItem>
        ))}
      </RevealGroup>
      <p className="mt-6 text-center text-xs text-muted">{t('landing.pricing.note')}</p>
    </section>
  );
}
