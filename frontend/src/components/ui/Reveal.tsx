import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useMotion } from '@/hooks/useMotion';

const viewport = { once: true, margin: '-80px' } as const;

/** Scroll-triggered group: children using <RevealItem> enter one after another. */
export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  const { presets } = useMotion();
  return (
    <motion.div className={className} variants={presets.stagger} initial="hidden" whileInView="visible" viewport={viewport}>
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const { presets } = useMotion();
  return (
    <motion.div className={className} variants={presets.fadeUp}>
      {children}
    </motion.div>
  );
}
