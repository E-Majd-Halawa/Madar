import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion';

/**
 * Madar hero illustration — emerald re-colour of the "Task Manager" landing reference.
 * Transparent background so the starfield stays visible.
 *
 * Every transform here uses an explicit pivot point (SVG `transform` attribute),
 * so nothing drifts: gears spin around their own centre, clock hands around the
 * clock centre, tiles/clock scale around their own centre, leaves bend at their base.
 *
 *  - clock hands: real time, always moving
 *  - hover tile  : soft glow + smooth scale
 *  - hover gear  : spins + glows
 *  - plant       : constant, very gentle breeze
 *  - hover clock : grows + glows
 *  - sticky notes: tiny float
 */

const EM = '#10B981';
const MINT = '#34D399';
const TEAL = '#0D9488';
const TEAL_D = '#0F766E';
const SLATE = '#1E293B';
const CARD = '#131c19';
const W = '#F8FAFC';
const MUTED = '#94A3B8';
const SKIN = '#CBD5E1';
const SKIN_D = '#94A3B8';
const HAIR = '#334155';
const EDGE = 'rgba(16,185,129,0.35)';

// calendar tiles, in the calendar's own (pre-skew) coordinates
const COLS = [16, 112, 208, 304];
const ROWS = [58, 150];
const TILE_W = 80;
const TILE_H = 72;
const DONE = new Set(['0-3', '1-1']);

type LabelProps = { sprintPlanning: string; designReview: string; calendarTitle: string };
type GRef = { current: SVGGElement | null };

/* ------------------------- pivot-safe transform hooks ------------------------- */

function useRotateAttr(ref: GRef, mv: MotionValue<number>, cx: number, cy: number) {
  useEffect(() => {
    const apply = (v: number) => ref.current?.setAttribute('transform', `rotate(${v} ${cx} ${cy})`);
    apply(mv.get());
    return mv.on('change', apply);
  }, [ref, mv, cx, cy]);
}

function useScaleAttr(ref: GRef, mv: MotionValue<number>, cx: number, cy: number) {
  useEffect(() => {
    const apply = (v: number) =>
      ref.current?.setAttribute('transform', `translate(${cx} ${cy}) scale(${v}) translate(${-cx} ${-cy})`);
    apply(mv.get());
    return mv.on('change', apply);
  }, [ref, mv, cx, cy]);
}

const grow = (mv: MotionValue<number>, to: number) =>
  animate(mv, to, { type: 'spring', stiffness: 280, damping: 22 });

/* ---------------------------------- Gear ---------------------------------- */

const spin = (mv: MotionValue<number>, degPerSec: number) =>
  animate(mv, mv.get() + degPerSec * 600, { duration: 600, ease: 'linear' });

function Gear({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGGElement>(null);
  const rotate = useMotionValue(0);
  const ctrl = useRef<ReturnType<typeof animate> | null>(null);
  const [hot, setHot] = useState(false);
  useRotateAttr(ref, rotate, cx, cy);

  useEffect(() => () => ctrl.current?.stop(), []);

  const onEnter = () => {
    setHot(true);
    if (reduce) return;
    ctrl.current?.stop();
    ctrl.current = spin(rotate, 240);
  };
  const onLeave = () => {
    setHot(false);
    if (reduce) return;
    ctrl.current?.stop();
    ctrl.current = animate(rotate, rotate.get() + 60, { duration: 1, ease: 'easeOut' });
  };

  const ring = r + r * 0.12;
  const dash = (2 * Math.PI * ring) / 24;

  return (
    <g onPointerEnter={onEnter} onPointerLeave={onLeave} style={{ cursor: 'pointer' }}>
      <motion.circle
        cx={cx}
        cy={cy}
        r={r * 1.7}
        fill={EM}
        filter="url(#mdr-blur-s)"
        initial={false}
        animate={{ opacity: hot ? 0.65 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <g ref={ref}>
        <motion.circle
          cx={cx}
          cy={cy}
          r={ring}
          strokeWidth={r * 0.26}
          strokeDasharray={`${dash} ${dash}`}
          initial={false}
          animate={{ stroke: hot ? MINT : EM, strokeOpacity: hot ? 0.95 : 0.55 }}
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="#111917"
          strokeWidth={r * 0.1}
          initial={false}
          animate={{ stroke: hot ? MINT : EM, strokeOpacity: hot ? 1 : 0.7 }}
        />
        <circle cx={cx} cy={cy} r={r * 0.5} fill={SLATE} stroke={MINT} strokeWidth={r * 0.16} />
        <circle cx={cx} cy={cy} r={r * 0.18} fill={W} />
      </g>
      <circle cx={cx} cy={cy} r={r * 1.35} fill="transparent" />
    </g>
  );
}

/* ----------------------------- Calendar tile ------------------------------ */

function Tile({ x, y, done }: { x: number; y: number; done: boolean }) {
  const mx = x + TILE_W / 2;
  const my = y + TILE_H / 2;
  const ref = useRef<SVGGElement>(null);
  const scale = useMotionValue(1);
  const [hot, setHot] = useState(false);
  useScaleAttr(ref, scale, mx, my);

  return (
    <g
      ref={ref}
      onPointerEnter={() => {
        setHot(true);
        grow(scale, 1.08);
      }}
      onPointerLeave={() => {
        setHot(false);
        grow(scale, 1);
      }}
      style={{ cursor: 'pointer' }}
    >
      <motion.rect
        x={x}
        y={y}
        width={TILE_W}
        height={TILE_H}
        rx="8"
        fill={EM}
        filter="url(#mdr-glow-soft)"
        initial={false}
        animate={{ opacity: hot ? 0.95 : done ? 0.3 : 0 }}
        transition={{ duration: 0.25 }}
      />
      {done ? (
        <rect x={x} y={y} width={TILE_W} height={TILE_H} rx="8" fill={EM} />
      ) : (
        <rect x={x} y={y} width={TILE_W} height={TILE_H} rx="8" fill={EM} fillOpacity="0.1" stroke={EM} strokeOpacity="0.2" />
      )}
      <motion.rect
        x={x}
        y={y}
        width={TILE_W}
        height={TILE_H}
        rx="8"
        fill={done ? MINT : EM}
        fillOpacity={done ? 0.35 : 0.28}
        stroke={MINT}
        strokeWidth="2"
        initial={false}
        animate={{ opacity: hot ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      />
      {done && (
        <path
          d={`M${mx - 20} ${my + 2}l14 14 26-30`}
          stroke={W}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}

/* ---------------------------------- Note ---------------------------------- */

function Note({ x, y, w = 56, h = 72, variant = 0 }: { x: number; y: number; w?: number; h?: number; variant?: number }) {
  return (
    <g>
      <rect x={x + 12} y={y + 12} width={w} height={h} rx="8" fill="#000" opacity="0.35" />
      <rect x={x} y={y} width={w} height={h} rx="8" fill={CARD} stroke={EDGE} strokeWidth="1.5" />
      <circle cx={x + w - 9} cy={y + 9} r="4.5" fill={EM} />
      {variant === 1 ? (
        <rect x={x + 10} y={y + 22} width="16" height="16" rx="3" fill={MINT} />
      ) : (
        <rect x={x + 10} y={y + 24} width="18" height="5" rx="2.5" fill={W} opacity="0.9" />
      )}
      <rect x={x + 10} y={y + 36} width={w - 20} height="5" rx="2.5" fill={EM} opacity="0.85" />
      <rect x={x + 10} y={y + 47} width={w - 28} height="5" rx="2.5" fill={MUTED} opacity="0.5" />
      <rect x={x + 10} y={y + 58} width={w - 22} height="5" rx="2.5" fill={W} opacity="0.75" />
    </g>
  );
}

/* ---------------------------------- Plant --------------------------------- */

// bx/by = where the leaf is attached (its pivot); amp = max bend in degrees (kept tiny)
const LEAVES = [
  { d: 'M240 594C205 562 195 520 210 475C240 500 255 548 240 594Z', fill: TEAL_D, vein: 'M240 590C228 550 224 520 212 480', bx: 240, by: 594, amp: 2.5, delay: 0 },
  { d: 'M250 594C235 544 255 502 288 480C298 522 282 562 250 594Z', fill: TEAL, vein: 'M252 588C262 550 272 520 286 486', bx: 250, by: 594, amp: 3, delay: 0.15 },
  { d: 'M232 596C200 578 188 546 196 520C226 530 242 562 232 596Z', fill: '#134E4A', vein: '', bx: 232, by: 596, amp: 3, delay: 0.3 },
  { d: 'M258 598C270 568 290 558 298 550C302 572 286 592 258 598Z', fill: TEAL_D, vein: '', bx: 258, by: 598, amp: 3.5, delay: 0.1 },
];

function Leaf({ leaf }: { leaf: (typeof LEAVES)[number] }) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGGElement>(null);
  const angle = useMotionValue(0);
  useRotateAttr(ref, angle, leaf.bx, leaf.by);

  // constant, gentle breeze — each leaf bends at its base with its own phase
  useEffect(() => {
    if (reduce) return;
    const a = leaf.amp;
    const c = animate(angle, [0, a, -a * 0.6, a * 0.4, 0], {
      duration: 3.6,
      delay: leaf.delay,
      ease: 'easeInOut',
      repeat: Infinity,
    });
    return () => c.stop();
  }, [reduce, leaf.amp, leaf.delay, angle]);

  return (
    <g ref={ref}>
      <path d={leaf.d} fill={leaf.fill} />
      {leaf.vein && <path d={leaf.vein} stroke={MINT} strokeOpacity="0.5" strokeWidth="2" />}
    </g>
  );
}

function Plant() {
  return (
    <g pointerEvents="none">
      {LEAVES.map((l, i) => (
        <Leaf key={i} leaf={l} />
      ))}
    </g>
  );
}

/* ---------------------------------- Clock --------------------------------- */

const CX = 745;
const CY = 130;

function Clock() {
  const reduce = useReducedMotion();
  const outer = useRef<SVGGElement>(null);
  const hourRef = useRef<SVGGElement>(null);
  const minRef = useRef<SVGGElement>(null);
  const secRef = useRef<SVGGElement>(null);
  const scale = useMotionValue(1);
  const [hot, setHot] = useState(false);
  useScaleAttr(outer, scale, CX, CY);

  // real time, hands rotate around the clock centre
  useEffect(() => {
    const set = () => {
      const d = new Date();
      const s = d.getSeconds() + d.getMilliseconds() / 1000;
      const m = d.getMinutes() + s / 60;
      const h = (d.getHours() % 12) + m / 60;
      hourRef.current?.setAttribute('transform', `rotate(${h * 30} ${CX} ${CY})`);
      minRef.current?.setAttribute('transform', `rotate(${m * 6} ${CX} ${CY})`);
      secRef.current?.setAttribute('transform', `rotate(${s * 6} ${CX} ${CY})`);
    };
    set();
    if (reduce) {
      const id = setInterval(set, 1000);
      return () => clearInterval(id);
    }
    let raf = 0;
    const loop = () => {
      set();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  return (
    <g
      ref={outer}
      onPointerEnter={() => {
        setHot(true);
        grow(scale, 1.14);
      }}
      onPointerLeave={() => {
        setHot(false);
        grow(scale, 1);
      }}
      style={{ cursor: 'pointer' }}
    >
      <motion.circle
        cx={CX}
        cy={CY}
        r="76"
        fill={EM}
        filter="url(#mdr-blur-s)"
        initial={false}
        animate={{ opacity: hot ? 0.6 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <circle cx={CX + 15} cy={CY + 14} r="62" fill="#000" opacity="0.35" />
      <motion.circle
        cx={CX}
        cy={CY}
        r="62"
        fill={CARD}
        strokeWidth="3.5"
        initial={false}
        animate={{ stroke: hot ? MINT : EM, strokeOpacity: hot ? 1 : 0.7 }}
        transition={{ duration: 0.3 }}
      />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <line
            key={i}
            x1={CX + Math.sin(a) * 47}
            y1={CY - Math.cos(a) * 47}
            x2={CX + Math.sin(a) * 54}
            y2={CY - Math.cos(a) * 54}
            stroke={i % 3 === 0 ? MINT : EM}
            strokeOpacity={i % 3 === 0 ? 1 : 0.6}
            strokeWidth="4"
            strokeLinecap="round"
          />
        );
      })}
      <g ref={hourRef}>
        <line x1={CX} y1={CY} x2={CX} y2={CY - 28} stroke={EM} strokeWidth="6.5" strokeLinecap="round" />
      </g>
      <g ref={minRef}>
        <line x1={CX} y1={CY} x2={CX} y2={CY - 41} stroke={W} strokeWidth="5" strokeLinecap="round" />
      </g>
      <g ref={secRef}>
        <line x1={CX} y1={CY + 12} x2={CX} y2={CY - 48} stroke={MINT} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx={CX} cy={CY} r="5.5" fill={W} />
    </g>
  );
}

/* ------------------------------ Illustration ------------------------------ */

export function HeroTaskIllustration({
  className = '',
}: {
  className?: string;
  /** kept for backwards compatibility — the illustration contains no text */
  labels?: LabelProps;
}) {
  const reduce = useReducedMotion();

  const float = (delay: number, distance = 5, duration = 5) =>
    reduce
      ? {}
      : {
          animate: { y: [0, -distance, 0] },
          transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' as const },
        };

  return (
    <div
      className={`relative isolate mx-auto w-full max-w-[600px] select-none ${className}`}
      dir="ltr"
      aria-hidden
    >
      {/* cheap CSS glow behind the calendar (transparent, starfield stays visible) */}
      <div
        className="pointer-events-none absolute -z-10 rounded-[3rem] bg-emerald-500/15 blur-3xl"
        style={{ left: '31%', top: '40%', width: '60%', height: '41%' }}
      />

      <svg
        viewBox="60 40 860 720"
        width="100%"
        className="block h-auto w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="mdr-head">
            <circle cx="408" cy="514" r="21" />
          </clipPath>
          <filter id="mdr-blur-s" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="mdr-glow-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <linearGradient id="mdr-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#141f1c" />
            <stop offset="1" stopColor="#0f1614" />
          </linearGradient>
          <linearGradient id="mdr-man" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={TEAL_D} />
            <stop offset="1" stopColor={EM} />
          </linearGradient>
          <linearGradient id="mdr-woman" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={TEAL} />
            <stop offset="1" stopColor={TEAL_D} />
          </linearGradient>
        </defs>

        {/* soft backdrop blob + ground */}
        <path
          d="M250 200C250 120 330 95 420 110C520 125 600 190 700 185C780 180 860 90 890 150C920 210 880 280 860 340C850 420 900 520 880 600C860 700 700 740 560 735C420 740 250 730 160 680C100 640 140 560 200 480C250 420 240 300 250 200Z"
          fill={EM}
          opacity="0.06"
        />
        <ellipse cx="520" cy="672" rx="400" ry="52" fill={EM} opacity="0.07" />

        {/* ---------- WALL CLOCK ---------- */}
        <Clock />

        {/* ---------- FLOATING STICKY NOTES ---------- */}
        <motion.g {...float(0, 5, 5)}>
          <Note x={118} y={212} w={52} h={70} />
        </motion.g>
        <motion.g {...float(0.9, 5, 5.6)}>
          <Note x={360} y={160} w={52} h={70} />
        </motion.g>

        {/* ---------- DESK CALENDAR ---------- */}
        <polygon points="780,362 842,606 836,626 722,626" fill="#134E4A" />
        <polygon points="722,626 776,556 842,606 836,626" fill={TEAL} opacity="0.75" />
        <polygon points="780,362 800,360 846,604 842,606" fill={TEAL_D} />

        <g transform="translate(385 360) skewX(-13.5)">
          <rect x="0" y="0" width="400" height="262" rx="10" fill="url(#mdr-face)" stroke={EDGE} strokeWidth="2.5" />
          <rect x="-2" y="-5" width="404" height="10" rx="5" fill={TEAL_D} />
          {ROWS.flatMap((ry, r) =>
            COLS.map((cx, c) => <Tile key={`${r}-${c}`} x={cx} y={ry} done={DONE.has(`${r}-${c}`)} />),
          )}
        </g>

        {/* binder rings */}
        <g pointerEvents="none">
          {[452, 563, 677].map((x, i) => (
            <path
              key={x}
              d={`M${x - 16} ${380 - i} C${x - 30} 356 ${x - 24} 322 ${x} 322 C${x + 26} 322 ${x + 32} 352 ${x + 18} 372`}
              stroke={EM}
              strokeWidth="11"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* ---------- PLANT ---------- */}
        <Plant />

        {/* ---------- STANDING CHARACTER ---------- */}
        <g pointerEvents="none">
          <path d="M112 482H150L132 652H98Z" fill={EM} />
          <path d="M146 482H188L186 652H152Z" fill="#0EA371" />
          <rect x="84" y="648" width="46" height="15" rx="7" fill={SLATE} stroke={MINT} strokeOpacity="0.45" />
          <rect x="146" y="648" width="42" height="15" rx="7" fill={SLATE} stroke={MINT} strokeOpacity="0.45" />
          <path d="M120 398Q104 440 112 472" stroke={TEAL_D} strokeWidth="18" strokeLinecap="round" />
          <path d="M116 394Q118 376 148 374Q178 376 186 394L188 488L110 490Z" fill="url(#mdr-man)" />
          <rect x="142" y="366" width="16" height="22" rx="6" fill={SKIN_D} />
          <circle cx="150" cy="350" r="21" fill={SKIN} />
          <path d="M127 352C122 328 140 316 160 320C174 323 178 336 173 344C160 334 146 336 138 354Z" fill={SLATE} stroke={MINT} strokeOpacity="0.5" />
          <path d="M176 396Q204 394 233 340" stroke={TEAL} strokeWidth="20" strokeLinecap="round" />
          <circle cx="237" cy="332" r="9" fill={SKIN} />
          <Note x={226} y={272} w={58} h={72} variant={1} />
        </g>

        {/* ---------- SEATED CHARACTER ---------- */}
        <g pointerEvents="none">
          {/* legs */}
          <path d="M398 640L335 652L276 704" stroke="#0A8F66" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M398 628L292 612L276 688" stroke={EM} strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="246" y="684" width="42" height="22" rx="9" fill={SLATE} stroke={MINT} strokeOpacity="0.45" />
          <rect x="266" y="700" width="40" height="18" rx="8" fill={SLATE} stroke={MINT} strokeOpacity="0.45" />

          {/* torso */}
          <path d="M372 552Q408 530 444 550L436 628L360 632Z" fill="url(#mdr-woman)" />

          {/* ponytail (behind the head), neck, head, hair cap clipped to the head */}
          <path d="M422 502C438 486 464 494 463 520C462 535 457 546 450 553C448 541 445 529 437 521C430 514 425 509 422 502Z" fill={HAIR} />
          <path d="M440 497C452 500 457 512 456 524" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="398" y="530" width="14" height="16" rx="5" fill={SKIN_D} />
          <circle cx="408" cy="514" r="21" fill={SKIN} />
          <path
            clipPath="url(#mdr-head)"
            d="M376 466H442V548H426C430 532 426 518 416 510C406 503 394 505 385 514L376 514Z"
            fill={HAIR}
          />
          <path clipPath="url(#mdr-head)" d="M392 494C404 487 420 489 430 499" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />

          {/* laptop on her lap, side view: keyboard deck + open lid, screen facing her */}
          <polygon points="298,591 380,604 380,611 298,598" fill={SLATE} stroke={MINT} strokeOpacity="0.55" strokeLinejoin="round" />
          <line x1="306" y1="596" x2="374" y2="607" stroke={MINT} strokeOpacity="0.35" strokeWidth="1.5" />
          <polygon points="308,592 290,533 331,566" fill={EM} opacity="0.14" />
          <polygon points="298,591 307,592.5 289,532.5 280,531" fill={CARD} stroke={EM} strokeOpacity="0.9" strokeWidth="2" strokeLinejoin="round" />
          <line x1="307" y1="592.5" x2="289" y2="532.5" stroke={MINT} strokeWidth="2.5" strokeLinecap="round" />

          {/* arm: elbow back, hand resting on the keys */}
          <path d="M404 558Q418 594 358 594" stroke={TEAL} strokeWidth="15" strokeLinecap="round" />
          <circle cx="354" cy="593" r="6" fill={SKIN} />
        </g>

        {/* ---------- GEARS ---------- */}
        <Gear cx={555} cy={664} r={30} />
        <Gear cx={650} cy={644} r={40} />
        <Gear cx={718} cy={652} r={15} />

        {/* small sprig */}
        <g pointerEvents="none">
          <path d="M505 728C494 716 490 704 494 696C504 702 508 714 505 728Z" fill={TEAL} />
          <path d="M505 728C512 716 520 710 528 710C524 720 516 728 505 728Z" fill={TEAL_D} />
        </g>
      </svg>
    </div>
  );
}