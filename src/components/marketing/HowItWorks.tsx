"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useBooking } from "./BookingProvider";
import { useTranslation } from "@/i18n";

/* ── Step 01: Dashboard / Upload panel ── */
function IllustrationUpload() {
  return (
    <svg viewBox="0 0 220 150" fill="none" width="220" height="150">
      <style>{`
        .hiw-u-arrow { animation: hiw-u-bob 2.5s ease-in-out infinite; }
        .hiw-u-cursor { animation: hiw-u-blink 1s step-end infinite; }
        .hiw-u-progress { animation: hiw-u-pulse 3s ease-in-out infinite; }
        .hiw-u-img1 { animation: hiw-u-breathe 4s ease-in-out infinite; }
        .hiw-u-img2 { animation: hiw-u-breathe 4s ease-in-out 1s infinite; }
        .hiw-u-thumb1 { animation: hiw-u-breathe 4s ease-in-out 0.2s infinite; }
        .hiw-u-thumb2 { animation: hiw-u-breathe 4s ease-in-out 0.5s infinite; }
        .hiw-u-thumb3 { animation: hiw-u-breathe 4s ease-in-out 0.8s infinite; }
        .hiw-u-type1 { stroke-dasharray: 44; animation: hiw-u-draw1 6s ease-out both infinite; }
        .hiw-u-type2 { stroke-dasharray: 28; animation: hiw-u-draw2 6s ease-out both infinite; }
        .hiw-u-type3 { stroke-dasharray: 64; animation: hiw-u-draw3 6s ease-out both infinite; }
        .hiw-u-type4 { stroke-dasharray: 50; animation: hiw-u-draw4 6s ease-out both infinite; }
        @keyframes hiw-u-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        @keyframes hiw-u-blink { 0%,49% { opacity: 0.7 } 50%,100% { opacity: 0 } }
        @keyframes hiw-u-pulse { 0%,100% { opacity: 0.15 } 50% { opacity: 0.35 } }
        @keyframes hiw-u-breathe { 0%,100% { opacity: 0.25 } 50% { opacity: 0.5 } }
        @keyframes hiw-u-draw1 { 0%,8% { stroke-dashoffset: 44 } 25%,100% { stroke-dashoffset: 0 } }
        @keyframes hiw-u-draw2 { 0%,16% { stroke-dashoffset: 28 } 38%,100% { stroke-dashoffset: 0 } }
        @keyframes hiw-u-draw3 { 0%,25% { stroke-dashoffset: 64 } 50%,100% { stroke-dashoffset: 0 } }
        @keyframes hiw-u-draw4 { 0%,33% { stroke-dashoffset: 50 } 55%,100% { stroke-dashoffset: 0 } }
      `}</style>

      {/* Panel frame */}
      <rect x="10" y="10" width="200" height="130" rx="4" stroke="#b8973a" strokeWidth="0.8" opacity="0.4" />
      {/* Title bar */}
      <line x1="10" y1="30" x2="210" y2="30" stroke="#b8973a" strokeWidth="0.5" opacity="0.25" />
      {/* 3 dots */}
      <circle cx="22" cy="20" r="2" fill="rgba(184,151,58,0.3)" />
      <circle cx="30" cy="20" r="2" fill="rgba(184,151,58,0.2)" />
      <circle cx="38" cy="20" r="2" fill="rgba(184,151,58,0.15)" />

      {/* Project name field */}
      <rect x="22" y="40" width="80" height="8" rx="1.5" stroke="#b8973a" strokeWidth="0.5" opacity="0.3" />
      <line className="hiw-u-type1" x1="26" y1="44" x2="70" y2="44" stroke="#b8973a" strokeWidth="0.8" opacity="0.5" />
      {/* Blinking cursor */}
      <line className="hiw-u-cursor" x1="71" y1="41" x2="71" y2="47" stroke="#b8973a" strokeWidth="0.6" />

      {/* Location field with pin */}
      <rect x="22" y="56" width="80" height="8" rx="1.5" stroke="#b8973a" strokeWidth="0.5" opacity="0.3" />
      <circle cx="28" cy="60" r="2" stroke="#b8973a" strokeWidth="0.5" opacity="0.5" />
      <line className="hiw-u-type2" x1="34" y1="60" x2="62" y2="60" stroke="#b8973a" strokeWidth="0.6" opacity="0.4" />

      {/* Description field */}
      <rect x="22" y="72" width="80" height="18" rx="1.5" stroke="#b8973a" strokeWidth="0.5" opacity="0.25" />
      <line className="hiw-u-type3" x1="26" y1="78" x2="90" y2="78" stroke="#b8973a" strokeWidth="0.4" opacity="0.25" />
      <line className="hiw-u-type4" x1="26" y1="83" x2="76" y2="83" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />

      {/* Right: image placeholders (renders) */}
      <rect className="hiw-u-img1" x="116" y="40" width="40" height="28" rx="2" stroke="#b8973a" strokeWidth="0.6" opacity="0.35" />
      <path d="M122 62 L130 54 L136 58 L142 50 L150 62" stroke="#b8973a" strokeWidth="0.5" opacity="0.3" />
      <circle cx="126" cy="50" r="2" stroke="#b8973a" strokeWidth="0.4" opacity="0.3" />

      <rect className="hiw-u-img2" x="162" y="40" width="40" height="28" rx="2" stroke="#b8973a" strokeWidth="0.6" opacity="0.35" />
      <line x1="170" y1="48" x2="194" y2="48" stroke="#b8973a" strokeWidth="0.3" opacity="0.25" />
      <line x1="170" y1="54" x2="194" y2="54" stroke="#b8973a" strokeWidth="0.3" opacity="0.25" />
      <line x1="182" y1="44" x2="182" y2="64" stroke="#b8973a" strokeWidth="0.3" opacity="0.25" />

      {/* Small thumbnail row */}
      <rect className="hiw-u-thumb1" x="116" y="74" width="26" height="16" rx="1.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.25" />
      <rect className="hiw-u-thumb2" x="146" y="74" width="26" height="16" rx="1.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.25" />
      <rect className="hiw-u-thumb3" x="176" y="74" width="26" height="16" rx="1.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.25" />

      {/* Progress bar */}
      <rect x="22" y="106" width="180" height="5" rx="2.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />
      <rect className="hiw-u-progress" x="22" y="106" width="120" height="5" rx="2.5" fill="rgba(184,151,58,0.2)" />

      {/* Upload arrow — bobs up/down */}
      <g className="hiw-u-arrow">
        <path d="M110 118 L110 128" stroke="#b8973a" strokeWidth="0.8" opacity="0.4" />
        <path d="M106 122 L110 118 L114 122" stroke="#b8973a" strokeWidth="0.8" opacity="0.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ── Step 02: Building facade with unit grid ── */
function IllustrationGrid() {
  const units = [
    // col 0 (left face)
    { x: 34, y: 30, c: "#4a9e6b" }, { x: 34, y: 46, c: "#4a9e6b" }, { x: 34, y: 62, c: "#c4853a" },
    { x: 34, y: 78, c: "#4a9e6b" }, { x: 34, y: 94, c: "#666" },
    { x: 54, y: 30, c: "#4a9e6b" }, { x: 54, y: 46, c: "#c4853a" }, { x: 54, y: 62, c: "#4a9e6b" },
    { x: 54, y: 78, c: "#666" }, { x: 54, y: 94, c: "#4a9e6b" },
    { x: 74, y: 30, c: "#666" }, { x: 74, y: 46, c: "#4a9e6b" }, { x: 74, y: 62, c: "#4a9e6b" },
    { x: 74, y: 78, c: "#4a9e6b" }, { x: 74, y: 94, c: "#c4853a" },
    // col 1 (right face)
    { x: 108, y: 30, c: "#4a9e6b" }, { x: 108, y: 46, c: "#4a9e6b" }, { x: 108, y: 62, c: "#4a9e6b" },
    { x: 108, y: 78, c: "#c4853a" }, { x: 108, y: 94, c: "#4a9e6b" },
    { x: 128, y: 30, c: "#c4853a" }, { x: 128, y: 46, c: "#4a9e6b" }, { x: 128, y: 62, c: "#666" },
    { x: 128, y: 78, c: "#4a9e6b" }, { x: 128, y: 94, c: "#4a9e6b" },
    { x: 148, y: 30, c: "#4a9e6b" }, { x: 148, y: 46, c: "#666" }, { x: 148, y: 62, c: "#4a9e6b" },
    { x: 148, y: 78, c: "#4a9e6b" }, { x: 148, y: 94, c: "#c4853a" },
  ];

  return (
    <svg viewBox="0 0 220 150" fill="none" width="220" height="150">
      <style>{`
        .hiw-g-ring { transform-box: fill-box; transform-origin: center; animation: hiw-g-pulse 2.5s ease-in-out infinite; }
        .hiw-g-glow { animation: hiw-g-glow-pulse 2.5s ease-in-out infinite; }
        .hiw-g-connector { stroke-dasharray: 3 2; animation: hiw-g-dash 1.5s linear infinite; }
        .hiw-g-tooltip { animation: hiw-g-float 3.5s ease-in-out infinite; }
        .hiw-g-cycle { animation: hiw-g-color-cycle 6s ease-in-out infinite; }
        .hiw-g-sold { animation: hiw-g-sold-blink 4s ease-in-out 1s infinite; }
        @keyframes hiw-g-pulse { 0%,100% { opacity: 0.4; transform: scale(1) } 50% { opacity: 0.85; transform: scale(1.12) } }
        @keyframes hiw-g-glow-pulse { 0%,100% { opacity: 0 } 50% { opacity: 0.25 } }
        @keyframes hiw-g-dash { from { stroke-dashoffset: 10 } to { stroke-dashoffset: 0 } }
        @keyframes hiw-g-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
        @keyframes hiw-g-color-cycle { 0%,28% { fill: #4a9e6b } 33%,61% { fill: #c4853a } 66%,94% { fill: #666 } 97%,100% { fill: #4a9e6b } }
        @keyframes hiw-g-sold-blink { 0%,100% { opacity: 0.7 } 50% { opacity: 0.35 } }
      `}</style>

      {/* Building outline */}
      <polygon points="24,20 94,10 94,120 24,130" stroke="#b8973a" strokeWidth="0.8" opacity="0.3" fill="none" />
      <polygon points="94,10 168,20 168,130 94,120" stroke="#b8973a" strokeWidth="0.7" opacity="0.25" fill="none" />
      <line x1="94" y1="10" x2="94" y2="120" stroke="#b8973a" strokeWidth="1.2" opacity="0.5" />
      <line x1="24" y1="20" x2="94" y2="10" stroke="#b8973a" strokeWidth="0.8" opacity="0.4" />
      <line x1="94" y1="10" x2="168" y2="20" stroke="#b8973a" strokeWidth="0.7" opacity="0.35" />

      {/* Floor lines */}
      {[0, 1, 2, 3, 4].map(i => (
        <line key={`fl${i}`} x1="24" y1={42 + i * 16} x2="94" y2={32 + i * 16} stroke="#b8973a" strokeWidth="0.3" opacity="0.15" />
      ))}
      {[0, 1, 2, 3, 4].map(i => (
        <line key={`fr${i}`} x1="94" y1={32 + i * 16} x2="168" y2={42 + i * 16} stroke="#b8973a" strokeWidth="0.3" opacity="0.12" />
      ))}

      {/* Unit dots */}
      {units.map((u, i) => (
        i === 12
          ? <circle key={i} className="hiw-g-cycle" cx={u.x} cy={u.y} r="4" fill={u.c} opacity="0.7" />
          : i === 4 || i === 8 || i === 10 || i === 22
            ? <circle key={i} className="hiw-g-sold" cx={u.x} cy={u.y} r="4" fill={u.c} opacity="0.7" />
            : <circle key={i} cx={u.x} cy={u.y} r="4" fill={u.c} opacity="0.7" />
      ))}

      {/* Glow behind selected unit */}
      <circle className="hiw-g-glow" cx="74" cy="62" r="12" fill="rgba(184,151,58,0.15)" />
      {/* Selection ring — pulses */}
      <circle className="hiw-g-ring" cx="74" cy="62" r="7" stroke="#b8973a" strokeWidth="1" fill="none" />
      <line x1="79" y1="67" x2="86" y2="74" stroke="#b8973a" strokeWidth="0.8" opacity="0.5" />

      {/* Floating tooltip */}
      <g className="hiw-g-tooltip">
        <rect x="150" y="55" width="62" height="34" rx="2" fill="rgba(20,20,20,0.9)" stroke="#b8973a" strokeWidth="0.6" opacity="0.6" />
        <line x1="156" y1="64" x2="200" y2="64" stroke="#b8973a" strokeWidth="0.5" opacity="0.4" />
        <line x1="156" y1="72" x2="190" y2="72" stroke="rgba(244,240,232,0.15)" strokeWidth="0.4" />
        <line x1="156" y1="78" x2="180" y2="78" stroke="rgba(244,240,232,0.1)" strokeWidth="0.4" />
      </g>

      {/* Connector — flowing dashes */}
      <line className="hiw-g-connector" x1="81" y1="62" x2="150" y2="68" stroke="#b8973a" strokeWidth="0.4" opacity="0.3" />

      {/* Legend */}
      <circle cx="38" cy="142" r="3" fill="#4a9e6b" opacity="0.7" />
      <circle cx="80" cy="142" r="3" fill="#c4853a" opacity="0.7" />
      <circle cx="122" cy="142" r="3" fill="#666" opacity="0.7" />
    </svg>
  );
}

/* ── Step 03: Browser with live microsite + share ── */
function IllustrationShare() {
  return (
    <svg viewBox="0 0 220 150" fill="none" width="220" height="150">
      <style>{`
        .hiw-s-node { animation: hiw-s-pulse 2.5s ease-in-out infinite; }
        .hiw-s-glow { animation: hiw-s-glow-pulse 2.5s ease-in-out infinite; }
        .hiw-s-ring { animation: hiw-s-ring-expand 2.5s ease-out infinite; }
        .hiw-s-ray { stroke-dasharray: 3 2; animation: hiw-s-dash 1.8s linear infinite; }
        .hiw-s-ep1 { transform-box: fill-box; transform-origin: center; animation: hiw-s-ep-pulse 3s ease-in-out infinite; }
        .hiw-s-ep2 { transform-box: fill-box; transform-origin: center; animation: hiw-s-ep-pulse 3s ease-in-out 0.75s infinite; }
        .hiw-s-ep3 { transform-box: fill-box; transform-origin: center; animation: hiw-s-ep-pulse 3s ease-in-out 1.5s infinite; }
        .hiw-s-ep4 { transform-box: fill-box; transform-origin: center; animation: hiw-s-ep-pulse 3s ease-in-out 2.25s infinite; }
        .hiw-s-url { animation: hiw-s-shimmer 4s ease-in-out infinite; }
        .hiw-s-live { animation: hiw-s-live-dot 1.5s ease-in-out infinite; }
        @keyframes hiw-s-pulse { 0%,100% { opacity: 0.5 } 50% { opacity: 0.9 } }
        @keyframes hiw-s-glow-pulse { 0%,100% { opacity: 0 } 50% { opacity: 0.3 } }
        @keyframes hiw-s-ring-expand { 0% { opacity: 0.4; r: 5 } 100% { opacity: 0; r: 16 } }
        @keyframes hiw-s-dash { from { stroke-dashoffset: 10 } to { stroke-dashoffset: 0 } }
        @keyframes hiw-s-ep-pulse { 0%,100% { opacity: 0.2; transform: scale(1) } 50% { opacity: 0.85; transform: scale(1.35) } }
        @keyframes hiw-s-shimmer { 0%,100% { opacity: 0.25 } 50% { opacity: 0.5 } }
        @keyframes hiw-s-live-dot { 0%,100% { opacity: 0.3 } 50% { opacity: 0.9 } }
      `}</style>

      {/* Browser frame */}
      <rect x="10" y="10" width="200" height="130" rx="4" stroke="#b8973a" strokeWidth="0.8" opacity="0.4" />
      <line x1="10" y1="28" x2="210" y2="28" stroke="#b8973a" strokeWidth="0.5" opacity="0.25" />
      {/* Browser dots */}
      <circle cx="22" cy="19" r="2" fill="rgba(184,151,58,0.3)" />
      <circle cx="30" cy="19" r="2" fill="rgba(184,151,58,0.2)" />
      <circle cx="38" cy="19" r="2" fill="rgba(184,151,58,0.15)" />
      {/* URL bar with shimmer */}
      <rect className="hiw-s-url" x="50" y="15" width="110" height="8" rx="4" stroke="#b8973a" strokeWidth="0.4" opacity="0.25" />
      <line x1="56" y1="19" x2="130" y2="19" stroke="#b8973a" strokeWidth="0.5" opacity="0.35" />
      {/* Live indicator dot */}
      <circle className="hiw-s-live" cx="167" cy="19" r="1.5" fill="#4a9e6b" />

      {/* Hero image area */}
      <rect x="18" y="34" width="184" height="40" rx="1" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />
      <rect x="18" y="54" width="184" height="20" fill="rgba(184,151,58,0.06)" />
      <line x1="26" y1="62" x2="90" y2="62" stroke="#b8973a" strokeWidth="0.8" opacity="0.4" />
      <line x1="26" y1="68" x2="70" y2="68" stroke="#b8973a" strokeWidth="0.5" opacity="0.25" />

      {/* Mini building silhouette */}
      <rect x="150" y="38" width="16" height="32" stroke="#b8973a" strokeWidth="0.4" opacity="0.15" />
      <rect x="168" y="44" width="12" height="26" stroke="#b8973a" strokeWidth="0.3" opacity="0.12" />
      <rect x="138" y="48" width="10" height="22" stroke="#b8973a" strokeWidth="0.3" opacity="0.1" />

      {/* Content cards */}
      <rect x="18" y="80" width="56" height="30" rx="1.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />
      <rect x="80" y="80" width="56" height="30" rx="1.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />
      <rect x="142" y="80" width="56" height="30" rx="1.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />
      <line x1="24" y1="92" x2="60" y2="92" stroke="#b8973a" strokeWidth="0.3" opacity="0.15" />
      <line x1="24" y1="97" x2="50" y2="97" stroke="#b8973a" strokeWidth="0.3" opacity="0.1" />
      <line x1="86" y1="92" x2="122" y2="92" stroke="#b8973a" strokeWidth="0.3" opacity="0.15" />
      <line x1="86" y1="97" x2="110" y2="97" stroke="#b8973a" strokeWidth="0.3" opacity="0.1" />
      <line x1="148" y1="92" x2="184" y2="92" stroke="#b8973a" strokeWidth="0.3" opacity="0.15" />
      <line x1="148" y1="97" x2="174" y2="97" stroke="#b8973a" strokeWidth="0.3" opacity="0.1" />

      {/* ── Share / radiating connections ── */}
      {/* Expanding ring from share node */}
      <circle className="hiw-s-ring" cx="110" cy="126" r="5" stroke="#b8973a" strokeWidth="0.6" fill="none" />
      {/* Static glow halo */}
      <circle className="hiw-s-glow" cx="110" cy="126" r="12" fill="rgba(184,151,58,0.15)" />

      {/* Central share node */}
      <circle className="hiw-s-node" cx="110" cy="126" r="5" stroke="#b8973a" strokeWidth="0.8" fill="rgba(184,151,58,0.08)" />
      {/* Link icon inside */}
      <path d="M107 126 L113 126" stroke="#b8973a" strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
      <path d="M108 124 C106 124 105 125 105 126 C105 127 106 128 108 128" stroke="#b8973a" strokeWidth="0.6" opacity="0.4" fill="none" />
      <path d="M112 124 C114 124 115 125 115 126 C115 127 114 128 112 128" stroke="#b8973a" strokeWidth="0.6" opacity="0.4" fill="none" />

      {/* Radiating lines — flowing dashes */}
      <line className="hiw-s-ray" x1="105" y1="124" x2="60" y2="118" stroke="#b8973a" strokeWidth="0.4" opacity="0.3" />
      <line className="hiw-s-ray" x1="115" y1="124" x2="160" y2="118" stroke="#b8973a" strokeWidth="0.4" opacity="0.3" />
      <line className="hiw-s-ray" x1="105" y1="128" x2="70" y2="138" stroke="#b8973a" strokeWidth="0.4" opacity="0.3" />
      <line className="hiw-s-ray" x1="115" y1="128" x2="150" y2="138" stroke="#b8973a" strokeWidth="0.4" opacity="0.3" />

      {/* Channel endpoints — sequential pulse */}
      <circle className="hiw-s-ep1" cx="58" cy="117" r="3" stroke="#b8973a" strokeWidth="0.5" fill="rgba(184,151,58,0.1)" />
      <circle className="hiw-s-ep2" cx="162" cy="117" r="3" stroke="#b8973a" strokeWidth="0.5" fill="rgba(184,151,58,0.1)" />
      <circle className="hiw-s-ep3" cx="68" cy="139" r="3" stroke="#b8973a" strokeWidth="0.5" fill="rgba(184,151,58,0.1)" />
      <circle className="hiw-s-ep4" cx="152" cy="139" r="3" stroke="#b8973a" strokeWidth="0.5" fill="rgba(184,151,58,0.1)" />
    </svg>
  );
}

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function HowItWorks() {
  const { openBooking } = useBooking();
  const { t } = useTranslation("marketing");

  const steps = [
    {
      num: "01",
      illustration: <IllustrationUpload />,
      title: t("howItWorks.steps.s0title"),
      body: t("howItWorks.steps.s0body"),
      tag: t("howItWorks.steps.s0tag"),
    },
    {
      num: "02",
      illustration: <IllustrationGrid />,
      title: t("howItWorks.steps.s1title"),
      body: t("howItWorks.steps.s1body"),
      tag: t("howItWorks.steps.s1tag"),
    },
    {
      num: "03",
      illustration: <IllustrationShare />,
      title: t("howItWorks.steps.s2title"),
      body: t("howItWorks.steps.s2body"),
      tag: t("howItWorks.steps.s2tag"),
    },
  ];

  return (
    <section className="relative z-[1] py-28 lg:py-40 px-6 lg:px-20 border-t border-[var(--mk-border-rule)]">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="mk-section-label mb-6">{t("howItWorks.label")}</div>

        <h2 className="mk-section-heading mb-16">
          {t("howItWorks.heading")} <em>{t("howItWorks.headingEmphasis")}</em>
        </h2>

        <div
          className="grid grid-cols-1 md:grid-cols-3 relative"
          style={{ gap: "1px", background: "rgba(255,255,255,0.04)" }}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.15, ease }}
              className="relative z-[1]"
              style={{ padding: "44px 36px", background: "var(--mk-bg)" }}
            >
              {/* Number — watermark */}
              <div
                className="absolute font-heading leading-none select-none"
                style={{ top: 28, right: 28, fontSize: 72, fontWeight: 300, color: "rgba(184,151,58,0.08)", letterSpacing: "-0.03em" }}
              >
                {step.num}
              </div>

              {/* Illustration */}
              <div className="mb-6" style={{ opacity: 0.85 }}>
                {step.illustration}
              </div>

              {/* Title */}
              <div className="font-ui text-[14px] font-bold uppercase tracking-[0.08em] mb-3" style={{ color: "var(--mk-text-primary)" }}>
                {step.title}
              </div>

              {/* Body */}
              <div className="text-[14px] leading-[1.8]" style={{ color: "rgba(244,240,232,0.55)" }}>
                {step.body}
              </div>

              {/* Tag */}
              <span
                className="inline-block mt-5 font-ui text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: "var(--mk-accent)",
                  padding: "5px 12px",
                  border: "1px solid rgba(184,151,58,0.3)",
                }}
              >
                {step.tag}
              </span>
            </motion.div>
          ))}
        </div>

        {/* CTA after steps */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.3, ease }}
          className="text-center mt-20"
        >
          <p
            className="font-heading text-[24px] font-light leading-[1.4] mb-8"
            style={{ color: "rgba(244,240,232,0.7)" }}
          >
            {t("howItWorks.ctaQuestion")} <span style={{ color: "var(--mk-accent-light)", fontStyle: "italic" }}>{t("howItWorks.ctaEmphasis")}</span>?
          </p>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              {/* Pulsing glow ring */}
              <div
                className="absolute inset-0 rounded-[12px]"
                style={{
                  background: "transparent",
                  boxShadow: "0 0 0 0 rgba(184,151,58,0.7)",
                  animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
              <button
                onClick={openBooking}
                className="btn-mk-primary inline-flex items-center gap-2.5 whitespace-nowrap relative z-[1]"
                style={{ fontSize: 13, padding: "14px 32px" }}
              >
                {t("howItWorks.ctaBookCall")}
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-[12px]" style={{ color: "rgba(244,240,232,0.35)" }}>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--mk-accent)" }}>✓</span>
              {t("howItWorks.trustNoCode")}
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--mk-accent)" }}>✓</span>
              {t("howItWorks.trustNoAgency")}
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--mk-accent)" }}>✓</span>
              {t("howItWorks.trustNoWait")}
            </div>
          </div>
        </motion.div>

        <style jsx>{`
          @keyframes pulse-ring {
            0% {
              box-shadow: 0 0 0 0 rgba(184,151,58,0.7);
            }
            50% {
              box-shadow: 0 0 0 10px rgba(184,151,58,0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(184,151,58,0);
            }
          }
        `}</style>
      </div>
    </section>
  );
}
