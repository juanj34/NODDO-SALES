"use client";

import { Cookie, Shield, Eye, Settings, X, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { usePageView } from "@/hooks/usePageView";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

/* ══════════════════════════════════════════════
   BROWSER PRIVACY PANEL — Complex animated hero SVG
   Full browser wireframe with consent overlay,
   animated toggles, data flow arrows, cookie shapes
══════════════════════════════════════════════ */
function BrowserPrivacyIllustration() {
  return (
    <svg viewBox="0 0 320 180" fill="none" className="w-full" style={{ maxWidth: 420 }}>
      <defs>
        <linearGradient id="ck-browser" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(184,151,58,0.04)" />
          <stop offset="100%" stopColor="rgba(184,151,58,0.01)" />
        </linearGradient>
        <linearGradient id="ck-overlay" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(184,151,58,0.07)" />
          <stop offset="100%" stopColor="rgba(184,151,58,0.025)" />
        </linearGradient>
        <linearGradient id="ck-flow" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%" stopColor="rgba(184,151,58,0.2)" />
          <stop offset="100%" stopColor="rgba(184,151,58,0.02)" />
        </linearGradient>
      </defs>
      <style>{`
        .ck-toggle-on { animation: ck-t-on 3s ease-in-out infinite; }
        .ck-toggle-off { animation: ck-t-off 3s ease-in-out infinite 1.5s; }
        .ck-flow1 { stroke-dasharray: 5 4; animation: ck-dash 2s linear infinite; }
        .ck-flow2 { stroke-dasharray: 4 5; animation: ck-dash 2.5s linear infinite 0.4s; }
        .ck-flow3 { stroke-dasharray: 6 3; animation: ck-dash 1.8s linear infinite 0.8s; }
        .ck-cookie1 { animation: ck-float 5s ease-in-out infinite; }
        .ck-cookie2 { animation: ck-float 6s ease-in-out infinite 1s; }
        .ck-cookie3 { animation: ck-float 5.5s ease-in-out infinite 2s; }
        .ck-shield { animation: ck-shield-glow 3s ease-in-out infinite; }
        .ck-shield-ring { animation: ck-ring 3s ease-out infinite; }
        .ck-shield-ring2 { animation: ck-ring 3s ease-out infinite 1s; }
        .ck-eye-blink { animation: ck-blink 4s ease-in-out infinite; }
        .ck-packet1 { animation: ck-packet 3s linear infinite; }
        .ck-packet2 { animation: ck-packet 3s linear infinite 1s; }
        .ck-packet3 { animation: ck-packet 3s linear infinite 2s; }
        .ck-cloud1 { animation: ck-cloud-pulse 4s ease-in-out infinite; }
        .ck-cloud2 { animation: ck-cloud-pulse 4s ease-in-out infinite 1.3s; }
        .ck-cloud3 { animation: ck-cloud-pulse 4s ease-in-out infinite 2.6s; }
        .ck-cursor { animation: ck-cursor-blink 1s step-end infinite; }
        .ck-scan { stroke-dasharray: 120; stroke-dashoffset: 120; animation: ck-scan-draw 4s ease-in-out infinite; }
        .ck-dust1 { animation: ck-dust 5s ease-in-out infinite; }
        .ck-dust2 { animation: ck-dust 6s ease-in-out infinite 0.8s; }
        .ck-dust3 { animation: ck-dust 5.5s ease-in-out infinite 1.5s; }
        .ck-dust4 { animation: ck-dust 7s ease-in-out infinite 0.4s; }
        .ck-dust5 { animation: ck-dust 4.5s ease-in-out infinite 2s; }
        .ck-check { animation: ck-check-pop 2.5s ease-in-out infinite; }
        @keyframes ck-t-on { 0%,40%{transform:translateX(0)} 50%,90%{transform:translateX(10px)} 100%{transform:translateX(0)} }
        @keyframes ck-t-off { 0%,40%{transform:translateX(10px)} 50%,90%{transform:translateX(0)} 100%{transform:translateX(10px)} }
        @keyframes ck-dash { from{stroke-dashoffset:0} to{stroke-dashoffset:-12} }
        @keyframes ck-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ck-shield-glow { 0%,100%{opacity:0.1} 50%{opacity:0.3} }
        @keyframes ck-ring { 0%{r:12;opacity:0.3} 100%{r:22;opacity:0} }
        @keyframes ck-blink { 0%,35%{opacity:0.5} 40%{opacity:0} 45%,100%{opacity:0.5} }
        @keyframes ck-packet { 0%{transform:translateX(0);opacity:0} 10%{opacity:0.5} 90%{opacity:0.5} 100%{transform:translateX(55px);opacity:0} }
        @keyframes ck-cloud-pulse { 0%,100%{opacity:0.12} 50%{opacity:0.25} }
        @keyframes ck-cursor-blink { 0%,49%{opacity:0.3} 50%,100%{opacity:0} }
        @keyframes ck-scan-draw { 0%{stroke-dashoffset:120} 50%{stroke-dashoffset:0} 100%{stroke-dashoffset:-120} }
        @keyframes ck-dust { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(-8px);opacity:0.3} }
        @keyframes ck-check-pop { 0%,30%{opacity:0.15} 50%{opacity:0.6} 70%,100%{opacity:0.15} }
      `}</style>

      {/* ── BROWSER WINDOW FRAME ── */}
      <rect x="12" y="8" width="195" height="164" rx="4" stroke="rgba(184,151,58,0.15)" strokeWidth="0.7" fill="url(#ck-browser)" />
      {/* Title bar */}
      <rect x="12" y="8" width="195" height="14" rx="4" fill="rgba(184,151,58,0.035)" />
      <line x1="12" y1="22" x2="207" y2="22" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />
      {/* Traffic light dots */}
      <circle cx="22" cy="15" r="2" fill="rgba(184,151,58,0.15)" />
      <circle cx="29" cy="15" r="2" fill="rgba(184,151,58,0.1)" />
      <circle cx="36" cy="15" r="2" fill="rgba(184,151,58,0.08)" />
      {/* URL bar */}
      <rect x="46" y="11" width="100" height="8" rx="2" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
      {/* Lock icon in URL bar */}
      <rect x="50" y="13.5" width="3" height="2.5" rx="0.5" stroke="rgba(74,158,107,0.4)" strokeWidth="0.4" fill="none" />
      <path d="M50.5 13.5 L50.5 12.5 A1 1 0 0 1 52.5 12.5 L52.5 13.5" stroke="rgba(74,158,107,0.3)" strokeWidth="0.4" fill="none" />
      {/* URL text */}
      <text x="56" y="17" fill="rgba(184,151,58,0.15)" fontSize="3.5" fontFamily="monospace">noddo.io/cookies</text>

      {/* ── MINIATURE WEBSITE INSIDE BROWSER ── */}
      {/* Building silhouettes at top */}
      <rect x="22" y="28" width="12" height="22" rx="1" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
      <rect x="37" y="32" width="10" height="18" rx="1" fill="rgba(184,151,58,0.025)" stroke="rgba(184,151,58,0.05)" strokeWidth="0.3" />
      <rect x="50" y="26" width="14" height="24" rx="1" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
      {/* Windows on buildings */}
      {[22, 24, 26, 28].map((y) => (
        <g key={`w${y}`}>
          <rect x={24} y={y + 4} width="2" height="1.5" rx="0.3" fill="rgba(184,151,58,0.05)" />
          <rect x={28} y={y + 4} width="2" height="1.5" rx="0.3" fill="rgba(184,151,58,0.04)" />
        </g>
      ))}
      {/* Text lines below buildings */}
      <rect x="22" y="54" width="50" height="2" rx="0.5" fill="rgba(184,151,58,0.04)" />
      <rect x="22" y="58" width="42" height="2" rx="0.5" fill="rgba(184,151,58,0.03)" />
      <rect x="22" y="62" width="46" height="2" rx="0.5" fill="rgba(184,151,58,0.035)" />
      <rect x="22" y="68" width="38" height="2" rx="0.5" fill="rgba(184,151,58,0.025)" />
      <rect x="22" y="72" width="45" height="2" rx="0.5" fill="rgba(184,151,58,0.03)" />

      {/* ── CONSENT OVERLAY PANEL ── */}
      <rect x="75" y="42" width="125" height="115" rx="4" fill="url(#ck-overlay)" stroke="rgba(184,151,58,0.18)" strokeWidth="0.6" />
      {/* Panel title bar */}
      <rect x="75" y="42" width="125" height="12" rx="4" fill="rgba(184,151,58,0.04)" />
      <line x1="75" y1="54" x2="200" y2="54" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
      {/* Cookie icon in panel title */}
      <circle cx="84" cy="48" r="3.5" stroke="rgba(184,151,58,0.2)" strokeWidth="0.5" fill="rgba(184,151,58,0.04)" />
      <circle cx="83" cy="47" r="0.7" fill="rgba(184,151,58,0.15)" />
      <circle cx="85.5" cy="49" r="0.6" fill="rgba(184,151,58,0.12)" />
      <circle cx="83" cy="50" r="0.5" fill="rgba(184,151,58,0.1)" />
      <text x="92" y="50" fill="rgba(184,151,58,0.2)" fontSize="4" fontFamily="monospace" fontWeight="500">PREFERENCIAS DE COOKIES</text>

      {/* ── TOGGLE ROW 1 — Essential (always ON, green) ── */}
      <rect x="82" y="60" width="34" height="3" rx="0.5" fill="rgba(184,151,58,0.06)" />
      <text x="82" y="58" fill="rgba(184,151,58,0.15)" fontSize="3" fontFamily="monospace">ESENCIALES</text>
      {/* Toggle track */}
      <rect x="162" y="57" width="16" height="8" rx="4" fill="rgba(74,158,107,0.15)" stroke="rgba(74,158,107,0.3)" strokeWidth="0.5" />
      {/* Toggle knob — always right */}
      <circle cx="174" cy="61" r="3" fill="rgba(74,158,107,0.4)" />
      {/* Checkmark */}
      <path className="ck-check" d="M171 61 L173 63 L177 58" stroke="rgba(74,158,107,0.5)" strokeWidth="0.6" fill="none" strokeLinecap="round" />
      {/* Required badge */}
      <rect x="120" y="57" width="28" height="7" rx="2" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" />
      <text x="134" y="62" textAnchor="middle" fill="rgba(184,151,58,0.18)" fontSize="3" fontFamily="monospace">REQUERIDA</text>

      {/* ── TOGGLE ROW 2 — Analytics (animated ON/OFF) ── */}
      <rect x="82" y="78" width="30" height="3" rx="0.5" fill="rgba(184,151,58,0.05)" />
      <text x="82" y="76" fill="rgba(184,151,58,0.12)" fontSize="3" fontFamily="monospace">ANALYTICS</text>
      {/* Toggle track */}
      <rect x="162" y="75" width="16" height="8" rx="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" />
      {/* Animated knob */}
      <circle className="ck-toggle-on" cx="166" cy="79" r="3" fill="rgba(184,151,58,0.25)" />
      {/* Optional badge */}
      <rect x="120" y="75" width="28" height="7" rx="2" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
      <text x="134" y="80" textAnchor="middle" fill="rgba(184,151,58,0.1)" fontSize="3" fontFamily="monospace">OPCIONAL</text>

      {/* ── TOGGLE ROW 3 — Marketing (animated opposite phase) ── */}
      <rect x="82" y="96" width="32" height="3" rx="0.5" fill="rgba(184,151,58,0.05)" />
      <text x="82" y="94" fill="rgba(184,151,58,0.12)" fontSize="3" fontFamily="monospace">MARKETING</text>
      {/* Toggle track */}
      <rect x="162" y="93" width="16" height="8" rx="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" />
      {/* Animated knob — opposite phase */}
      <circle className="ck-toggle-off" cx="166" cy="97" r="3" fill="rgba(184,151,58,0.25)" />
      {/* Optional badge */}
      <rect x="120" y="93" width="28" height="7" rx="2" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
      <text x="134" y="98" textAnchor="middle" fill="rgba(184,151,58,0.1)" fontSize="3" fontFamily="monospace">OPCIONAL</text>

      {/* Panel divider */}
      <line x1="82" y1="107" x2="193" y2="107" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />

      {/* ── PANEL BUTTONS ── */}
      {/* Accept all button */}
      <rect x="82" y="112" width="50" height="10" rx="3" fill="rgba(184,151,58,0.1)" stroke="rgba(184,151,58,0.2)" strokeWidth="0.5" />
      <text x="107" y="119" textAnchor="middle" fill="rgba(184,151,58,0.3)" fontSize="3.5" fontFamily="monospace">ACEPTAR</text>
      {/* Reject optional button */}
      <rect x="138" y="112" width="50" height="10" rx="3" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
      <text x="163" y="119" textAnchor="middle" fill="rgba(184,151,58,0.15)" fontSize="3.5" fontFamily="monospace">RECHAZAR</text>

      {/* Panel description text */}
      <rect x="82" y="128" width="60" height="2" rx="0.5" fill="rgba(184,151,58,0.03)" />
      <rect x="82" y="132" width="52" height="2" rx="0.5" fill="rgba(184,151,58,0.025)" />
      <rect x="82" y="136" width="48" height="2" rx="0.5" fill="rgba(184,151,58,0.02)" />

      {/* Privacy policy link */}
      <text x="82" y="148" fill="rgba(184,151,58,0.12)" fontSize="3" fontFamily="monospace">Leer política completa →</text>
      <line x1="82" y1="149" x2="138" y2="149" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />

      {/* ── DATA FLOW ARROWS (browser to cloud nodes) ── */}
      <path className="ck-flow1" d="M207 55 Q230 50 250 45" stroke="url(#ck-flow)" strokeWidth="0.6" fill="none" />
      <path className="ck-flow2" d="M207 85 Q230 80 250 80" stroke="url(#ck-flow)" strokeWidth="0.6" fill="none" />
      <path className="ck-flow3" d="M207 115 Q230 115 250 115" stroke="url(#ck-flow)" strokeWidth="0.6" fill="none" />

      {/* Data packets traveling along flow lines */}
      <rect className="ck-packet1" x="207" y="53" width="5" height="3" rx="0.5" fill="rgba(184,151,58,0.15)" />
      <rect className="ck-packet2" x="207" y="83" width="5" height="3" rx="0.5" fill="rgba(184,151,58,0.12)" />
      <rect className="ck-packet3" x="207" y="113" width="5" height="3" rx="0.5" fill="rgba(184,151,58,0.1)" />

      {/* ── CLOUD NODES ── */}
      {/* Cloud 1 — Analytics */}
      <g className="ck-cloud1">
        <ellipse cx="265" cy="42" rx="12" ry="8" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" fill="rgba(184,151,58,0.025)" />
        <ellipse cx="260" cy="39" rx="6" ry="4" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
        <ellipse cx="270" cy="39" rx="5" ry="3.5" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
        <text x="265" y="44" textAnchor="middle" fill="rgba(184,151,58,0.12)" fontSize="3" fontFamily="monospace">GA</text>
      </g>

      {/* Cloud 2 — Meta */}
      <g className="ck-cloud2">
        <ellipse cx="265" cy="78" rx="12" ry="8" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" fill="rgba(184,151,58,0.025)" />
        <ellipse cx="260" cy="75" rx="6" ry="4" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
        <ellipse cx="270" cy="75" rx="5" ry="3.5" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
        <text x="265" y="80" textAnchor="middle" fill="rgba(184,151,58,0.12)" fontSize="3" fontFamily="monospace">META</text>
      </g>

      {/* Cloud 3 — GTM */}
      <g className="ck-cloud3">
        <ellipse cx="265" cy="114" rx="12" ry="8" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" fill="rgba(184,151,58,0.025)" />
        <ellipse cx="260" cy="111" rx="6" ry="4" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
        <ellipse cx="270" cy="111" rx="5" ry="3.5" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
        <text x="265" y="116" textAnchor="middle" fill="rgba(184,151,58,0.12)" fontSize="3" fontFamily="monospace">GTM</text>
      </g>

      {/* ── COOKIE SHAPES (floating) ── */}
      <g className="ck-cookie1">
        <circle cx="295" cy="30" r="6" stroke="rgba(184,151,58,0.18)" strokeWidth="0.5" fill="rgba(184,151,58,0.03)" />
        {/* Bite mark */}
        <circle cx="299" cy="27" r="2.5" fill="#141414" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
        {/* Chips */}
        <circle cx="293" cy="29" r="1" fill="rgba(184,151,58,0.12)" />
        <circle cx="296" cy="33" r="0.8" fill="rgba(184,151,58,0.1)" />
        <circle cx="292" cy="33" r="0.7" fill="rgba(184,151,58,0.08)" />
      </g>
      <g className="ck-cookie2">
        <circle cx="305" cy="100" r="5" stroke="rgba(184,151,58,0.14)" strokeWidth="0.4" fill="rgba(184,151,58,0.025)" />
        <circle cx="309" cy="98" r="2" fill="#141414" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
        <circle cx="303" cy="99" r="0.8" fill="rgba(184,151,58,0.1)" />
        <circle cx="306" cy="102" r="0.7" fill="rgba(184,151,58,0.08)" />
      </g>
      <g className="ck-cookie3">
        <circle cx="288" cy="155" r="4.5" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" fill="rgba(184,151,58,0.02)" />
        <circle cx="291" cy="153" r="1.8" fill="#141414" stroke="rgba(184,151,58,0.05)" strokeWidth="0.3" />
        <circle cx="286" cy="154" r="0.7" fill="rgba(184,151,58,0.08)" />
        <circle cx="288" cy="158" r="0.6" fill="rgba(184,151,58,0.06)" />
      </g>

      {/* ── SHIELD + CHECKMARK (bottom-left) ── */}
      <g className="ck-shield">
        <path d="M25 130 L38 136 L38 148 L31.5 154 L25 148 L25 136 Z" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" fill="rgba(184,151,58,0.03)" />
        <path d="M29 142 L31 144.5 L35.5 138" stroke="rgba(184,151,58,0.35)" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      </g>
      {/* Shield pulse rings */}
      <circle className="ck-shield-ring" cx="31.5" cy="143" r="12" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" fill="none" />
      <circle className="ck-shield-ring2" cx="31.5" cy="143" r="12" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" fill="none" />

      {/* ── CROSSED-OUT EYE (tracking blocked indicator) ── */}
      <g className="ck-eye-blink">
        {/* Eye outline */}
        <ellipse cx="55" cy="140" rx="7" ry="4.5" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" fill="none" />
        {/* Iris */}
        <circle cx="55" cy="140" r="2" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" fill="rgba(184,151,58,0.04)" />
        <circle cx="55" cy="140" r="0.8" fill="rgba(184,151,58,0.12)" />
        {/* Cross-out line */}
        <line x1="48" y1="136" x2="62" y2="144" stroke="rgba(184,151,58,0.2)" strokeWidth="0.6" strokeLinecap="round" />
      </g>
      <text x="55" y="150" textAnchor="middle" fill="rgba(184,151,58,0.08)" fontSize="2.5" fontFamily="monospace">BLOQUEADO</text>

      {/* ── SCANNING LINE across browser ── */}
      <line className="ck-scan" x1="14" y1="90" x2="205" y2="90" stroke="rgba(184,151,58,0.04)" strokeWidth="0.5" />

      {/* ── STATUS BAR at browser bottom ── */}
      <rect x="12" y="163" width="195" height="9" rx="2" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.05)" strokeWidth="0.3" />
      <circle cx="19" cy="167.5" r="2" fill="rgba(74,158,107,0.2)" stroke="rgba(74,158,107,0.3)" strokeWidth="0.3" />
      <text x="25" y="169.5" fill="rgba(184,151,58,0.1)" fontSize="3" fontFamily="monospace">SEGURO — 2 cookies activas</text>
      <text x="170" y="169.5" fill="rgba(184,151,58,0.08)" fontSize="3" fontFamily="monospace">HTTPS</text>

      {/* ── GOLD DUST PARTICLES ── */}
      <circle className="ck-dust1" cx="8" cy="50" r="1.3" fill="rgba(184,151,58,0.12)" />
      <circle className="ck-dust2" cx="310" cy="60" r="1" fill="rgba(184,151,58,0.08)" />
      <circle className="ck-dust3" cx="150" cy="6" r="1.5" fill="rgba(184,151,58,0.1)" />
      <circle className="ck-dust4" cx="300" cy="140" r="1" fill="rgba(184,151,58,0.06)" />
      <circle className="ck-dust5" cx="40" cy="170" r="1.2" fill="rgba(184,151,58,0.08)" />
    </svg>
  );
}

const sections = [
  { id: "que-son", title: "¿Qué son las cookies?", icon: Cookie },
  { id: "como-usamos", title: "Cómo usamos cookies", icon: Eye },
  { id: "tipos", title: "Tipos de cookies", icon: Settings },
  { id: "terceros", title: "Cookies de terceros", icon: Shield },
  { id: "control", title: "Control de cookies", icon: Settings },
  { id: "cambios", title: "Cambios a esta política", icon: Cookie },
  { id: "contacto", title: "Contacto", icon: Mail },
];

export default function CookiesPage() {
  usePageView("Cookies");
  const [activeSection, setActiveSection] = useState<string>("que-son");

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
            <Cookie className="w-5 h-5" style={{ color: "#b8973a" }} />
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
            Política de{" "}
            <em style={{ fontStyle: "italic", color: "#b8973a" }}>Cookies</em>
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
            Información sobre las cookies que utiliza NODDO, su propósito, y cómo puede
            controlarlas para proteger su privacidad.
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
            <BrowserPrivacyIllustration />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
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
              {/* 1. Qué son */}
              <motion.section
                id="que-son"
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
                    <Cookie className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      1. ¿Qué son las cookies?
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
                    Las cookies son pequeños archivos de texto que los sitios web almacenan en su
                    dispositivo (ordenador, tablet, smartphone) cuando los visita. Se utilizan
                    ampliamente para hacer que los sitios web funcionen de manera eficiente y para
                    proporcionar información a los propietarios del sitio.
                  </p>
                  <p>
                    Las cookies permiten que un sitio web reconozca su dispositivo, recuerde sus
                    preferencias, y mejore su experiencia de navegación. Sin embargo, respetamos su
                    derecho a controlar qué cookies se almacenan.
                  </p>
                </div>
              </motion.section>

              {/* 2. Cómo usamos */}
              <motion.section
                id="como-usamos"
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
                    <Eye className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      2. Cómo usamos las cookies
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
                  <p>NODDO utiliza cookies para:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Mantener su sesión activa
                      </strong>{" "}
                      — Para que no tenga que iniciar sesión cada vez que visite el panel de
                      administración
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Recordar sus preferencias
                      </strong>{" "}
                      — Idioma, zona horaria, configuración del dashboard
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Proteger contra ataques CSRF
                      </strong>{" "}
                      — Tokens de seguridad para prevenir falsificación de solicitudes
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Analizar cómo usa el Servicio
                      </strong>{" "}
                      — Para mejorar funcionalidades y detectar problemas
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Medir conversiones de marketing
                      </strong>{" "}
                      — Para optimizar campañas publicitarias y entender qué funciona
                    </li>
                  </ul>
                </div>
              </motion.section>

              {/* 3. Tipos */}
              <motion.section
                id="tipos"
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
                    <Settings className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      3. Tipos de cookies que utilizamos
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-6 text-sm leading-[1.8]"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  {/* Esenciales */}
                  <div className="glass-light p-6 rounded-xl">
                    <div className="flex items-start gap-3 mb-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: "#b8973a" }} />
                      <div>
                        <h3
                          className="font-medium mb-2"
                          style={{ color: "rgba(244,240,232,0.92)" }}
                        >
                          Cookies Esenciales (Obligatorias)
                        </h3>
                        <p className="mb-2">
                          Estas cookies son necesarias para el funcionamiento básico del sitio. No
                          se pueden desactivar.
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr
                            className="border-b"
                            style={{ borderColor: "rgba(244,240,232,0.1)" }}
                          >
                            <th className="text-left py-2 px-3" style={{ color: "rgba(244,240,232,0.92)" }}>Cookie</th>
                            <th className="text-left py-2 px-3" style={{ color: "rgba(244,240,232,0.92)" }}>Propósito</th>
                            <th className="text-left py-2 px-3" style={{ color: "rgba(244,240,232,0.92)" }}>Duración</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b" style={{ borderColor: "rgba(244,240,232,0.05)" }}>
                            <td className="py-2 px-3">sb-access-token</td>
                            <td className="py-2 px-3">Sesión de autenticación Supabase</td>
                            <td className="py-2 px-3">1 hora</td>
                          </tr>
                          <tr className="border-b" style={{ borderColor: "rgba(244,240,232,0.05)" }}>
                            <td className="py-2 px-3">sb-refresh-token</td>
                            <td className="py-2 px-3">Renovación automática de sesión</td>
                            <td className="py-2 px-3">30 días</td>
                          </tr>
                          <tr className="border-b" style={{ borderColor: "rgba(244,240,232,0.05)" }}>
                            <td className="py-2 px-3">csrf_token</td>
                            <td className="py-2 px-3">Protección contra CSRF</td>
                            <td className="py-2 px-3">Sesión</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3">noddo_prefs</td>
                            <td className="py-2 px-3">Preferencias de usuario (idioma, tema)</td>
                            <td className="py-2 px-3">1 año</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="glass-light p-6 rounded-xl">
                    <div className="flex items-start gap-3 mb-3">
                      <Eye className="w-5 h-5 mt-0.5" style={{ color: "#b8973a" }} />
                      <div>
                        <h3
                          className="font-medium mb-2"
                          style={{ color: "rgba(244,240,232,0.92)" }}
                        >
                          Cookies de Analytics (Opcionales)
                        </h3>
                        <p className="mb-2">
                          Nos ayudan a entender cómo los visitantes usan el sitio para mejorar la
                          experiencia.
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b" style={{ borderColor: "rgba(244,240,232,0.1)" }}>
                            <th className="text-left py-2 px-3" style={{ color: "rgba(244,240,232,0.92)" }}>Cookie</th>
                            <th className="text-left py-2 px-3" style={{ color: "rgba(244,240,232,0.92)" }}>Propósito</th>
                            <th className="text-left py-2 px-3" style={{ color: "rgba(244,240,232,0.92)" }}>Duración</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b" style={{ borderColor: "rgba(244,240,232,0.05)" }}>
                            <td className="py-2 px-3">_ga</td>
                            <td className="py-2 px-3">Google Analytics - ID de usuario único</td>
                            <td className="py-2 px-3">2 años</td>
                          </tr>
                          <tr className="border-b" style={{ borderColor: "rgba(244,240,232,0.05)" }}>
                            <td className="py-2 px-3">_ga_*</td>
                            <td className="py-2 px-3">Google Analytics - Estado de sesión</td>
                            <td className="py-2 px-3">2 años</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3">noddo_analytics</td>
                            <td className="py-2 px-3">Analytics propios (sin PII)</td>
                            <td className="py-2 px-3">1 año</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Marketing */}
                  <div className="glass-light p-6 rounded-xl">
                    <div className="flex items-start gap-3 mb-3">
                      <Shield className="w-5 h-5 mt-0.5" style={{ color: "#b8973a" }} />
                      <div>
                        <h3
                          className="font-medium mb-2"
                          style={{ color: "rgba(244,240,232,0.92)" }}
                        >
                          Cookies de Marketing (Opcionales)
                        </h3>
                        <p className="mb-2">
                          Se utilizan para rastrear conversiones y mostrar anuncios relevantes.
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b" style={{ borderColor: "rgba(244,240,232,0.1)" }}>
                            <th className="text-left py-2 px-3" style={{ color: "rgba(244,240,232,0.92)" }}>Cookie</th>
                            <th className="text-left py-2 px-3" style={{ color: "rgba(244,240,232,0.92)" }}>Propósito</th>
                            <th className="text-left py-2 px-3" style={{ color: "rgba(244,240,232,0.92)" }}>Duración</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b" style={{ borderColor: "rgba(244,240,232,0.05)" }}>
                            <td className="py-2 px-3">_fbp</td>
                            <td className="py-2 px-3">Meta Pixel - Tracking conversiones FB/IG</td>
                            <td className="py-2 px-3">3 meses</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3">_fbc</td>
                            <td className="py-2 px-3">Meta Pixel - Click ID de anuncio</td>
                            <td className="py-2 px-3">3 meses</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* 4. Terceros */}
              <motion.section
                id="terceros"
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
                      4. Cookies de terceros
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
                    Algunos servicios de terceros que utilizamos pueden colocar sus propias cookies
                    en su dispositivo:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Google Analytics
                      </strong>{" "}
                      — Análisis de tráfico web. Puede deshabilitarlo con el{" "}
                      <a
                        href="https://tools.google.com/dlpage/gaoptout"
                        className="underline"
                        style={{ color: "#b8973a" }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        complemento de exclusión de Google Analytics
                      </a>
                      .
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Meta Pixel</strong> —
                      Rastreo de conversiones de Facebook/Instagram. Configurable desde las
                      preferencias de su cuenta de Facebook.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Google Tag Manager
                      </strong>{" "}
                      — Gestión centralizada de tags de marketing (no almacena datos por sí mismo).
                    </li>
                  </ul>
                  <p className="pt-3">
                    Estas cookies de terceros están sujetas a las políticas de privacidad de sus
                    respectivos proveedores. NODDO no tiene control sobre estas cookies.
                  </p>
                </div>
              </motion.section>

              {/* 5. Control */}
              <motion.section
                id="control"
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
                    <Settings className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      5. Cómo controlar las cookies
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
                  <p>Usted tiene el control total sobre las cookies que se almacenan:</p>

                  <div className="space-y-3">
                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        1. Configuración del navegador
                      </h3>
                      <p>
                        Todos los navegadores modernos permiten controlar cookies. Puede bloquear
                        todas las cookies, aceptar solo las de sitios confiables, o eliminar las
                        existentes. Consulte la ayuda de su navegador:
                      </p>
                      <ul className="list-disc pl-6 mt-1 space-y-1">
                        <li>
                          <a href="https://support.google.com/chrome/answer/95647" className="underline" style={{ color: "#b8973a" }} target="_blank" rel="noopener noreferrer">Google Chrome</a>
                        </li>
                        <li>
                          <a href="https://support.mozilla.org/es/kb/impedir-que-los-sitios-web-guarden-sus-preferencia" className="underline" style={{ color: "#b8973a" }} target="_blank" rel="noopener noreferrer">Mozilla Firefox</a>
                        </li>
                        <li>
                          <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" className="underline" style={{ color: "#b8973a" }} target="_blank" rel="noopener noreferrer">Safari</a>
                        </li>
                        <li>
                          <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="underline" style={{ color: "#b8973a" }} target="_blank" rel="noopener noreferrer">Microsoft Edge</a>
                        </li>
                      </ul>
                    </div>

                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        2. Herramientas de privacidad
                      </h3>
                      <p>
                        Puede usar extensiones de navegador como Privacy Badger, uBlock Origin, o
                        Ghostery para bloquear cookies de rastreo automáticamente.
                      </p>
                    </div>

                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        3. Do Not Track (DNT)
                      </h3>
                      <p>
                        Si activa la señal &quot;Do Not Track&quot; en su navegador, respetaremos esa
                        preferencia y no cargaremos cookies de analytics ni marketing (solo las
                        esenciales).
                      </p>
                    </div>
                  </div>

                  <div
                    className="mt-6 p-4 rounded-lg"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.08)" }}
                  >
                    <div className="flex items-start gap-3">
                      <X
                        className="w-5 h-5 mt-0.5 shrink-0"
                        style={{ color: "rgba(244,240,232,0.55)" }}
                      />
                      <p>
                        <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                          Importante:
                        </strong>{" "}
                        Si bloquea las cookies esenciales, algunas funcionalidades del Servicio no
                        funcionarán correctamente. No podrá mantener su sesión activa ni guardar
                        preferencias.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* 6. Cambios */}
              <motion.section
                id="cambios"
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
                    <Cookie className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      6. Cambios a esta política
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
                    Podemos actualizar esta Política de Cookies periódicamente para reflejar cambios
                    en las cookies que utilizamos o por razones operacionales, legales, o
                    regulatorias.
                  </p>
                  <p>
                    Le recomendamos revisar esta página ocasionalmente para estar informado sobre
                    cómo usamos las cookies. La fecha de &quot;Última actualización&quot; al inicio del
                    documento indica cuándo fue modificada por última vez.
                  </p>
                </div>
              </motion.section>

              {/* 7. Contacto */}
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
                      7. Contacto
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
                    Si tiene preguntas sobre esta Política de Cookies o cómo usamos las cookies,
                    contáctenos en:
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
                  </div>
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
              ¿Preguntas sobre cookies? Estamos aquí para ayudar.
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
