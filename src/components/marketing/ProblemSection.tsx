"use client";

import { motion } from "framer-motion";

/* ── Large SVG illustrations ── */

/** Brochure estático — PDF pages stacked, gathering dust, with "unread" red X overlay */
function IllustrationBrochure() {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full" style={{ maxWidth: 220 }}>
      <defs>
        <linearGradient id="pb-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(244,240,232,0.06)" />
          <stop offset="100%" stopColor="rgba(244,240,232,0.01)" />
        </linearGradient>
      </defs>

      {/* Back pages (stacked offset) */}
      <rect x="48" y="10" width="96" height="124" rx="2" fill="rgba(244,240,232,0.015)" stroke="rgba(244,240,232,0.08)" strokeWidth="0.6" />
      <rect x="42" y="14" width="96" height="124" rx="2" fill="rgba(244,240,232,0.02)" stroke="rgba(244,240,232,0.1)" strokeWidth="0.6" />

      {/* Main page */}
      <rect x="36" y="18" width="96" height="124" rx="2" fill="url(#pb-page)" stroke="rgba(244,240,232,0.2)" strokeWidth="0.8" />
      {/* Folded corner */}
      <path d="M116 18 L132 18 L132 34 Z" fill="rgba(244,240,232,0.03)" stroke="rgba(244,240,232,0.12)" strokeWidth="0.5" />
      <path d="M116 18 L116 34 L132 34" stroke="rgba(244,240,232,0.15)" strokeWidth="0.5" fill="none" />

      {/* Title block */}
      <rect x="48" y="32" width="56" height="4" rx="1" fill="rgba(244,240,232,0.12)" />
      <rect x="48" y="40" width="40" height="3" rx="1" fill="rgba(244,240,232,0.07)" />

      {/* Image placeholder area */}
      <rect x="48" y="52" width="72" height="32" rx="1" stroke="rgba(244,240,232,0.08)" strokeWidth="0.5" fill="rgba(244,240,232,0.02)" />
      {/* Mountain landscape inside */}
      <polyline points="48,84 62,66 74,76 86,60 100,72 120,84" stroke="rgba(244,240,232,0.06)" strokeWidth="0.5" fill="none" />
      <circle cx="108" cy="62" r="4" fill="rgba(244,240,232,0.04)" />

      {/* Text lines */}
      <line x1="48" y1="94" x2="118" y2="94" stroke="rgba(244,240,232,0.08)" strokeWidth="0.6" />
      <line x1="48" y1="100" x2="110" y2="100" stroke="rgba(244,240,232,0.06)" strokeWidth="0.6" />
      <line x1="48" y1="106" x2="114" y2="106" stroke="rgba(244,240,232,0.08)" strokeWidth="0.6" />
      <line x1="48" y1="112" x2="98" y2="112" stroke="rgba(244,240,232,0.05)" strokeWidth="0.6" />
      <line x1="48" y1="118" x2="106" y2="118" stroke="rgba(244,240,232,0.06)" strokeWidth="0.6" />
      <line x1="48" y1="124" x2="80" y2="124" stroke="rgba(244,240,232,0.04)" strokeWidth="0.6" />

      {/* "PDF" badge */}
      <rect x="94" y="128" width="28" height="10" rx="1.5" fill="rgba(200,80,60,0.1)" stroke="rgba(200,80,60,0.25)" strokeWidth="0.6" />
      <text x="108" y="136" textAnchor="middle" fill="rgba(200,80,60,0.5)" fontSize="6" fontFamily="monospace">.PDF</text>

      {/* Large red X overlay — "unread / ignored" */}
      <line x1="150" y1="28" x2="196" y2="74" stroke="rgba(200,80,60,0.25)" strokeWidth="2" strokeLinecap="round" />
      <line x1="196" y1="28" x2="150" y2="74" stroke="rgba(200,80,60,0.25)" strokeWidth="2" strokeLinecap="round" />
      {/* Circle around X */}
      <circle cx="173" cy="51" r="28" stroke="rgba(200,80,60,0.15)" strokeWidth="1" fill="none" />

      {/* Dust particles — neglect */}
      <circle cx="28" cy="68" r="1.5" fill="rgba(244,240,232,0.05)" />
      <circle cx="22" cy="48" r="1" fill="rgba(244,240,232,0.04)" />
      <circle cx="16" cy="88" r="1.2" fill="rgba(244,240,232,0.03)" />
      <circle cx="150" cy="110" r="1.5" fill="rgba(244,240,232,0.04)" />
      <circle cx="170" cy="120" r="1" fill="rgba(244,240,232,0.03)" />
      <circle cx="190" cy="98" r="1.3" fill="rgba(244,240,232,0.04)" />

      {/* "0 views" indicator */}
      <rect x="152" y="90" width="48" height="18" rx="2" fill="rgba(244,240,232,0.02)" stroke="rgba(244,240,232,0.06)" strokeWidth="0.5" />
      {/* Eye icon crossed out */}
      <ellipse cx="164" cy="99" rx="4" ry="2.5" stroke="rgba(244,240,232,0.15)" strokeWidth="0.5" fill="none" />
      <circle cx="164" cy="99" r="1" fill="rgba(244,240,232,0.1)" />
      <line x1="160" y1="102" x2="168" y2="96" stroke="rgba(200,80,60,0.3)" strokeWidth="0.6" strokeLinecap="round" />
      <text x="182" y="101.5" textAnchor="middle" fill="rgba(244,240,232,0.2)" fontSize="6" fontFamily="monospace">0</text>
    </svg>
  );
}

/** CGI desperdiciado — 3D renders trapped inside folders, isometric cube + film reel */
function IllustrationCGI() {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full" style={{ maxWidth: 220 }}>
      <defs>
        <linearGradient id="pc-folder" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(244,240,232,0.05)" />
          <stop offset="100%" stopColor="rgba(244,240,232,0.015)" />
        </linearGradient>
      </defs>

      {/* Large back folder */}
      <rect x="24" y="44" width="120" height="90" rx="2" fill="url(#pc-folder)" stroke="rgba(244,240,232,0.12)" strokeWidth="0.7" />
      <path d="M24 44 L24 38 L48 38 L54 44" fill="rgba(244,240,232,0.03)" stroke="rgba(244,240,232,0.12)" strokeWidth="0.7" />

      {/* Isometric 3D cube inside folder — render asset */}
      <polygon points="80,58 108,72 108,98 80,112 52,98 52,72" stroke="rgba(244,240,232,0.18)" strokeWidth="0.7" fill="none" />
      <polygon points="80,58 108,72 80,86 52,72" stroke="rgba(244,240,232,0.14)" strokeWidth="0.5" fill="rgba(244,240,232,0.025)" />
      <line x1="80" y1="86" x2="80" y2="112" stroke="rgba(244,240,232,0.1)" strokeWidth="0.5" />
      <line x1="52" y1="72" x2="80" y2="86" stroke="rgba(244,240,232,0.08)" strokeWidth="0.5" />
      <line x1="108" y1="72" x2="80" y2="86" stroke="rgba(244,240,232,0.08)" strokeWidth="0.5" />
      {/* Grid on top face */}
      <line x1="66" y1="65" x2="94" y2="79" stroke="rgba(244,240,232,0.05)" strokeWidth="0.3" />
      <line x1="80" y1="72" x2="66" y2="79" stroke="rgba(244,240,232,0.04)" strokeWidth="0.3" />
      <line x1="80" y1="72" x2="94" y2="65" stroke="rgba(244,240,232,0.04)" strokeWidth="0.3" />

      {/* 360° rotation arc with arrow */}
      <path d="M88 55 A30 30 0 1 1 72 55" stroke="rgba(244,240,232,0.1)" strokeWidth="0.6" fill="none" strokeDasharray="2 2" />
      <polygon points="72,55 74,50 69,53" fill="rgba(244,240,232,0.12)" />

      {/* Film reel icon (video asset) */}
      <circle cx="38" cy="64" r="8" stroke="rgba(244,240,232,0.12)" strokeWidth="0.6" fill="none" />
      <circle cx="38" cy="64" r="3" stroke="rgba(244,240,232,0.08)" strokeWidth="0.4" fill="none" />
      {/* Sprocket holes */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const r = 6;
        const cx = 38 + r * Math.cos((angle * Math.PI) / 180);
        const cy = 64 + r * Math.sin((angle * Math.PI) / 180);
        return <circle key={angle} cx={cx} cy={cy} r="0.8" fill="rgba(244,240,232,0.08)" />;
      })}

      {/* Small render thumbnail — window showing building */}
      <rect x="106" y="54" width="28" height="20" rx="1" stroke="rgba(244,240,232,0.1)" strokeWidth="0.5" fill="rgba(244,240,232,0.02)" />
      <rect x="114" y="60" width="6" height="14" stroke="rgba(244,240,232,0.06)" strokeWidth="0.4" fill="none" />
      <rect x="122" y="64" width="6" height="10" stroke="rgba(244,240,232,0.06)" strokeWidth="0.4" fill="none" />

      {/* Second folder (overlapping, tilted) */}
      <g transform="translate(130,60) rotate(8)">
        <rect x="0" y="12" width="72" height="56" rx="2" fill="rgba(244,240,232,0.025)" stroke="rgba(244,240,232,0.1)" strokeWidth="0.6" />
        <path d="M0 12 L0 6 L18 6 L22 12" fill="rgba(244,240,232,0.02)" stroke="rgba(244,240,232,0.1)" strokeWidth="0.6" />
        {/* Image thumbnails inside */}
        <rect x="8" y="22" width="18" height="14" rx="1" stroke="rgba(244,240,232,0.07)" strokeWidth="0.4" fill="rgba(244,240,232,0.015)" />
        <rect x="30" y="22" width="18" height="14" rx="1" stroke="rgba(244,240,232,0.07)" strokeWidth="0.4" fill="rgba(244,240,232,0.015)" />
        <rect x="52" y="22" width="14" height="14" rx="1" stroke="rgba(244,240,232,0.05)" strokeWidth="0.4" fill="rgba(244,240,232,0.01)" />
        <rect x="8" y="42" width="18" height="14" rx="1" stroke="rgba(244,240,232,0.05)" strokeWidth="0.4" fill="rgba(244,240,232,0.01)" />
        <rect x="30" y="42" width="18" height="14" rx="1" stroke="rgba(244,240,232,0.05)" strokeWidth="0.4" fill="rgba(244,240,232,0.01)" />
      </g>

      {/* "Lost" / dust particles */}
      <circle cx="18" cy="100" r="1.2" fill="rgba(244,240,232,0.04)" />
      <circle cx="12" cy="80" r="1" fill="rgba(244,240,232,0.03)" />
      <circle cx="8" cy="56" r="0.8" fill="rgba(244,240,232,0.04)" />
      <circle cx="200" cy="48" r="1" fill="rgba(244,240,232,0.03)" />

      {/* Red "unused" stamp */}
      <rect x="56" y="118" width="56" height="16" rx="2" stroke="rgba(200,80,60,0.2)" strokeWidth="0.7" fill="rgba(200,80,60,0.04)" transform="rotate(-4,84,126)" />
      <text x="84" y="129" textAnchor="middle" fill="rgba(200,80,60,0.35)" fontSize="7" fontFamily="monospace" transform="rotate(-4,84,126)">SIN USO</text>
    </svg>
  );
}

/** Proceso fragmentado — scattered tools: Excel grid, PDF, phone, email — broken connections */
function IllustrationFragmented() {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full" style={{ maxWidth: 220 }}>
      {/* Excel spreadsheet (top-left) */}
      <g>
        <rect x="12" y="16" width="56" height="42" rx="2" stroke="rgba(244,240,232,0.18)" strokeWidth="0.7" fill="rgba(244,240,232,0.025)" />
        {/* Header row */}
        <rect x="12" y="16" width="56" height="8" rx="2" fill="rgba(244,240,232,0.04)" />
        <line x1="12" y1="24" x2="68" y2="24" stroke="rgba(244,240,232,0.1)" strokeWidth="0.4" />
        {/* Column lines */}
        <line x1="26" y1="16" x2="26" y2="58" stroke="rgba(244,240,232,0.06)" strokeWidth="0.3" />
        <line x1="40" y1="16" x2="40" y2="58" stroke="rgba(244,240,232,0.06)" strokeWidth="0.3" />
        <line x1="54" y1="16" x2="54" y2="58" stroke="rgba(244,240,232,0.06)" strokeWidth="0.3" />
        {/* Row lines */}
        <line x1="12" y1="32" x2="68" y2="32" stroke="rgba(244,240,232,0.05)" strokeWidth="0.3" />
        <line x1="12" y1="40" x2="68" y2="40" stroke="rgba(244,240,232,0.05)" strokeWidth="0.3" />
        <line x1="12" y1="48" x2="68" y2="48" stroke="rgba(244,240,232,0.05)" strokeWidth="0.3" />
        {/* Cell data */}
        <rect x="14" y="26" width="10" height="3" rx="0.5" fill="rgba(244,240,232,0.06)" />
        <rect x="28" y="26" width="8" height="3" rx="0.5" fill="rgba(244,240,232,0.05)" />
        <rect x="42" y="26" width="10" height="3" rx="0.5" fill="rgba(244,240,232,0.04)" />
        <rect x="14" y="34" width="8" height="3" rx="0.5" fill="rgba(244,240,232,0.05)" />
        <rect x="28" y="34" width="10" height="3" rx="0.5" fill="rgba(244,240,232,0.06)" />
        <rect x="42" y="42" width="8" height="3" rx="0.5" fill="rgba(244,240,232,0.04)" />
        <text x="40" y="21" textAnchor="middle" fill="rgba(244,240,232,0.15)" fontSize="4.5" fontFamily="monospace">DISPONIBILIDAD.xlsx</text>
      </g>

      {/* PDF document (top-right) */}
      <g>
        <rect x="142" y="8" width="44" height="56" rx="2" stroke="rgba(244,240,232,0.15)" strokeWidth="0.7" fill="rgba(244,240,232,0.02)" />
        <path d="M172 8 L186 8 L186 22 Z" fill="rgba(244,240,232,0.025)" stroke="rgba(244,240,232,0.1)" strokeWidth="0.4" />
        <path d="M172 8 L172 22 L186 22" fill="none" stroke="rgba(244,240,232,0.12)" strokeWidth="0.4" />
        {/* Lines */}
        <line x1="150" y1="28" x2="178" y2="28" stroke="rgba(244,240,232,0.06)" strokeWidth="0.4" />
        <line x1="150" y1="33" x2="174" y2="33" stroke="rgba(244,240,232,0.05)" strokeWidth="0.4" />
        <line x1="150" y1="38" x2="176" y2="38" stroke="rgba(244,240,232,0.06)" strokeWidth="0.4" />
        <line x1="150" y1="43" x2="168" y2="43" stroke="rgba(244,240,232,0.04)" strokeWidth="0.4" />
        <line x1="150" y1="48" x2="172" y2="48" stroke="rgba(244,240,232,0.05)" strokeWidth="0.4" />
        <line x1="150" y1="53" x2="164" y2="53" stroke="rgba(244,240,232,0.04)" strokeWidth="0.4" />
        <text x="164" y="14" textAnchor="middle" fill="rgba(244,240,232,0.1)" fontSize="3.5" fontFamily="monospace">BROCHURE.pdf</text>
      </g>

      {/* Phone / WhatsApp (bottom-left) */}
      <g>
        <rect x="20" y="88" width="32" height="52" rx="4" stroke="rgba(244,240,232,0.18)" strokeWidth="0.7" fill="rgba(244,240,232,0.025)" />
        {/* Screen area */}
        <rect x="23" y="96" width="26" height="36" rx="1" stroke="rgba(244,240,232,0.06)" strokeWidth="0.3" fill="rgba(244,240,232,0.015)" />
        {/* Chat bubbles */}
        <rect x="26" y="100" width="16" height="5" rx="1.5" fill="rgba(244,240,232,0.06)" />
        <rect x="32" y="109" width="14" height="5" rx="1.5" fill="rgba(244,240,232,0.04)" />
        <rect x="26" y="118" width="18" height="5" rx="1.5" fill="rgba(244,240,232,0.05)" />
        {/* Speaker notch */}
        <line x1="31" y1="91" x2="41" y2="91" stroke="rgba(244,240,232,0.08)" strokeWidth="0.5" strokeLinecap="round" />
      </g>

      {/* Email envelope (bottom-right) */}
      <g>
        <rect x="144" y="92" width="56" height="38" rx="2" stroke="rgba(244,240,232,0.15)" strokeWidth="0.7" fill="rgba(244,240,232,0.02)" />
        {/* Envelope flap */}
        <polyline points="144,92 172,114 200,92" stroke="rgba(244,240,232,0.12)" strokeWidth="0.5" fill="none" />
        <line x1="144" y1="130" x2="160" y2="112" stroke="rgba(244,240,232,0.06)" strokeWidth="0.4" />
        <line x1="200" y1="130" x2="184" y2="112" stroke="rgba(244,240,232,0.06)" strokeWidth="0.4" />
        {/* Unread badge */}
        <circle cx="196" cy="92" r="5" fill="rgba(200,80,60,0.2)" stroke="rgba(200,80,60,0.3)" strokeWidth="0.5" />
        <text x="196" y="94.5" textAnchor="middle" fill="rgba(200,80,60,0.5)" fontSize="5" fontFamily="monospace">3</text>
      </g>

      {/* Center chaos — broken dashed connections */}
      {/* Excel → PDF */}
      <line x1="68" y1="34" x2="142" y2="28" stroke="rgba(200,80,60,0.15)" strokeWidth="0.6" strokeDasharray="4 4" />
      {/* Excel → Phone */}
      <line x1="40" y1="58" x2="36" y2="88" stroke="rgba(200,80,60,0.12)" strokeWidth="0.6" strokeDasharray="4 4" />
      {/* PDF → Email */}
      <line x1="164" y1="64" x2="172" y2="92" stroke="rgba(200,80,60,0.12)" strokeWidth="0.6" strokeDasharray="4 4" />
      {/* Phone → Email */}
      <line x1="52" y1="114" x2="144" y2="111" stroke="rgba(200,80,60,0.1)" strokeWidth="0.6" strokeDasharray="4 4" />
      {/* Excel → Email diagonal */}
      <line x1="68" y1="50" x2="144" y2="100" stroke="rgba(200,80,60,0.08)" strokeWidth="0.5" strokeDasharray="3 5" />

      {/* Break marks on the lines — small X marks */}
      <g transform="translate(104,30)">
        <line x1="-3" y1="-3" x2="3" y2="3" stroke="rgba(200,80,60,0.3)" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="3" y1="-3" x2="-3" y2="3" stroke="rgba(200,80,60,0.3)" strokeWidth="0.8" strokeLinecap="round" />
      </g>
      <g transform="translate(38,74)">
        <line x1="-2.5" y1="-2.5" x2="2.5" y2="2.5" stroke="rgba(200,80,60,0.25)" strokeWidth="0.7" strokeLinecap="round" />
        <line x1="2.5" y1="-2.5" x2="-2.5" y2="2.5" stroke="rgba(200,80,60,0.25)" strokeWidth="0.7" strokeLinecap="round" />
      </g>
      <g transform="translate(168,78)">
        <line x1="-2.5" y1="-2.5" x2="2.5" y2="2.5" stroke="rgba(200,80,60,0.25)" strokeWidth="0.7" strokeLinecap="round" />
        <line x1="2.5" y1="-2.5" x2="-2.5" y2="2.5" stroke="rgba(200,80,60,0.25)" strokeWidth="0.7" strokeLinecap="round" />
      </g>
      <g transform="translate(98,112)">
        <line x1="-3" y1="-3" x2="3" y2="3" stroke="rgba(200,80,60,0.2)" strokeWidth="0.7" strokeLinecap="round" />
        <line x1="3" y1="-3" x2="-3" y2="3" stroke="rgba(200,80,60,0.2)" strokeWidth="0.7" strokeLinecap="round" />
      </g>

      {/* Floating question marks */}
      <text x="92" y="56" fill="rgba(244,240,232,0.08)" fontSize="14" fontFamily="serif">?</text>
      <text x="108" y="82" fill="rgba(244,240,232,0.06)" fontSize="10" fontFamily="serif">?</text>
      <text x="82" y="96" fill="rgba(244,240,232,0.05)" fontSize="8" fontFamily="serif">?</text>
    </svg>
  );
}

/** Leads sin trazabilidad — user silhouettes fading into void, broken funnel, no data lines */
function IllustrationLeads() {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full" style={{ maxWidth: 220 }}>
      <defs>
        <linearGradient id="pl-funnel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(244,240,232,0.08)" />
          <stop offset="100%" stopColor="rgba(244,240,232,0.02)" />
        </linearGradient>
      </defs>

      {/* Broken funnel (center) */}
      <path d="M72 16 L148 16 L128 62" stroke="rgba(244,240,232,0.18)" strokeWidth="0.8" fill="url(#pl-funnel)" />
      <path d="M72 16 L92 62" stroke="rgba(244,240,232,0.18)" strokeWidth="0.8" fill="none" />
      {/* Funnel bottom — broken / cracked */}
      <line x1="92" y1="62" x2="96" y2="76" stroke="rgba(244,240,232,0.15)" strokeWidth="0.7" />
      <line x1="128" y1="62" x2="124" y2="76" stroke="rgba(244,240,232,0.15)" strokeWidth="0.7" />
      {/* Crack in funnel */}
      <path d="M108 48 L112 56 L106 62 L110 70" stroke="rgba(200,80,60,0.3)" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M100 44 L96 52 L102 58" stroke="rgba(200,80,60,0.2)" strokeWidth="0.6" strokeLinecap="round" fill="none" />

      {/* User silhouettes entering funnel (top) — fading */}
      {/* Person 1 */}
      <circle cx="84" cy="8" r="3.5" stroke="rgba(244,240,232,0.2)" strokeWidth="0.6" fill="none" />
      <path d="M78 18 C78 14 80 12 84 12 C88 12 90 14 90 18" stroke="rgba(244,240,232,0.15)" strokeWidth="0.6" fill="none" />
      {/* Person 2 */}
      <circle cx="110" cy="6" r="3.5" stroke="rgba(244,240,232,0.15)" strokeWidth="0.6" fill="none" />
      <path d="M104 16 C104 12 106 10 110 10 C114 10 116 12 116 16" stroke="rgba(244,240,232,0.12)" strokeWidth="0.6" fill="none" />
      {/* Person 3 */}
      <circle cx="136" cy="8" r="3.5" stroke="rgba(244,240,232,0.12)" strokeWidth="0.6" fill="none" />
      <path d="M130 18 C130 14 132 12 136 12 C140 12 142 14 142 18" stroke="rgba(244,240,232,0.1)" strokeWidth="0.6" fill="none" />

      {/* Dripping out — leads lost as dots falling into void */}
      <circle cx="104" cy="82" r="2" fill="rgba(244,240,232,0.12)" />
      <circle cx="110" cy="92" r="1.8" fill="rgba(244,240,232,0.08)" />
      <circle cx="106" cy="102" r="1.5" fill="rgba(244,240,232,0.05)" />
      <circle cx="112" cy="110" r="1.2" fill="rgba(244,240,232,0.03)" />
      <circle cx="108" cy="118" r="1" fill="rgba(244,240,232,0.02)" />

      {/* Side: ghost user profiles — no data */}
      {/* Left ghost user card */}
      <rect x="8" y="36" width="48" height="56" rx="2" stroke="rgba(244,240,232,0.08)" strokeWidth="0.5" fill="rgba(244,240,232,0.015)" />
      <circle cx="32" cy="52" r="8" stroke="rgba(244,240,232,0.1)" strokeWidth="0.5" fill="none" />
      {/* Question mark inside avatar */}
      <text x="32" y="56" textAnchor="middle" fill="rgba(200,80,60,0.3)" fontSize="10" fontFamily="serif">?</text>
      {/* Empty data lines */}
      <line x1="16" y1="68" x2="48" y2="68" stroke="rgba(244,240,232,0.04)" strokeWidth="0.5" strokeDasharray="2 3" />
      <line x1="16" y1="74" x2="42" y2="74" stroke="rgba(244,240,232,0.03)" strokeWidth="0.5" strokeDasharray="2 3" />
      <line x1="16" y1="80" x2="44" y2="80" stroke="rgba(244,240,232,0.03)" strokeWidth="0.5" strokeDasharray="2 3" />

      {/* Right ghost user card */}
      <rect x="164" y="40" width="48" height="56" rx="2" stroke="rgba(244,240,232,0.08)" strokeWidth="0.5" fill="rgba(244,240,232,0.015)" />
      <circle cx="188" cy="56" r="8" stroke="rgba(244,240,232,0.1)" strokeWidth="0.5" fill="none" />
      <text x="188" y="60" textAnchor="middle" fill="rgba(200,80,60,0.3)" fontSize="10" fontFamily="serif">?</text>
      <line x1="172" y1="72" x2="204" y2="72" stroke="rgba(244,240,232,0.04)" strokeWidth="0.5" strokeDasharray="2 3" />
      <line x1="172" y1="78" x2="198" y2="78" stroke="rgba(244,240,232,0.03)" strokeWidth="0.5" strokeDasharray="2 3" />
      <line x1="172" y1="84" x2="200" y2="84" stroke="rgba(244,240,232,0.03)" strokeWidth="0.5" strokeDasharray="2 3" />

      {/* Empty analytics graph (bottom) */}
      <g>
        {/* Axes */}
        <line x1="24" y1="140" x2="24" y2="110" stroke="rgba(244,240,232,0.08)" strokeWidth="0.5" />
        <line x1="24" y1="140" x2="80" y2="140" stroke="rgba(244,240,232,0.08)" strokeWidth="0.5" />
        {/* Flat line — no data */}
        <line x1="28" y1="136" x2="76" y2="136" stroke="rgba(200,80,60,0.15)" strokeWidth="0.6" strokeDasharray="3 3" />
        {/* Ghost grid */}
        <line x1="24" y1="130" x2="80" y2="130" stroke="rgba(244,240,232,0.03)" strokeWidth="0.3" />
        <line x1="24" y1="120" x2="80" y2="120" stroke="rgba(244,240,232,0.03)" strokeWidth="0.3" />
        <text x="52" y="148" textAnchor="middle" fill="rgba(244,240,232,0.08)" fontSize="4" fontFamily="monospace">SIN DATOS</text>
      </g>

      {/* UTM source labels — scattered and disconnected */}
      <rect x="140" y="110" width="36" height="10" rx="1.5" stroke="rgba(244,240,232,0.06)" strokeWidth="0.4" fill="rgba(244,240,232,0.01)" />
      <text x="158" y="117" textAnchor="middle" fill="rgba(244,240,232,0.08)" fontSize="4" fontFamily="monospace">utm_source=?</text>
      <rect x="140" y="124" width="42" height="10" rx="1.5" stroke="rgba(244,240,232,0.06)" strokeWidth="0.4" fill="rgba(244,240,232,0.01)" />
      <text x="161" y="131" textAnchor="middle" fill="rgba(244,240,232,0.08)" fontSize="4" fontFamily="monospace">utm_campaign=?</text>
      <rect x="148" y="138" width="34" height="10" rx="1.5" stroke="rgba(244,240,232,0.06)" strokeWidth="0.4" fill="rgba(244,240,232,0.01)" />
      <text x="165" y="145" textAnchor="middle" fill="rgba(244,240,232,0.08)" fontSize="4" fontFamily="monospace">utm_medium=?</text>
    </svg>
  );
}

const problems = [
  {
    num: "01",
    illustration: <IllustrationBrochure />,
    title: "Brochures estáticos",
    body: "Inviertes millones en brochures que terminan en un PDF que nadie abre. Sin interactividad, sin inmersión, sin forma de medir si alguien lo leyó.",
  },
  {
    num: "02",
    illustration: <IllustrationCGI />,
    title: "CGI desperdiciado",
    body: "Renders, recorridos 360°, videos, interiores, amenidades — miles de dólares en producción visual que terminan perdidos en carpetas que nadie ve.",
  },
  {
    num: "03",
    illustration: <IllustrationFragmented />,
    title: "Proceso fragmentado",
    body: "Brochure aquí, planos allá, disponibilidad en Excel. Tu equipo comercial pierde minutos valiosos saltando entre archivos — especialmente en videollamadas.",
  },
  {
    num: "04",
    illustration: <IllustrationLeads />,
    title: "Leads sin trazabilidad",
    body: "No sabes quién vio tu proyecto, qué unidad le interesó ni de qué campaña llegó. Cada oportunidad que no capturas es una venta que se pierde.",
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function ProblemSection() {
  return (
    <section className="relative z-[1] py-28 lg:py-40 px-6 lg:px-20 border-t border-[var(--mk-border-rule)]">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 mb-16 lg:mb-20">
          <div>
            <div className="mk-section-label mb-6">El problema</div>
            <h2 className="mk-section-heading">
              Millones en producción.
              <br />
              <em>Cero interactividad.</em>
            </h2>
          </div>

          <div className="flex items-end">
            <p
              className="text-[13px] leading-[1.9] max-w-[480px]"
              style={{ color: "rgba(244,240,232,0.5)" }}
            >
              Las constructoras invierten fortunas en renders, videos y brochures
              para vender sus proyectos. Pero toda esa producción termina
              fragmentada en PDFs estáticos, carpetas dispersas y procesos
              manuales que no convierten.
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
              className="relative z-[1] group"
              style={{ padding: "48px 40px", background: "var(--mk-bg)" }}
            >
              {/* Number watermark */}
              <div
                className="font-heading leading-none absolute top-10 left-10"
                style={{
                  fontSize: 64,
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.04)",
                  letterSpacing: "-0.03em",
                }}
              >
                {problem.num}
              </div>

              {/* Large illustration */}
              <div className="mb-6" style={{ minHeight: 120 }}>
                {problem.illustration}
              </div>

              {/* Title */}
              <div
                className="font-ui text-[13px] font-bold uppercase tracking-[0.08em] mb-3"
                style={{ color: "rgba(244,240,232,0.85)" }}
              >
                {problem.title}
              </div>

              {/* Body */}
              <div
                className="text-[12px] leading-[1.8]"
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
