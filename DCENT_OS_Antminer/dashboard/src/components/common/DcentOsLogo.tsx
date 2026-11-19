import React from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   JMSCNC Heater OS logo: a simple flame mark + the "JMSCNC / HEATER OS"
   wordmark. The component names (DcentOsLogo / DcentOsIcon) and props are
   kept from upstream DCENT_OS so call sites and merges stay unchanged.

   The flame is drawn from plain paths. Its gradient and glow keep the
   upstream ids (logo-sphere / icon-sphere, logo-glow / icon-glow) so the
   theme rules in design-system.css still recolor the mark to the active
   accent. A gentle flicker honors prefers-reduced-motion (disabled).
   ───────────────────────────────────────────────────────────────────────── */

// Outer flame and inner core, centred on roughly (53, 59) inside the
// 66x66 box starting at (20, 26), matching the old mark's footprint.
const FLAME_OUTER =
  'M53 28 C60 42 76 50 76 68 C76 82 66 90 53 90 C40 90 30 82 30 68 ' +
  'C30 58 36 52 40 46 C41 54 44 58 48 60 C46 48 48 38 53 28 Z';
const FLAME_INNER =
  'M53 56 C57 63 64 68 64 76 C64 83 59 88 53 88 C47 88 42 83 42 76 C42 70 47 66 53 56 Z';

function Flame({ idp }: { idp: string }) {
  return (
    <g
      className={`${idp}-flame`}
      style={{ transformBox: 'view-box', transformOrigin: '53px 90px' } as React.CSSProperties}
    >
      <path d={FLAME_OUTER} fill={`url(#${idp}-sphere)`} filter={`url(#${idp}-glow)`} />
      <path d={FLAME_INNER} fill="#FFE9B0" opacity={0.85} />
    </g>
  );
}

function FlameDefs({ idp }: { idp: string }) {
  return (
    <>
      <linearGradient id={`${idp}-sphere`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#FFD47A" />
        <stop offset="55%" stopColor="#FAA500" />
        <stop offset="100%" stopColor="#FA6700" />
      </linearGradient>
      <filter id={`${idp}-glow`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="blur" />
        <feFlood floodColor="#FAA500" floodOpacity={0.28} result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <style>{`
        @keyframes ${idp}-flicker {
          0%, 100% { transform: scale(1, 1); }
          50% { transform: scale(0.97, 1.04); }
        }
        .${idp}-flame { animation: ${idp}-flicker 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .${idp}-flame { animation: none; } }
      `}</style>
    </>
  );
}

/**
 * JMSCNC Heater OS full logo: flame mark + wordmark. Pass width to scale
 * (aspect ratio 340:120, unchanged from the prior logo so callers don't shift).
 */
export function DcentOsLogo({ width = 170 }: { width?: number }) {
  const height = Math.round(width * (120 / 340));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 340 120"
      width={width}
      height={height}
      role="img"
      aria-label="JMSCNC Heater OS"
    >
      <defs>
        <FlameDefs idp="logo" />
        <filter id="logo-textglow">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <Flame idp="logo" />

      {/* Wordmark: crisp white JMSCNC over an accent-colored HEATER OS. */}
      <text
        x="104" y="64"
        fontFamily="-apple-system, 'SF Pro Display', 'Segoe UI', Helvetica, sans-serif"
        fontSize="42" fontWeight="800" letterSpacing="-1"
        fill="#f5f5f7" filter="url(#logo-textglow)"
      >
        JMSCNC
      </text>
      {/* accent text follows the theme accent (see design-system.css) */}
      <text
        x="106" y="92"
        fontFamily="-apple-system, 'SF Pro Display', 'Segoe UI', Helvetica, sans-serif"
        fontSize="20" fontWeight="700" letterSpacing="5"
        fill="#FAA500" className="dcent-logo-underscore"
      >
        HEATER OS
      </text>
    </svg>
  );
}

/**
 * JMSCNC Heater OS mark only: the flame, for sidebars / favicon / small
 * spaces. No wordmark.
 */
export function DcentOsIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="20 26 66 66"
      width={size}
      height={size}
      role="img"
      aria-label="JMSCNC Heater OS"
    >
      <defs>
        <FlameDefs idp="icon" />
      </defs>
      <Flame idp="icon" />
    </svg>
  );
}
