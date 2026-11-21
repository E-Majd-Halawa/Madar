import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HeroTaskIllustration } from '@/components/hero/HeroTaskIllustration';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { ROUTES } from '@/constants/routes';

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
    <section ref={section} className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-0">
        <div className="grid grid-cols-1 gap-8 items-center lg:grid-cols-12 max-w-7xl mx-auto">
          <motion.div style={{ opacity: textOpacity, y: textY }} className="lg:col-span-6">
            <div className="max-w-xl text-start">
              <motion.div variants={reveal} initial="hidden" animate="visible" custom={0}>
                <Badge tone="accent">{t('landing.hero.badge')}</Badge>
              </motion.div>

              <motion.h1
                variants={reveal}
                initial="hidden"
                animate="visible"
                custom={0.08}
                className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
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
            className="flex justify-center items-center lg:col-span-6"
          >
            <HeroTaskIllustration labels={labels} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
