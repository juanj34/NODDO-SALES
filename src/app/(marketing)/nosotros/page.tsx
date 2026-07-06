"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Target, Rocket, Users, Heart, Zap, Globe, Award, TrendingUp } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

/* ─── Blueprint Construction Scene SVG ─── */
function BlueprintConstructionIllustration() {
  return (
    <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
      <svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Blueprint Construction Scene">
        <style>{`
          /* ── blueprint grid ── */
          .ns-grid{animation:ns-grid 6s ease-in-out infinite}
          @keyframes ns-grid{0%,100%{opacity:.03}50%{opacity:.06}}

          /* ── building construction breathe ── */
          .ns-build-top{animation:ns-build 4s ease-in-out infinite}
          @keyframes ns-build{0%,100%{opacity:.3}50%{opacity:.7}}
          .ns-build-mid{animation:ns-build 4s ease-in-out infinite 1s}

          /* ── crane swing ── */
          .ns-swing{animation:ns-swing 5s ease-in-out infinite;transform-origin:210px 22px}
          @keyframes ns-swing{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}

          /* ── crane block pendulum ── */
          .ns-pend{animation:ns-pend 4s ease-in-out infinite;transform-origin:240px 22px}
          @keyframes ns-pend{0%,100%{transform:translateX(-3px)}50%{transform:translateX(3px)}}

          /* ── team node pulse (sequential) ── */
          .ns-person0{animation:ns-person 3s ease-in-out infinite}
          .ns-person1{animation:ns-person 3s ease-in-out infinite .5s}
          .ns-person2{animation:ns-person 3s ease-in-out infinite 1s}
          .ns-person3{animation:ns-person 3s ease-in-out infinite 1.5s}
          .ns-person4{animation:ns-person 3s ease-in-out infinite 2s}
          @keyframes ns-person{0%,100%{opacity:.4}50%{opacity:1}}

          /* ── team connection flow ── */
          .ns-conn{stroke-dasharray:3 3;animation:ns-conn 2s linear infinite}
          @keyframes ns-conn{to{stroke-dashoffset:-12}}

          /* ── timeline progress grow ── */
          .ns-progress{animation:ns-progress 3s ease-out forwards}
          @keyframes ns-progress{from{width:0}to{width:140px}}

          /* ── timeline current pulse ── */
          .ns-current{animation:ns-current 2s ease-in-out infinite}
          @keyframes ns-current{0%,100%{opacity:.5;r:3}50%{opacity:1;r:4.5}}

          /* ── current ring ── */
          .ns-current-ring{animation:ns-current-ring 2s ease-in-out infinite}
          @keyframes ns-current-ring{0%,100%{opacity:0;r:5}50%{opacity:.3;r:8}}

          /* ── floating page drift ── */
          .ns-page1{animation:ns-page-a 8s ease-in-out infinite}
          .ns-page2{animation:ns-page-b 9s ease-in-out infinite 1.5s}
          @keyframes ns-page-a{0%,100%{opacity:.15;transform:translate(0,0) rotate(0deg)}50%{opacity:.3;transform:translate(3px,-5px) rotate(2deg)}}
          @keyframes ns-page-b{0%,100%{opacity:.1;transform:translate(0,0) rotate(0deg)}50%{opacity:.25;transform:translate(-2px,-4px) rotate(-3deg)}}

          /* ── scaffolding pulse ── */
          .ns-scaff{animation:ns-scaff 5s ease-in-out infinite}
          @keyframes ns-scaff{0%,100%{opacity:.15}50%{opacity:.3}}

          /* ── gold dust ── */
          .ns-dust1{animation:ns-dust-a 7s ease-in-out infinite}
          .ns-dust2{animation:ns-dust-a 9s ease-in-out infinite 1.5s}
          .ns-dust3{animation:ns-dust-a 8s ease-in-out infinite 3s}
          .ns-dust4{animation:ns-dust-b 10s ease-in-out infinite .8s}
          .ns-dust5{animation:ns-dust-b 7.5s ease-in-out infinite 2.2s}
          .ns-dust6{animation:ns-dust-a 11s ease-in-out infinite 4s}
          @keyframes ns-dust-a{0%,100%{opacity:0;transform:translateY(0)}25%{opacity:.45}75%{opacity:.2}50%{transform:translateY(-8px)}}
          @keyframes ns-dust-b{0%,100%{opacity:0;transform:translateY(0)}25%{opacity:.35}75%{opacity:.15}50%{transform:translateY(-10px)}}

          /* ── window appear ── */
          .ns-win0{animation:ns-win 3s ease-in-out infinite}
          .ns-win1{animation:ns-win 3s ease-in-out infinite .4s}
          .ns-win2{animation:ns-win 3s ease-in-out infinite .8s}
          .ns-win3{animation:ns-win 3s ease-in-out infinite 1.2s}
          @keyframes ns-win{0%,100%{opacity:.2}50%{opacity:.5}}

          /* ── bg glow ── */
          .ns-bg{animation:ns-bg 4s ease-in-out infinite}
          @keyframes ns-bg{0%,100%{opacity:.03}50%{opacity:.07}}
        `}</style>

        {/* Background glow */}
        <circle cx="160" cy="80" r="70" fill="rgba(184,151,58,0.04)" className="ns-bg" />

        {/* ── Blueprint grid background ── */}
        <g className="ns-grid">
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`vg-${i}`} x1={20 * i} y1="0" x2={20 * i} y2="180" stroke="rgba(184,151,58,0.03)" strokeWidth="0.3" />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`hg-${i}`} x1="0" y1={20 * i} x2="320" y2={20 * i} stroke="rgba(184,151,58,0.03)" strokeWidth="0.3" />
          ))}
        </g>

        {/* ── Isometric building ── */}
        {/* Left face */}
        <g>
          {/* Base wall */}
          <path d="M120 130 L120 50 L160 35 L160 115 Z" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.2)" strokeWidth="0.5" />

          {/* Floor lines */}
          <line x1="120" y1="60" x2="160" y2="45" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" />
          <line x1="120" y1="75" x2="160" y2="60" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" />
          <line x1="120" y1="90" x2="160" y2="75" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" />
          <line x1="120" y1="105" x2="160" y2="90" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" />
          <line x1="120" y1="120" x2="160" y2="105" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" />

          {/* Windows — completed floors (top 4) */}
          <rect x="125" y="62" width="5" height="4" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" className="ns-win0" />
          <rect x="133" y="59" width="5" height="4" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" className="ns-win1" />
          <rect x="141" y="56" width="5" height="4" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" className="ns-win2" />
          <rect x="149" y="53" width="5" height="4" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" className="ns-win3" />

          <rect x="125" y="77" width="5" height="4" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" className="ns-win1" />
          <rect x="133" y="74" width="5" height="4" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" className="ns-win2" />
          <rect x="141" y="71" width="5" height="4" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" className="ns-win3" />
          <rect x="149" y="68" width="5" height="4" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" className="ns-win0" />

          <rect x="125" y="92" width="5" height="4" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" className="ns-win2" />
          <rect x="133" y="89" width="5" height="4" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" className="ns-win3" />
          <rect x="141" y="86" width="5" height="4" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" className="ns-win0" />
          <rect x="149" y="83" width="5" height="4" fill="rgba(184,151,58,0.08)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" className="ns-win1" />

          {/* Under construction floors (bottom 2) — empty frames, breathing */}
          <rect x="125" y="107" width="5" height="4" fill="none" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" strokeDasharray="1 1" className="ns-build-top" />
          <rect x="133" y="104" width="5" height="4" fill="none" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" strokeDasharray="1 1" className="ns-build-top" />
          <rect x="141" y="101" width="5" height="4" fill="none" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" strokeDasharray="1 1" className="ns-build-mid" />

          <rect x="125" y="122" width="5" height="4" fill="none" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" strokeDasharray="1 1" className="ns-build-mid" />
          <rect x="133" y="119" width="5" height="4" fill="none" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" strokeDasharray="1 1" className="ns-build-mid" />
        </g>

        {/* Right face */}
        <g>
          <path d="M160 35 L200 50 L200 130 L160 115 Z" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" />

          {/* Floor lines */}
          <line x1="160" y1="45" x2="200" y2="60" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
          <line x1="160" y1="60" x2="200" y2="75" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
          <line x1="160" y1="75" x2="200" y2="90" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
          <line x1="160" y1="90" x2="200" y2="105" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
          <line x1="160" y1="105" x2="200" y2="120" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />

          {/* Right face windows */}
          <rect x="165" y="53" width="5" height="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" className="ns-win3" />
          <rect x="173" y="56" width="5" height="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" className="ns-win0" />
          <rect x="181" y="59" width="5" height="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" className="ns-win1" />
          <rect x="189" y="62" width="5" height="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" className="ns-win2" />

          <rect x="165" y="68" width="5" height="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" className="ns-win0" />
          <rect x="173" y="71" width="5" height="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" className="ns-win1" />
          <rect x="181" y="74" width="5" height="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" className="ns-win2" />
          <rect x="189" y="77" width="5" height="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" className="ns-win3" />
        </g>

        {/* Roof / top edge */}
        <path d="M120 50 L160 35 L200 50" fill="none" stroke="rgba(184,151,58,0.25)" strokeWidth="0.6" />

        {/* ── Scaffolding (right side) ── */}
        <g className="ns-scaff">
          {/* Verticals */}
          <line x1="202" y1="50" x2="202" y2="130" stroke="rgba(184,151,58,0.2)" strokeWidth="0.4" />
          <line x1="210" y1="50" x2="210" y2="130" stroke="rgba(184,151,58,0.2)" strokeWidth="0.4" />
          {/* Horizontals (ladder) */}
          <line x1="202" y1="60" x2="210" y2="60" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />
          <line x1="202" y1="72" x2="210" y2="72" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />
          <line x1="202" y1="84" x2="210" y2="84" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />
          <line x1="202" y1="96" x2="210" y2="96" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />
          <line x1="202" y1="108" x2="210" y2="108" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />
          <line x1="202" y1="120" x2="210" y2="120" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />
          {/* Cross braces */}
          <line x1="202" y1="60" x2="210" y2="72" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
          <line x1="210" y1="60" x2="202" y2="72" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
          <line x1="202" y1="84" x2="210" y2="96" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
          <line x1="210" y1="84" x2="202" y2="96" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
        </g>

        {/* ── Crane ── */}
        {/* Mast */}
        <line x1="230" y1="130" x2="230" y2="22" stroke="rgba(184,151,58,0.3)" strokeWidth="0.8" />
        {/* Crane base */}
        <polygon points="225,130 235,130 230,126" fill="rgba(184,151,58,0.1)" stroke="rgba(184,151,58,0.2)" strokeWidth="0.4" />
        {/* Horizontal boom */}
        <line x1="215" y1="22" x2="270" y2="22" stroke="rgba(184,151,58,0.3)" strokeWidth="0.6" />
        {/* Counter-weight arm */}
        <line x1="215" y1="22" x2="218" y2="22" stroke="rgba(184,151,58,0.3)" strokeWidth="0.6" />
        <rect x="213" y="22" width="6" height="4" rx="0.5" fill="rgba(184,151,58,0.1)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />
        {/* Boom support cables */}
        <line x1="230" y1="18" x2="270" y2="22" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />
        <line x1="230" y1="18" x2="215" y2="22" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />
        {/* Top point */}
        <circle cx="230" cy="18" r="1.5" fill="rgba(184,151,58,0.2)" stroke="rgba(184,151,58,0.3)" strokeWidth="0.3" />

        {/* Cable + swinging block */}
        <g className="ns-pend">
          {/* Cable (dashed) */}
          <line x1="258" y1="22" x2="258" y2="55" stroke="rgba(184,151,58,0.2)" strokeWidth="0.4" strokeDasharray="2 1" />
          {/* Golden block */}
          <rect x="254" y="55" width="8" height="6" rx="1" fill="rgba(184,151,58,0.15)" stroke="#b8973a" strokeWidth="0.5" opacity="0.6" />
        </g>

        {/* ── Team constellation (bottom-left) ── */}
        <rect x="12" y="102" width="96" height="72" rx="3" fill="rgba(184,151,58,0.01)" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
        <text x="16" y="109" fill="rgba(184,151,58,0.3)" fontSize="3" fontFamily="monospace">TEAM NETWORK</text>

        {/* 5 person nodes */}
        {[
          { cx: 35, cy: 125, label: "CEO" },
          { cx: 60, cy: 118, label: "CTO" },
          { cx: 85, cy: 125, label: "SALES" },
          { cx: 45, cy: 145, label: "DEV" },
          { cx: 75, cy: 145, label: "DESIGN" },
        ].map((p, i) => (
          <g key={`person-${i}`} className={`ns-person${i}`}>
            {/* Node circle */}
            <circle cx={p.cx} cy={p.cy} r="6" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.25)" strokeWidth="0.4" />
            {/* Person silhouette */}
            <circle cx={p.cx} cy={p.cy - 2} r="1.5" fill="none" stroke="#b8973a" strokeWidth="0.4" opacity="0.4" />
            <path d={`M${p.cx - 3} ${p.cy + 3} A3 2.5 0 0 1 ${p.cx + 3} ${p.cy + 3}`} fill="none" stroke="#b8973a" strokeWidth="0.4" opacity="0.4" />
            {/* Label */}
            <text x={p.cx} y={p.cy + 11} textAnchor="middle" fill="rgba(184,151,58,0.25)" fontSize="2.5" fontFamily="monospace">{p.label}</text>
          </g>
        ))}

        {/* Connection lines between team nodes */}
        <line x1="35" y1="125" x2="60" y2="118" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" className="ns-conn" />
        <line x1="60" y1="118" x2="85" y2="125" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" className="ns-conn" />
        <line x1="35" y1="125" x2="45" y2="145" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" className="ns-conn" />
        <line x1="85" y1="125" x2="75" y2="145" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" className="ns-conn" />
        <line x1="45" y1="145" x2="75" y2="145" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" className="ns-conn" />
        <line x1="60" y1="118" x2="45" y2="145" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" className="ns-conn" />
        <line x1="60" y1="118" x2="75" y2="145" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" className="ns-conn" />

        {/* Lines connecting team to building */}
        <line x1="85" y1="125" x2="120" y2="110" stroke="rgba(184,151,58,0.05)" strokeWidth="0.3" strokeDasharray="3 4" />
        <line x1="60" y1="118" x2="120" y2="90" stroke="rgba(184,151,58,0.04)" strokeWidth="0.3" strokeDasharray="3 4" />

        {/* ── Timeline bar (bottom) ── */}
        <rect x="120" y="140" width="188" height="28" rx="3" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <text x="124" y="147" fill="rgba(184,151,58,0.3)" fontSize="3" fontFamily="monospace">COMPANY TIMELINE</text>

        {/* Horizontal timeline line */}
        <line x1="135" y1="158" x2="295" y2="158" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />

        {/* Progress fill (gold) */}
        <rect x="135" y="156.5" width="140" height="3" rx="1" fill="rgba(184,151,58,0.12)" stroke="rgba(184,151,58,0.2)" strokeWidth="0.2" />

        {/* Milestone markers */}
        {/* 2024 */}
        <line x1="155" y1="153" x2="155" y2="163" stroke="rgba(184,151,58,0.2)" strokeWidth="0.3" />
        <circle cx="155" cy="158" r="2" fill="rgba(184,151,58,0.3)" stroke="rgba(184,151,58,0.4)" strokeWidth="0.3" />
        <text x="155" y="151" textAnchor="middle" fill="rgba(184,151,58,0.4)" fontSize="3.5" fontFamily="serif" fontWeight="300">2024</text>

        {/* 2025 */}
        <line x1="215" y1="153" x2="215" y2="163" stroke="rgba(184,151,58,0.2)" strokeWidth="0.3" />
        <circle cx="215" cy="158" r="2" fill="rgba(184,151,58,0.3)" stroke="rgba(184,151,58,0.4)" strokeWidth="0.3" />
        <text x="215" y="151" textAnchor="middle" fill="rgba(184,151,58,0.4)" fontSize="3.5" fontFamily="serif" fontWeight="300">2025</text>

        {/* 2026 — current (pulsing) */}
        <line x1="275" y1="153" x2="275" y2="163" stroke="rgba(184,151,58,0.3)" strokeWidth="0.3" />
        <circle cx="275" cy="158" r="3" fill="#b8973a" opacity="0.6" className="ns-current" />
        <circle cx="275" cy="158" r="5" fill="none" stroke="rgba(184,151,58,0.3)" strokeWidth="0.3" className="ns-current-ring" />
        <text x="275" y="151" textAnchor="middle" fill="#b8973a" fontSize="3.5" fontFamily="serif" fontWeight="400" opacity="0.8">2026</text>

        {/* Labels under milestones */}
        <text x="155" y="167" textAnchor="middle" fill="rgba(184,151,58,0.2)" fontSize="2.2" fontFamily="monospace">FOUNDED</text>
        <text x="215" y="167" textAnchor="middle" fill="rgba(184,151,58,0.2)" fontSize="2.2" fontFamily="monospace">TRACTION</text>
        <text x="275" y="167" textAnchor="middle" fill="rgba(184,151,58,0.2)" fontSize="2.2" fontFamily="monospace">SCALE</text>

        {/* ── Stats (top-left) ── */}
        <rect x="12" y="12" width="96" height="80" rx="3" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <text x="16" y="19" fill="rgba(184,151,58,0.3)" fontSize="3" fontFamily="monospace">COMPANY METRICS</text>

        {/* Metric rows */}
        <text x="16" y="32" fill="rgba(184,151,58,0.2)" fontSize="2.8" fontFamily="monospace">PROJECTS</text>
        <text x="90" y="32" textAnchor="end" fill="#b8973a" fontSize="5" fontFamily="serif" fontWeight="300" opacity="0.7">34+</text>

        <line x1="16" y1="36" x2="100" y2="36" stroke="rgba(184,151,58,0.06)" strokeWidth="0.2" />

        <text x="16" y="46" fill="rgba(184,151,58,0.2)" fontSize="2.8" fontFamily="monospace">INVENTORY</text>
        <text x="90" y="46" textAnchor="end" fill="#b8973a" fontSize="5" fontFamily="serif" fontWeight="300" opacity="0.7">$150M</text>

        <line x1="16" y1="50" x2="100" y2="50" stroke="rgba(184,151,58,0.06)" strokeWidth="0.2" />

        <text x="16" y="60" fill="rgba(184,151,58,0.2)" fontSize="2.8" fontFamily="monospace">COUNTRIES</text>
        <text x="90" y="60" textAnchor="end" fill="#b8973a" fontSize="5" fontFamily="serif" fontWeight="300" opacity="0.7">6</text>

        <line x1="16" y1="64" x2="100" y2="64" stroke="rgba(184,151,58,0.06)" strokeWidth="0.2" />

        <text x="16" y="74" fill="rgba(184,151,58,0.2)" fontSize="2.8" fontFamily="monospace">UPTIME</text>
        <text x="90" y="74" textAnchor="end" fill="#b8973a" fontSize="5" fontFamily="serif" fontWeight="300" opacity="0.7">99.97%</text>

        <line x1="16" y1="78" x2="100" y2="78" stroke="rgba(184,151,58,0.06)" strokeWidth="0.2" />

        <text x="16" y="87" fill="rgba(184,151,58,0.2)" fontSize="2.8" fontFamily="monospace">LEADS</text>
        <text x="90" y="87" textAnchor="end" fill="#b8973a" fontSize="5" fontFamily="serif" fontWeight="300" opacity="0.7">12K+</text>

        {/* ── Floating blueprint pages ── */}
        <g className="ns-page1">
          <rect x="255" y="70" width="14" height="18" rx="1" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" />
          <line x1="258" y1="74" x2="266" y2="74" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
          <line x1="258" y1="77" x2="264" y2="77" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
          <line x1="258" y1="80" x2="265" y2="80" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
          <line x1="258" y1="83" x2="262" y2="83" stroke="rgba(184,151,58,0.05)" strokeWidth="0.3" />
          {/* Fold corner */}
          <path d="M265 70 L269 70 L269 74 Z" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.2" />
        </g>

        <g className="ns-page2">
          <rect x="278" y="90" width="12" height="15" rx="1" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
          <line x1="281" y1="94" x2="287" y2="94" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
          <line x1="281" y1="97" x2="286" y2="97" stroke="rgba(184,151,58,0.05)" strokeWidth="0.3" />
          <line x1="281" y1="100" x2="285" y2="100" stroke="rgba(184,151,58,0.04)" strokeWidth="0.3" />
        </g>

        {/* ── Gold dust particles ── */}
        <circle cx="30" cy="98" r="0.7" fill="#b8973a" className="ns-dust1" />
        <circle cx="290" cy="40" r="0.6" fill="#b8973a" className="ns-dust2" />
        <circle cx="160" cy="170" r="0.8" fill="#b8973a" className="ns-dust3" />
        <circle cx="240" cy="100" r="0.5" fill="#b8973a" className="ns-dust4" />
        <circle cx="100" cy="40" r="0.6" fill="#b8973a" className="ns-dust5" />
        <circle cx="195" cy="130" r="0.7" fill="#b8973a" className="ns-dust6" />
      </svg>
    </div>
  );
}

/* ─── page ─── */
export default function NosotrosPage() {
  usePageView("Nosotros");

  const values = [
    { icon: Zap, title: "Velocidad", desc: "El tiempo es dinero en bienes raíces. Nos obsesiona que nuestros clientes lancen proyectos en días, no meses. Cada segundo cuenta." },
    { icon: Heart, title: "Simplicidad", desc: "La tecnología debe ser invisible. Nuestros clientes no son developers — son vendedores. Diseñamos para que cualquiera pueda usarlo sin manual." },
    { icon: Award, title: "Excelencia", desc: "Ser rápido no significa ser mediocre. Cada microsite que generamos es premium: diseño de lujo, carga rápida, mobile-first, experiencia pulida." },
    { icon: TrendingUp, title: "Transparencia", desc: "Sin letra pequeña. Sin cargos ocultos. Sin trucos. Precio claro, funcionalidades claras, uptime público. Construimos confianza siendo directos." },
  ];

  const timeline = [
    { year: "2024", title: "Fundación", desc: "Nacimos en Medellín con la visión de democratizar la tecnología de ventas inmobiliarias. Primeros 5 clientes en Colombia.", side: "left" },
    { year: "2025", title: "Tracción", desc: "$150M+ en inventario gestionado. Expansión a México y Perú. Primeras integraciones enterprise con CRMs.", side: "right" },
    { year: "2026", title: "Escala", desc: "34 proyectos activos en 6 países. Lanzamiento de features avanzadas: A/B testing, WhatsApp Business API, analytics predictivos.", side: "left" },
    { year: "2027", title: "Global", desc: "Próxima expansión a Dubai, UAE y mercados europeos. Objetivo: ser la plataforma #1 de ventas inmobiliarias digitales en LATAM y MENA.", side: "right" },
  ];

  const team = [
    {
      name: "Juan Rodríguez", role: "CEO & Co-Founder",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      linkedin: "#",
      bio: "10+ años en proptech y desarrollo inmobiliario. Anteriormente en Habi y Properati. Experto en product-market fit para SaaS B2B.",
    },
    {
      name: "María González", role: "CTO & Co-Founder",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
      linkedin: "#",
      bio: "Engineering lead con 8 años en startups de alto crecimiento. Especialista en arquitectura escalable y developer experience.",
    },
    {
      name: "Carlos Mendoza", role: "Head of Sales",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      linkedin: "#",
      bio: "15 años vendiendo software enterprise a constructoras. Ex-director comercial en Oracle y Salesforce para sector inmobiliario.",
    },
  ];

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 selection:bg-[rgba(184,151,58,0.30)]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light"
          >
            <Heart className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Nosotros
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
            Revolucionando la
            <br />
            <em style={{ fontStyle: "italic", color: "#b8973a" }}>venta inmobiliaria</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="text-lg max-w-2xl mx-auto leading-relaxed"
            style={{
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            NODDO nació de una frustración: las constructoras invierten meses y decenas de miles
            de dólares en páginas web que terminan siendo folletos digitales estáticos. Creamos
            la alternativa.
          </motion.p>
        </div>

        {/* Hero SVG */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease }}
          className="mb-20"
        >
          <BlueprintConstructionIllustration />
        </motion.div>

        {/* Mission */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease }}
          className="glass-card p-10 mb-12"
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <Target className="w-7 h-7" style={{ color: "#b8973a" }} />
            </div>
            <div>
              <h2
                className="text-3xl mb-3"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Nuestra Misión
              </h2>
              <p
                className="text-base leading-[1.9]"
                style={{
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                Democratizar la tecnología de ventas inmobiliarias. Que una constructora de 3
                proyectos tenga la misma presencia digital que un desarrollador de 50. Sin
                agencias. Sin código. Sin esperas.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Story */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.08, ease }}
          className="glass-card p-10 mb-12"
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <Rocket className="w-7 h-7" style={{ color: "#b8973a" }} />
            </div>
            <div>
              <h2
                className="text-3xl mb-4"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Nuestra Historia
              </h2>
              <div
                className="space-y-4 text-base leading-[1.9]"
                style={{
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                <p>
                  En 2024, trabajando con constructoras en Colombia, nos dimos cuenta de un patrón:
                  todas necesitaban sitios web para sus proyectos, pero el proceso era lento,
                  caro, y frustrante.
                </p>
                <p>
                  Las agencias cobraban entre $5,000 y $15,000 USD, tardaban 2-3 meses, y
                  entregaban sitios bonitos pero{" "}
                  <span style={{ color: "rgba(244,240,232,0.92)", fontWeight: 400 }}>
                    completamente estáticos
                  </span>
                  . Cambiar un precio requería un ticket de soporte. Actualizar inventario era un
                  dolor de cabeza. Y los leads se perdían en emails.
                </p>
                <p>
                  Pensamos:{" "}
                  <span
                    style={{
                      fontStyle: "italic",
                      color: "#b8973a",
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "1.1em",
                    }}
                  >
                    &quot;¿Y si una constructora pudiera tener un showroom digital premium listo en 1
                    día?&quot;
                  </span>
                </p>
                <p>
                  Así nació NODDO. No solo un generador de sitios, sino una{" "}
                  <span style={{ color: "rgba(244,240,232,0.92)", fontWeight: 400 }}>
                    sala de ventas digital completa
                  </span>
                  : inventario en vivo, cotizador, captura de leads con CRM integrado, analytics,
                  y todo actualizable en segundos.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Values */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease }}
          className="mb-12"
        >
          <h2
            className="text-3xl mb-8 text-center"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Nuestros Valores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease }}
                  className="glass-card p-8"
                >
                  <div
                    className="inline-flex p-3 rounded-xl mb-4"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Icon className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <h3
                    className="text-xl mb-3"
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontWeight: 400,
                      color: "rgba(244,240,232,0.92)",
                    }}
                  >
                    {v.title}
                  </h3>
                  <p
                    className="text-sm leading-[1.8]"
                    style={{
                      fontWeight: 300,
                      color: "rgba(244,240,232,0.70)",
                    }}
                  >
                    {v.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease }}
          className="mb-16"
        >
          <h2
            className="text-3xl mb-10 text-center"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Nuestro Recorrido
          </h2>
          <div className="relative">
            <div
              className="absolute left-1/2 top-0 bottom-0 w-px"
              style={{
                background: "linear-gradient(to bottom, transparent, #b8973a 20%, #b8973a 80%, transparent)",
              }}
            />
            <div className="space-y-16">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease }}
                  className={`flex items-center ${item.side === "right" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-1/2 ${item.side === "left" ? "pr-12 text-right" : "pl-12"}`}>
                    <div className="glass-card p-6 inline-block">
                      <div
                        className="text-5xl mb-2 font-light"
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          color: "#b8973a",
                        }}
                      >
                        {item.year}
                      </div>
                      <h3
                        className="text-xl mb-2"
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          fontWeight: 400,
                          color: "rgba(244,240,232,0.92)",
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="text-sm leading-[1.7]"
                        style={{
                          fontWeight: 300,
                          color: "rgba(244,240,232,0.70)",
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full border-4 relative z-10"
                    style={{
                      borderColor: "#b8973a",
                      backgroundColor: "#0a0a0b",
                      boxShadow: "0 0 20px rgba(184, 151, 58, 0.5)",
                    }}
                  />
                  <div className="w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Team */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease }}
          className="mb-12"
        >
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
              >
                <Users className="w-6 h-6" style={{ color: "#b8973a" }} />
              </div>
            </div>
            <h2
              className="text-3xl mb-4"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 400,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              El Equipo
            </h2>
            <p
              className="text-base max-w-2xl mx-auto leading-[1.9]"
              style={{
                fontWeight: 300,
                color: "rgba(244,240,232,0.70)",
              }}
            >
              Somos un equipo pequeño y ágil con experiencia en proptech, SaaS, y desarrollo
              inmobiliario. Combinamos expertise técnico con conocimiento profundo del sector.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="glass-card p-6 text-center hover:bg-white/5 transition-all duration-300"
              >
                <Image
                  src={member.avatar}
                  alt=""
                  width={400}
                  height={300}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  style={{ border: "3px solid rgba(184, 151, 58, 0.3)" }}
                />
                <h3
                  className="text-xl mb-1"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 400,
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  {member.name}
                </h3>
                <p
                  className="text-xs mb-3 uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 600,
                    color: "#b8973a",
                  }}
                >
                  {member.role}
                </p>
                <p
                  className="text-sm leading-[1.7] mb-4"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  {member.bio}
                </p>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-colors duration-200"
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 600,
                    backgroundColor: "rgba(184, 151, 58, 0.15)",
                    color: "#b8973a",
                    border: "1px solid rgba(184, 151, 58, 0.3)",
                  }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn
                </a>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Global */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease }}
          className="glass-card p-10 mb-12"
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <Globe className="w-7 h-7" style={{ color: "#b8973a" }} />
            </div>
            <div>
              <h2
                className="text-3xl mb-4"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Alcance Global
              </h2>
              <p
                className="text-base leading-[1.9]"
                style={{
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                Nacimos en Colombia, pero servimos a constructoras en toda América Latina.
                Próximamente expandiremos a Medio Oriente (Dubai, UAE) y Europa. La tecnología no
                tiene fronteras — y la venta inmobiliaria digital tampoco.
              </p>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="text-center mt-16"
        >
          <div className="glass-card p-10">
            <h2
              className="text-3xl mb-4"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              ¿Listo para revolucionar su estrategia de ventas?
            </h2>
            <p
              className="text-base mb-6 max-w-xl mx-auto"
              style={{
                fontWeight: 300,
                color: "rgba(244,240,232,0.55)",
              }}
            >
              Únase a las constructoras que ya confían en NODDO para vender más rápido.
            </p>
            <a href="/pricing" className="btn-mk-primary inline-flex items-center gap-2">
              Ver Planes
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
