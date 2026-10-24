import { AnimatePresence, motion } from 'framer-motion';
import { PartyPopper, Sparkles } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ROUTES } from '@/constants/routes';
import {
  HoursStep,
  LanguageStep,
  NotificationsStep,
  ThemeStep,
  TimezoneStep,
  UsageStep,
  WorkspaceStep,
  type StepProps,
} from '@/features/onboarding/steps';
import { useMotion } from '@/hooks/useMotion';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import type { UserPreferences } from '@/types';

type StepId = 'welcome' | 'usage' | 'workspace' | 'theme' | 'language' | 'timezone' | 'hours' | 'notifications' | 'done';

const ORDER: StepId[] = ['welcome', 'usage', 'workspace', 'theme', 'language', 'timezone', 'hours', 'notifications', 'done'];
const SKIPPABLE: StepId[] = ['usage', 'workspace', 'theme', 'language', 'timezone', 'hours', 'notifications'];

const BODY: Partial<Record<StepId, (props: StepProps) => ReactNode>> = {
  usage: (p) => <UsageStep {...p} />,
  workspace: (p) => <WorkspaceStep {...p} />,
  theme: () => <ThemeStep />,
  language: () => <LanguageStep />,
  timezone: (p) => <TimezoneStep {...p} />,
  hours: (p) => <HoursStep {...p} />,
  notifications: (p) => <NotificationsStep {...p} />,
};

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { presets } = useMotion();
  const user = useAuthStore((s) => s.session?.user);
  const stored = usePreferencesStore((s) => s.prefs);
  const status = usePreferencesStore((s) => s.status);
  const save = usePreferencesStore((s) => s.save);

  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Partial<UserPreferences>>({});
  const prefs = { ...stored, ...draft };
  const patch = (change: Partial<UserPreferences>) => setDraft((d) => ({ ...d, ...change }));

  if (!user) return <Navigate to={ROUTES.login} replace />;
  if (status === 'ready' && stored.onboardingCompleted && index === 0) return <Navigate to={ROUTES.app.dashboard} replace />;

  const step = ORDER[index];
  const last = step === 'done';
  const content = BODY[step];

  const finish = async () => {
    await save(user.id, { ...draft, onboardingCompleted: true });
    navigate(ROUTES.app.dashboard, { replace: true });
  };

  return (
    <main className="bg-ambient grid min-h-dvh place-items-center px-5 py-8">
      <div className="w-full max-w-xl">
        <div className="mb-4 flex items-center justify-between text-xs text-muted">
          <span>{t('app.name')}</span>
          <span>{t('onboarding.step', { current: Math.min(index + 1, ORDER.length), total: ORDER.length })}</span>
        </div>
        <ProgressBar value={((index + 1) / ORDER.length) * 100} label={t('onboarding.step', { current: index + 1, total: ORDER.length })} className="mb-6" />

        <div className="glass min-h-[22rem] rounded-2xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} variants={presets.fadeUp} initial="hidden" animate="visible" exit="hidden">
              {step === 'welcome' && (
                <div className="text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/10 text-accent shadow-glow">
                    <Sparkles className="size-7" aria-hidden />
                  </span>
                  <h1 className="mt-5 text-2xl font-semibold tracking-tight">{t('onboarding.welcome.title', { name: user.fullName.split(' ')[0] })}</h1>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t('onboarding.welcome.body')}</p>
                </div>
              )}
              {content && (
                <>
                  <h1 className="text-xl font-semibold tracking-tight">{t(`onboarding.${step}.title`)}</h1>
                  {t(`onboarding.${step}.hint`, { defaultValue: '' }) && (
                    <p className="mt-1 text-sm text-muted">{t(`onboarding.${step}.hint`, { defaultValue: '' })}</p>
                  )}
                  <div className="mt-6">{content({ prefs, patch })}</div>
                </>
              )}
              {last && (
                <div className="text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/10 text-success">
                    <PartyPopper className="size-7" aria-hidden />
                  </span>
                  <h1 className="mt-5 text-2xl font-semibold tracking-tight">{t('onboarding.done.title')}</h1>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t('onboarding.done.body')}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setIndex((i) => i - 1)} disabled={index === 0 || last}>
            {t('common.back')}
          </Button>
          <div className="flex gap-2">
            {SKIPPABLE.includes(step) && (
              <Button variant="ghost" onClick={() => setIndex((i) => i + 1)}>
                {t('common.skip')}
              </Button>
            )}
            {last ? (
              <Button variant="primary" onClick={() => void finish()}>
                {t('onboarding.done.cta')}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setIndex((i) => i + 1)}>
                {t('common.next')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
