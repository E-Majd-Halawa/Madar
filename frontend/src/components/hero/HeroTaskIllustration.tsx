import { motion, useReducedMotion } from 'framer-motion';

/**
 * Madar hero illustration — one fixed SVG composition (viewBox 560x480).
 * Transparent background so the starfield stays visible.
 * Only the floating cards, the clock and one gear move.
 */

const SKIN = '#CBD5E1';
const COLS = [172, 254, 336, 418];
const ROWS = [140, 212, 284];
const TILE_W = 70;
const TILE_H = 62;
const DONE = new Set([2, 5, 11]); // row1-col3, row2-col2, row3-col4
const BAR_W = [26, 40, 18, 34, 22, 0, 38, 16, 30, 24, 36, 0];

type GearProps = {
  cx: number;
  cy: number;
  r: number;
  opacity?: number;
  spin?: number;
};

function Gear({ cx, cy, r, opacity = 0.45, spin }: GearProps) {
  const reduce = useReducedMotion();
  const teeth = 12;
  const outer = r + 3;
  const dash = (2 * Math.PI * outer) / (teeth * 2);
  const body = (
    <g opacity={opacity}>
      <circle
        cx={cx}
        cy={cy}
        r={outer}
        stroke="#10B981"
        strokeWidth={r * 0.38}
        strokeDasharray={`${dash} ${dash}`}
        fill="none"
      />
      <circle cx={cx} cy={cy} r={r} stroke="#10B981" strokeWidth={r * 0.28} fill="none" />
      <circle cx={cx} cy={cy} r={r * 0.32} fill="#10B981" />
    </g>
  );
  if (!spin || reduce) return body;
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      animate={{ rotate: 360 }}
      transition={{ duration: spin, repeat: Infinity, ease: 'linear' }}
    >
      {body}
    </motion.g>
  );
}

export interface HeroTaskIllustrationLabels {
  sprintPlanning: string;
  designReview: string;
  calendarTitle: string;
}

export function HeroTaskIllustration({
  className = '',
  labels,
}: {
  className?: string;
  labels?: HeroTaskIllustrationLabels;
}) {
  const resolved = {
    sprintPlanning: labels?.sprintPlanning ?? 'Sprint planning',
    designReview: labels?.designReview ?? 'Design review',
    calendarTitle: labels?.calendarTitle ?? 'Oct 2026',
  };
  const isArabic = /[\u0600-\u06FF]/.test(
    `${resolved.sprintPlanning}${resolved.designReview}${resolved.calendarTitle}`,
  );
  const reduce = useReducedMotion();

  const float = (delay: number, distance = 6, duration = 4.5) =>
    reduce
      ? {}
      : {
          animate: { y: [0, -distance, 0] },
          transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' as const },
        };

  return (
    <div
      className={`relative isolate mx-auto w-full max-w-[560px] select-none ${className}`}
      dir="ltr"
      aria-hidden
    >
      {/* soft emerald halo — transparent, keeps the starfield visible */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.16),transparent_65%)] blur-2xl" />

      <svg
        viewBox="0 0 560 480"
        width="100%"
        className="block h-auto w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        fontFamily="inherit"
      >
        <defs>
          <filter id="mdr-glow-sm" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="mdr-glow-lg" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <linearGradient id="mdr-board" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#131c19" />
            <stop offset="1" stopColor="#0f1614" />
          </linearGradient>
        </defs>

        {/* ground shadow */}
        <ellipse cx="280" cy="456" rx="245" ry="8" fill="#10B981" opacity="0.08" />

        {/* ---------- gears (base) ---------- */}
        <Gear cx={262} cy={434} r={15} spin={60} />
        <Gear cx={297} cy={447} r={8} opacity={0.35} />
        <Gear cx={28} cy={430} r={11} opacity={0.3} />

        {/* ---------- calendar stand ---------- */}
        <rect x="213" y="350" width="9" height="104" rx="4" fill="#1E293B" stroke="#10B981" strokeOpacity="0.2" />
        <rect x="451" y="350" width="9" height="104" rx="4" fill="#1E293B" stroke="#10B981" strokeOpacity="0.2" />

        {/* ---------- CALENDAR ---------- */}
        <g transform="rotate(-3 320 225)">
          {/* glow */}
          <rect x="150" y="80" width="360" height="290" rx="24" fill="#10B981" opacity="0.2" filter="url(#mdr-glow-lg)" />
          {/* board */}
          <rect x="150" y="80" width="360" height="290" rx="24" fill="url(#mdr-board)" stroke="#10B981" strokeOpacity="0.35" strokeWidth="1.5" />
          {/* header */}
          <path d="M150 104a24 24 0 0 1 24-24h312a24 24 0 0 1 24 24v20H150z" fill="#131c19" />
          <line x1="150.75" y1="124" x2="509.25" y2="124" stroke="#10B981" strokeOpacity="0.2" />
          <circle cx="180" cy="102" r="4" fill="#34D399" />
          <text
            x="330"
            y="107"
            fontSize={isArabic ? 13 : 14}
            fontWeight="600"
            fill="#F8FAFC"
            fontFamily="inherit"
            textAnchor="middle"
            direction={isArabic ? 'rtl' : 'ltr'}
          >
            {resolved.calendarTitle}
          </text>
          {/* binder rings */}
          {[226, 326, 426].map((x) => (
            <g key={x}>
              <rect x={x} y="62" width="10" height="34" rx="5" fill="#10B981" />
              <rect x={x + 2} y="66" width="2.5" height="22" rx="1.25" fill="#34D399" opacity="0.7" />
            </g>
          ))}
          {/* tiles */}
          {ROWS.flatMap((y, r) =>
            COLS.map((x, c) => {
              const i = r * 4 + c;
              const done = DONE.has(i);
              if (done) {
                const cx = x + TILE_W / 2;
                const cy = y + TILE_H / 2;
                return (
                  <g
                    key={i}
                    className="transition-transform duration-200 ease-out hover:scale-[1.04]"
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  >
                    <g filter="url(#mdr-glow-sm)">
                      <rect
                        x={x}
                        y={y}
                        width={TILE_W}
                        height={TILE_H}
                        rx="10"
                        fill="#10B981"
                        fillOpacity="0.22"
                        stroke="#10B981"
                        strokeWidth="1.5"
                        className="transition-all duration-200 ease-out hover:stroke-emerald-400 hover:stroke-[2] hover:drop-shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                      />
                    </g>
                    <path
                      d={`M${cx - 12} ${cy + 1}l8 9 16-19`}
                      stroke="#F8FAFC"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              }
              return (
                <g
                  key={i}
                  className="transition-transform duration-200 ease-out hover:scale-[1.04]"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                >
                  <rect
                    x={x}
                    y={y}
                    width={TILE_W}
                    height={TILE_H}
                    rx="10"
                    fill="#0f1614"
                    stroke="#10B981"
                    strokeOpacity="0.25"
                    className="transition-all duration-200 ease-out hover:stroke-emerald-400/70 hover:stroke-[2] hover:drop-shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                  />
                  <text x={x + 10} y={y + 19} fontSize="10" fill="#94A3B8" opacity="0.6" fontFamily="inherit">
                    {i + 12}
                  </text>
                  {BAR_W[i] > 0 && (
                    <rect x={x + 10} y={y + TILE_H - 18} width={BAR_W[i]} height="4" rx="2" fill="#1E293B" />
                  )}
                </g>
              );
            }),
          )}
        </g>

        {/* ---------- PLANT ---------- */}
        <g>
          <path d="M168 418h32l-4 34h-24z" fill="#1E293B" stroke="#10B981" strokeOpacity="0.3" />
          <path d="M184 418C170 400 170 384 178 372c10 12 12 30 6 46z" fill="#10B981" />
          <path d="M184 418c4-16 14-28 28-32 0 16-8 28-28 32z" fill="#0D9488" />
          <path d="M184 418c-6-12-20-18-34-16 6 14 18 20 34 16z" fill="#0D9488" />
          <path d="M184 418c10-8 12-22 8-34-10 8-14 22-8 34z" fill="#34D399" opacity="0.75" />
        </g>

        {/* ---------- CHARACTER A (standing, placing a task card) ---------- */}
        <g>
          {/* legs */}
          <rect x="66" y="334" width="18" height="108" rx="9" fill="#1E293B" stroke="#10B981" strokeOpacity="0.3" />
          <rect x="92" y="334" width="18" height="108" rx="9" fill="#1E293B" stroke="#10B981" strokeOpacity="0.3" />
          {/* shoes */}
          <rect x="60" y="440" width="28" height="12" rx="6" fill="#0D9488" />
          <rect x="90" y="440" width="28" height="12" rx="6" fill="#0D9488" />
          {/* far arm (hanging) */}
          <path d="M68 262q-10 34-6 60" stroke="#0D9488" strokeWidth="12" strokeLinecap="round" />
          <circle cx="62" cy="326" r="6.5" fill={SKIN} />
          {/* torso */}
          <rect x="62" y="244" width="52" height="104" rx="20" fill="#10B981" />
          <line x1="88" y1="256" x2="88" y2="340" stroke="#064E3B" strokeOpacity="0.35" strokeWidth="2" />
          {/* neck + head */}
          <rect x="82" y="224" width="12" height="24" rx="5" fill="#94A3B8" />
          <circle cx="88" cy="208" r="20" fill={SKIN} />
          <path d="M67 208C66 192 76 183 88 183c13 0 22 9 21 25-6-8-14-10-22-9-8 0-15 3-20 9z" fill="#0D9488" />
          {/* raised arm */}
          <path d="M106 262q26 0 41-42" stroke="#0D9488" strokeWidth="12" strokeLinecap="round" />
          <circle cx="148" cy="216" r="6.5" fill={SKIN} />
          {/* task card being placed */}
          <g transform="rotate(-8 172 192)">
            <rect x="142" y="168" width="62" height="46" rx="9" fill="#131c19" stroke="#10B981" strokeWidth="1.3" />
            <circle cx="157" cy="184" r="5.5" fill="#10B981" />
            <path d="M154.5 184l2 2 3.5-4" stroke="#F8FAFC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="168" y="181" width="28" height="4" rx="2" fill="#F8FAFC" opacity="0.85" />
            <rect x="152" y="197" width="42" height="4" rx="2" fill="#1E293B" />
            <rect x="152" y="197" width="26" height="4" rx="2" fill="#34D399" />
          </g>
        </g>

        {/* ---------- DESK + LAPTOP ---------- */}
        <g>
          {/* table */}
          <rect x="342" y="428" width="7" height="24" rx="3" fill="#1E293B" />
          <rect x="424" y="428" width="7" height="24" rx="3" fill="#1E293B" />
          <rect x="330" y="420" width="124" height="8" rx="4" fill="#1E293B" stroke="#10B981" strokeOpacity="0.3" />
          {/* laptop glow */}
          <rect x="356" y="372" width="72" height="44" rx="8" fill="#10B981" opacity="0.18" filter="url(#mdr-glow-lg)" />
          {/* screen */}
          <rect x="352" y="366" width="80" height="50" rx="6" fill="#131c19" stroke="#10B981" strokeOpacity="0.6" />
          <rect x="362" y="377" width="34" height="4" rx="2" fill="#10B981" />
          <rect x="362" y="387" width="52" height="4" rx="2" fill="#34D399" opacity="0.5" />
          <rect x="362" y="397" width="24" height="4" rx="2" fill="#10B981" opacity="0.6" />
          <circle cx="418" cy="402" r="4" fill="#10B981" />
          {/* base */}
          <rect x="344" y="414" width="96" height="6" rx="3" fill="#1E293B" stroke="#10B981" strokeOpacity="0.4" />
        </g>

        {/* ---------- CHARACTER B (seated, working) ---------- */}
        <g>
          {/* stool */}
          <rect x="478" y="436" width="46" height="7" rx="3" fill="#1E293B" stroke="#10B981" strokeOpacity="0.3" />
          <rect x="497" y="443" width="8" height="9" rx="3" fill="#1E293B" />
          {/* legs */}
          <rect x="446" y="428" width="62" height="16" rx="8" fill="#1E293B" stroke="#10B981" strokeOpacity="0.3" />
          <rect x="446" y="430" width="14" height="22" rx="7" fill="#1E293B" stroke="#10B981" strokeOpacity="0.3" />
          <rect x="434" y="443" width="26" height="10" rx="5" fill="#0D9488" />
          {/* torso */}
          <g transform="rotate(-6 496 440)">
            <rect x="478" y="382" width="38" height="62" rx="16" fill="#0D9488" />
            <rect x="494" y="350" width="8" height="14" rx="3" fill="#94A3B8" />
            <circle cx="497" cy="352" r="17" fill={SKIN} />
            <path d="M480 352c-2-14 7-23 18-23 11 0 18 8 16 20-5-6-10-8-17-8-7 0-13 4-17 11z" fill="#1E293B" stroke="#34D399" strokeOpacity="0.5" />
            <circle cx="512" cy="337" r="7" fill="#1E293B" stroke="#34D399" strokeOpacity="0.5" />
          </g>
          {/* arm to keyboard */}
          <path d="M490 394q-10 20-46 18" stroke="#0D9488" strokeWidth="10" strokeLinecap="round" />
          <circle cx="443" cy="412" r="5.5" fill={SKIN} />
        </g>

        {/* ---------- FLOATING: Sprint planning ---------- */}
        <motion.g {...float(0, 6, 4.5)}>
          <rect x="24" y="34" width="152" height="52" rx="14" fill="#131c19" fillOpacity="0.9" stroke="#10B981" strokeOpacity="0.35" />
          <circle cx="45" cy="53" r="9" fill="none" stroke="#34D399" strokeOpacity="0.8" strokeWidth="1.5" />
          <path d="M41 53l3 3 5-6" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <text
            x="100"
            y="57"
            fontSize={isArabic ? 10.5 : 11.5}
            fontWeight="600"
            fill="#F8FAFC"
            fontFamily="inherit"
            textAnchor="middle"
            direction={isArabic ? 'rtl' : 'ltr'}
          >
            {resolved.sprintPlanning}
          </text>
          <rect x="38" y="68" width="124" height="6" rx="3" fill="#10B981" fillOpacity="0.18" />
          <rect x="38" y="68" width="62" height="6" rx="3" fill="#34D399" />
        </motion.g>

        {/* ---------- FLOATING: Design review ---------- */}
        <motion.g {...float(0.9, 5, 5)}>
          <rect x="408" y="46" width="144" height="54" rx="14" fill="#131c19" fillOpacity="0.92" stroke="#10B981" strokeOpacity="0.4" />
          <circle cx="429" cy="66" r="9" fill="#10B981" />
          <path d="M425 66l3 3 5-6" stroke="#F8FAFC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <text
            x="480"
            y="70"
            fontSize={isArabic ? 10.5 : 11.5}
            fontWeight="600"
            fill="#F8FAFC"
            fontFamily="inherit"
            textAnchor="middle"
            direction={isArabic ? 'rtl' : 'ltr'}
          >
            {resolved.designReview}
          </text>
          <rect x="422" y="83" width="116" height="6" rx="3" fill="#10B981" fillOpacity="0.18" />
          <rect x="422" y="83" width="87" height="6" rx="3" fill="#10B981" />
        </motion.g>

        {/* ---------- FLOATING: Clock ---------- */}
        <motion.g {...float(1.6, 4, 4)}>
          <circle cx="284" cy="42" r="34" stroke="#34D399" strokeOpacity="0.2" strokeDasharray="2 5" />
          <circle cx="284" cy="42" r="28" fill="#111917" fillOpacity="0.92" stroke="#10B981" strokeWidth="1.5" />
          <g stroke="#94A3B8" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round">
            <line x1="284" y1="18" x2="284" y2="22" />
            <line x1="284" y1="62" x2="284" y2="66" />
            <line x1="260" y1="42" x2="264" y2="42" />
            <line x1="304" y1="42" x2="308" y2="42" />
          </g>
          <line x1="284" y1="42" x2="284" y2="26" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="284" y1="42" x2="296" y2="49" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="284" cy="42" r="3" fill="#10B981" />
        </motion.g>
      </svg>
    </div>
  );
}
