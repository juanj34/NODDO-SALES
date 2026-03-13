"use client";

import React, { ReactNode } from "react";
import { emptyState, emptyStateTitle, emptyStateDescription } from "./editor-styles";

/* ═══════════════════════════════════════════════════════════════
   DashboardEmptyState — Branded empty state for editor pages
   Gold wireframe SVGs, Cormorant title, DM Mono body
   ═══════════════════════════════════════════════════════════════ */

const p = "var(--site-primary)"; // gold accent (per-project)
const pR = "rgba(var(--site-primary-rgb),"; // gold rgba prefix

/* ── SVG Illustrations (dashboard-sized, ~100x80) ── */

function IllustrationGaleria() {
  return (
    <svg viewBox="0 0 100 72" fill="none" width="100" height="72">
      <rect x="22" y="6" width="56" height="40" rx="2" stroke={p} strokeWidth="0.6" opacity="0.15" />
      <rect x="14" y="14" width="56" height="40" rx="2" stroke={p} strokeWidth="0.7" opacity="0.35" />
      <path d="M18 44 L30 32 L40 38 L52 26 L66 44" stroke={p} strokeWidth="0.5" opacity="0.25" />
      <circle cx="58" cy="24" r="4" stroke={p} strokeWidth="0.4" opacity="0.2" />
      <path d="M14 18 L14 14 L18 14" stroke={p} strokeWidth="0.8" opacity="0.4" fill="none" />
      <path d="M66 14 L70 14 L70 18" stroke={p} strokeWidth="0.8" opacity="0.4" fill="none" />
      <path d="M14 50 L14 54 L18 54" stroke={p} strokeWidth="0.8" opacity="0.4" fill="none" />
      <path d="M66 54 L70 54 L70 50" stroke={p} strokeWidth="0.8" opacity="0.4" fill="none" />
    </svg>
  );
}

function IllustrationVideos() {
  return (
    <svg viewBox="0 0 100 72" fill="none" width="100" height="72">
      <rect x="12" y="8" width="76" height="46" rx="2" stroke={p} strokeWidth="0.7" opacity="0.3" />
      <polygon points="42,22 42,42 58,32" stroke={p} strokeWidth="0.8" opacity="0.4" fill={`${pR}0.05)`} strokeLinejoin="round" />
      <circle cx="50" cy="32" r="14" stroke={p} strokeWidth="0.5" opacity="0.2" />
      <rect x="16" y="48" width="68" height="2" rx="1" stroke={p} strokeWidth="0.3" opacity="0.12" />
      <rect x="16" y="48" width="26" height="2" rx="1" fill={p} opacity="0.15" />
      {[0,1,2,3].map(i => (
        <rect key={`l${i}`} x="6" y={12 + i * 10} width="3" height="5" rx="0.5" stroke={p} strokeWidth="0.25" opacity="0.1" />
      ))}
      {[0,1,2,3].map(i => (
        <rect key={`r${i}`} x="91" y={12 + i * 10} width="3" height="5" rx="0.5" stroke={p} strokeWidth="0.25" opacity="0.1" />
      ))}
      <line x1="42" y1="54" x2="36" y2="64" stroke={p} strokeWidth="0.4" opacity="0.15" />
      <line x1="58" y1="54" x2="64" y2="64" stroke={p} strokeWidth="0.4" opacity="0.15" />
      <line x1="32" y1="64" x2="68" y2="64" stroke={p} strokeWidth="0.4" opacity="0.15" />
    </svg>
  );
}

function IllustrationTipologias() {
  return (
    <svg viewBox="0 0 100 72" fill="none" width="100" height="72">
      <polygon points="22,14 50,8 50,60 22,66" stroke={p} strokeWidth="0.7" opacity="0.3" />
      <polygon points="50,8 78,14 78,66 50,60" stroke={p} strokeWidth="0.6" opacity="0.25" />
      <line x1="50" y1="8" x2="50" y2="60" stroke={p} strokeWidth="1" opacity="0.45" />
      {[0,1,2,3].map(i => (
        <g key={`f${i}`}>
          <line x1="22" y1={25 + i * 10} x2="50" y2={19 + i * 10} stroke={p} strokeWidth="0.25" opacity="0.12" />
          <line x1="50" y1={19 + i * 10} x2="78" y2={25 + i * 10} stroke={p} strokeWidth="0.25" opacity="0.1" />
        </g>
      ))}
      {[0,1,2,3].map(row =>
        [0,1].map(col => (
          <rect key={`l${row}-${col}`} x={27 + col * 10} y={16 + row * 10} width="6" height="6" rx="1"
            fill={row === 1 && col === 1 ? `${pR}0.18)` : `${pR}0.05)`}
            stroke={row === 1 && col === 1 ? p : "none"} strokeWidth="0.4" opacity={row === 1 && col === 1 ? "0.5" : "0.7"} />
        ))
      )}
      {[0,1,2,3].map(row =>
        [0,1].map(col => (
          <rect key={`r${row}-${col}`} x={55 + col * 10} y={16 + row * 10} width="6" height="6" rx="1" fill={`${pR}0.04)`} opacity="0.7" />
        ))
      )}
    </svg>
  );
}

function IllustrationRecursos() {
  return (
    <svg viewBox="0 0 100 72" fill="none" width="100" height="72">
      <rect x="36" y="6" width="40" height="52" rx="2" stroke={p} strokeWidth="0.4" opacity="0.12" />
      <rect x="28" y="12" width="40" height="52" rx="2" stroke={p} strokeWidth="0.5" opacity="0.2" />
      <path d="M20 18 H50 L56 24 V68 H20 Z" stroke={p} strokeWidth="0.7" opacity="0.35" />
      <path d="M50 18 V24 H56" stroke={p} strokeWidth="0.5" opacity="0.25" />
      <line x1="26" y1="32" x2="48" y2="32" stroke={p} strokeWidth="0.4" opacity="0.18" />
      <line x1="26" y1="38" x2="44" y2="38" stroke={p} strokeWidth="0.4" opacity="0.12" />
      <line x1="26" y1="44" x2="48" y2="44" stroke={p} strokeWidth="0.4" opacity="0.18" />
      <line x1="26" y1="50" x2="40" y2="50" stroke={p} strokeWidth="0.4" opacity="0.1" />
      <line x1="76" y1="30" x2="76" y2="48" stroke={p} strokeWidth="0.7" opacity="0.3" />
      <path d="M72 44 L76 48 L80 44" stroke={p} strokeWidth="0.7" opacity="0.3" strokeLinecap="round" />
      <line x1="68" y1="52" x2="84" y2="52" stroke={p} strokeWidth="0.5" opacity="0.2" />
    </svg>
  );
}

function IllustrationPlanos() {
  return (
    <svg viewBox="0 0 100 72" fill="none" width="100" height="72">
      <rect x="10" y="10" width="80" height="52" rx="1" stroke={p} strokeWidth="0.6" opacity="0.25" />
      <line x1="10" y1="36" x2="90" y2="36" stroke={p} strokeWidth="0.4" opacity="0.15" />
      <line x1="50" y1="10" x2="50" y2="62" stroke={p} strokeWidth="0.4" opacity="0.15" />
      <rect x="16" y="16" width="28" height="14" rx="1" stroke={p} strokeWidth="0.4" opacity="0.2" strokeDasharray="2 2" />
      <rect x="56" y="16" width="28" height="14" rx="1" stroke={p} strokeWidth="0.4" opacity="0.2" strokeDasharray="2 2" />
      <rect x="16" y="42" width="14" height="14" rx="1" stroke={p} strokeWidth="0.4" opacity="0.2" strokeDasharray="2 2" />
      <rect x="56" y="42" width="28" height="14" rx="1" stroke={p} strokeWidth="0.4" opacity="0.2" strokeDasharray="2 2" />
      <line x1="22" y1="22" x2="38" y2="22" stroke={p} strokeWidth="0.3" opacity="0.12" />
      <line x1="62" y1="22" x2="78" y2="22" stroke={p} strokeWidth="0.3" opacity="0.12" />
      <circle cx="23" cy="49" r="3" stroke={p} strokeWidth="0.3" opacity="0.15" />
    </svg>
  );
}

function IllustrationLeads() {
  return (
    <svg viewBox="0 0 100 72" fill="none" width="100" height="72">
      <circle cx="50" cy="20" r="10" stroke={p} strokeWidth="0.7" opacity="0.3" />
      <circle cx="50" cy="17" r="4" stroke={p} strokeWidth="0.5" opacity="0.25" />
      <path d="M40 27 C40 27 44 32 50 32 C56 32 60 27 60 27" stroke={p} strokeWidth="0.5" opacity="0.2" fill="none" />
      <rect x="24" y="38" width="52" height="28" rx="2" stroke={p} strokeWidth="0.5" opacity="0.2" />
      <line x1="30" y1="46" x2="60" y2="46" stroke={p} strokeWidth="0.4" opacity="0.15" />
      <line x1="30" y1="52" x2="54" y2="52" stroke={p} strokeWidth="0.4" opacity="0.12" />
      <line x1="30" y1="58" x2="48" y2="58" stroke={p} strokeWidth="0.4" opacity="0.1" />
      <circle cx="68" cy="46" r="2" fill={p} opacity="0.15" />
      <circle cx="68" cy="52" r="2" fill={p} opacity="0.1" />
    </svg>
  );
}

function IllustrationTorres() {
  return (
    <svg viewBox="0 0 100 72" fill="none" width="100" height="72">
      <rect x="14" y="24" width="22" height="42" stroke={p} strokeWidth="0.6" opacity="0.25" />
      <rect x="39" y="10" width="22" height="56" stroke={p} strokeWidth="0.7" opacity="0.35" />
      <rect x="64" y="30" width="22" height="36" stroke={p} strokeWidth="0.6" opacity="0.25" />
      {[0,1,2,3].map(i => (
        <g key={`w1${i}`}>
          <rect x="18" y={30 + i * 8} width="5" height="4" stroke={p} strokeWidth="0.3" opacity="0.15" />
          <rect x="27" y={30 + i * 8} width="5" height="4" stroke={p} strokeWidth="0.3" opacity="0.15" />
        </g>
      ))}
      {[0,1,2,3,4,5].map(i => (
        <g key={`w2${i}`}>
          <rect x="43" y={16 + i * 8} width="5" height="4" stroke={p} strokeWidth="0.3" opacity="0.2" />
          <rect x="52" y={16 + i * 8} width="5" height="4" stroke={p} strokeWidth="0.3" opacity="0.2" />
        </g>
      ))}
      {[0,1,2].map(i => (
        <g key={`w3${i}`}>
          <rect x="68" y={36 + i * 8} width="5" height="4" stroke={p} strokeWidth="0.3" opacity="0.15" />
          <rect x="77" y={36 + i * 8} width="5" height="4" stroke={p} strokeWidth="0.3" opacity="0.15" />
        </g>
      ))}
      <line x1="50" y1="10" x2="50" y2="2" stroke={p} strokeWidth="0.5" opacity="0.2" />
      <line x1="8" y1="66" x2="92" y2="66" stroke={p} strokeWidth="0.4" opacity="0.12" />
    </svg>
  );
}

/* ── Illustration map ── */
const illustrations: Record<string, () => React.ReactElement> = {
  galeria: IllustrationGaleria,
  imagenes: IllustrationGaleria,
  videos: IllustrationVideos,
  tipologias: IllustrationTipologias,
  recursos: IllustrationRecursos,
  planos: IllustrationPlanos,
  leads: IllustrationLeads,
  torres: IllustrationTorres,
};

/* ── Component ── */
interface DashboardEmptyStateProps {
  variant: keyof typeof illustrations;
  title: string;
  description: string;
  children?: ReactNode; // CTA button slot
}

export function DashboardEmptyState({ variant, title, description, children }: DashboardEmptyStateProps) {
  const Illustration = illustrations[variant] || IllustrationGaleria;

  return (
    <div className={emptyState}>
      <div className="mb-5" style={{ opacity: 0.85 }}>
        <Illustration />
      </div>
      <p className={emptyStateTitle}>{title}</p>
      <p className={emptyStateDescription}>{description}</p>
      {children}
    </div>
  );
}
