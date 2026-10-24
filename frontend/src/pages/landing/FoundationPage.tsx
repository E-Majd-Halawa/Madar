import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/constants/routes';
import { GuardTestCard } from '@/features/foundation/GuardTestCard';
import { ServiceProbeCard } from '@/features/foundation/ServiceProbeCard';
import { PermissionMatrixCard } from '@/features/auth/PermissionMatrixCard';
import { SessionCard } from '@/features/auth/SessionCard';
import { AppearanceCard } from '@/features/settings/AppearanceCard';
import { LanguageCard } from '@/features/settings/LanguageCard';
import { useMotion } from '@/hooks/useMotion';

/**
 * Phase 1 home: a live check of the foundation.
 * Replaced by the real landing page and 3D hero in phase 2.
 */
export default function FoundationPage() {
  const { t } = useTranslation();
  const { presets } = useMotion();

  return (
    <div className="bg-ambient min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">{t('app.name')}</span>
        <Link to={ROUTES.login} className="text-sm font-medium text-accent hover:underline">
          {t('common.signIn')}
        </Link>
      </header>

      <motion.main
        className="mx-auto max-w-6xl space-y-6 px-6 pb-20"
        variants={presets.stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.section variants={presets.fadeUp} className="max-w-2xl py-8">
          <Badge tone="accent">{t('foundation.badge')}</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{t('foundation.title')}</h1>
          <p className="mt-3 text-muted">{t('foundation.subtitle')}</p>
        </motion.section>

        <motion.div variants={presets.fadeUp} className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AppearanceCard />
          </div>
          <div className="space-y-6">
            <LanguageCard />
            <SessionCard />
          </div>
        </motion.div>

        <motion.div variants={presets.fadeUp}>
          <PermissionMatrixCard />
        </motion.div>

        <motion.div variants={presets.fadeUp} className="grid gap-6 lg:grid-cols-2">
          <GuardTestCard />
          <ServiceProbeCard />
        </motion.div>
      </motion.main>
    </div>
  );
}
