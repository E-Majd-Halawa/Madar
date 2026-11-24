import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HeroTaskIllustration } from '@/components/hero/HeroTaskIllustration';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { ROUTES } from '@/constants/routes';
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
  const language = useSettingsStore((s) => s.language);
  const direction = useSettingsStore((s) => s.direction);
  const isRtl = resolveDirection(language, direction) === 'rtl';
  const section = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] });
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const labels = {
    sprintPlanning: t('landing.hero.illustration.sprintPlanning'),
    designReview: t('landing.hero.illustration.designReview'),
    calendarTitle: t('landing.hero.illustration.calendarTitle'),
  };

  return (
    <section ref={section} className="relative">
      {/* Ambient emerald backdrop accents behind the hero window (starfield stays visible) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.35),transparent_62%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_at_bottom,rgba(5,150,105,0.3),transparent_62%)]" />
        <div className="absolute left-1/2 top-1/2 h-72 w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.12),transparent_70%)] blur-2xl" />
        <svg
          className="absolute left-1/2 top-4 w-[140%] -translate-x-1/2 opacity-80"
          viewBox="0 0 1200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 120 C 200 40, 400 200, 600 100 S 1000 20, 1200 120"
            stroke="#10B981"
            strokeWidth="2"
            strokeOpacity="0.6"
          />
          <path
            d="M0 160 C 250 90, 450 180, 650 130 S 950 60, 1200 150"
            stroke="#34D399"
            strokeWidth="1.5"
            strokeOpacity="0.45"
          />
        </svg>
        <svg
          className="absolute bottom-4 left-1/2 w-[140%] -translate-x-1/2 opacity-80"
          viewBox="0 0 1200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 80 C 200 160, 400 0, 600 100 S 1000 180, 1200 80"
            stroke="#059669"
            strokeWidth="2"
            strokeOpacity="0.6"
          />
          <path
            d="M0 40 C 250 110, 450 20, 650 70 S 950 140, 1200 50"
            stroke="#0D9488"
            strokeWidth="1.5"
            strokeOpacity="0.45"
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-2 pb-20 sm:pt-4 lg:pt-5 lg:pb-16">
        <div className="relative mx-auto mb-6 w-full max-w-[1200px] rounded-3xl border border-emerald-500/20 bg-surface/95 p-5 text-fg shadow-[0_24px_70px_-24px_rgba(16,185,129,0.28)] backdrop-blur-md sm:mb-8 sm:p-7 lg:p-9">
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="grid grid-cols-1 gap-8 items-center lg:grid-cols-12 max-w-7xl mx-auto"
          >
            <motion.div
              style={{ opacity: textOpacity, y: textY }}
              className="lg:col-span-6 lg:order-1"
            >
              <div className="max-w-xl text-start">
                <motion.div variants={reveal} initial="hidden" animate="visible" custom={0}>
                  <Badge tone="accent">{t('landing.hero.badge')}</Badge>
                </motion.div>

                <motion.h1
                  variants={reveal}
                  initial="hidden"
                  animate="visible"
                  custom={0.08}
                  className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-fg sm:text-5xl lg:text-6xl"
                >
                  {t('landing.hero.title')}
                </motion.h1>

                <motion.p
                  variants={reveal}
                  initial="hidden"
                  animate="visible"
                  custom={0.16}
                  className="mt-5 max-w-lg text-base text-muted sm:text-lg"
                >
                  {t('landing.hero.subtitle')}
                </motion.p>

                <motion.div
                  variants={reveal}
                  initial="hidden"
                  animate="visible"
                  custom={0.24}
                  className="mt-8 flex flex-wrap gap-3 justify-start"
                >
                  <ButtonLink to={ROUTES.login} variant="primary" size="lg">
                    {t('landing.hero.primary')}
                  </ButtonLink>
                </motion.div>

                <motion.p
                  variants={reveal}
                  initial="hidden"
                  animate="visible"
                  custom={0.32}
                  className="mt-6 text-sm text-muted"
                >
                  {t('landing.hero.indicator')}
                </motion.p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center items-center lg:col-span-6 lg:order-2"
            >
              <HeroTaskIllustration labels={labels} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}