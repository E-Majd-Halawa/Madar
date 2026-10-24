import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { SidebarContent, Sidebar } from '@/features/shell/Sidebar';
import { MobileNav } from '@/features/shell/MobileNav';
import { DemoBanner, OfflineBanner } from '@/features/shell/StatusBanners';
import { Topbar } from '@/features/shell/Topbar';
import { TaskModal } from '@/features/tasks/TaskModal';
import { TaskDetailDrawer } from '@/features/tasks/TaskDetailDrawer';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { CommandPalette } from '@/features/search/CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMotion } from '@/hooks/useMotion';
import { useUiStore } from '@/store/uiStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/** Authenticated application frame: sidebar + top bar on desktop, top bar + bottom bar on phones. */
export function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { presets } = useMotion();
  const { mobileMenuOpen, setMobileMenu } = useUiStore();
  useKeyboardShortcuts();

  return (
    <div className="bg-ambient min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">
        {t('shell.skipToContent')}
      </a>
      <DemoBanner />
      <OfflineBanner />
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Topbar />
          <main id="main" className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
            <AnimatePresence mode="wait">
              <motion.div key={location.pathname} variants={presets.pageTransition} initial="hidden" animate="visible" exit="exit">
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <MobileNav />
      <Modal open={mobileMenuOpen} onClose={() => setMobileMenu(false)} title={t('common.menu')} className="lg:hidden">
        <div className="-m-4 max-h-[70dvh] overflow-y-auto">
          <SidebarContent onNavigate={() => setMobileMenu(false)} />
        </div>
      </Modal>
      <TaskModal />
      <TaskDetailDrawer />
      <ProjectModal />
      <CommandPalette />
    </div>
  );
}