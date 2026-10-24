import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HeroVisual, type HeroIntro } from '@/components/3d/HeroVisual';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { HERO_TIMELINE } from '@/constants/heroTimeline';
import { ROUTES } from '@/constants/routes';
import { useMotion } from '@/hooks/useMotion';
import { resolveDirection, useSettingsStore } from '@/store/settingsStore';

const reveal: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function HeroSection() {
  const { t } = useTranslation();
  const { enabled } = useMotion();
  const language = useSettingsStore((s) => s.language);
  const direction = useSettingsStore((s) => s.direction);
  const isRtl = resolveDirection(language, direction) === 'rtl';
  const section = useRef<HTMLElement>(null);
  const [intro, setIntro] = useState<HeroIntro>('pending');

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] });
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  // Keep the first answer: a late "cinematic" signal must not restart text that is already visible.
  const handleIntro = useCallback((next: Exclude<HeroIntro, 'pending'>) => {
    setIntro((current) => (current === 'pending' ? next : current));
  }, []);

  // Safety net: never leave the headline hidden if the 3D chunk is slow to load.
  useEffect(() => {
    if (intro !== 'pending') return;
    const id = window.setTimeout(() => handleIntro('instant'), 3500);
    return () => window.clearTimeout(id);
  }, [intro, handleIntro]);

  const cinematic = intro === 'cinematic' && enabled;
  const delayFor = (cinematicDelay: number, order: number) => (cinematic ? cinematicDelay : order * 0.08);
  const state = intro === 'pending' ? 'hidden' : 'visible';

  return (
    <section ref={section} className="relative -mt-16 h-[100svh] min-h-[640px] overflow-hidden">
      <HeroVisual progress={scrollYProgress} onIntro={handleIntro} isRtl={isRtl} />

      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl items-end px-6 pb-20 pt-24 justify-start lg:items-center lg:pb-0"
      >
        <div className="pointer-events-auto max-w-xl text-start">
          <motion.div variants={reveal} initial="hidden" animate={state} custom={delayFor(HERO_TIMELINE.headline - 0.1, 0)}>
            <Badge tone="accent">{t('landing.hero.badge')}</Badge>
          </motion.div>

          <motion.h1
            variants={reveal}
            initial="hidden"
            animate={state}
            custom={delayFor(HERO_TIMELINE.headline, 1)}
            className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            {t('landing.hero.title')}
          </motion.h1>

          <motion.p
            variants={reveal}
            initial="hidden"
            animate={state}
            custom={delayFor(HERO_TIMELINE.headline + 0.15, 2)}
            className="mt-5 max-w-lg text-base text-muted sm:text-lg"
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          <motion.div
            variants={reveal}
            initial="hidden"
            animate={state}
            custom={delayFor(HERO_TIMELINE.cta, 3)}
            className="mt-8 flex flex-wrap gap-3"
          >
            <ButtonLink to={ROUTES.login} variant="primary" size="lg">
              {t('landing.hero.primary')}
            </ButtonLink>
          </motion.div>

          <motion.p
            variants={reveal}
            initial="hidden"
            animate={state}
            custom={delayFor(HERO_TIMELINE.cta + 0.2, 4)}
            className="mt-6 text-sm text-muted"
          >
            {t('landing.hero.indicator')}
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
