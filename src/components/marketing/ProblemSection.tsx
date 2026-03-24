"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/i18n";

/* ── Large SVG illustrations ── */

/** Brochure estático — PDF pages stacked, gathering dust, with "unread" red X overlay */
function IllustrationBrochure() {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full" style={{ maxWidth: 180 }}>
      <defs>
        <linearGradient id="pb-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(184,151,58,0.06)" />
          <stop offset="100%" stopColor="rgba(184,151,58,0.01)" />
        </linearGradient>
      </defs>
      <style>{`
        .pb-page { animation: pb-page-bob 4s ease-in-out infinite; }
        .pb-x { animation: pb-x-pulse 2.5s ease-in-out infinite; }
        .pb-ring { animation: pb-ring-pulse 2.5s ease-in-out infinite; }
        .pb-views { animation: pb-blink 2s ease-in-out infinite; }
        .pb-dust1 { animation: pb-float 4s ease-in-out infinite; }
        .pb-dust2 { animation: pb-float 5s ease-in-out infinite .6s; }
        .pb-dust3 { animation: pb-float 5.5s ease-in-out infinite 1.2s; }
        .pb-dust4 { animation: pb-float 4.5s ease-in-out infinite .3s; }
        .pb-dust5 { animation: pb-float 5s ease-in-out infinite 1.5s; }
        .pb-dust6 { animation: pb-float 6s ease-in-out infinite .8s; }
        @keyframes pb-float { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(-14px);opacity:.4} }
        @keyframes pb-x-pulse { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.7;transform:scale(1.08)} }
        @keyframes pb-ring-pulse { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:.5;transform:scale(1.06)} }
        @keyframes pb-blink { 0%,30%{opacity:1} 40%,50%{opacity:.15} 60%,100%{opacity:1} }
        @keyframes pb-page-bob { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-6px) rotate(0.5deg)} }
      `}</style>

      {/* Back pages (stacked offset) */}
      <rect x="48" y="10" width="96" height="124" rx="2" fill="rgba(184,151,58,0.015)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.6" />
      <rect x="42" y="14" width="96" height="124" rx="2" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.1)" strokeWidth="0.6" />

      {/* Main page — gentle bob */}
      <g className="pb-page">
        <rect x="36" y="18" width="96" height="124" rx="2" fill="url(#pb-page)" stroke="#b8973a" strokeWidth="0.8" opacity="0.3" />
        <path d="M116 18 L132 18 L132 34 Z" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" />
        <path d="M116 18 L116 34 L132 34" stroke="rgba(184,151,58,0.18)" strokeWidth="0.5" fill="none" />
        {/* Title block */}
        <rect x="48" y="32" width="56" height="4" rx="1" fill="rgba(184,151,58,0.15)" />
        <rect x="48" y="40" width="40" height="3" rx="1" fill="rgba(184,151,58,0.08)" />
        {/* Image placeholder */}
        <rect x="48" y="52" width="72" height="32" rx="1" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" fill="rgba(184,151,58,0.02)" />
        <polyline points="48,84 62,66 74,76 86,60 100,72 120,84" stroke="rgba(184,151,58,0.08)" strokeWidth="0.5" fill="none" />
        <circle cx="108" cy="62" r="4" fill="rgba(184,151,58,0.05)" />
        {/* Text lines */}
        <line x1="48" y1="94" x2="118" y2="94" stroke="rgba(184,151,58,0.1)" strokeWidth="0.6" />
        <line x1="48" y1="100" x2="110" y2="100" stroke="rgba(184,151,58,0.07)" strokeWidth="0.6" />
        <line x1="48" y1="106" x2="114" y2="106" stroke="rgba(184,151,58,0.1)" strokeWidth="0.6" />
        <line x1="48" y1="112" x2="98" y2="112" stroke="rgba(184,151,58,0.06)" strokeWidth="0.6" />
        <line x1="48" y1="118" x2="106" y2="118" stroke="rgba(184,151,58,0.07)" strokeWidth="0.6" />
        <line x1="48" y1="124" x2="80" y2="124" stroke="rgba(184,151,58,0.05)" strokeWidth="0.6" />
      </g>

      {/* "PDF" badge */}
      <rect x="94" y="128" width="28" height="10" rx="1.5" fill="rgba(200,80,60,0.1)" stroke="rgba(200,80,60,0.25)" strokeWidth="0.6" />
      <text x="108" y="136" textAnchor="middle" fill="rgba(200,80,60,0.5)" fontSize="6" fontFamily="monospace">.PDF</text>

      {/* Large red X overlay — pulsing */}
      <g className="pb-x" style={{ transformOrigin: "173px 51px" }}>
        <line x1="150" y1="28" x2="196" y2="74" stroke="rgba(200,80,60,0.35)" strokeWidth="2" strokeLinecap="round" />
        <line x1="196" y1="28" x2="150" y2="74" stroke="rgba(200,80,60,0.35)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <circle className="pb-ring" cx="173" cy="51" r="28" stroke="rgba(200,80,60,0.2)" strokeWidth="1" fill="none" style={{ transformOrigin: "173px 51px" }} />

      {/* Gold dust particles */}
      <circle className="pb-dust1" cx="28" cy="68" r="1.8" fill="rgba(184,151,58,0.14)" />
      <circle className="pb-dust2" cx="22" cy="48" r="1.2" fill="rgba(184,151,58,0.12)" />
      <circle className="pb-dust3" cx="16" cy="88" r="1.5" fill="rgba(184,151,58,0.10)" />
      <circle className="pb-dust4" cx="150" cy="110" r="1.8" fill="rgba(184,151,58,0.12)" />
      <circle className="pb-dust5" cx="170" cy="120" r="1.2" fill="rgba(184,151,58,0.10)" />
      <circle className="pb-dust6" cx="190" cy="98" r="1.5" fill="rgba(184,151,58,0.12)" />

      {/* "0 views" indicator — blinking */}
      <g className="pb-views">
        <rect x="152" y="90" width="48" height="18" rx="2" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.5" />
        <ellipse cx="164" cy="99" rx="4" ry="2.5" stroke="rgba(184,151,58,0.18)" strokeWidth="0.5" fill="none" />
        <circle cx="164" cy="99" r="1" fill="rgba(184,151,58,0.12)" />
        <line x1="160" y1="102" x2="168" y2="96" stroke="rgba(200,80,60,0.3)" strokeWidth="0.6" strokeLinecap="round" />
        <text x="182" y="101.5" textAnchor="middle" fill="rgba(184,151,58,0.25)" fontSize="6" fontFamily="monospace">0</text>
      </g>
    </svg>
  );
}

/** CGI desperdiciado — 3D renders trapped inside folders, isometric cube + film reel */
function IllustrationCGI() {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full" style={{ maxWidth: 180 }}>
      <defs>
        <linearGradient id="pc-folder" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(184,151,58,0.05)" />
          <stop offset="100%" stopColor="rgba(184,151,58,0.015)" />
        </linearGradient>
      </defs>
      <style>{`
        .pc-dust1 { animation: pc-float 4s ease-in-out infinite; }
        .pc-dust2 { animation: pc-float 5s ease-in-out infinite .4s; }
        .pc-dust3 { animation: pc-float 5.5s ease-in-out infinite 1s; }
        .pc-dust4 { animation: pc-float 4.5s ease-in-out infinite .7s; }
        .pc-stamp { animation: pc-stamp-pulse 2.5s ease-in-out infinite; transform-origin: 84px 126px; }
        .pc-arc { stroke-dasharray: 3 3; animation: pc-arc-flow 2.5s linear infinite; }
        .pc-cube-glow { animation: pc-glow 3s ease-in-out infinite; }
        .pc-cube { animation: pc-cube-float 5s ease-in-out infinite; }
        .pc-folder2 { animation: pc-folder2-drift 6s ease-in-out infinite; }
        @keyframes pc-float { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(-12px);opacity:.4} }
        @keyframes pc-stamp-pulse { 0%,100%{opacity:1;transform:scale(1) rotate(-4deg)} 50%{opacity:.25;transform:scale(1.1) rotate(-4deg)} }
        @keyframes pc-arc-flow { from{stroke-dashoffset:0} to{stroke-dashoffset:-12} }
        @keyframes pc-glow { 0%,100%{opacity:.04} 50%{opacity:.18} }
        @keyframes pc-cube-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes pc-folder2-drift { 0%,100%{transform:translate(130px,60px) rotate(8deg)} 50%{transform:translate(132px,57px) rotate(9deg)} }
      `}</style>

      {/* Large back folder */}
      <rect x="24" y="44" width="120" height="90" rx="2" fill="url(#pc-folder)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.7" />
      <path d="M24 44 L24 38 L48 38 L54 44" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.7" />

      {/* Glow behind cube */}
      <circle className="pc-cube-glow" cx="80" cy="85" r="30" fill="rgba(184,151,58,0.08)" />

      {/* Isometric 3D cube — render asset */}
      <g className="pc-cube">
      <polygon points="80,58 108,72 108,98 80,112 52,98 52,72" stroke="#b8973a" strokeWidth="0.7" opacity="0.3" fill="none" />
      <polygon points="80,58 108,72 80,86 52,72" stroke="#b8973a" strokeWidth="0.5" opacity="0.25" fill="rgba(184,151,58,0.035)" />
      <line x1="80" y1="86" x2="80" y2="112" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" />
      <line x1="52" y1="72" x2="80" y2="86" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" />
      <line x1="108" y1="72" x2="80" y2="86" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" />
      {/* Grid on top face */}
      <line x1="66" y1="65" x2="94" y2="79" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
      <line x1="80" y1="72" x2="66" y2="79" stroke="rgba(184,151,58,0.05)" strokeWidth="0.3" />
      <line x1="80" y1="72" x2="94" y2="65" stroke="rgba(184,151,58,0.05)" strokeWidth="0.3" />

      {/* 360° arc — animated dash flow */}
      <path className="pc-arc" d="M88 55 A30 30 0 1 1 72 55" stroke="rgba(184,151,58,0.18)" strokeWidth="0.7" fill="none" />
      <polygon points="72,55 74,50 69,53" fill="rgba(184,151,58,0.2)" />
      </g>

      {/* Film reel icon — rotating sprockets */}
      <g>
        <circle cx="38" cy="64" r="8" stroke="rgba(184,151,58,0.15)" strokeWidth="0.6" fill="none" />
        <circle cx="38" cy="64" r="3" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" fill="none" />
        <g>
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const r = 6;
            const cx = 38 + r * Math.cos((angle * Math.PI) / 180);
            const cy = 64 + r * Math.sin((angle * Math.PI) / 180);
            return <circle key={angle} cx={cx} cy={cy} r="0.8" fill="rgba(184,151,58,0.1)" />;
          })}
          <animateTransform attributeName="transform" type="rotate" from="0 38 64" to="360 38 64" dur="12s" repeatCount="indefinite" />
        </g>
      </g>

      {/* Small render thumbnail */}
      <rect x="106" y="54" width="28" height="20" rx="1" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" fill="rgba(184,151,58,0.02)" />
      <rect x="114" y="60" width="6" height="14" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" fill="none" />
      <rect x="122" y="64" width="6" height="10" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" fill="none" />

      {/* Second folder (tilted) — drifts */}
      <g className="pc-folder2">
        <rect x="0" y="12" width="72" height="56" rx="2" fill="rgba(184,151,58,0.025)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.6" />
        <path d="M0 12 L0 6 L18 6 L22 12" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.6" />
        <rect x="8" y="22" width="18" height="14" rx="1" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" fill="rgba(184,151,58,0.015)" />
        <rect x="30" y="22" width="18" height="14" rx="1" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" fill="rgba(184,151,58,0.015)" />
        <rect x="52" y="22" width="14" height="14" rx="1" stroke="rgba(184,151,58,0.06)" strokeWidth="0.4" fill="rgba(184,151,58,0.01)" />
        <rect x="8" y="42" width="18" height="14" rx="1" stroke="rgba(184,151,58,0.06)" strokeWidth="0.4" fill="rgba(184,151,58,0.01)" />
        <rect x="30" y="42" width="18" height="14" rx="1" stroke="rgba(184,151,58,0.06)" strokeWidth="0.4" fill="rgba(184,151,58,0.01)" />
      </g>

      {/* Gold dust particles */}
      <circle className="pc-dust1" cx="18" cy="100" r="1.5" fill="rgba(184,151,58,0.13)" />
      <circle className="pc-dust2" cx="12" cy="80" r="1.2" fill="rgba(184,151,58,0.11)" />
      <circle className="pc-dust3" cx="8" cy="56" r="1" fill="rgba(184,151,58,0.12)" />
      <circle className="pc-dust4" cx="200" cy="48" r="1.2" fill="rgba(184,151,58,0.10)" />

      {/* Red "SIN USO" stamp — pulsing */}
      <g className="pc-stamp">
        <rect x="56" y="118" width="56" height="16" rx="2" stroke="rgba(200,80,60,0.3)" strokeWidth="0.8" fill="rgba(200,80,60,0.06)" />
        <text x="84" y="129" textAnchor="middle" fill="rgba(200,80,60,0.45)" fontSize="7" fontFamily="monospace">SIN USO</text>
      </g>
    </svg>
  );
}

/** Proceso fragmentado — scattered tools: Excel grid, PDF, phone, email — broken connections */
function IllustrationFragmented() {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full" style={{ maxWidth: 180 }}>
      <style>{`
        .pf-conn1 { stroke-dasharray: 5 4; animation: pf-flow 1.5s linear infinite; }
        .pf-conn2 { stroke-dasharray: 5 4; animation: pf-flow 1.8s linear infinite .15s; }
        .pf-conn3 { stroke-dasharray: 5 4; animation: pf-flow 1.6s linear infinite .4s; }
        .pf-conn4 { stroke-dasharray: 5 4; animation: pf-flow 2s linear infinite .25s; }
        .pf-conn5 { stroke-dasharray: 4 5; animation: pf-flow 2.2s linear infinite .6s; }
        .pf-x1 { animation: pf-x-pulse 1.8s ease-in-out infinite; }
        .pf-x2 { animation: pf-x-pulse 1.8s ease-in-out infinite .35s; }
        .pf-x3 { animation: pf-x-pulse 1.8s ease-in-out infinite .7s; }
        .pf-x4 { animation: pf-x-pulse 1.8s ease-in-out infinite 1.05s; }
        .pf-q1 { animation: pf-float 3s ease-in-out infinite; }
        .pf-q2 { animation: pf-float 3.5s ease-in-out infinite .5s; }
        .pf-q3 { animation: pf-float 2.8s ease-in-out infinite 1s; }
        .pf-badge { transform-box: fill-box; transform-origin: center; animation: pf-badge-pulse 1.6s ease-in-out infinite; }
        .pf-excel { animation: pf-tool-drift1 5s ease-in-out infinite; }
        .pf-pdf { animation: pf-tool-drift2 5.5s ease-in-out infinite .3s; }
        .pf-phone { animation: pf-tool-drift3 4.5s ease-in-out infinite .6s; }
        .pf-email { animation: pf-tool-drift4 5s ease-in-out infinite .9s; }
        @keyframes pf-flow { from{stroke-dashoffset:0} to{stroke-dashoffset:-10} }
        @keyframes pf-x-pulse { 0%,100%{opacity:.9;transform:scale(1)} 50%{opacity:.2;transform:scale(0.8)} }
        @keyframes pf-float { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(-10px);opacity:.5} }
        @keyframes pf-badge-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.25)} }
        @keyframes pf-tool-drift1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-3px,-4px)} }
        @keyframes pf-tool-drift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(3px,-3px)} }
        @keyframes pf-tool-drift3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-2px,4px)} }
        @keyframes pf-tool-drift4 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(3px,3px)} }
      `}</style>

      {/* Excel spreadsheet (top-left) */}
      <g className="pf-excel">
        <rect x="12" y="16" width="56" height="42" rx="2" stroke="#b8973a" strokeWidth="0.7" opacity="0.25" fill="rgba(184,151,58,0.025)" />
        <rect x="12" y="16" width="56" height="8" rx="2" fill="rgba(184,151,58,0.04)" />
        <line x1="12" y1="24" x2="68" y2="24" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
        <line x1="26" y1="16" x2="26" y2="58" stroke="rgba(184,151,58,0.07)" strokeWidth="0.3" />
        <line x1="40" y1="16" x2="40" y2="58" stroke="rgba(184,151,58,0.07)" strokeWidth="0.3" />
        <line x1="54" y1="16" x2="54" y2="58" stroke="rgba(184,151,58,0.07)" strokeWidth="0.3" />
        <line x1="12" y1="32" x2="68" y2="32" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
        <line x1="12" y1="40" x2="68" y2="40" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
        <line x1="12" y1="48" x2="68" y2="48" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
        <rect x="14" y="26" width="10" height="3" rx="0.5" fill="rgba(184,151,58,0.08)" />
        <rect x="28" y="26" width="8" height="3" rx="0.5" fill="rgba(184,151,58,0.06)" />
        <rect x="42" y="26" width="10" height="3" rx="0.5" fill="rgba(184,151,58,0.05)" />
        <rect x="14" y="34" width="8" height="3" rx="0.5" fill="rgba(184,151,58,0.06)" />
        <rect x="28" y="34" width="10" height="3" rx="0.5" fill="rgba(184,151,58,0.08)" />
        <rect x="42" y="42" width="8" height="3" rx="0.5" fill="rgba(184,151,58,0.05)" />
        <text x="40" y="21" textAnchor="middle" fill="rgba(184,151,58,0.18)" fontSize="4.5" fontFamily="monospace">DISPONIBILIDAD.xlsx</text>
      </g>

      {/* PDF document (top-right) */}
      <g className="pf-pdf">
        <rect x="142" y="8" width="44" height="56" rx="2" stroke="#b8973a" strokeWidth="0.7" opacity="0.2" fill="rgba(184,151,58,0.02)" />
        <path d="M172 8 L186 8 L186 22 Z" fill="rgba(184,151,58,0.025)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
        <path d="M172 8 L172 22 L186 22" fill="none" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" />
        <line x1="150" y1="28" x2="178" y2="28" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <line x1="150" y1="33" x2="174" y2="33" stroke="rgba(184,151,58,0.06)" strokeWidth="0.4" />
        <line x1="150" y1="38" x2="176" y2="38" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <line x1="150" y1="43" x2="168" y2="43" stroke="rgba(184,151,58,0.05)" strokeWidth="0.4" />
        <line x1="150" y1="48" x2="172" y2="48" stroke="rgba(184,151,58,0.06)" strokeWidth="0.4" />
        <line x1="150" y1="53" x2="164" y2="53" stroke="rgba(184,151,58,0.05)" strokeWidth="0.4" />
        <text x="164" y="14" textAnchor="middle" fill="rgba(184,151,58,0.12)" fontSize="3.5" fontFamily="monospace">BROCHURE.pdf</text>
      </g>

      {/* Phone / WhatsApp (bottom-left) */}
      <g className="pf-phone">
        <rect x="20" y="88" width="32" height="52" rx="4" stroke="#b8973a" strokeWidth="0.7" opacity="0.25" fill="rgba(184,151,58,0.025)" />
        <rect x="23" y="96" width="26" height="36" rx="1" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" fill="rgba(184,151,58,0.015)" />
        <rect x="26" y="100" width="16" height="5" rx="1.5" fill="rgba(184,151,58,0.07)" />
        <rect x="32" y="109" width="14" height="5" rx="1.5" fill="rgba(184,151,58,0.05)" />
        <rect x="26" y="118" width="18" height="5" rx="1.5" fill="rgba(184,151,58,0.06)" />
        <line x1="31" y1="91" x2="41" y2="91" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" strokeLinecap="round" />
      </g>

      {/* Email envelope (bottom-right) */}
      <g className="pf-email">
        <rect x="144" y="92" width="56" height="38" rx="2" stroke="#b8973a" strokeWidth="0.7" opacity="0.2" fill="rgba(184,151,58,0.02)" />
        <polyline points="144,92 172,114 200,92" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" fill="none" />
        <line x1="144" y1="130" x2="160" y2="112" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <line x1="200" y1="130" x2="184" y2="112" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        {/* Unread badge — pulsing */}
        <circle className="pf-badge" cx="196" cy="92" r="5" fill="rgba(200,80,60,0.2)" stroke="rgba(200,80,60,0.3)" strokeWidth="0.5" />
        <text x="196" y="94.5" textAnchor="middle" fill="rgba(200,80,60,0.5)" fontSize="5" fontFamily="monospace">3</text>
      </g>

      {/* Broken dashed connections — flowing */}
      <line className="pf-conn1" x1="68" y1="34" x2="142" y2="28" stroke="rgba(200,80,60,0.22)" strokeWidth="0.7" />
      <line className="pf-conn2" x1="40" y1="58" x2="36" y2="88" stroke="rgba(200,80,60,0.18)" strokeWidth="0.7" />
      <line className="pf-conn3" x1="164" y1="64" x2="172" y2="92" stroke="rgba(200,80,60,0.18)" strokeWidth="0.7" />
      <line className="pf-conn4" x1="52" y1="114" x2="144" y2="111" stroke="rgba(200,80,60,0.16)" strokeWidth="0.7" />
      <line className="pf-conn5" x1="68" y1="50" x2="144" y2="100" stroke="rgba(200,80,60,0.14)" strokeWidth="0.6" />

      {/* Break X marks — staggered pulse */}
      <g className="pf-x1" transform="translate(104,30)" style={{ transformOrigin: "104px 30px" }}>
        <line x1="-4" y1="-4" x2="4" y2="4" stroke="rgba(200,80,60,0.45)" strokeWidth="1" strokeLinecap="round" />
        <line x1="4" y1="-4" x2="-4" y2="4" stroke="rgba(200,80,60,0.45)" strokeWidth="1" strokeLinecap="round" />
      </g>
      <g className="pf-x2" transform="translate(38,74)" style={{ transformOrigin: "38px 74px" }}>
        <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="rgba(200,80,60,0.4)" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="rgba(200,80,60,0.4)" strokeWidth="0.9" strokeLinecap="round" />
      </g>
      <g className="pf-x3" transform="translate(168,78)" style={{ transformOrigin: "168px 78px" }}>
        <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="rgba(200,80,60,0.4)" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="rgba(200,80,60,0.4)" strokeWidth="0.9" strokeLinecap="round" />
      </g>
      <g className="pf-x4" transform="translate(98,112)" style={{ transformOrigin: "98px 112px" }}>
        <line x1="-4" y1="-4" x2="4" y2="4" stroke="rgba(200,80,60,0.35)" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="4" y1="-4" x2="-4" y2="4" stroke="rgba(200,80,60,0.35)" strokeWidth="0.9" strokeLinecap="round" />
      </g>

      {/* Floating question marks */}
      <text className="pf-q1" x="92" y="56" fill="rgba(184,151,58,0.18)" fontSize="16" fontFamily="serif">?</text>
      <text className="pf-q2" x="108" y="82" fill="rgba(184,151,58,0.14)" fontSize="12" fontFamily="serif">?</text>
      <text className="pf-q3" x="82" y="96" fill="rgba(184,151,58,0.10)" fontSize="10" fontFamily="serif">?</text>
    </svg>
  );
}

/** Leads sin trazabilidad — user silhouettes fading into void, broken funnel, no data lines */
function IllustrationLeads() {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full" style={{ maxWidth: 180 }}>
      <defs>
        <linearGradient id="pl-funnel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(184,151,58,0.08)" />
          <stop offset="100%" stopColor="rgba(184,151,58,0.02)" />
        </linearGradient>
      </defs>
      <style>{`
        .pl-drip1 { animation: pl-drip 2s ease-in-out infinite; }
        .pl-drip2 { animation: pl-drip 2s ease-in-out infinite .25s; }
        .pl-drip3 { animation: pl-drip 2s ease-in-out infinite .5s; }
        .pl-drip4 { animation: pl-drip 2s ease-in-out infinite .75s; }
        .pl-drip5 { animation: pl-drip 2s ease-in-out infinite 1s; }
        .pl-crack { animation: pl-crack-pulse 2s ease-in-out infinite; }
        .pl-person1 { animation: pl-fade 3.5s ease-in-out infinite; }
        .pl-person2 { animation: pl-fade 4s ease-in-out infinite .6s; }
        .pl-person3 { animation: pl-fade 4.5s ease-in-out infinite 1.2s; }
        .pl-utm1 { animation: pl-flicker 3s ease-in-out infinite; }
        .pl-utm2 { animation: pl-flicker 3.5s ease-in-out infinite .5s; }
        .pl-utm3 { animation: pl-flicker 2.8s ease-in-out infinite 1s; }
        .pl-dash { stroke-dasharray: 4 3; animation: pl-dash-flow 2s linear infinite; }
        .pl-q { animation: pl-q-pulse 2.5s ease-in-out infinite; }
        .pl-q2 { animation: pl-q-pulse 3s ease-in-out infinite .4s; }
        .pl-funnel { animation: pl-funnel-shake 4s ease-in-out infinite; }
        .pl-card-left { animation: pl-card-drift1 5s ease-in-out infinite; }
        .pl-card-right { animation: pl-card-drift2 5.5s ease-in-out infinite .4s; }
        @keyframes pl-drip { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(12px);opacity:0} }
        @keyframes pl-crack-pulse { 0%,100%{opacity:.9} 50%{opacity:.25} }
        @keyframes pl-fade { 0%,20%{opacity:1} 50%{opacity:.15} 80%,100%{opacity:1} }
        @keyframes pl-flicker { 0%,100%{opacity:1} 30%{opacity:.15} 50%{opacity:.8} 70%{opacity:.1} }
        @keyframes pl-dash-flow { from{stroke-dashoffset:0} to{stroke-dashoffset:-8} }
        @keyframes pl-q-pulse { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.7;transform:scale(1.15)} }
        @keyframes pl-funnel-shake { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-1px,0)} 75%{transform:translate(1px,0)} }
        @keyframes pl-card-drift1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-3px,-3px)} }
        @keyframes pl-card-drift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(3px,-2px)} }
      `}</style>

      {/* Broken funnel */}
      <g className="pl-funnel">
      <path d="M72 16 L148 16 L128 62" stroke="#b8973a" strokeWidth="0.8" opacity="0.3" fill="url(#pl-funnel)" />
      <path d="M72 16 L92 62" stroke="#b8973a" strokeWidth="0.8" opacity="0.3" fill="none" />
      <line x1="92" y1="62" x2="96" y2="76" stroke="rgba(184,151,58,0.22)" strokeWidth="0.7" />
      <line x1="128" y1="62" x2="124" y2="76" stroke="rgba(184,151,58,0.22)" strokeWidth="0.7" />
      {/* Crack — pulsing red */}
      <g className="pl-crack">
        <path d="M108 48 L112 56 L106 62 L110 70" stroke="rgba(200,80,60,0.4)" strokeWidth="1" strokeLinecap="round" fill="none" />
        <path d="M100 44 L96 52 L102 58" stroke="rgba(200,80,60,0.3)" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      </g>
      </g>

      {/* User silhouettes — fading */}
      <g className="pl-person1">
        <circle cx="84" cy="8" r="3.5" stroke="#b8973a" strokeWidth="0.7" opacity="0.35" fill="none" />
        <path d="M78 18 C78 14 80 12 84 12 C88 12 90 14 90 18" stroke="#b8973a" strokeWidth="0.7" opacity="0.3" fill="none" />
      </g>
      <g className="pl-person2">
        <circle cx="110" cy="6" r="3.5" stroke="#b8973a" strokeWidth="0.7" opacity="0.3" fill="none" />
        <path d="M104 16 C104 12 106 10 110 10 C114 10 116 12 116 16" stroke="#b8973a" strokeWidth="0.7" opacity="0.25" fill="none" />
      </g>
      <g className="pl-person3">
        <circle cx="136" cy="8" r="3.5" stroke="#b8973a" strokeWidth="0.7" opacity="0.25" fill="none" />
        <path d="M130 18 C130 14 132 12 136 12 C140 12 142 14 142 18" stroke="#b8973a" strokeWidth="0.7" opacity="0.2" fill="none" />
      </g>

      {/* Dripping dots — leads lost */}
      <circle className="pl-drip1" cx="104" cy="82" r="2.5" fill="rgba(184,151,58,0.22)" />
      <circle className="pl-drip2" cx="110" cy="90" r="2.2" fill="rgba(184,151,58,0.18)" />
      <circle className="pl-drip3" cx="106" cy="98" r="1.8" fill="rgba(184,151,58,0.14)" />
      <circle className="pl-drip4" cx="112" cy="106" r="1.5" fill="rgba(184,151,58,0.10)" />
      <circle className="pl-drip5" cx="108" cy="114" r="1.2" fill="rgba(184,151,58,0.07)" />

      {/* Left ghost user card */}
      <g className="pl-card-left">
      <rect x="8" y="36" width="48" height="56" rx="2" stroke="rgba(184,151,58,0.14)" strokeWidth="0.6" fill="rgba(184,151,58,0.02)" />
      <circle cx="32" cy="52" r="8" stroke="rgba(184,151,58,0.16)" strokeWidth="0.6" fill="none" />
      <text className="pl-q" x="32" y="56" textAnchor="middle" fill="rgba(200,80,60,0.45)" fontSize="11" fontFamily="serif" style={{ transformOrigin: "32px 52px" }}>?</text>
      <line x1="16" y1="68" x2="48" y2="68" stroke="rgba(184,151,58,0.08)" strokeWidth="0.5" strokeDasharray="2 3" />
      <line x1="16" y1="74" x2="42" y2="74" stroke="rgba(184,151,58,0.06)" strokeWidth="0.5" strokeDasharray="2 3" />
      <line x1="16" y1="80" x2="44" y2="80" stroke="rgba(184,151,58,0.06)" strokeWidth="0.5" strokeDasharray="2 3" />
      </g>

      {/* Right ghost user card */}
      <g className="pl-card-right">
      <rect x="164" y="40" width="48" height="56" rx="2" stroke="rgba(184,151,58,0.14)" strokeWidth="0.6" fill="rgba(184,151,58,0.02)" />
      <circle cx="188" cy="56" r="8" stroke="rgba(184,151,58,0.16)" strokeWidth="0.6" fill="none" />
      <text className="pl-q2" x="188" y="60" textAnchor="middle" fill="rgba(200,80,60,0.45)" fontSize="11" fontFamily="serif" style={{ transformOrigin: "188px 56px" }}>?</text>
      <line x1="172" y1="72" x2="204" y2="72" stroke="rgba(184,151,58,0.08)" strokeWidth="0.5" strokeDasharray="2 3" />
      <line x1="172" y1="78" x2="198" y2="78" stroke="rgba(184,151,58,0.06)" strokeWidth="0.5" strokeDasharray="2 3" />
      <line x1="172" y1="84" x2="200" y2="84" stroke="rgba(184,151,58,0.06)" strokeWidth="0.5" strokeDasharray="2 3" />
      </g>

      {/* Empty analytics graph */}
      <g>
        <line x1="24" y1="140" x2="24" y2="110" stroke="rgba(184,151,58,0.14)" strokeWidth="0.6" />
        <line x1="24" y1="140" x2="80" y2="140" stroke="rgba(184,151,58,0.14)" strokeWidth="0.6" />
        <line className="pl-dash" x1="28" y1="136" x2="76" y2="136" stroke="rgba(200,80,60,0.22)" strokeWidth="0.7" />
        <line x1="24" y1="130" x2="80" y2="130" stroke="rgba(184,151,58,0.06)" strokeWidth="0.4" />
        <line x1="24" y1="120" x2="80" y2="120" stroke="rgba(184,151,58,0.06)" strokeWidth="0.4" />
        <text x="52" y="148" textAnchor="middle" fill="rgba(184,151,58,0.15)" fontSize="4.5" fontFamily="monospace">SIN DATOS</text>
      </g>

      {/* UTM labels — flickering */}
      <g className="pl-utm1">
        <rect x="140" y="110" width="36" height="10" rx="1.5" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" fill="rgba(184,151,58,0.02)" />
        <text x="158" y="117" textAnchor="middle" fill="rgba(184,151,58,0.16)" fontSize="4" fontFamily="monospace">utm_source=?</text>
      </g>
      <g className="pl-utm2">
        <rect x="140" y="124" width="42" height="10" rx="1.5" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" fill="rgba(184,151,58,0.02)" />
        <text x="161" y="131" textAnchor="middle" fill="rgba(184,151,58,0.16)" fontSize="4" fontFamily="monospace">utm_campaign=?</text>
      </g>
      <g className="pl-utm3">
        <rect x="148" y="138" width="34" height="10" rx="1.5" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" fill="rgba(184,151,58,0.02)" />
        <text x="165" y="145" textAnchor="middle" fill="rgba(184,151,58,0.16)" fontSize="4" fontFamily="monospace">utm_medium=?</text>
      </g>
    </svg>
  );
}

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function ProblemSection() {
  const { t } = useTranslation("marketing");

  const accent = "var(--mk-accent)";
  const hl = "rgba(244,240,232,0.72)";

  const problems = [
    {
      num: "01",
      illustration: <IllustrationBrochure />,
      title: t("problem.items.i0title"),
      body: (
        <>
          Inviertes millones en brochures que terminan en un PDF que{" "}
          <strong style={{ color: hl, fontWeight: 500 }}>nadie abre</strong>.{" "}
          <em style={{ color: accent }}>Sin interactividad</em>, sin inmersión,
          sin forma de medir si alguien lo leyó.
        </>
      ),
    },
    {
      num: "02",
      illustration: <IllustrationCGI />,
      title: t("problem.items.i1title"),
      body: (
        <>
          Renders, recorridos 360°, videos, interiores —{" "}
          <strong style={{ color: hl, fontWeight: 500 }}>miles de dólares</strong> en
          producción visual que terminan perdidos en carpetas que{" "}
          <em style={{ color: accent }}>nadie ve</em>.
        </>
      ),
    },
    {
      num: "03",
      illustration: <IllustrationFragmented />,
      title: t("problem.items.i2title"),
      body: (
        <>
          El comprador pregunta por una unidad y el vendedor busca en un Excel.{" "}
          <strong style={{ color: hl, fontWeight: 500 }}>5 minutos después</strong> → se
          enfría → el <em style={{ color: accent }}>momento de venta se pierde</em>.
        </>
      ),
    },
    {
      num: "04",
      illustration: <IllustrationLeads />,
      title: t("problem.items.i3title"),
      body: (
        <>
          <strong style={{ color: hl, fontWeight: 500 }}>No sabes</strong> quién vio tu
          proyecto, qué unidad le interesó ni de qué campaña llegó. Cada oportunidad
          sin capturar es <em style={{ color: accent }}>una venta que se pierde</em>.
        </>
      ),
    },
  ];

  return (
    <section className="relative z-[1] py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-20 border-t border-[var(--mk-border-rule)]">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 mb-8 lg:mb-10">
          <div>
            <div className="mk-section-label mb-4">{t("problem.label")}</div>
            <h2
              className="mk-section-heading"
              style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
            >
              {t("problem.headingLine1")}{" "}
              <em>{t("problem.headingEmphasis")}</em>
            </h2>
          </div>

          <div className="flex items-end">
            <p
              className="text-[13px] leading-[1.8] max-w-[480px]"
              style={{ color: "rgba(244,240,232,0.45)" }}
            >
              Las constructoras invierten{" "}
              <strong style={{ color: "rgba(244,240,232,0.68)", fontWeight: 500 }}>
                fortunas en renders, videos y brochures
              </strong>{" "}
              para vender sus proyectos. Pero toda esa producción termina{" "}
              <em style={{ color: "var(--mk-accent)", fontStyle: "italic" }}>fragmentada</em>{" "}
              en PDFs estáticos, carpetas dispersas y procesos manuales que{" "}
              <strong style={{ color: "rgba(244,240,232,0.68)", fontWeight: 500 }}>
                no convierten
              </strong>.
            </p>
          </div>
        </div>

        {/* Problem cards — 2x2 grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 relative"
          style={{ gap: "1px", background: "rgba(255,255,255,0.04)" }}
        >
          {problems.map((problem, i) => (
            <motion.div
              key={problem.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease }}
              className="relative z-[1] group p-5 sm:p-6 md:p-8"
              style={{ background: "var(--mk-bg)" }}
            >
              {/* Number watermark */}
              <div
                className="font-heading leading-none absolute top-4 left-5 sm:top-6 sm:left-8 text-[40px] sm:text-[52px]"
                style={{
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.04)",
                  letterSpacing: "-0.03em",
                }}
              >
                {problem.num}
              </div>

              {/* Large illustration */}
              <div className="mb-3 sm:mb-4 flex justify-center" style={{ minHeight: 80 }}>
                {problem.illustration}
              </div>

              {/* Title */}
              <div
                className="font-ui text-[13px] font-bold uppercase tracking-[0.08em] mb-2"
                style={{ color: "rgba(244,240,232,0.85)" }}
              >
                {problem.title}
              </div>

              {/* Body */}
              <div
                className="text-[13px] leading-[1.75]"
                style={{ color: "rgba(244,240,232,0.45)" }}
              >
                {problem.body}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}