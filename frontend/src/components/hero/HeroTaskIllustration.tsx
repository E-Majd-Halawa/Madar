import { motion } from 'framer-motion';
import { Check, Settings } from 'lucide-react';
import { cn } from '@/utils/cn';

const floating = (delay: number, distance = 6) => ({
  animate: { y: [0, -distance, 0] },
  transition: { duration: 4.5, delay, repeat: Infinity, ease: 'easeInOut' as const },
});

export function HeroTaskIllustration({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative mx-auto w-full max-w-[640px] select-none', className)}
      aria-hidden
      dir="ltr"
    >
      {/* Soft emerald glow behind the composition (transparent container keeps starfield visible) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.18),transparent_62%)] blur-2xl" />
      </div>

      {/* Minimalist flat-geometric characters (SVG) */}
      <svg
        viewBox="0 0 640 480"
        className="absolute inset-0 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Standing character placing a floating task card */}
        <g>
          <circle cx="118" cy="132" r="26" fill="#1E293B" />
          <rect x="94" y="160" width="48" height="78" rx="14" fill="#1E293B" />
          <rect x="142" y="172" width="74" height="12" rx="6" fill="#0D9488" />
          <rect x="100" y="238" width="14" height="46" rx="7" fill="#1E293B" />
          <rect x="124" y="238" width="14" height="46" rx="7" fill="#1E293B" />
        </g>

        {/* Seated character working on a laptop */}
        <g>
          <circle cx="500" cy="278" r="24" fill="#1E293B" />
          <rect x="478" y="302" width="44" height="56" rx="12" fill="#1E293B" />
          <rect x="456" y="358" width="92" height="12" rx="6" fill="#10B981" />
          <rect x="470" y="370" width="64" height="8" rx="4" fill="#0D9488" />
          <rect x="462" y="348" width="18" height="10" rx="3" fill="#1E293B" />
          <rect x="520" y="348" width="18" height="10" rx="3" fill="#1E293B" />
        </g>

        {/* Subtle gears at the base */}
        <g className="text-emerald-500/30" fill="currentColor">
          <circle cx="96" cy="420" r="18" fill="none" stroke="#10B981" strokeOpacity="0.25" strokeWidth="2" />
          <circle cx="96" cy="420" r="6" fill="#10B981" fillOpacity="0.4" />
          <circle cx="540" cy="408" r="14" fill="none" stroke="#34D399" strokeOpacity="0.2" strokeWidth="2" />
          <circle cx="540" cy="408" r="5" fill="#34D399" fillOpacity="0.35" />
        </g>
      </svg>

      {/* Central desk calendar card */}
      <motion.div
        className="glass absolute left-1/2 top-[18%] w-[58%] -translate-x-1/2 rotate-[-5deg] rounded-2xl border border-emerald-500/20 bg-[#111917]/70 p-4 shadow-2xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">Madar</span>
          <span className="text-[10px] text-slate-400">Oct 2026</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const done = i === 2 || i === 6 || i === 9;
            return (
              <div
                key={i}
                className={cn(
                  'grid aspect-square place-items-center rounded-lg border text-white',
                  done
                    ? 'border-emerald-500/40 bg-emerald-500/15 shadow-[0_0_14px_rgba(16,185,129,0.22)]'
                    : 'border-emerald-500/10 bg-[#0f1614]/60',
                )}
              >
                {done && <Check className="size-4 text-white" strokeWidth={3} />}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Floating task card - top */}
      <motion.div
        {...floating(0, 6)}
        className="glass absolute right-[6%] top-[6%] w-44 rounded-xl border border-emerald-500/20 bg-[#131c19]/75 p-3"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded-full bg-emerald-500 text-[10px] text-white">
            <Check className="size-3" strokeWidth={3} />
          </span>
          <span className="truncate text-xs text-slate-200">Design review</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-500/15">
          <div className="h-full w-3/4 rounded-full bg-emerald-500" />
        </div>
      </motion.div>

      {/* Floating task card - left */}
      <motion.div
        {...floating(0.8, 5)}
        className="glass absolute left-[4%] top-[52%] w-40 rounded-xl border border-emerald-500/20 bg-[#131c19]/75 p-3"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded-full border border-emerald-500/40 text-emerald-300">
            <Check className="size-3" />
          </span>
          <span className="truncate text-xs text-slate-200">Sprint planning</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-500/15">
          <div className="h-full w-1/2 rounded-full bg-emerald-400" />
        </div>
      </motion.div>

      {/* Clock badge */}
      <motion.div
        {...floating(1.4, 4)}
        className="glass absolute right-[10%] bottom-[12%] grid size-16 place-items-center rounded-2xl border border-emerald-500/20 bg-[#111917]/75"
      >
        <svg viewBox="0 0 48 48" className="size-10" fill="none">
          <circle cx="24" cy="24" r="20" stroke="#34D399" strokeOpacity="0.35" strokeWidth="2" />
          <line x1="24" y1="24" x2="24" y2="12" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="24" x2="34" y2="24" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
          <circle cx="24" cy="24" r="2" fill="#10B981" />
        </svg>
      </motion.div>

      {/* Rotating gear accents */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute left-[14%] bottom-[6%] text-emerald-500/35"
      >
        <Settings className="size-7" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        className="absolute right-[18%] bottom-[8%] text-emerald-400/25"
      >
        <Settings className="size-5" />
      </motion.div>
    </div>
  );
}
