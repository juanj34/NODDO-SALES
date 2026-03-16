"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Search,
  ChevronRight,
  Lightbulb,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useContact } from "@/components/marketing/ContactProvider";
import {
  iconMap,
  categoryIconMap,
  defaultIcon,
  categoryStructure,
  normalize,
  type ArticleTranslation,
} from "@/lib/help-data";

/* ─── Framer ease ─── */
const ease = [0.25, 0.46, 0.45, 0.94] as const;

/* ══════════════════════════════════════════════
   ANIMATED SVG ILLUSTRATIONS (loop keyframes)
══════════════════════════════════════════════ */

/** Hero — Open book with floating pages, magnifying glass glow, gold dust */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 320 180" fill="none" className="w-full" style={{ maxWidth: 320 }}>
      <style>{`
        .hc-book { animation: hc-bob 5s ease-in-out infinite; }
        .hc-page1 { animation: hc-float 6s ease-in-out infinite; }
        .hc-page2 { animation: hc-float 7s ease-in-out infinite 0.8s; }
        .hc-page3 { animation: hc-float 5.5s ease-in-out infinite 1.5s; }
        .hc-lens-glow { animation: hc-glow 3s ease-in-out infinite; }
        .hc-lens-ring { animation: hc-ring 3s ease-in-out infinite; }
        .hc-spark1 { animation: hc-spark 4s ease-in-out infinite; }
        .hc-spark2 { animation: hc-spark 5s ease-in-out infinite 1s; }
        .hc-spark3 { animation: hc-spark 4.5s ease-in-out infinite 2s; }
        .hc-spark4 { animation: hc-spark 3.5s ease-in-out infinite 0.5s; }
        .hc-dust1 { animation: hc-dust 6s ease-in-out infinite; }
        .hc-dust2 { animation: hc-dust 7s ease-in-out infinite 1.2s; }
        .hc-dust3 { animation: hc-dust 5.5s ease-in-out infinite 0.4s; }
        .hc-dust4 { animation: hc-dust 6.5s ease-in-out infinite 2s; }
        .hc-dust5 { animation: hc-dust 5s ease-in-out infinite 1.6s; }
        .hc-dust6 { animation: hc-dust 7.5s ease-in-out infinite 0.8s; }
        .hc-check1 { animation: hc-check 3s ease-in-out infinite; }
        .hc-check2 { animation: hc-check 3s ease-in-out infinite 1s; }
        .hc-check3 { animation: hc-check 3s ease-in-out infinite 2s; }
        .hc-cursor { animation: hc-blink 1.2s step-end infinite; }
        .hc-line-draw { stroke-dasharray: 60; animation: hc-draw 4s ease-in-out infinite; }
        @keyframes hc-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes hc-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(2deg)} }
        @keyframes hc-glow { 0%,100%{opacity:0} 50%{opacity:.2} }
        @keyframes hc-ring { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:.5;transform:scale(1.08)} }
        @keyframes hc-spark { 0%,100%{opacity:.05;transform:scale(0.8)} 50%{opacity:.4;transform:scale(1.2)} }
        @keyframes hc-dust { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes hc-check { 0%,30%{opacity:.15} 50%{opacity:.6} 70%,100%{opacity:.15} }
        @keyframes hc-blink { 0%,49%{opacity:.6} 50%,100%{opacity:0} }
        @keyframes hc-draw { 0%{stroke-dashoffset:60} 40%,60%{stroke-dashoffset:0} 100%{stroke-dashoffset:-60} }
      `}</style>

      {/* Open book — gentle bob */}
      <g className="hc-book">
        {/* Left page */}
        <path d="M80 50 L160 60 L160 150 L80 140 Z" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.7" />
        {/* Right page */}
        <path d="M160 60 L240 50 L240 140 L160 150 Z" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.18)" strokeWidth="0.7" />
        {/* Spine */}
        <line x1="160" y1="58" x2="160" y2="152" stroke="rgba(184,151,58,0.25)" strokeWidth="1" />
        {/* Left page text lines */}
        <line x1="92" y1="72" x2="148" y2="76" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" />
        <line x1="92" y1="82" x2="145" y2="86" stroke="rgba(184,151,58,0.07)" strokeWidth="0.5" />
        <line x1="92" y1="92" x2="142" y2="96" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" />
        <line x1="92" y1="102" x2="130" y2="105" stroke="rgba(184,151,58,0.06)" strokeWidth="0.5" />
        <line x1="92" y1="112" x2="140" y2="115" stroke="rgba(184,151,58,0.08)" strokeWidth="0.5" />
        {/* Right page text with checkmarks */}
        <g className="hc-check1"><path d="M172 75 L175 78 L180 72" stroke="rgba(184,151,58,0.4)" strokeWidth="0.8" fill="none" strokeLinecap="round" /></g>
        <line x1="185" y1="75" x2="228" y2="72" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" />
        <g className="hc-check2"><path d="M172 90 L175 93 L180 87" stroke="rgba(184,151,58,0.4)" strokeWidth="0.8" fill="none" strokeLinecap="round" /></g>
        <line x1="185" y1="90" x2="225" y2="87" stroke="rgba(184,151,58,0.08)" strokeWidth="0.5" />
        <g className="hc-check3"><path d="M172 105 L175 108 L180 102" stroke="rgba(184,151,58,0.4)" strokeWidth="0.8" fill="none" strokeLinecap="round" /></g>
        <line x1="185" y1="105" x2="222" y2="102" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" />
      </g>

      {/* Floating pages — detached, drifting */}
      <g className="hc-page1">
        <rect x="40" y="20" width="32" height="40" rx="2" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" transform="rotate(-8 56 40)" />
        <line x1="46" y1="30" x2="66" y2="28" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" transform="rotate(-8 56 40)" />
        <line x1="46" y1="36" x2="64" y2="34" stroke="rgba(184,151,58,0.06)" strokeWidth="0.4" transform="rotate(-8 56 40)" />
      </g>
      <g className="hc-page2">
        <rect x="250" y="15" width="28" height="36" rx="2" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" transform="rotate(6 264 33)" />
        <line x1="256" y1="24" x2="272" y2="25" stroke="rgba(184,151,58,0.07)" strokeWidth="0.4" transform="rotate(6 264 33)" />
        <line x1="256" y1="30" x2="270" y2="31" stroke="rgba(184,151,58,0.05)" strokeWidth="0.4" transform="rotate(6 264 33)" />
      </g>
      <g className="hc-page3">
        <rect x="262" y="100" width="24" height="32" rx="2" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.5" transform="rotate(10 274 116)" />
      </g>

      {/* Magnifying glass with glow */}
      <circle className="hc-lens-glow" cx="60" cy="120" r="22" fill="rgba(184,151,58,0.08)" />
      <g className="hc-lens-ring">
        <circle cx="60" cy="120" r="16" stroke="rgba(184,151,58,0.3)" strokeWidth="1.2" fill="none" />
        <line x1="71" y1="131" x2="82" y2="142" stroke="rgba(184,151,58,0.3)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* Search text line inside lens */}
      <line className="hc-line-draw" x1="50" y1="120" x2="70" y2="120" stroke="rgba(184,151,58,0.2)" strokeWidth="0.8" />
      <line className="hc-cursor" x1="70" y1="115" x2="70" y2="125" stroke="rgba(184,151,58,0.3)" strokeWidth="0.6" />

      {/* Sparkle dots */}
      <circle className="hc-spark1" cx="48" cy="98" r="2" fill="rgba(184,151,58,0.15)" />
      <circle className="hc-spark2" cx="280" cy="70" r="2.5" fill="rgba(184,151,58,0.12)" />
      <circle className="hc-spark3" cx="30" cy="60" r="1.8" fill="rgba(184,151,58,0.1)" />
      <circle className="hc-spark4" cx="295" cy="130" r="2" fill="rgba(184,151,58,0.12)" />

      {/* Gold dust particles */}
      <circle className="hc-dust1" cx="20" cy="90" r="1.2" fill="rgba(184,151,58,0.06)" />
      <circle className="hc-dust2" cx="300" cy="50" r="1" fill="rgba(184,151,58,0.05)" />
      <circle className="hc-dust3" cx="130" cy="20" r="1.5" fill="rgba(184,151,58,0.06)" />
      <circle className="hc-dust4" cx="200" cy="25" r="1" fill="rgba(184,151,58,0.05)" />
      <circle className="hc-dust5" cx="15" cy="140" r="1.3" fill="rgba(184,151,58,0.05)" />
      <circle className="hc-dust6" cx="305" cy="160" r="1.1" fill="rgba(184,151,58,0.04)" />
    </svg>
  );
}

/** Category icon SVGs — small animated illustrations for each category card */
const categorySvgs: Record<string, () => React.ReactElement> = {
  /* Dashboard — mini dashboard panel with blinking KPIs */
  dashboard: () => (
    <svg viewBox="0 0 56 56" fill="none" className="w-full h-full">
      <style>{`
        .hcd-bar1 { animation: hcd-grow 3s ease-in-out infinite; }
        .hcd-bar2 { animation: hcd-grow 3s ease-in-out 0.4s infinite; }
        .hcd-bar3 { animation: hcd-grow 3s ease-in-out 0.8s infinite; }
        .hcd-dot { animation: hcd-pulse 2s ease-in-out infinite; }
        @keyframes hcd-grow { 0%,100%{transform:scaleY(0.6);transform-origin:bottom} 50%{transform:scaleY(1);transform-origin:bottom} }
        @keyframes hcd-pulse { 0%,100%{opacity:.2} 50%{opacity:.7} }
      `}</style>
      <rect x="6" y="6" width="44" height="44" rx="4" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" />
      <line x1="6" y1="16" x2="50" y2="16" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
      <circle className="hcd-dot" cx="12" cy="11" r="1.5" fill="rgba(184,151,58,0.3)" />
      <circle cx="17" cy="11" r="1.5" fill="rgba(184,151,58,0.15)" />
      <rect className="hcd-bar1" x="12" y="26" width="6" height="18" rx="1" fill="rgba(184,151,58,0.15)" />
      <rect className="hcd-bar2" x="22" y="22" width="6" height="22" rx="1" fill="rgba(184,151,58,0.2)" />
      <rect className="hcd-bar3" x="32" y="30" width="6" height="14" rx="1" fill="rgba(184,151,58,0.12)" />
      <rect x="42" y="34" width="4" height="10" rx="1" fill="rgba(184,151,58,0.08)" />
    </svg>
  ),
  /* Proyecto — building wireframe with pulsing foundation */
  proyecto: () => (
    <svg viewBox="0 0 56 56" fill="none" className="w-full h-full">
      <style>{`
        .hcp-frame { animation: hcp-breathe 4s ease-in-out infinite; }
        .hcp-gear { transform-origin: 42px 14px; animation: hcp-spin 8s linear infinite; }
        @keyframes hcp-breathe { 0%,100%{opacity:.15} 50%{opacity:.35} }
        @keyframes hcp-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
      <rect className="hcp-frame" x="10" y="14" width="24" height="32" rx="2" stroke="rgba(184,151,58,0.25)" strokeWidth="0.7" />
      <line x1="10" y1="22" x2="34" y2="22" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />
      <rect x="14" y="26" width="6" height="6" rx="1" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
      <rect x="24" y="26" width="6" height="6" rx="1" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
      <rect x="14" y="36" width="6" height="6" rx="1" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />
      <rect x="24" y="36" width="6" height="6" rx="1" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />
      <circle className="hcp-gear" cx="42" cy="14" r="6" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" />
      <line x1="42" y1="8" x2="42" y2="10" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" />
      <line x1="42" y1="18" x2="42" y2="20" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" />
      <line x1="36" y1="14" x2="38" y2="14" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" />
      <line x1="46" y1="14" x2="48" y2="14" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" />
    </svg>
  ),
  /* Contenido — stacked cards with floating layers */
  contenido: () => (
    <svg viewBox="0 0 56 56" fill="none" className="w-full h-full">
      <style>{`
        .hcc-l1 { animation: hcc-shift 4s ease-in-out infinite; }
        .hcc-l2 { animation: hcc-shift 4s ease-in-out 0.5s infinite; }
        .hcc-l3 { animation: hcc-shift 4s ease-in-out 1s infinite; }
        .hcc-img { animation: hcc-pulse 3s ease-in-out infinite; }
        @keyframes hcc-shift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes hcc-pulse { 0%,100%{opacity:.1} 50%{opacity:.3} }
      `}</style>
      <g className="hcc-l3"><rect x="18" y="10" width="28" height="20" rx="2" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.5" /></g>
      <g className="hcc-l2"><rect x="14" y="16" width="28" height="20" rx="2" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" /></g>
      <g className="hcc-l1">
        <rect x="10" y="22" width="28" height="20" rx="2" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.18)" strokeWidth="0.6" />
        <line x1="14" y1="28" x2="34" y2="28" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />
        <line x1="14" y1="33" x2="30" y2="33" stroke="rgba(184,151,58,0.07)" strokeWidth="0.4" />
        <line x1="14" y1="38" x2="26" y2="38" stroke="rgba(184,151,58,0.05)" strokeWidth="0.4" />
      </g>
      <rect className="hcc-img" x="30" y="34" width="18" height="14" rx="2" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" />
      <path d="M34 44 L38 38 L42 42 L44 44" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" fill="none" />
    </svg>
  ),
  /* Ajustes — gear with orbiting dots */
  ajustes: () => (
    <svg viewBox="0 0 56 56" fill="none" className="w-full h-full">
      <style>{`
        .hca-gear { transform-origin: 28px 28px; animation: hca-spin 12s linear infinite; }
        .hca-orbit { transform-origin: 28px 28px; animation: hca-orbit 6s linear infinite; }
        .hca-dot { animation: hca-blink 2s ease-in-out infinite; }
        @keyframes hca-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes hca-orbit { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes hca-blink { 0%,100%{opacity:.2} 50%{opacity:.6} }
      `}</style>
      <circle cx="28" cy="28" r="8" stroke="rgba(184,151,58,0.25)" strokeWidth="0.8" className="hca-gear" />
      <circle cx="28" cy="28" r="3" fill="rgba(184,151,58,0.1)" />
      {/* Gear teeth */}
      <g className="hca-gear">
        <line x1="28" y1="16" x2="28" y2="19" stroke="rgba(184,151,58,0.2)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="28" y1="37" x2="28" y2="40" stroke="rgba(184,151,58,0.2)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16" y1="28" x2="19" y2="28" stroke="rgba(184,151,58,0.2)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="37" y1="28" x2="40" y2="28" stroke="rgba(184,151,58,0.2)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="19.5" y1="19.5" x2="21.6" y2="21.6" stroke="rgba(184,151,58,0.15)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="34.4" y1="34.4" x2="36.5" y2="36.5" stroke="rgba(184,151,58,0.15)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="36.5" y1="19.5" x2="34.4" y2="21.6" stroke="rgba(184,151,58,0.15)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="21.6" y1="34.4" x2="19.5" y2="36.5" stroke="rgba(184,151,58,0.15)" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      {/* Orbiting dot */}
      <g className="hca-orbit">
        <circle className="hca-dot" cx="28" cy="10" r="2" fill="rgba(184,151,58,0.25)" />
      </g>
    </svg>
  ),
  /* Flujos — connected nodes with flowing dashes */
  flujos: () => (
    <svg viewBox="0 0 56 56" fill="none" className="w-full h-full">
      <style>{`
        .hcf-flow1 { stroke-dasharray: 3 3; animation: hcf-dash 2s linear infinite; }
        .hcf-flow2 { stroke-dasharray: 3 3; animation: hcf-dash 2s linear 0.5s infinite; }
        .hcf-n1 { animation: hcf-pulse 3s ease-in-out infinite; }
        .hcf-n2 { animation: hcf-pulse 3s ease-in-out 0.6s infinite; }
        .hcf-n3 { animation: hcf-pulse 3s ease-in-out 1.2s infinite; }
        .hcf-arrow { animation: hcf-bob 2.5s ease-in-out infinite; }
        @keyframes hcf-dash { from{stroke-dashoffset:12} to{stroke-dashoffset:0} }
        @keyframes hcf-pulse { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:.5;transform:scale(1.1)} }
        @keyframes hcf-bob { 0%,100%{transform:translateX(0)} 50%{transform:translateX(2px)} }
      `}</style>
      <circle className="hcf-n1" cx="12" cy="28" r="6" stroke="rgba(184,151,58,0.25)" strokeWidth="0.7" style={{ transformOrigin: "12px 28px" }} />
      <circle cx="12" cy="28" r="2" fill="rgba(184,151,58,0.15)" />
      <line className="hcf-flow1" x1="18" y1="28" x2="32" y2="20" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" />
      <circle className="hcf-n2" cx="36" cy="18" r="5" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" style={{ transformOrigin: "36px 18px" }} />
      <circle cx="36" cy="18" r="1.5" fill="rgba(184,151,58,0.12)" />
      <line className="hcf-flow2" x1="18" y1="30" x2="32" y2="38" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" />
      <circle className="hcf-n3" cx="36" cy="38" r="5" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" style={{ transformOrigin: "36px 38px" }} />
      <circle cx="36" cy="38" r="1.5" fill="rgba(184,151,58,0.12)" />
      <g className="hcf-arrow">
        <line x1="42" y1="18" x2="50" y2="18" stroke="rgba(184,151,58,0.15)" strokeWidth="0.6" />
        <path d="M48 15 L51 18 L48 21" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" fill="none" />
      </g>
    </svg>
  ),
};

/** CTA — envelope with pulse rings and floating sparkles */
function CtaIllustration() {
  return (
    <svg viewBox="0 0 200 100" fill="none" className="w-full" style={{ maxWidth: 200 }}>
      <style>{`
        .hct-ring1 { animation: hct-ring 3s ease-out infinite; }
        .hct-ring2 { animation: hct-ring 3s ease-out 1s infinite; }
        .hct-ring3 { animation: hct-ring 3s ease-out 2s infinite; }
        .hct-env { animation: hct-bob 4s ease-in-out infinite; }
        .hct-spark1 { animation: hct-sparkle 2.5s ease-in-out infinite; }
        .hct-spark2 { animation: hct-sparkle 3s ease-in-out 0.8s infinite; }
        .hct-spark3 { animation: hct-sparkle 2.8s ease-in-out 1.5s infinite; }
        @keyframes hct-ring { 0%{opacity:.3;transform:scale(1)} 100%{opacity:0;transform:scale(2)} }
        @keyframes hct-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes hct-sparkle { 0%,100%{opacity:.05;transform:scale(0.6)} 50%{opacity:.5;transform:scale(1.3)} }
      `}</style>
      {/* Pulse rings from center */}
      <circle className="hct-ring1" cx="100" cy="50" r="14" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" style={{ transformOrigin: "100px 50px" }} />
      <circle className="hct-ring2" cx="100" cy="50" r="14" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" style={{ transformOrigin: "100px 50px" }} />
      <circle className="hct-ring3" cx="100" cy="50" r="14" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" style={{ transformOrigin: "100px 50px" }} />
      {/* Envelope */}
      <g className="hct-env">
        <rect x="80" y="38" width="40" height="26" rx="2" stroke="rgba(184,151,58,0.3)" strokeWidth="0.8" fill="rgba(184,151,58,0.03)" />
        <path d="M80 38 L100 52 L120 38" stroke="rgba(184,151,58,0.25)" strokeWidth="0.7" fill="none" />
        <line x1="80" y1="64" x2="92" y2="52" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />
        <line x1="120" y1="64" x2="108" y2="52" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />
      </g>
      {/* Sparkles */}
      <circle className="hct-spark1" cx="60" cy="30" r="2" fill="rgba(184,151,58,0.15)" />
      <circle className="hct-spark2" cx="145" cy="25" r="2.5" fill="rgba(184,151,58,0.12)" />
      <circle className="hct-spark3" cx="50" cy="70" r="1.8" fill="rgba(184,151,58,0.1)" />
    </svg>
  );
}

/* ─── Fade-in wrapper ─── */
function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Structured help dict shape ─── */
interface HelpDict {
  page: Record<string, string>;
  categories: Record<string, string>;
  categoryDescriptions: Record<string, string>;
  articles: Record<string, ArticleTranslation>;
}

/* ─── Category data built from translations ─── */
interface CategoryData {
  id: string;
  label: string;
  description: string;
  articleCount: number;
  articles: {
    id: string;
    title: string;
    description: string;
    content: string;
    steps?: readonly string[];
    tips?: readonly string[];
  }[];
}

export default function AyudaPage() {
  const { dictionary } = useLanguage();
  const { openContact } = useContact();
  const helpDict = dictionary.help as unknown as HelpDict;

  const [search, setSearch] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  /* ─── Build structured data ─── */
  const allCategories: CategoryData[] = useMemo(() => {
    return categoryStructure.map((cat) => {
      const articles = cat.articleIds.map((artId) => {
        const art = helpDict.articles[artId];
        return {
          id: artId,
          title: art?.title || artId,
          description: art?.description || "",
          content: art?.content || "",
          steps: art?.steps,
          tips: art?.tips,
        };
      });
      return {
        id: cat.id,
        label: helpDict.categories[cat.id] || cat.id,
        description: helpDict.categoryDescriptions?.[cat.id] || "",
        articleCount: articles.length,
        articles,
      };
    });
  }, [helpDict]);

  /* ─── Filter by search ─── */
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return allCategories;
    const q = normalize(search);
    return allCategories
      .map((cat) => ({
        ...cat,
        articles: cat.articles.filter(
          (a) =>
            normalize(a.title).includes(q) ||
            normalize(a.description).includes(q) ||
            normalize(a.content).includes(q)
        ),
        articleCount: cat.articles.filter(
          (a) =>
            normalize(a.title).includes(q) ||
            normalize(a.description).includes(q) ||
            normalize(a.content).includes(q)
        ).length,
      }))
      .filter((cat) => cat.articles.length > 0);
  }, [search, allCategories]);

  /* ─── Hash navigation on mount ─── */
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      requestAnimationFrame(() => {
        setExpandedArticle(hash);
        setTimeout(() => {
          document
            .getElementById(`help-${hash}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 400);
      });
    }
  }, []);

  const handleToggleArticle = (articleId: string) => {
    const next = expandedArticle === articleId ? null : articleId;
    setExpandedArticle(next);
    if (next) {
      window.history.replaceState(null, "", `#${next}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const scrollToCategory = (catId: string) => {
    const el = document.getElementById(`cat-${catId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* ════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-20 px-6 lg:px-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Animated hero illustration */}
          <FadeIn>
            <div className="mx-auto mb-8" style={{ maxWidth: 280 }}>
              <HeroIllustration />
            </div>
          </FadeIn>

          {/* Section label */}
          <FadeIn delay={0.05}>
            <p
              className="font-ui text-[9px] font-bold tracking-[0.4em] uppercase mb-6"
              style={{ color: "var(--mk-accent)" }}
            >
              Centro de Ayuda
            </p>
          </FadeIn>

          {/* Heading */}
          <FadeIn delay={0.15}>
            <h1
              className="font-heading font-light leading-[1.1] mb-5"
              style={{
                fontSize: "clamp(36px, 5vw, 72px)",
                color: "var(--mk-text-primary)",
              }}
            >
              {helpDict.page.title}
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay={0.25}>
            <p
              className="text-[14px] font-light leading-[1.8] max-w-xl mx-auto mb-10"
              style={{ color: "var(--mk-text-tertiary)" }}
            >
              {helpDict.page.heroSubtitle || helpDict.page.description}
            </p>
          </FadeIn>

          {/* Search */}
          <FadeIn delay={0.3}>
            <div className="relative max-w-xl mx-auto">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "rgba(244, 240, 232, 0.25)" }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={helpDict.page.searchPlaceholder}
                className="w-full pl-12 pr-5 py-4 rounded-[1rem] text-[13px] font-light outline-none transition-all duration-200"
                style={{
                  background: "var(--mk-surface-3, #2a2a2a)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "var(--mk-text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(184, 151, 58, 0.4)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(184, 151, 58, 0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.06)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CATEGORY CARDS GRID
      ════════════════════════════════════════════ */}
      <section className="relative px-6 lg:px-20 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Top row: 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {filteredCategories.slice(0, 3).map((cat, i) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                delay={i * 0.08}
                onClick={() => scrollToCategory(cat.id)}
              />
            ))}
          </div>
          {/* Bottom row: 2 cards centered */}
          {filteredCategories.length > 3 && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {filteredCategories.slice(3, 5).map((cat, i) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  delay={(3 + i) * 0.08}
                  onClick={() => scrollToCategory(cat.id)}
                  className="sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CATEGORY SECTIONS WITH ARTICLES
      ════════════════════════════════════════════ */}
      <section className="relative px-6 lg:px-20 pb-20">
        <div className="max-w-4xl mx-auto space-y-16">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              id={`cat-${category.id}`}
              className="scroll-mt-32"
            >
              {/* Category header */}
              <FadeIn>
                <div className="flex items-center gap-4 mb-6">
                  <span
                    className="font-ui text-[9px] font-bold tracking-[0.35em] uppercase whitespace-nowrap"
                    style={{ color: "var(--mk-accent)" }}
                  >
                    {category.label}
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                    }}
                  />
                  <span
                    className="text-[11px] font-light"
                    style={{ color: "var(--mk-text-muted)" }}
                  >
                    {category.articles.length}
                  </span>
                </div>
              </FadeIn>

              {/* Articles */}
              <div className="space-y-3">
                {category.articles.map((article, i) => (
                  <FadeIn key={article.id} delay={i * 0.05}>
                    <ArticleCard
                      article={article}
                      isExpanded={expandedArticle === article.id}
                      onToggle={() => handleToggleArticle(article.id)}
                      stepsLabel={helpDict.page.stepsLabel || "Paso a paso"}
                      tipsLabel={helpDict.page.tipsLabel || "Consejos"}
                    />
                  </FadeIn>
                ))}
              </div>
            </div>
          ))}

          {/* No results */}
          {filteredCategories.length === 0 && (
            <FadeIn>
              <div className="text-center py-24">
                <Search
                  size={40}
                  className="mx-auto mb-4"
                  style={{ color: "rgba(244, 240, 232, 0.12)" }}
                />
                <p
                  className="text-[13px] font-light"
                  style={{ color: "var(--mk-text-tertiary)" }}
                >
                  {helpDict.page.noResults}
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CONTACT CTA SECTION
      ════════════════════════════════════════════ */}
      <section
        className="relative px-6 lg:px-20 py-28 border-t"
        style={{
          borderColor: "var(--mk-border-rule, rgba(255,255,255,0.04))",
          background: "var(--mk-bg-dark, #0a0a0a)",
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          {/* Animated envelope illustration */}
          <FadeIn>
            <div className="mx-auto mb-8" style={{ maxWidth: 160 }}>
              <CtaIllustration />
            </div>
          </FadeIn>
          <FadeIn delay={0.05}>
            <p
              className="font-ui text-[9px] font-bold tracking-[0.4em] uppercase mb-6"
              style={{ color: "var(--mk-accent)" }}
            >
              Soporte
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2
              className="font-heading font-light leading-[1.15] mb-5"
              style={{
                fontSize: "clamp(28px, 4vw, 48px)",
                color: "var(--mk-text-primary)",
              }}
            >
              {helpDict.page.ctaTitle || "No encontraste lo que buscabas?"}
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p
              className="text-[13px] font-light leading-[1.8] mb-10 max-w-lg mx-auto"
              style={{ color: "var(--mk-text-tertiary)" }}
            >
              {helpDict.page.ctaDescription || ""}
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => openContact(undefined, "help-center")}
                className="btn-mk-primary flex items-center gap-2 px-7 py-3.5"
              >
                <MessageCircle size={14} />
                {helpDict.page.ctaContact || "Contactanos"}
              </button>
              <a
                href="/faq"
                className="btn-mk-outline flex items-center gap-2 px-7 py-3.5"
              >
                {helpDict.page.ctaWhatsapp
                  ? "Ver preguntas frecuentes"
                  : "FAQ"}
                <ArrowRight size={14} />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}

/* ══════════════════════════════════════════════
   CATEGORY CARD COMPONENT
══════════════════════════════════════════════ */
function CategoryCard({
  category,
  delay = 0,
  onClick,
  className,
}: {
  category: CategoryData;
  delay?: number;
  onClick: () => void;
  className?: string;
}) {
  const SvgIllustration = categorySvgs[category.id];
  const CatIcon = categoryIconMap[category.id] || defaultIcon;

  return (
    <FadeIn delay={delay} className={className}>
      <button
        onClick={onClick}
        className="w-full text-left rounded-[1.25rem] p-6 transition-all duration-300 group cursor-pointer"
        style={{
          background: "var(--mk-surface-3, #2a2a2a)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(184, 151, 58, 0.3)";
          e.currentTarget.style.boxShadow =
            "0 0 30px rgba(184, 151, 58, 0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Animated SVG illustration or fallback Lucide icon */}
        {SvgIllustration ? (
          <div className="w-14 h-14 mb-4">
            <SvgIllustration />
          </div>
        ) : (
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
            style={{ background: "rgba(184, 151, 58, 0.1)" }}
          >
            <CatIcon size={20} style={{ color: "var(--mk-accent)" }} />
          </div>
        )}

        {/* Name */}
        <h3
          className="font-ui text-[11px] font-bold tracking-[0.12em] uppercase mb-1.5"
          style={{ color: "var(--mk-text-primary)" }}
        >
          {category.label}
        </h3>

        {/* Description */}
        <p
          className="text-[11px] font-light leading-[1.6] mb-3"
          style={{ color: "var(--mk-text-tertiary)" }}
        >
          {category.description}
        </p>

        {/* Article count */}
        <span
          className="text-[10px] font-light"
          style={{ color: "var(--mk-text-muted)" }}
        >
          {category.articleCount}{" "}
          {category.articleCount === 1 ? "articulo" : "articulos"}
        </span>
      </button>
    </FadeIn>
  );
}

/* ══════════════════════════════════════════════
   ARTICLE CARD COMPONENT
══════════════════════════════════════════════ */
function ArticleCard({
  article,
  isExpanded,
  onToggle,
  stepsLabel,
  tipsLabel,
}: {
  article: CategoryData["articles"][number];
  isExpanded: boolean;
  onToggle: () => void;
  stepsLabel: string;
  tipsLabel: string;
}) {
  const Icon = iconMap[article.id] || defaultIcon;

  return (
    <div
      id={`help-${article.id}`}
      className="rounded-[1.25rem] transition-all duration-300"
      style={{
        background: "var(--mk-surface-3, #2a2a2a)",
        border: isExpanded
          ? "1px solid rgba(184, 151, 58, 0.25)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: isExpanded
          ? "0 0 40px rgba(184, 151, 58, 0.06)"
          : "none",
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-5 text-left group cursor-pointer rounded-[1.25rem] transition-colors duration-200"
        style={{}}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
          style={{
            background: isExpanded
              ? "rgba(184, 151, 58, 0.15)"
              : "rgba(255,255,255,0.04)",
            boxShadow: isExpanded
              ? "0 0 20px rgba(184, 151, 58, 0.12)"
              : "none",
          }}
        >
          <Icon
            size={18}
            style={{
              color: isExpanded
                ? "var(--mk-accent)"
                : "rgba(244, 240, 232, 0.3)",
            }}
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-[14px] font-normal"
            style={{ color: "var(--mk-text-primary)" }}
          >
            {article.title}
          </h3>
          <p
            className="text-[11px] font-light mt-0.5 truncate"
            style={{ color: "var(--mk-text-muted)" }}
          >
            {article.description}
          </p>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="shrink-0"
        >
          <ChevronRight
            size={16}
            className="transition-colors duration-200"
            style={{
              color: isExpanded
                ? "var(--mk-accent)"
                : "rgba(244, 240, 232, 0.15)",
            }}
          />
        </motion.div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6">
              {/* Divider */}
              <div
                className="border-t"
                style={{
                  borderColor: "rgba(184, 151, 58, 0.1)",
                }}
              />

              {/* Content */}
              <p
                className="text-[13px] font-light leading-[1.85]"
                style={{ color: "var(--mk-text-secondary)" }}
              >
                {article.content}
              </p>

              {/* Steps */}
              {article.steps && article.steps.length > 0 && (
                <div>
                  <h4
                    className="font-ui text-[9px] font-bold tracking-[0.2em] uppercase mb-4"
                    style={{ color: "var(--mk-text-muted)" }}
                  >
                    {stepsLabel}
                  </h4>
                  <ol className="space-y-0 relative">
                    {/* Vertical line */}
                    <div
                      className="absolute left-[11px] top-3 bottom-3 w-px"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(184,151,58,0.2), rgba(184,151,58,0.05))",
                      }}
                    />
                    {article.steps.map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-4 py-2.5 relative"
                      >
                        <span
                          className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-medium relative z-[1]"
                          style={{
                            background: "rgba(184, 151, 58, 0.12)",
                            color: "var(--mk-accent)",
                            border:
                              "1px solid rgba(184, 151, 58, 0.25)",
                          }}
                        >
                          {i + 1}
                        </span>
                        <span
                          className="text-[12px] font-light leading-[1.75] pt-[2px]"
                          style={{
                            color: "var(--mk-text-secondary)",
                          }}
                        >
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Tips */}
              {article.tips && article.tips.length > 0 && (
                <div>
                  <h4
                    className="font-ui text-[9px] font-bold tracking-[0.2em] uppercase mb-3"
                    style={{ color: "var(--mk-text-muted)" }}
                  >
                    {tipsLabel}
                  </h4>
                  <div className="space-y-2.5">
                    {article.tips.map((tip, i) => (
                      <div
                        key={i}
                        className="flex gap-3 rounded-[0.875rem] px-4 py-3.5"
                        style={{
                          background: "rgba(184, 151, 58, 0.06)",
                          border:
                            "1px solid rgba(184, 151, 58, 0.12)",
                        }}
                      >
                        <Lightbulb
                          size={15}
                          className="shrink-0 mt-0.5"
                          style={{
                            color: "var(--mk-accent)",
                          }}
                        />
                        <p
                          className="text-[12px] font-light leading-[1.75]"
                          style={{
                            color: "var(--mk-text-secondary)",
                          }}
                        >
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
