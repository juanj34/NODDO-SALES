"use client";

import React from "react";

/* ═══════════════════════════════════════════════════════════════
   SiteEmptyState — Branded empty state for microsite pages
   Gold wireframe SVG illustrations, Cormorant title, DM Mono body
   ═══════════════════════════════════════════════════════════════ */

const g = "#b8973a"; // gold
const gR = "rgba(184,151,58,"; // gold rgba prefix

/* ── SVG Illustrations ── */

function IllustrationGaleria() {
  return (
    <svg viewBox="0 0 140 100" fill="none" width="140" height="100">
      {/* Back frame */}
      <rect x="30" y="8" width="80" height="56" rx="2" stroke={g} strokeWidth="0.6" opacity="0.2" />
      {/* Front frame */}
      <rect x="18" y="18" width="80" height="56" rx="2" stroke={g} strokeWidth="0.8" opacity="0.4" />
      {/* Landscape inside front frame */}
      <path d="M24 62 L40 46 L52 54 L68 38 L92 62" stroke={g} strokeWidth="0.6" opacity="0.3" />
      {/* Sun */}
      <circle cx="80" cy="30" r="5" stroke={g} strokeWidth="0.5" opacity="0.25" />
      {/* Corner marks */}
      <path d="M18 24 L18 18 L24 18" stroke={g} strokeWidth="1" opacity="0.5" fill="none" />
      <path d="M92 18 L98 18 L98 24" stroke={g} strokeWidth="1" opacity="0.5" fill="none" />
      <path d="M18 68 L18 74 L24 74" stroke={g} strokeWidth="1" opacity="0.5" fill="none" />
      <path d="M92 74 L98 74 L98 68" stroke={g} strokeWidth="1" opacity="0.5" fill="none" />
      {/* Third stacked frame hint */}
      <line x1="42" y1="4" x2="108" y2="4" stroke={g} strokeWidth="0.4" opacity="0.12" />
      <line x1="110" y1="6" x2="110" y2="60" stroke={g} strokeWidth="0.4" opacity="0.12" />
      {/* Grid dots background */}
      {[0,1,2,3,4].map(r => [0,1,2,3,4,5,6].map(c => (
        <circle key={`${r}-${c}`} cx={12 + c * 18} cy={84 + r * 4} r="0.5" fill={g} opacity="0.1" />
      )))}
    </svg>
  );
}

function IllustrationVideos() {
  return (
    <svg viewBox="0 0 140 100" fill="none" width="140" height="100">
      {/* Screen frame */}
      <rect x="16" y="12" width="108" height="64" rx="3" stroke={g} strokeWidth="0.8" opacity="0.35" />
      {/* Screen inner */}
      <rect x="20" y="16" width="100" height="56" rx="1" stroke={g} strokeWidth="0.4" opacity="0.15" />
      {/* Play triangle */}
      <polygon points="62,34 62,56 80,45" stroke={g} strokeWidth="1" opacity="0.5" fill={`${gR}0.06)`} strokeLinejoin="round" />
      {/* Play circle */}
      <circle cx="70" cy="45" r="18" stroke={g} strokeWidth="0.7" opacity="0.25" />
      {/* Progress bar */}
      <rect x="24" y="66" width="92" height="2" rx="1" stroke={g} strokeWidth="0.3" opacity="0.15" />
      <rect x="24" y="66" width="35" height="2" rx="1" fill={g} opacity="0.2" />
      {/* Film notches left */}
      {[0,1,2,3,4,5].map(i => (
        <rect key={`l${i}`} x="10" y={16 + i * 10} width="4" height="6" rx="0.5" stroke={g} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Film notches right */}
      {[0,1,2,3,4,5].map(i => (
        <rect key={`r${i}`} x="126" y={16 + i * 10} width="4" height="6" rx="0.5" stroke={g} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Stand */}
      <line x1="60" y1="76" x2="50" y2="88" stroke={g} strokeWidth="0.5" opacity="0.2" />
      <line x1="80" y1="76" x2="90" y2="88" stroke={g} strokeWidth="0.5" opacity="0.2" />
      <line x1="44" y1="88" x2="96" y2="88" stroke={g} strokeWidth="0.5" opacity="0.2" />
    </svg>
  );
}

function IllustrationTipologias() {
  return (
    <svg viewBox="0 0 140 100" fill="none" width="140" height="100">
      {/* Building facade — left face */}
      <polygon points="30,20 70,10 70,85 30,95" stroke={g} strokeWidth="0.8" opacity="0.35" />
      {/* Building facade — right face */}
      <polygon points="70,10 110,20 110,95 70,85" stroke={g} strokeWidth="0.7" opacity="0.28" />
      {/* Center edge */}
      <line x1="70" y1="10" x2="70" y2="85" stroke={g} strokeWidth="1.2" opacity="0.5" />
      {/* Top edges */}
      <line x1="30" y1="20" x2="70" y2="10" stroke={g} strokeWidth="0.8" opacity="0.4" />
      <line x1="70" y1="10" x2="110" y2="20" stroke={g} strokeWidth="0.7" opacity="0.35" />
      {/* Floor lines */}
      {[0,1,2,3,4].map(i => (
        <g key={`f${i}`}>
          <line x1="30" y1={35 + i * 12} x2="70" y2={25 + i * 12} stroke={g} strokeWidth="0.3" opacity="0.15" />
          <line x1="70" y1={25 + i * 12} x2="110" y2={35 + i * 12} stroke={g} strokeWidth="0.3" opacity="0.12" />
        </g>
      ))}
      {/* Grid cells — left face (Noddo Grid style) */}
      {[0,1,2,3,4].map(row =>
        [0,1,2].map(col => (
          <rect
            key={`l${row}-${col}`}
            x={36 + col * 11 - row * 0.8}
            y={24 + row * 12}
            width="8"
            height="8"
            rx="1"
            fill={row === 2 && col === 1 ? `${gR}0.2)` : `${gR}0.06)`}
            stroke={row === 2 && col === 1 ? g : "none"}
            strokeWidth="0.5"
            opacity={row === 2 && col === 1 ? "0.6" : "0.8"}
          />
        ))
      )}
      {/* Grid cells — right face */}
      {[0,1,2,3,4].map(row =>
        [0,1,2].map(col => (
          <rect
            key={`r${row}-${col}`}
            x={76 + col * 11 + row * 0.8}
            y={24 + row * 12}
            width="8"
            height="8"
            rx="1"
            fill={`${gR}0.04)`}
            opacity="0.8"
          />
        ))
      )}
      {/* Antenna */}
      <line x1="70" y1="10" x2="70" y2="2" stroke={g} strokeWidth="0.6" opacity="0.3" />
      <line x1="66" y1="5" x2="74" y2="5" stroke={g} strokeWidth="0.4" opacity="0.2" />
    </svg>
  );
}

function IllustrationUbicacion() {
  return (
    <svg viewBox="0 0 140 100" fill="none" width="140" height="100">
      {/* Topographic contour lines */}
      <ellipse cx="70" cy="55" rx="58" ry="32" stroke={g} strokeWidth="0.3" opacity="0.1" />
      <ellipse cx="70" cy="55" rx="46" ry="25" stroke={g} strokeWidth="0.3" opacity="0.12" />
      <ellipse cx="70" cy="55" rx="34" ry="18" stroke={g} strokeWidth="0.4" opacity="0.15" />
      <ellipse cx="70" cy="55" rx="22" ry="12" stroke={g} strokeWidth="0.4" opacity="0.18" />
      <ellipse cx="70" cy="55" rx="10" ry="6" stroke={g} strokeWidth="0.5" opacity="0.2" />
      {/* Map pin */}
      <path d="M70 20 C60 20 54 28 54 36 C54 48 70 58 70 58 C70 58 86 48 86 36 C86 28 80 20 70 20 Z" stroke={g} strokeWidth="1" opacity="0.45" fill={`${gR}0.05)`} />
      <circle cx="70" cy="35" r="5" stroke={g} strokeWidth="0.7" opacity="0.35" />
      {/* Pin glow ring */}
      <circle cx="70" cy="35" r="10" stroke={g} strokeWidth="0.4" opacity="0.12" strokeDasharray="2 2" />
      {/* Road lines */}
      <line x1="8" y1="70" x2="52" y2="50" stroke={g} strokeWidth="0.4" opacity="0.1" />
      <line x1="88" y1="50" x2="132" y2="70" stroke={g} strokeWidth="0.4" opacity="0.1" />
      {/* Distance marker dots */}
      <circle cx="20" cy="65" r="2" stroke={g} strokeWidth="0.4" opacity="0.15" />
      <circle cx="120" cy="65" r="2" stroke={g} strokeWidth="0.4" opacity="0.15" />
      {/* Grid dots */}
      {[0,1,2].map(r => [0,1,2,3,4,5,6].map(c => (
        <circle key={`${r}-${c}`} cx={14 + c * 19} cy={82 + r * 6} r="0.5" fill={g} opacity="0.08" />
      )))}
    </svg>
  );
}

function IllustrationRecursos() {
  return (
    <svg viewBox="0 0 140 100" fill="none" width="140" height="100">
      {/* Back document */}
      <rect x="46" y="8" width="56" height="72" rx="2" stroke={g} strokeWidth="0.5" opacity="0.15" />
      {/* Middle document */}
      <rect x="38" y="14" width="56" height="72" rx="2" stroke={g} strokeWidth="0.6" opacity="0.25" />
      {/* Front document with folded corner */}
      <path d="M30 20 H74 L82 28 V92 H30 Z" stroke={g} strokeWidth="0.8" opacity="0.4" />
      <path d="M74 20 V28 H82" stroke={g} strokeWidth="0.6" opacity="0.3" />
      {/* Text lines on front doc */}
      <line x1="36" y1="38" x2="72" y2="38" stroke={g} strokeWidth="0.5" opacity="0.2" />
      <line x1="36" y1="46" x2="68" y2="46" stroke={g} strokeWidth="0.5" opacity="0.15" />
      <line x1="36" y1="54" x2="72" y2="54" stroke={g} strokeWidth="0.5" opacity="0.2" />
      <line x1="36" y1="62" x2="60" y2="62" stroke={g} strokeWidth="0.5" opacity="0.12" />
      {/* Download arrow */}
      <line x1="106" y1="40" x2="106" y2="62" stroke={g} strokeWidth="0.8" opacity="0.35" />
      <path d="M100 56 L106 62 L112 56" stroke={g} strokeWidth="0.8" opacity="0.35" strokeLinecap="round" />
      {/* Download base line */}
      <line x1="96" y1="68" x2="116" y2="68" stroke={g} strokeWidth="0.6" opacity="0.25" />
    </svg>
  );
}

function IllustrationAvances() {
  return (
    <svg viewBox="0 0 140 100" fill="none" width="140" height="100">
      {/* Building under construction */}
      <rect x="40" y="35" width="40" height="55" stroke={g} strokeWidth="0.7" opacity="0.3" />
      {/* Floors */}
      {[0,1,2,3].map(i => (
        <line key={`f${i}`} x1="40" y1={48 + i * 12} x2="80" y2={48 + i * 12} stroke={g} strokeWidth="0.3" opacity="0.15" />
      ))}
      {/* Windows */}
      {[0,1,2,3].map(row =>
        [0,1,2].map(col => (
          <rect key={`w${row}-${col}`} x={44 + col * 12} y={38 + row * 12} width="6" height="7" stroke={g} strokeWidth="0.3" opacity="0.15" />
        ))
      )}
      {/* Crane tower */}
      <line x1="85" y1="90" x2="85" y2="8" stroke={g} strokeWidth="0.8" opacity="0.35" />
      {/* Crane arm */}
      <line x1="85" y1="12" x2="125" y2="12" stroke={g} strokeWidth="0.7" opacity="0.3" />
      {/* Crane counter-arm */}
      <line x1="85" y1="12" x2="70" y2="12" stroke={g} strokeWidth="0.5" opacity="0.2" />
      {/* Crane cables */}
      <line x1="85" y1="8" x2="125" y2="12" stroke={g} strokeWidth="0.3" opacity="0.15" />
      <line x1="85" y1="8" x2="70" y2="12" stroke={g} strokeWidth="0.3" opacity="0.15" />
      {/* Hook cable */}
      <line x1="110" y1="12" x2="110" y2="30" stroke={g} strokeWidth="0.4" opacity="0.2" strokeDasharray="2 2" />
      {/* Hook */}
      <path d="M107 30 L110 30 L110 34 C110 36 108 36 108 34" stroke={g} strokeWidth="0.5" opacity="0.25" fill="none" />
      {/* Progress bar */}
      <rect x="20" y="92" width="100" height="4" rx="2" stroke={g} strokeWidth="0.4" opacity="0.2" />
      <rect x="20" y="92" width="55" height="4" rx="2" fill={g} opacity="0.15" />
      {/* Crane base */}
      <line x1="78" y1="90" x2="92" y2="90" stroke={g} strokeWidth="0.6" opacity="0.25" />
    </svg>
  );
}

function IllustrationInventario() {
  return (
    <svg viewBox="0 0 140 100" fill="none" width="140" height="100">
      {/* Table/grid structure */}
      <rect x="16" y="14" width="108" height="72" rx="3" stroke={g} strokeWidth="0.8" opacity="0.35" />
      {/* Header row */}
      <rect x="16" y="14" width="108" height="14" rx="3" stroke={g} strokeWidth="0.5" opacity="0.2" fill={`${gR}0.04)`} />
      {/* Column lines */}
      <line x1="48" y1="14" x2="48" y2="86" stroke={g} strokeWidth="0.3" opacity="0.12" />
      <line x1="80" y1="14" x2="80" y2="86" stroke={g} strokeWidth="0.3" opacity="0.12" />
      {/* Row lines */}
      {[0,1,2,3,4].map(i => (
        <line key={`r${i}`} x1="16" y1={28 + i * 12} x2="124" y2={28 + i * 12} stroke={g} strokeWidth="0.3" opacity="0.1" />
      ))}
      {/* Status dots */}
      <circle cx="110" cy="35" r="3" fill={`${gR}0.25)`} stroke={g} strokeWidth="0.5" opacity="0.4" />
      <circle cx="110" cy="47" r="3" fill={`${gR}0.15)`} stroke={g} strokeWidth="0.5" opacity="0.3" />
      <circle cx="110" cy="59" r="3" fill={`${gR}0.25)`} stroke={g} strokeWidth="0.5" opacity="0.4" />
      <circle cx="110" cy="71" r="3" stroke={g} strokeWidth="0.5" opacity="0.2" />
      {/* Header text lines */}
      <line x1="22" y1="21" x2="42" y2="21" stroke={g} strokeWidth="0.8" opacity="0.25" />
      <line x1="54" y1="21" x2="74" y2="21" stroke={g} strokeWidth="0.8" opacity="0.25" />
      <line x1="86" y1="21" x2="100" y2="21" stroke={g} strokeWidth="0.8" opacity="0.25" />
      {/* Cell text placeholders */}
      {[0,1,2,3].map(row => (
        <g key={`c${row}`}>
          <line x1="22" y1={35 + row * 12} x2="38" y2={35 + row * 12} stroke={g} strokeWidth="0.5" opacity="0.15" />
          <line x1="54" y1={35 + row * 12} x2="72" y2={35 + row * 12} stroke={g} strokeWidth="0.5" opacity="0.12" />
        </g>
      ))}
      {/* Grid dots */}
      {[0,1].map(r => [0,1,2,3,4,5,6].map(c => (
        <circle key={`${r}-${c}`} cx={14 + c * 18} cy={92 + r * 4} r="0.5" fill={g} opacity="0.08" />
      )))}
    </svg>
  );
}

function IllustrationExplorar() {
  return (
    <svg viewBox="0 0 140 100" fill="none" width="140" height="100">
      {/* Building facade — front face */}
      <rect x="30" y="15" width="50" height="70" stroke={g} strokeWidth="0.8" opacity="0.35" />
      {/* Building facade — side face (3D) */}
      <polygon points="80,15 110,25 110,85 80,85" stroke={g} strokeWidth="0.7" opacity="0.25" />
      {/* Top edge */}
      <line x1="30" y1="15" x2="60" y2="5" stroke={g} strokeWidth="0.5" opacity="0.15" />
      <line x1="60" y1="5" x2="110" y2="25" stroke={g} strokeWidth="0.5" opacity="0.15" />
      <line x1="80" y1="15" x2="60" y2="5" stroke={g} strokeWidth="0.5" opacity="0.15" />
      {/* Grid windows — front */}
      {[0,1,2,3,4].map(row =>
        [0,1,2].map(col => (
          <rect
            key={`f${row}-${col}`}
            x={36 + col * 14}
            y={22 + row * 13}
            width="9"
            height="9"
            rx="1"
            fill={row === 2 && col === 1 ? `${gR}0.18)` : `${gR}0.05)`}
            stroke={row === 2 && col === 1 ? g : "none"}
            strokeWidth="0.5"
            opacity={row === 2 && col === 1 ? 0.6 : 0.8}
          />
        ))
      )}
      {/* Compass circle */}
      <circle cx="22" cy="82" r="10" stroke={g} strokeWidth="0.6" opacity="0.25" />
      <line x1="22" y1="74" x2="22" y2="78" stroke={g} strokeWidth="0.5" opacity="0.3" />
      <line x1="22" y1="86" x2="22" y2="90" stroke={g} strokeWidth="0.5" opacity="0.3" />
      <line x1="14" y1="82" x2="18" y2="82" stroke={g} strokeWidth="0.5" opacity="0.3" />
      <line x1="26" y1="82" x2="30" y2="82" stroke={g} strokeWidth="0.5" opacity="0.3" />
      {/* North arrow */}
      <polygon points="22,75 20,80 24,80" fill={g} opacity="0.3" />
      {/* Eye icon */}
      <ellipse cx="120" cy="20" rx="10" ry="6" stroke={g} strokeWidth="0.6" opacity="0.3" />
      <circle cx="120" cy="20" r="3" stroke={g} strokeWidth="0.5" opacity="0.25" />
    </svg>
  );
}

function IllustrationBrochure() {
  return (
    <svg viewBox="0 0 140 100" fill="none" width="140" height="100">
      {/* Open booklet — left page */}
      <path d="M70 18 Q50 16 24 22 L24 82 Q50 76 70 78 Z" stroke={g} strokeWidth="0.8" opacity="0.35" fill={`${gR}0.02)`} />
      {/* Open booklet — right page */}
      <path d="M70 18 Q90 16 116 22 L116 82 Q90 76 70 78 Z" stroke={g} strokeWidth="0.7" opacity="0.28" fill={`${gR}0.02)`} />
      {/* Spine */}
      <line x1="70" y1="18" x2="70" y2="78" stroke={g} strokeWidth="1" opacity="0.45" />
      {/* Text lines — left page */}
      <line x1="32" y1="34" x2="62" y2="32" stroke={g} strokeWidth="0.5" opacity="0.2" />
      <line x1="32" y1="42" x2="58" y2="40" stroke={g} strokeWidth="0.5" opacity="0.15" />
      <line x1="32" y1="50" x2="60" y2="48" stroke={g} strokeWidth="0.5" opacity="0.2" />
      <line x1="32" y1="58" x2="54" y2="56" stroke={g} strokeWidth="0.5" opacity="0.12" />
      {/* Image placeholder — right page */}
      <rect x="78" y="30" width="30" height="22" rx="1.5" stroke={g} strokeWidth="0.5" opacity="0.2" />
      <path d="M82 46 L90 38 L96 42 L104 34" stroke={g} strokeWidth="0.4" opacity="0.15" />
      {/* Text lines — right page */}
      <line x1="78" y1="60" x2="108" y2="60" stroke={g} strokeWidth="0.5" opacity="0.15" />
      <line x1="78" y1="66" x2="104" y2="66" stroke={g} strokeWidth="0.5" opacity="0.12" />
      {/* Download arrow below */}
      <line x1="70" y1="84" x2="70" y2="94" stroke={g} strokeWidth="0.7" opacity="0.3" />
      <path d="M65 90 L70 95 L75 90" stroke={g} strokeWidth="0.7" opacity="0.3" strokeLinecap="round" />
    </svg>
  );
}

/* ── Illustration map ── */
const illustrations: Record<string, () => React.ReactElement> = {
  galeria: IllustrationGaleria,
  videos: IllustrationVideos,
  tipologias: IllustrationTipologias,
  ubicacion: IllustrationUbicacion,
  recursos: IllustrationRecursos,
  avances: IllustrationAvances,
  inventario: IllustrationInventario,
  explorar: IllustrationExplorar,
  brochure: IllustrationBrochure,
};

/* ── Component ── */
interface SiteEmptyStateProps {
  variant: keyof typeof illustrations;
  title: string;
  description: string;
  /** Compact mode: no full-screen height, no grid background. For inline use inside pages. */
  compact?: boolean;
}

export function SiteEmptyState({ variant, title, description, compact }: SiteEmptyStateProps) {
  const Illustration = illustrations[variant] || IllustrationGaleria;

  return (
    <div
      className={compact
        ? "flex flex-col items-center justify-center text-center px-8 py-16"
        : "h-screen flex flex-col items-center justify-center text-center px-8"
      }
      style={compact ? undefined : { background: "var(--site-bg, #0A0A0B)" }}
    >
      {/* Subtle ambient grid dots (full-page only) */}
      {!compact && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.03 }}>
          <svg width="100%" height="100%">
            <defs>
              <pattern id="emptyGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="0.8" fill={g} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#emptyGrid)" />
          </svg>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* SVG Illustration */}
        <div style={{ opacity: 0.9 }}>
          <Illustration />
        </div>

        {/* Title — Cormorant Garamond */}
        <h2
          className="font-site-heading font-light leading-tight"
          style={{ fontSize: compact ? "clamp(18px, 2.5vw, 24px)" : "clamp(22px, 3vw, 32px)", color: `${gR}0.55)` }}
        >
          {title}
        </h2>

        {/* Description — DM Mono */}
        <p
          className="max-w-[360px] leading-[1.7]"
          style={{ fontSize: 13, color: "rgba(244,240,232,0.3)" }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
