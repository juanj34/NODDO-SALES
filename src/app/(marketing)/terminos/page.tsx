"use client";

import {
  FileText,
  Shield,
  CreditCard,
  UserCheck,
  AlertTriangle,
  Ban,
  Copyright,
  Server,
  XCircle,
  RefreshCw,
  Scale,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { usePageView } from "@/hooks/usePageView";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

/* ══════════════════════════════════════════════
   DIGITAL CONTRACT & SEAL — Complex animated hero SVG
   Open contract document with clause markers,
   wax seal, quill pen, balance scale, ink trails
══════════════════════════════════════════════ */
function DigitalContractIllustration() {
  return (
    <svg viewBox="0 0 320 180" fill="none" className="w-full" style={{ maxWidth: 420 }}>
      <defs>
        <linearGradient id="tm-doc-fill" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(184,151,58,0.05)" />
          <stop offset="100%" stopColor="rgba(184,151,58,0.015)" />
        </linearGradient>
        <linearGradient id="tm-seal-glow" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(184,151,58,0.15)" />
          <stop offset="100%" stopColor="rgba(184,151,58,0.03)" />
        </linearGradient>
        <linearGradient id="tm-ink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(184,151,58,0.25)" />
          <stop offset="100%" stopColor="rgba(184,151,58,0.05)" />
        </linearGradient>
      </defs>
      <style>{`
        .tm-pen-bob { animation: tm-bob 3s ease-in-out infinite; }
        .tm-seal-pulse { animation: tm-seal-glow 3s ease-in-out infinite; }
        .tm-seal-ring1 { animation: tm-ring 3s ease-out infinite; }
        .tm-seal-ring2 { animation: tm-ring 3s ease-out infinite 1s; }
        .tm-seal-ring3 { animation: tm-ring 3s ease-out infinite 2s; }
        .tm-ink-flow { stroke-dasharray: 80; stroke-dashoffset: 80; animation: tm-draw 3s ease-in-out infinite; }
        .tm-sig-draw { stroke-dasharray: 60; stroke-dashoffset: 60; animation: tm-sig 2.5s ease-in-out infinite 0.5s; }
        .tm-clause1 { stroke-dasharray: 50; stroke-dashoffset: 50; animation: tm-line-draw 2s ease-in-out infinite; }
        .tm-clause2 { stroke-dasharray: 45; stroke-dashoffset: 45; animation: tm-line-draw 2.2s ease-in-out infinite 0.3s; }
        .tm-clause3 { stroke-dasharray: 40; stroke-dashoffset: 40; animation: tm-line-draw 2.4s ease-in-out infinite 0.6s; }
        .tm-clause4 { stroke-dasharray: 48; stroke-dashoffset: 48; animation: tm-line-draw 2.1s ease-in-out infinite 0.9s; }
        .tm-clause5 { stroke-dasharray: 42; stroke-dashoffset: 42; animation: tm-line-draw 2.3s ease-in-out infinite 1.2s; }
        .tm-clause6 { stroke-dasharray: 38; stroke-dashoffset: 38; animation: tm-line-draw 2.5s ease-in-out infinite 1.5s; }
        .tm-scale-left { animation: tm-sway-l 5s ease-in-out infinite; transform-origin: 260px 50px; }
        .tm-scale-right { animation: tm-sway-r 5s ease-in-out infinite; transform-origin: 290px 50px; }
        .tm-badge { animation: tm-badge-breathe 3.5s ease-in-out infinite; }
        .tm-check { animation: tm-check-pulse 2.5s ease-in-out infinite; }
        .tm-dust1 { animation: tm-dust 5s ease-in-out infinite; }
        .tm-dust2 { animation: tm-dust 6s ease-in-out infinite 0.8s; }
        .tm-dust3 { animation: tm-dust 5.5s ease-in-out infinite 1.5s; }
        .tm-dust4 { animation: tm-dust 7s ease-in-out infinite 0.4s; }
        .tm-dust5 { animation: tm-dust 4.5s ease-in-out infinite 2s; }
        .tm-dust6 { animation: tm-dust 6.5s ease-in-out infinite 1.2s; }
        .tm-ribbon { animation: tm-ribbon-wave 4s ease-in-out infinite; }
        .tm-fold { animation: tm-fold-breathe 4s ease-in-out infinite; }
        @keyframes tm-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes tm-seal-glow { 0%,100%{opacity:0.06} 50%{opacity:0.22} }
        @keyframes tm-ring { 0%{r:18;opacity:0.3} 100%{r:32;opacity:0} }
        @keyframes tm-draw { 0%{stroke-dashoffset:80} 50%{stroke-dashoffset:0} 100%{stroke-dashoffset:-80} }
        @keyframes tm-sig { 0%{stroke-dashoffset:60} 60%{stroke-dashoffset:0} 100%{stroke-dashoffset:0} }
        @keyframes tm-line-draw { 0%{stroke-dashoffset:50} 50%{stroke-dashoffset:0} 100%{stroke-dashoffset:0} }
        @keyframes tm-sway-l { 0%,100%{transform:translateY(0)} 50%{transform:translateY(2px)} }
        @keyframes tm-sway-r { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes tm-badge-breathe { 0%,100%{opacity:0.15} 50%{opacity:0.35} }
        @keyframes tm-check-pulse { 0%,30%{opacity:0.2} 50%{opacity:0.6} 70%,100%{opacity:0.2} }
        @keyframes tm-dust { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(-8px);opacity:0.3} }
        @keyframes tm-ribbon-wave { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(1deg)} 75%{transform:rotate(-1deg)} }
        @keyframes tm-fold-breathe { 0%,100%{opacity:0.08} 50%{opacity:0.14} }
      `}</style>

      {/* Background grid pattern */}
      <g opacity="0.03">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="20" y1={20 + i * 18} x2="300" y2={20 + i * 18} stroke="#b8973a" strokeWidth="0.3" />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`v${i}`} x1={20 + i * 28} y1="8" x2={20 + i * 28} y2="172" stroke="#b8973a" strokeWidth="0.3" />
        ))}
      </g>

      {/* ── MAIN DOCUMENT ── */}
      <rect x="55" y="14" width="145" height="155" rx="3" stroke="rgba(184,151,58,0.18)" strokeWidth="0.7" fill="url(#tm-doc-fill)" />
      {/* Document header area */}
      <rect x="55" y="14" width="145" height="16" rx="3" fill="rgba(184,151,58,0.03)" />
      <line x1="55" y1="30" x2="200" y2="30" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />
      {/* Document title bar dots */}
      <circle cx="65" cy="22" r="1.8" fill="rgba(184,151,58,0.12)" />
      <circle cx="72" cy="22" r="1.8" fill="rgba(184,151,58,0.08)" />
      <circle cx="79" cy="22" r="1.8" fill="rgba(184,151,58,0.06)" />
      {/* Document title text */}
      <text x="127" y="24" textAnchor="middle" fill="rgba(184,151,58,0.15)" fontSize="4.5" fontFamily="monospace">CONTRATO DE SERVICIO</text>

      {/* Folded corner */}
      <path className="tm-fold" d="M185 14 L200 14 L200 29 Z" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
      <line x1="185" y1="14" x2="200" y2="29" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />

      {/* ── CLAUSE MARKERS & TEXT LINES ── */}
      {/* Clause 1 */}
      <text x="64" y="42" fill="rgba(184,151,58,0.2)" fontSize="4.5" fontFamily="monospace" fontWeight="500">01</text>
      <line className="tm-clause1" x1="76" y1="40" x2="190" y2="40" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="76" y1="45" x2="175" y2="45" stroke="rgba(184,151,58,0.05)" strokeWidth="0.4" />

      {/* Clause 2 */}
      <text x="64" y="56" fill="rgba(184,151,58,0.18)" fontSize="4.5" fontFamily="monospace" fontWeight="500">02</text>
      <line className="tm-clause2" x1="76" y1="54" x2="185" y2="54" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="76" y1="59" x2="165" y2="59" stroke="rgba(184,151,58,0.05)" strokeWidth="0.4" />

      {/* Clause 3 */}
      <text x="64" y="70" fill="rgba(184,151,58,0.16)" fontSize="4.5" fontFamily="monospace" fontWeight="500">03</text>
      <line className="tm-clause3" x1="76" y1="68" x2="180" y2="68" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="76" y1="73" x2="170" y2="73" stroke="rgba(184,151,58,0.05)" strokeWidth="0.4" />

      {/* Clause 4 */}
      <text x="64" y="84" fill="rgba(184,151,58,0.14)" fontSize="4.5" fontFamily="monospace" fontWeight="500">04</text>
      <line className="tm-clause4" x1="76" y1="82" x2="188" y2="82" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="76" y1="87" x2="160" y2="87" stroke="rgba(184,151,58,0.05)" strokeWidth="0.4" />

      {/* Clause 5 */}
      <text x="64" y="98" fill="rgba(184,151,58,0.12)" fontSize="4.5" fontFamily="monospace" fontWeight="500">05</text>
      <line className="tm-clause5" x1="76" y1="96" x2="182" y2="96" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="76" y1="101" x2="172" y2="101" stroke="rgba(184,151,58,0.05)" strokeWidth="0.4" />

      {/* Clause 6 */}
      <text x="64" y="112" fill="rgba(184,151,58,0.1)" fontSize="4.5" fontFamily="monospace" fontWeight="500">06</text>
      <line className="tm-clause6" x1="76" y1="110" x2="178" y2="110" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="76" y1="115" x2="155" y2="115" stroke="rgba(184,151,58,0.05)" strokeWidth="0.4" />

      {/* Section dividers between clauses */}
      <line x1="62" y1="49" x2="192" y2="49" stroke="rgba(184,151,58,0.04)" strokeWidth="0.3" strokeDasharray="2 2" />
      <line x1="62" y1="63" x2="192" y2="63" stroke="rgba(184,151,58,0.04)" strokeWidth="0.3" strokeDasharray="2 2" />
      <line x1="62" y1="77" x2="192" y2="77" stroke="rgba(184,151,58,0.04)" strokeWidth="0.3" strokeDasharray="2 2" />
      <line x1="62" y1="91" x2="192" y2="91" stroke="rgba(184,151,58,0.04)" strokeWidth="0.3" strokeDasharray="2 2" />
      <line x1="62" y1="105" x2="192" y2="105" stroke="rgba(184,151,58,0.04)" strokeWidth="0.3" strokeDasharray="2 2" />

      {/* ── SIGNATURE LINE ── */}
      <line x1="90" y1="145" x2="170" y2="145" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" />
      <text x="130" y="152" textAnchor="middle" fill="rgba(184,151,58,0.1)" fontSize="3" fontFamily="monospace">FIRMA AUTORIZADA</text>
      {/* Animated signature scrawl */}
      <path className="tm-sig-draw" d="M95 143 C100 138 105 148 112 140 C118 133 122 147 130 141 C137 135 142 146 150 140 C155 136 158 144 165 142" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" fill="none" strokeLinecap="round" />

      {/* ── QUILL PEN ── */}
      <g className="tm-pen-bob">
        {/* Pen body — angled */}
        <line x1="38" y1="22" x2="58" y2="52" stroke="rgba(184,151,58,0.3)" strokeWidth="1.2" strokeLinecap="round" />
        {/* Feather vanes */}
        <path d="M38 22 C30 18 28 24 32 28" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" fill="rgba(184,151,58,0.03)" />
        <path d="M38 22 C34 14 40 12 42 18" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" fill="rgba(184,151,58,0.03)" />
        <path d="M36 26 C28 28 30 34 36 32" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" fill="rgba(184,151,58,0.02)" />
        {/* Feather central shaft */}
        <line x1="38" y1="22" x2="34" y2="12" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
        {/* Nib */}
        <path d="M56 48 L60 56 L54 54 Z" fill="rgba(184,151,58,0.25)" stroke="rgba(184,151,58,0.3)" strokeWidth="0.4" />
        {/* Ink drop at nib tip */}
        <circle cx="59" cy="55" r="1.5" fill="rgba(184,151,58,0.2)" />
      </g>

      {/* Ink trail from pen to document */}
      <path className="tm-ink-flow" d="M59 55 C62 58 60 62 65 65 Q70 70 75 72 C80 74 85 70 90 75" stroke="url(#tm-ink)" strokeWidth="0.6" fill="none" strokeLinecap="round" />

      {/* ── WAX SEAL ── */}
      {/* Seal glow */}
      <circle className="tm-seal-pulse" cx="185" cy="138" r="20" fill="rgba(184,151,58,0.1)" />
      {/* Expanding rings */}
      <circle className="tm-seal-ring1" cx="185" cy="138" r="18" stroke="rgba(184,151,58,0.2)" strokeWidth="0.5" fill="none" />
      <circle className="tm-seal-ring2" cx="185" cy="138" r="18" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" fill="none" />
      <circle className="tm-seal-ring3" cx="185" cy="138" r="18" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" fill="none" />
      {/* Main seal body */}
      <circle cx="185" cy="138" r="14" stroke="#b8973a" strokeWidth="0.8" opacity="0.35" fill="url(#tm-seal-glow)" />
      <circle cx="185" cy="138" r="11" stroke="rgba(184,151,58,0.2)" strokeWidth="0.4" fill="none" />
      {/* Seal scalloped edge — decorative bumps */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30) * Math.PI / 180;
        const cx = 185 + Math.cos(angle) * 14;
        const cy = 138 + Math.sin(angle) * 14;
        return <circle key={`scallop${i}`} cx={cx} cy={cy} r="1.2" fill="rgba(184,151,58,0.08)" />;
      })}
      {/* "N" monogram in seal */}
      <text x="185" y="142" textAnchor="middle" fill="rgba(184,151,58,0.4)" fontSize="12" fontFamily="serif" fontWeight="300" fontStyle="italic">N</text>
      {/* Seal ribbon */}
      <g className="tm-ribbon">
        <path d="M178 150 L172 168 L178 163 L184 170 L180 152" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" fill="rgba(184,151,58,0.04)" />
        <path d="M192 150 L198 168 L192 163 L186 170 L190 152" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" fill="rgba(184,151,58,0.04)" />
      </g>

      {/* ── BALANCE SCALE ── */}
      {/* Fulcrum */}
      <line x1="275" y1="30" x2="275" y2="70" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" />
      <polygon points="270,70 280,70 275,76" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" />
      {/* Beam */}
      <line x1="252" y1="34" x2="298" y2="34" stroke="rgba(184,151,58,0.2)" strokeWidth="0.7" />
      {/* Pivot ornament */}
      <circle cx="275" cy="32" r="2.5" stroke="rgba(184,151,58,0.2)" strokeWidth="0.5" fill="rgba(184,151,58,0.04)" />
      {/* Left pan */}
      <g className="tm-scale-left">
        <line x1="255" y1="34" x2="252" y2="48" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
        <line x1="255" y1="34" x2="258" y2="48" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
        <ellipse cx="255" cy="50" rx="8" ry="2.5" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" fill="rgba(184,151,58,0.03)" />
        {/* Weight on left pan */}
        <rect x="252" y="46" width="6" height="4" rx="0.5" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" />
      </g>
      {/* Right pan */}
      <g className="tm-scale-right">
        <line x1="295" y1="34" x2="292" y2="48" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
        <line x1="295" y1="34" x2="298" y2="48" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
        <ellipse cx="295" cy="50" rx="8" ry="2.5" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" fill="rgba(184,151,58,0.03)" />
        {/* Weight on right pan */}
        <rect x="292" y="46" width="6" height="4" rx="0.5" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" />
      </g>
      {/* Scale label */}
      <text x="275" y="82" textAnchor="middle" fill="rgba(184,151,58,0.08)" fontSize="3" fontFamily="monospace">JUSTICIA</text>

      {/* ── DIGITAL CERTIFICATE BADGE ── */}
      <g className="tm-badge">
        {/* Shield outline */}
        <path d="M260 96 L275 102 L275 114 L267.5 120 L260 114 L260 102 Z" stroke="rgba(184,151,58,0.18)" strokeWidth="0.5" fill="rgba(184,151,58,0.03)" />
        {/* Checkmark */}
        <path className="tm-check" d="M264 108 L267 111 L272 104" stroke="rgba(184,151,58,0.35)" strokeWidth="0.7" fill="none" strokeLinecap="round" />
        {/* Certificate text */}
        <text x="267.5" y="126" textAnchor="middle" fill="rgba(184,151,58,0.1)" fontSize="2.8" fontFamily="monospace">VERIFIED</text>
      </g>

      {/* ── CONNECTED CLAUSE NODES (right side) ── */}
      {/* Vertical trunk */}
      <line x1="240" y1="90" x2="240" y2="155" stroke="rgba(184,151,58,0.06)" strokeWidth="0.4" strokeDasharray="2 2" />
      {/* Node 1 — Accepted */}
      <circle cx="240" cy="95" r="3" stroke="rgba(74,158,107,0.3)" strokeWidth="0.5" fill="rgba(74,158,107,0.06)" />
      <path d="M238 95 L239.5 96.5 L242 93.5" stroke="rgba(74,158,107,0.4)" strokeWidth="0.5" fill="none" strokeLinecap="round" />
      <line x1="243" y1="95" x2="254" y2="95" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
      {/* Node 2 — Accepted */}
      <circle cx="240" cy="110" r="3" stroke="rgba(74,158,107,0.3)" strokeWidth="0.5" fill="rgba(74,158,107,0.06)" />
      <path d="M238 110 L239.5 111.5 L242 108.5" stroke="rgba(74,158,107,0.4)" strokeWidth="0.5" fill="none" strokeLinecap="round" />
      <line x1="243" y1="110" x2="254" y2="110" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
      {/* Node 3 — Pending */}
      <circle cx="240" cy="125" r="3" stroke="rgba(184,151,58,0.2)" strokeWidth="0.5" fill="rgba(184,151,58,0.04)" />
      <circle cx="240" cy="125" r="1" fill="rgba(184,151,58,0.15)" />
      <line x1="243" y1="125" x2="254" y2="125" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
      {/* Node 4 — Pending */}
      <circle cx="240" cy="140" r="3" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" fill="rgba(184,151,58,0.03)" />
      <circle cx="240" cy="140" r="1" fill="rgba(184,151,58,0.1)" />
      <line x1="243" y1="140" x2="254" y2="140" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
      {/* Node 5 */}
      <circle cx="240" cy="155" r="3" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" fill="rgba(184,151,58,0.02)" />
      <circle cx="240" cy="155" r="1" fill="rgba(184,151,58,0.08)" />

      {/* ── PARAGRAPH MARKERS inside document (small decorative lines) ── */}
      <rect x="64" y="120" width="22" height="3" rx="0.5" fill="rgba(184,151,58,0.04)" />
      <rect x="64" y="125" width="18" height="3" rx="0.5" fill="rgba(184,151,58,0.03)" />
      <rect x="64" y="130" width="25" height="3" rx="0.5" fill="rgba(184,151,58,0.025)" />
      <rect x="64" y="135" width="14" height="3" rx="0.5" fill="rgba(184,151,58,0.02)" />

      {/* ── FLOATING LEGAL SYMBOLS ── */}
      {/* Section symbol § */}
      <text x="22" y="80" fill="rgba(184,151,58,0.08)" fontSize="14" fontFamily="serif">§</text>
      {/* Paragraph symbol ¶ */}
      <text x="210" y="22" fill="rgba(184,151,58,0.06)" fontSize="10" fontFamily="serif">¶</text>

      {/* ── BOTTOM STATUS BAR ── */}
      <rect x="55" y="160" width="145" height="9" rx="1.5" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
      <circle cx="62" cy="164.5" r="2" fill="rgba(74,158,107,0.2)" stroke="rgba(74,158,107,0.3)" strokeWidth="0.3" />
      <text x="68" y="166.5" fill="rgba(184,151,58,0.1)" fontSize="3" fontFamily="monospace">VIGENTE — v2.1</text>
      <text x="160" y="166.5" fill="rgba(184,151,58,0.08)" fontSize="3" fontFamily="monospace">14.03.2026</text>

      {/* ── GOLD DUST PARTICLES ── */}
      <circle className="tm-dust1" cx="15" cy="50" r="1.3" fill="rgba(184,151,58,0.12)" />
      <circle className="tm-dust2" cx="305" cy="90" r="1" fill="rgba(184,151,58,0.08)" />
      <circle className="tm-dust3" cx="120" cy="12" r="1.5" fill="rgba(184,151,58,0.1)" />
      <circle className="tm-dust4" cx="45" cy="160" r="1" fill="rgba(184,151,58,0.06)" />
      <circle className="tm-dust5" cx="300" cy="150" r="1.2" fill="rgba(184,151,58,0.08)" />
      <circle className="tm-dust6" cx="25" cy="130" r="1.1" fill="rgba(184,151,58,0.06)" />
    </svg>
  );
}

const sections = [
  { id: "aceptacion", title: "Aceptación de términos", icon: FileText },
  { id: "descripcion", title: "Descripción del Servicio", icon: Server },
  { id: "registro", title: "Registro y cuenta", icon: UserCheck },
  { id: "pagos", title: "Planes y pagos", icon: CreditCard },
  { id: "uso-aceptable", title: "Uso aceptable", icon: Shield },
  { id: "propiedad", title: "Propiedad intelectual", icon: Copyright },
  { id: "disponibilidad", title: "Disponibilidad y SLA", icon: Server },
  { id: "limitacion", title: "Limitación de responsabilidad", icon: AlertTriangle },
  { id: "indemnizacion", title: "Indemnización", icon: Scale },
  { id: "suspension", title: "Suspensión y terminación", icon: Ban },
  { id: "cancelacion", title: "Cancelación y reembolsos", icon: XCircle },
  { id: "modificaciones", title: "Modificaciones", icon: RefreshCw },
  { id: "legislacion", title: "Legislación aplicable", icon: Scale },
  { id: "contacto", title: "Contacto", icon: Mail },
];

export default function TerminosPage() {
  usePageView("Términos");
  const [activeSection, setActiveSection] = useState<string>("aceptacion");

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 selection:bg-[rgba(184,151,58,0.30)] selection:text-[var(--mk-text-primary)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light"
          >
            <Scale className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Legal
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="text-5xl md:text-7xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Términos de{" "}
            <em style={{ fontStyle: "italic", color: "#b8973a" }}>Servicio</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="text-base max-w-2xl mx-auto"
            style={{
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            Condiciones generales de uso de la plataforma NODDO. Al utilizar nuestro servicio,
            usted acepta estos términos en su totalidad.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease }}
            className="text-xs mt-4 flex items-center justify-center gap-2"
            style={{
              color: "rgba(244,240,232,0.35)",
            }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: "#b8973a" }} />
            Última actualización: 14 de marzo de 2026
          </motion.p>

          {/* Hero SVG */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease }}
            className="mt-12 mb-4 flex justify-center"
          >
            <DigitalContractIllustration />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Table of Contents - Sticky Sidebar */}
          <aside className="lg:col-span-3">
            <motion.nav
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease }}
              className="glass-card p-6 sticky top-24"
            >
              <h2
                className="text-sm uppercase tracking-[0.15em] mb-4"
                style={{
                  fontFamily: "var(--font-syne)",
                  fontWeight: 700,
                  color: "rgba(244,240,232,0.55)",
                }}
              >
                Contenido
              </h2>
              <ul className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        onClick={() => setActiveSection(section.id)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200"
                        style={{
                          backgroundColor: isActive
                            ? "rgba(184, 151, 58, 0.12)"
                            : "transparent",
                          borderLeft: isActive
                            ? "2px solid #b8973a"
                            : "2px solid transparent",
                          color: isActive
                            ? "rgba(244,240,232,0.92)"
                            : "rgba(244,240,232,0.55)",
                          fontSize: "0.75rem",
                          fontWeight: 300,
                        }}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-1">{section.title}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </motion.nav>
          </aside>

          {/* Content */}
          <main className="lg:col-span-9">
            <div className="space-y-6">
              {/* 1. Aceptación */}
              <motion.section
                id="aceptacion"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <FileText className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      1. Aceptación de los términos
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    Al acceder y utilizar la plataforma NODDO (en adelante, &quot;el Servicio&quot;),
                    operada por{" "}
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>Antigravity SAS</strong>{" "}
                    (en adelante, &quot;la Empresa&quot;, &quot;nosotros&quot;, &quot;NODDO&quot;), usted (en adelante, &quot;el
                    Usuario&quot;, &quot;usted&quot;) acepta quedar vinculado por estos Términos de Servicio en
                    su totalidad.
                  </p>
                  <p>
                    Si no está de acuerdo con alguna parte de estos términos, no debe utilizar el
                    Servicio. El uso continuado del Servicio constituye aceptación de estos
                    términos y de cualquier modificación futura.
                  </p>
                  <p>
                    Estos términos deben leerse en conjunto con nuestra{" "}
                    <a
                      href="/privacidad"
                      className="underline"
                      style={{ color: "#b8973a" }}
                    >
                      Política de Privacidad
                    </a>
                    , que forma parte integral del acuerdo.
                  </p>
                </div>
              </motion.section>

              {/* 2. Descripción */}
              <motion.section
                id="descripcion"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Server className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      2. Descripción del Servicio
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    NODDO es una plataforma SaaS (Software as a Service) que permite a
                    constructoras e inmobiliarias crear micrositios digitales premium para la
                    comercialización de proyectos inmobiliarios.
                  </p>
                  <p>El Servicio incluye, entre otras funcionalidades:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Creación de micrositios web con dominio personalizado</li>
                    <li>Gestión de inventario de unidades inmobiliarias en tiempo real</li>
                    <li>Galería de imágenes, renders 3D, y planos arquitectónicos</li>
                    <li>Tours virtuales 360° (Matterport o similar)</li>
                    <li>Videos promocionales con hosting incluido</li>
                    <li>Mapas satelitales interactivos con puntos de interés (POIs)</li>
                    <li>Sistema de cotización automática</li>
                    <li>Captura y gestión de leads (prospectos)</li>
                    <li>Integración con CRM (GoHighLevel, HubSpot)</li>
                    <li>Analytics de visitantes y conversiones</li>
                    <li>Sistema de colaboradores con permisos limitados</li>
                    <li>Almacenamiento en la nube para assets multimedia</li>
                  </ul>
                  <p className="pt-3">
                    NODDO se reserva el derecho de añadir, modificar, o discontinuar
                    funcionalidades del Servicio con previo aviso de 30 días para cambios que
                    afecten funcionalidades principales.
                  </p>
                </div>
              </motion.section>

              {/* 3. Registro */}
              <motion.section
                id="registro"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <UserCheck className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      3. Registro y cuenta
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    Para utilizar el Servicio, debe crear una cuenta proporcionando información
                    veraz, precisa, y actualizada. Declara y garantiza que:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Tiene al menos 18 años de edad</li>
                    <li>Es una persona jurídica o natural con capacidad legal</li>
                    <li>Toda la información proporcionada es veraz y exacta</li>
                    <li>Actualizará su información en caso de cambios</li>
                  </ul>
                  <p className="pt-3">
                    Usted es responsable de:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                    <li>
                      Todas las actividades realizadas desde su cuenta, incluso si son realizadas
                      por terceros
                    </li>
                    <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                    <li>Cerrar sesión al finalizar cada uso del Servicio</li>
                  </ul>
                  <p className="pt-3">
                    NODDO no será responsable por pérdidas derivadas del uso no autorizado de su
                    cuenta. Usted puede ser responsable por pérdidas de NODDO o terceros causadas
                    por dicho uso no autorizado.
                  </p>
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Colaboradores:
                    </strong>{" "}
                    Puede invitar hasta 3 colaboradores por proyecto. Los colaboradores tienen
                    acceso limitado únicamente para modificar el estado de unidades. Usted es
                    responsable de las acciones realizadas por sus colaboradores.
                  </p>
                </div>
              </motion.section>

              {/* 4. Pagos */}
              <motion.section
                id="pagos"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <CreditCard className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      4. Planes, pagos y facturación
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    Los planes disponibles, sus funcionalidades, y precios están publicados en{" "}
                    <a
                      href="https://noddo.io/pricing"
                      className="underline"
                      style={{ color: "#b8973a" }}
                    >
                      noddo.io/pricing
                    </a>
                    .
                  </p>

                  <div className="space-y-2 pt-2">
                    <p>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Facturación recurrente:
                      </strong>{" "}
                      Los pagos son recurrentes según el ciclo de facturación seleccionado
                      (mensual o anual). Al suscribirse, autoriza cargos automáticos recurrentes a
                      su método de pago.
                    </p>
                    <p>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Procesamiento de pagos:
                      </strong>{" "}
                      Los pagos se procesan mediante proveedores de pago de terceros (Stripe u
                      otros). NODDO no almacena datos completos de tarjetas de crédito.
                    </p>
                    <p>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Falta de pago:
                      </strong>{" "}
                      La falta de pago puede resultar en la suspensión inmediata del Servicio. Si
                      el pago no se regulariza en 15 días, su cuenta será marcada para eliminación.
                    </p>
                    <p>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Cambios de precio:
                      </strong>{" "}
                      NODDO se reserva el derecho de modificar los precios con 60 días de
                      anticipación. Si no está de acuerdo con el nuevo precio, puede cancelar su
                      suscripción antes de que el cambio entre en vigor.
                    </p>
                    <p>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Impuestos:</strong> Los
                      precios no incluyen impuestos locales (IVA, retenciones). Los impuestos
                      aplicables se añadirán según la jurisdicción del Usuario.
                    </p>
                    <p>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Facturas:</strong> Se
                      emitirá factura electrónica por cada pago. Las facturas están disponibles en
                      el panel de administración.
                    </p>
                  </div>
                </div>
              </motion.section>

              {/* 5. Uso aceptable */}
              <motion.section
                id="uso-aceptable"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Shield className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      5. Uso aceptable
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    El Usuario se compromete a utilizar el Servicio únicamente para fines
                    legítimos relacionados con la comercialización inmobiliaria y en cumplimiento
                    de todas las leyes aplicables.
                  </p>
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Queda estrictamente prohibido:
                    </strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Publicar contenido ilegal, difamatorio, fraudulento, obsceno, o que viole
                      derechos de terceros
                    </li>
                    <li>
                      Publicar información falsa o engañosa sobre proyectos inmobiliarios (precios
                      ficticios, áreas incorrectas, permisos inexistentes)
                    </li>
                    <li>
                      Usar el Servicio para esquemas piramidales, fraudes inmobiliarios, lavado de
                      activos, o actividades ilícitas
                    </li>
                    <li>
                      Intentar acceder, vulnerar, o probar la seguridad de cuentas de otros
                      usuarios
                    </li>
                    <li>Usar el Servicio para enviar spam, phishing, o comunicaciones masivas no solicitadas</li>
                    <li>
                      Realizar ingeniería inversa, descompilar, o intentar extraer el código fuente
                      de la plataforma
                    </li>
                    <li>
                      Usar scrapers, bots, o herramientas automatizadas sin autorización expresa
                    </li>
                    <li>
                      Sobrecargar intencionalmente la infraestructura (ataques DDoS, flooding)
                    </li>
                    <li>
                      Interferir con el uso del Servicio por otros usuarios
                    </li>
                    <li>
                      Revender, sublicenciar, o transferir su acceso al Servicio sin autorización
                      escrita
                    </li>
                    <li>
                      Usar el Servicio para competir directamente con NODDO (crear plataforma
                      similar)
                    </li>
                    <li>
                      Remover, ocultar, o modificar avisos de propiedad intelectual o marca
                      registrada de NODDO
                    </li>
                  </ul>
                  <p className="pt-3">
                    La violación de estas reglas puede resultar en suspensión o terminación
                    inmediata de la cuenta sin previo aviso y sin derecho a reembolso.
                  </p>
                </div>
              </motion.section>

              {/* 6. Propiedad intelectual */}
              <motion.section
                id="propiedad"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Copyright className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      6. Propiedad intelectual
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <div>
                    <h3
                      className="font-medium mb-2"
                      style={{ color: "rgba(244,240,232,0.92)" }}
                    >
                      Su contenido
                    </h3>
                    <p>
                      El contenido que usted carga al Servicio (imágenes, renders, textos,
                      planos, videos, brochures) sigue siendo de su propiedad. NODDO no reclama
                      derechos de propiedad sobre su contenido.
                    </p>
                    <p className="mt-2">
                      Sin embargo, al cargar contenido al Servicio, usted otorga a NODDO una
                      licencia mundial, no exclusiva, libre de regalías, sublicenciable, y
                      transferible para:
                    </p>
                    <ul className="list-disc pl-6 mt-1 space-y-1">
                      <li>Mostrar dicho contenido en los micrositios generados</li>
                      <li>Almacenar y hacer copias de seguridad del contenido</li>
                      <li>
                        Procesar el contenido (redimensionar imágenes, comprimir videos,
                        optimización)
                      </li>
                      <li>
                        Usar capturas de pantalla o ejemplos anónimos en materiales promocionales
                        de NODDO (con su autorización previa)
                      </li>
                    </ul>
                    <p className="mt-2">
                      Usted declara y garantiza que posee todos los derechos sobre el contenido que
                      carga, o tiene las licencias necesarias para su uso. Usted indemnizará a
                      NODDO frente a reclamaciones de terceros por violación de derechos de autor,
                      marcas, o propiedad intelectual relacionadas con su contenido.
                    </p>
                  </div>

                  <div className="pt-3">
                    <h3
                      className="font-medium mb-2"
                      style={{ color: "rgba(244,240,232,0.92)" }}
                    >
                      Propiedad de NODDO
                    </h3>
                    <p>
                      La plataforma NODDO, incluyendo su diseño, código fuente, arquitectura,
                      interfaz de usuario, marca, logotipo, y toda la propiedad intelectual
                      asociada, son propiedad exclusiva de Antigravity SAS y están protegidos por
                      las leyes de propiedad intelectual de Colombia y tratados internacionales.
                    </p>
                    <p className="mt-2">
                      El uso del Servicio no le otorga ningún derecho de propiedad sobre la
                      plataforma. Usted recibe únicamente una licencia limitada, revocable, no
                      exclusiva, y no transferible para usar el Servicio según estos términos.
                    </p>
                  </div>
                </div>
              </motion.section>

              {/* 7. Disponibilidad */}
              <motion.section
                id="disponibilidad"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Server className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      7. Disponibilidad del Servicio y SLA
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    NODDO se esfuerza por mantener el Servicio disponible 24/7 con un objetivo de
                    uptime del 99.5% mensual (excluyendo mantenimientos programados).
                  </p>
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>Sin embargo</strong>, no
                    garantizamos disponibilidad ininterrumpida. Pueden ocurrir interrupciones por:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Mantenimiento programado (notificado con 48h de anticipación)</li>
                    <li>Actualizaciones de seguridad críticas (pueden ser sin previo aviso)</li>
                    <li>Fallos de infraestructura de terceros (Supabase, Vercel, Cloudflare)</li>
                    <li>Ataques DDoS o eventos de seguridad</li>
                    <li>Fuerza mayor, desastres naturales, pandemias, guerras, actos de gobierno</li>
                    <li>Problemas de conectividad de internet globales</li>
                  </ul>
                  <p className="pt-3">
                    NODDO no será responsable por pérdidas derivadas de la indisponibilidad del
                    Servicio. Los únicos recursos en caso de incumplimiento del SLA son créditos
                    de servicio según las políticas de compensación (disponibles previa solicitud).
                  </p>
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>Backups:</strong> NODDO
                    realiza copias de seguridad diarias automáticas con retención de 30 días. Sin
                    embargo, usted es responsable de mantener copias propias de su contenido
                    crítico.
                  </p>
                </div>
              </motion.section>

              {/* 8. Limitación de responsabilidad */}
              <motion.section
                id="limitacion"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <AlertTriangle className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      8. Limitación de responsabilidad
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY:
                    </strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      El Servicio se proporciona &quot;TAL CUAL&quot; y &quot;SEGÚN DISPONIBILIDAD&quot;, sin
                      garantías de ningún tipo, expresas o implícitas.
                    </li>
                    <li>
                      NODDO no garantiza que el Servicio sea ininterrumpido, libre de errores,
                      seguro, o que cumpla con sus requisitos específicos.
                    </li>
                    <li>
                      NODDO NO SERÁ RESPONSABLE por daños indirectos, incidentales,
                      consecuentes, especiales, punitivos, o ejemplares derivados del uso o
                      imposibilidad de uso del Servicio, incluyendo pero no limitado a:
                      <ul className="list-circle pl-6 mt-1 space-y-1">
                        <li>Pérdida de ingresos, ventas, o ganancias esperadas</li>
                        <li>Pérdida de oportunidades de negocio o leads no capturados</li>
                        <li>Pérdida de datos o corrupción de archivos</li>
                        <li>Daños a la reputación o marca</li>
                        <li>Costos de adquisición de servicios sustitutos</li>
                      </ul>
                    </li>
                    <li>
                      La responsabilidad total y agregada de NODDO, por cualquier reclamación
                      relacionada con estos términos o el Servicio, estará limitada al monto total
                      pagado por el Usuario en los últimos{" "}
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>12 meses</strong>, o
                      USD $100, lo que sea mayor.
                    </li>
                  </ul>
                  <p className="pt-3">
                    Algunas jurisdicciones no permiten la exclusión de ciertas garantías o
                    limitación de responsabilidad por daños consecuentes. En tales jurisdicciones,
                    nuestra responsabilidad se limitará en la máxima medida permitida por la ley.
                  </p>
                </div>
              </motion.section>

              {/* 9. Indemnización */}
              <motion.section
                id="indemnizacion"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Scale className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      9. Indemnización
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    Usted acepta indemnizar, defender, y mantener indemne a Antigravity SAS, sus
                    afiliados, directores, empleados, agentes, y licenciantes, frente a cualquier
                    reclamación, pérdida, responsabilidad, daño, costo, o gasto (incluyendo
                    honorarios legales razonables) derivados de:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Su uso del Servicio</li>
                    <li>Violación de estos Términos de Servicio</li>
                    <li>
                      Violación de derechos de terceros, incluyendo derechos de autor, marcas,
                      secretos comerciales, o privacidad
                    </li>
                    <li>Contenido que usted carga al Servicio</li>
                    <li>Información fraudulenta o engañosa publicada en sus micrositios</li>
                    <li>Reclamaciones de compradores o terceros relacionadas con sus proyectos</li>
                    <li>Incumplimiento de leyes y regulaciones aplicables</li>
                  </ul>
                  <p className="pt-3">
                    NODDO se reserva el derecho de asumir la defensa y control exclusivo de
                    cualquier asunto sujeto a indemnización, en cuyo caso usted cooperará con NODDO
                    en la defensa de dicha reclamación.
                  </p>
                </div>
              </motion.section>

              {/* 10. Suspensión */}
              <motion.section
                id="suspension"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Ban className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      10. Suspensión y terminación
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    NODDO se reserva el derecho de suspender o terminar su acceso al Servicio,
                    inmediatamente y sin previo aviso, por cualquiera de las siguientes razones:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Violación de estos Términos de Servicio o la Política de Privacidad</li>
                    <li>Falta de pago o intento de fraude en pagos</li>
                    <li>
                      Conducta que NODDO considere, a su sola discreción, inapropiada, abusiva, o
                      dañina
                    </li>
                    <li>Solicitud de autoridades gubernamentales o por orden judicial</li>
                    <li>Actividades ilegales o sospecha razonable de fraude</li>
                    <li>Uso que ponga en riesgo la seguridad o estabilidad de la plataforma</li>
                    <li>Inactividad prolongada (más de 12 meses sin uso)</li>
                  </ul>
                  <p className="pt-3">
                    En caso de terminación:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Perderá inmediatamente el acceso al panel de administración y a los
                      micrositios
                    </li>
                    <li>Sus datos se conservarán por 30 días antes de eliminación permanente</li>
                    <li>
                      Puede solicitar una exportación de sus datos dentro de los 30 días posteriores
                      a la terminación
                    </li>
                    <li>No tendrá derecho a reembolso de pagos ya realizados</li>
                  </ul>
                  <p className="pt-3">
                    NODDO no será responsable ante usted ni terceros por la terminación de su
                    acceso al Servicio.
                  </p>
                </div>
              </motion.section>

              {/* 11. Cancelación */}
              <motion.section
                id="cancelacion"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <XCircle className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      11. Cancelación y reembolsos
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Cancelación por el Usuario:
                    </strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Puede cancelar su suscripción en cualquier momento desde el panel de
                      administración
                    </li>
                    <li>
                      La cancelación es efectiva al final del período de facturación actual (no
                      habrá cargos futuros)
                    </li>
                    <li>Mantendrá acceso completo hasta el final del período pagado</li>
                    <li>
                      Después del período pagado, los micrositios se desactivarán y los datos se
                      conservarán por 30 días adicionales
                    </li>
                    <li>Puede reactivar su cuenta dentro de los 30 días sin pérdida de datos</li>
                  </ul>

                  <p className="pt-3">
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Política de reembolsos:
                    </strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Garantía de 14 días:
                      </strong>{" "}
                      Si cancela dentro de los primeros 14 días de su primera suscripción, le
                      reembolsaremos el 100% del pago (excepto cargos de procesamiento).
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Después de 14 días:
                      </strong>{" "}
                      NO hay reembolsos por meses/años parciales. La cancelación es efectiva al
                      final del período pagado.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Planes anuales:
                      </strong>{" "}
                      No hay reembolsos prorrateados si cancela antes de cumplir el año.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Excepciones:
                      </strong>{" "}
                      NODDO puede ofrecer reembolsos discrecionales en casos de fallas graves del
                      Servicio que afecten significativamente su uso (sujeto a evaluación caso por
                      caso).
                    </li>
                  </ul>

                  <p className="pt-3">
                    Los reembolsos se procesan mediante el mismo método de pago original y pueden
                    tardar 5-10 días hábiles en reflejarse.
                  </p>
                </div>
              </motion.section>

              {/* 12. Modificaciones */}
              <motion.section
                id="modificaciones"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <RefreshCw className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      12. Modificaciones a estos términos
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    NODDO se reserva el derecho de modificar estos términos en cualquier momento.
                  </p>
                  <p>
                    Cuando realicemos cambios significativos:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Publicaremos los términos actualizados en esta página con la fecha de &quot;Última
                      actualización&quot;
                    </li>
                    <li>
                      Le notificaremos por email con al menos{" "}
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>30 días</strong> de
                      anticipación
                    </li>
                    <li>
                      Mostraremos un aviso prominente en el panel de administración solicitando que
                      revise y acepte los nuevos términos
                    </li>
                  </ul>
                  <p className="pt-3">
                    Si no está de acuerdo con los términos modificados, debe cancelar su
                    suscripción antes de que los cambios entren en vigor. El uso continuado del
                    Servicio después de la fecha efectiva constituye aceptación de los nuevos
                    términos.
                  </p>
                  <p>
                    Cambios menores (correcciones tipográficas, aclaraciones que no afectan
                    derechos u obligaciones) pueden realizarse sin notificación previa.
                  </p>
                </div>
              </motion.section>

              {/* 13. Legislación */}
              <motion.section
                id="legislacion"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Scale className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      13. Legislación aplicable y resolución de disputas
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    Estos términos se rigen e interpretan de acuerdo con las leyes de la{" "}
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      República de Colombia
                    </strong>
                    , sin perjuicio de sus disposiciones sobre conflicto de leyes.
                  </p>
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Resolución de disputas:
                    </strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Negociación informal:
                      </strong>{" "}
                      Antes de iniciar cualquier procedimiento legal, las partes acuerdan intentar
                      resolver la disputa mediante negociación de buena fe durante al menos 30
                      días.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Jurisdicción:</strong>{" "}
                      Para cualquier controversia que no pueda resolverse de manera informal, las
                      partes se someten expresamente a la jurisdicción exclusiva de los tribunales
                      de Medellín, Colombia.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Arbitraje:</strong> Las
                      partes pueden acordar mutuamente someter la disputa a arbitraje bajo las
                      reglas de la Cámara de Comercio de Medellín.
                    </li>
                  </ul>
                  <p className="pt-3">
                    Usted renuncia expresamente a cualquier derecho a participar en demandas
                    colectivas (class actions) contra NODDO. Todas las reclamaciones deben
                    presentarse a título individual.
                  </p>
                </div>
              </motion.section>

              {/* 14. Contacto */}
              <motion.section
                id="contacto"
                className="glass-card p-8 scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Mail className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      14. Contacto y soporte
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-4 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    Para consultas sobre estos términos, soporte técnico, facturación, o cualquier
                    asunto relacionado con el Servicio, contáctenos en:
                  </p>
                  <div className="pl-4 space-y-2">
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Email:</strong>{" "}
                      <a
                        href="mailto:hola@noddo.io"
                        className="underline"
                        style={{ color: "#b8973a" }}
                      >
                        hola@noddo.io
                      </a>
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Empresa:</strong>{" "}
                      Antigravity SAS
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Ubicación:</strong>{" "}
                      Medellín, Colombia
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Sitio web:</strong>{" "}
                      <a
                        href="https://noddo.io"
                        className="underline"
                        style={{ color: "#b8973a" }}
                      >
                        noddo.io
                      </a>
                    </div>
                  </div>
                  <p className="pt-3">
                    Nuestro equipo de soporte responde consultas en horario laboral de Colombia
                    (Lunes a Viernes, 9:00 AM - 6:00 PM COT). Responderemos dentro de 24-48 horas
                    hábiles.
                  </p>
                </div>
              </motion.section>
            </div>
          </main>
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mt-16 text-center"
        >
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <p
              className="text-sm mb-4"
              style={{
                fontWeight: 300,
                color: "rgba(244,240,232,0.70)",
              }}
            >
              ¿Tiene dudas sobre nuestros términos? Estamos aquí para ayudar.
            </p>
            <a
              href="mailto:hola@noddo.io"
              className="btn-mk-primary inline-flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              CONTÁCTENOS
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
