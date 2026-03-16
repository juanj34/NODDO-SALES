"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, Server, Key, FileCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

/* ─── Security Architecture Blueprint SVG ─── */
function SecurityArchitectureIllustration() {
  return (
    <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
      <svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Security Architecture Blueprint">
        <style>{`
          /* ── background glow ── */
          .sg-bg-glow{animation:sg-bg-glow 4s ease-in-out infinite}
          @keyframes sg-bg-glow{0%,100%{opacity:.03}50%{opacity:.07}}

          /* ── shield pulse ── */
          .sg-shield-glow{animation:sg-shield-glow 3s ease-in-out infinite}
          @keyframes sg-shield-glow{0%,100%{opacity:.06}50%{opacity:.14}}

          /* ── concentric ring rotations ── */
          .sg-ring-cw{animation:sg-ring-cw 20s linear infinite;transform-origin:160px 82px}
          @keyframes sg-ring-cw{to{transform:rotate(360deg)}}
          .sg-ring-ccw{animation:sg-ring-ccw 30s linear infinite;transform-origin:160px 82px}
          @keyframes sg-ring-ccw{to{transform:rotate(-360deg)}}
          .sg-ring-cw2{animation:sg-ring-cw2 25s linear infinite;transform-origin:160px 82px}
          @keyframes sg-ring-cw2{to{transform:rotate(360deg)}}

          /* ── radar sweep ── */
          .sg-radar{animation:sg-radar 8s linear infinite;transform-origin:160px 82px}
          @keyframes sg-radar{to{transform:rotate(360deg)}}

          /* ── auth node sequential pulse ── */
          .sg-auth0{animation:sg-auth-pulse 3s ease-in-out infinite}
          .sg-auth1{animation:sg-auth-pulse 3s ease-in-out infinite .75s}
          .sg-auth2{animation:sg-auth-pulse 3s ease-in-out infinite 1.5s}
          .sg-auth3{animation:sg-auth-pulse 3s ease-in-out infinite 2.25s}
          @keyframes sg-auth-pulse{0%,100%{opacity:.5;r:4}40%{opacity:1;r:5.5}60%{opacity:1;r:5.5}}

          /* ── auth flow dashes ── */
          .sg-auth-flow{stroke-dasharray:4 3;animation:sg-auth-flow 2s linear infinite}
          @keyframes sg-auth-flow{to{stroke-dashoffset:-14}}

          /* ── encrypted data stream ── */
          .sg-data-flow{animation:sg-data-flow 4s linear infinite}
          @keyframes sg-data-flow{from{transform:translateX(-40px)}to{transform:translateX(40px)}}
          .sg-data-flow2{animation:sg-data-flow2 5s linear infinite}
          @keyframes sg-data-flow2{from{transform:translateX(-50px)}to{transform:translateX(50px)}}

          /* ── database breathe ── */
          .sg-db-breathe{animation:sg-db-breathe 3.5s ease-in-out infinite}
          @keyframes sg-db-breathe{0%,100%{opacity:.6}50%{opacity:1}}

          /* ── RLS row indicators ── */
          .sg-rls-green{animation:sg-rls-blink 2.5s ease-in-out infinite}
          .sg-rls-red{animation:sg-rls-blink 2.5s ease-in-out infinite .4s}
          .sg-rls-gold{animation:sg-rls-blink 2.5s ease-in-out infinite .8s}
          @keyframes sg-rls-blink{0%,100%{opacity:.4}50%{opacity:1}}

          /* ── lock keyhole glow ── */
          .sg-lock-glow{animation:sg-lock-glow 2.5s ease-in-out infinite}
          @keyframes sg-lock-glow{0%,100%{opacity:.15}50%{opacity:.35}}

          /* ── dust particles ── */
          .sg-dust1{animation:sg-dust-a 7s ease-in-out infinite}
          .sg-dust2{animation:sg-dust-a 9s ease-in-out infinite 1.5s}
          .sg-dust3{animation:sg-dust-a 8s ease-in-out infinite 3s}
          .sg-dust4{animation:sg-dust-b 10s ease-in-out infinite .8s}
          .sg-dust5{animation:sg-dust-b 7.5s ease-in-out infinite 2.2s}
          .sg-dust6{animation:sg-dust-a 11s ease-in-out infinite 4s}
          @keyframes sg-dust-a{0%,100%{opacity:0;transform:translateY(0)}25%{opacity:.45}75%{opacity:.2}50%{transform:translateY(-8px)}}
          @keyframes sg-dust-b{0%,100%{opacity:0;transform:translateY(0)}25%{opacity:.35}75%{opacity:.15}50%{transform:translateY(-10px)}}

          /* ── encryption zone gradient ── */
          .sg-encrypt-zone{animation:sg-encrypt 2s ease-in-out infinite}
          @keyframes sg-encrypt{0%,100%{opacity:.08}50%{opacity:.18}}

          /* ── scanning beam ── */
          .sg-scan-beam{animation:sg-scan-beam 8s linear infinite;transform-origin:160px 82px}
          @keyframes sg-scan-beam{to{transform:rotate(360deg)}}
        `}</style>

        {/* Background glow */}
        <circle cx="160" cy="82" r="70" fill="rgba(184,151,58,0.04)" className="sg-bg-glow" />

        {/* ── Concentric defense layers (hexagonal rings) ── */}
        {/* Outer ring — dotted, counter-clockwise */}
        <polygon
          className="sg-ring-ccw"
          points="160,22 210,52 210,112 160,142 110,112 110,52"
          fill="none"
          stroke="rgba(184,151,58,0.04)"
          strokeWidth="0.5"
          strokeDasharray="3 4"
        />
        {/* Middle ring — dashed, clockwise */}
        <polygon
          className="sg-ring-cw"
          points="160,32 200,55 200,109 160,132 120,109 120,55"
          fill="none"
          stroke="rgba(184,151,58,0.08)"
          strokeWidth="0.5"
          strokeDasharray="5 3"
        />
        {/* Inner ring — solid, slow clockwise */}
        <polygon
          className="sg-ring-cw2"
          points="160,42 190,58 190,106 160,122 130,106 130,58"
          fill="rgba(184,151,58,0.02)"
          stroke="rgba(184,151,58,0.15)"
          strokeWidth="0.6"
        />

        {/* ── Central shield with lock ── */}
        {/* Shield glow */}
        <circle cx="160" cy="82" r="28" fill="rgba(184,151,58,0.06)" className="sg-shield-glow" />

        {/* Hexagonal shield outline */}
        <polygon
          points="160,55 180,67 180,97 160,109 140,97 140,67"
          fill="rgba(184,151,58,0.03)"
          stroke="#b8973a"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* Shield inner highlight */}
        <polygon
          points="160,60 176,70 176,94 160,104 144,94 144,70"
          fill="none"
          stroke="rgba(184,151,58,0.12)"
          strokeWidth="0.4"
        />

        {/* Lock icon inside shield */}
        {/* Lock body */}
        <rect x="153" y="80" width="14" height="11" rx="1.5" fill="none" stroke="#b8973a" strokeWidth="0.8" opacity="0.8" />
        {/* Lock shackle */}
        <path d="M156 80 V76 A4 4 0 0 1 164 76 V80" fill="none" stroke="#b8973a" strokeWidth="0.8" opacity="0.8" />
        {/* Keyhole */}
        <circle cx="160" cy="84" r="1.5" fill="#b8973a" opacity="0.7" />
        <rect x="159.3" y="85" width="1.4" height="3" rx="0.5" fill="#b8973a" opacity="0.5" />
        {/* Keyhole glow */}
        <circle cx="160" cy="84" r="4" fill="rgba(184,151,58,0.15)" className="sg-lock-glow" />

        {/* ── Radar sweep ── */}
        <line
          className="sg-radar"
          x1="160" y1="82" x2="160" y2="48"
          stroke="rgba(184,151,58,0.08)"
          strokeWidth="0.5"
        />
        <path
          className="sg-scan-beam"
          d="M160,82 L158,50 L162,50 Z"
          fill="rgba(184,151,58,0.04)"
        />

        {/* ── Auth flow diagram (top-left) ── */}
        {/* Background panel */}
        <rect x="12" y="14" width="82" height="36" rx="3" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <text x="16" y="21" fill="rgba(184,151,58,0.35)" fontSize="3.5" fontFamily="monospace">AUTHENTICATION FLOW</text>

        {/* Node 0: User */}
        <circle cx="28" cy="34" r="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.4)" strokeWidth="0.5" className="sg-auth0" />
        {/* Person icon */}
        <circle cx="28" cy="32" r="1.2" fill="none" stroke="#b8973a" strokeWidth="0.5" opacity="0.6" />
        <path d="M25.5 37 A2.5 2 0 0 1 30.5 37" fill="none" stroke="#b8973a" strokeWidth="0.5" opacity="0.6" />
        <text x="28" y="43" textAnchor="middle" fill="rgba(184,151,58,0.3)" fontSize="2.8" fontFamily="monospace">USER</text>

        {/* Arrow 0→1 */}
        <line x1="33" y1="34" x2="42" y2="34" stroke="rgba(184,151,58,0.25)" strokeWidth="0.4" className="sg-auth-flow" />

        {/* Node 1: Password/Key */}
        <circle cx="47" cy="34" r="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.4)" strokeWidth="0.5" className="sg-auth1" />
        {/* Key icon */}
        <circle cx="46" cy="33" r="1" fill="none" stroke="#b8973a" strokeWidth="0.5" opacity="0.6" />
        <line x1="47" y1="33" x2="50" y2="33" stroke="#b8973a" strokeWidth="0.5" opacity="0.6" />
        <line x1="49" y1="33" x2="49" y2="35" stroke="#b8973a" strokeWidth="0.4" opacity="0.6" />
        <text x="47" y="43" textAnchor="middle" fill="rgba(184,151,58,0.3)" fontSize="2.8" fontFamily="monospace">PASS</text>

        {/* Arrow 1→2 */}
        <line x1="52" y1="34" x2="61" y2="34" stroke="rgba(184,151,58,0.25)" strokeWidth="0.4" className="sg-auth-flow" />

        {/* Node 2: 2FA */}
        <circle cx="66" cy="34" r="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.4)" strokeWidth="0.5" className="sg-auth2" />
        {/* Phone icon */}
        <rect x="64.5" y="31" width="3" height="5" rx="0.5" fill="none" stroke="#b8973a" strokeWidth="0.4" opacity="0.6" />
        <line x1="65.2" y1="35" x2="66.8" y2="35" stroke="#b8973a" strokeWidth="0.3" opacity="0.6" />
        <text x="66" y="43" textAnchor="middle" fill="rgba(184,151,58,0.3)" fontSize="2.8" fontFamily="monospace">2FA</text>

        {/* Arrow 2→3 */}
        <line x1="71" y1="34" x2="80" y2="34" stroke="rgba(184,151,58,0.25)" strokeWidth="0.4" className="sg-auth-flow" />

        {/* Node 3: Access granted */}
        <circle cx="85" cy="34" r="4" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.4)" strokeWidth="0.5" className="sg-auth3" />
        {/* Checkmark */}
        <path d="M82.5 34 L84.5 36 L87.5 32" fill="none" stroke="#b8973a" strokeWidth="0.6" opacity="0.7" />
        <text x="85" y="43" textAnchor="middle" fill="rgba(184,151,58,0.3)" fontSize="2.8" fontFamily="monospace">OK</text>

        {/* ── Database + RLS visualization (top-right) ── */}
        <rect x="226" y="14" width="82" height="52" rx="3" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <text x="230" y="21" fill="rgba(184,151,58,0.35)" fontSize="3.5" fontFamily="monospace">ROW LEVEL SECURITY</text>

        {/* Database cylinder */}
        <g className="sg-db-breathe">
          {/* Cylinder body */}
          <rect x="240" y="30" width="16" height="18" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.3)" strokeWidth="0.5" rx="0.5" />
          {/* Top ellipse */}
          <ellipse cx="248" cy="30" rx="8" ry="2.5" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.3)" strokeWidth="0.5" />
          {/* Middle division */}
          <ellipse cx="248" cy="36" rx="8" ry="2" fill="none" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />
          {/* Bottom ellipse */}
          <ellipse cx="248" cy="48" rx="8" ry="2.5" fill="none" stroke="rgba(184,151,58,0.3)" strokeWidth="0.5" />
          {/* DB label */}
          <text x="248" y="42" textAnchor="middle" fill="rgba(184,151,58,0.4)" fontSize="3" fontFamily="monospace">PG</text>
        </g>

        {/* RLS Row indicators */}
        {/* Green — allowed */}
        <g className="sg-rls-green">
          <rect x="266" y="28" width="32" height="5" rx="1" fill="rgba(74,158,107,0.08)" stroke="rgba(74,158,107,0.3)" strokeWidth="0.4" />
          <circle cx="270" cy="30.5" r="1.2" fill="rgba(74,158,107,0.6)" />
          <line x1="274" y1="30.5" x2="294" y2="30.5" stroke="rgba(244,240,232,0.15)" strokeWidth="0.4" />
          <text x="296" y="31.5" fill="rgba(74,158,107,0.5)" fontSize="2.5" fontFamily="monospace">✓</text>
        </g>
        {/* Red — blocked */}
        <g className="sg-rls-red">
          <rect x="266" y="36" width="32" height="5" rx="1" fill="rgba(200,70,70,0.06)" stroke="rgba(200,70,70,0.25)" strokeWidth="0.4" />
          <circle cx="270" cy="38.5" r="1.2" fill="rgba(200,70,70,0.5)" />
          <line x1="274" y1="38.5" x2="294" y2="38.5" stroke="rgba(244,240,232,0.1)" strokeWidth="0.4" />
          {/* Lock on blocked row */}
          <rect x="295" y="37" width="3" height="2.5" rx="0.3" fill="none" stroke="rgba(200,70,70,0.4)" strokeWidth="0.3" />
          <path d="M296 37 V36 A0.8 0.8 0 0 1 297.5 36 V37" fill="none" stroke="rgba(200,70,70,0.4)" strokeWidth="0.3" />
        </g>
        {/* Gold — conditional */}
        <g className="sg-rls-gold">
          <rect x="266" y="44" width="32" height="5" rx="1" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.2)" strokeWidth="0.4" />
          <circle cx="270" cy="46.5" r="1.2" fill="rgba(184,151,58,0.5)" />
          <line x1="274" y1="46.5" x2="294" y2="46.5" stroke="rgba(244,240,232,0.1)" strokeWidth="0.4" />
          <text x="296" y="47.5" fill="rgba(184,151,58,0.4)" fontSize="2.5" fontFamily="monospace">?</text>
        </g>

        {/* Connecting lines from DB to RLS rows */}
        <line x1="256" y1="34" x2="266" y2="30.5" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" strokeDasharray="2 2" />
        <line x1="256" y1="39" x2="266" y2="38.5" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" strokeDasharray="2 2" />
        <line x1="256" y1="44" x2="266" y2="46.5" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" strokeDasharray="2 2" />

        {/* ── Encrypted data stream (bottom) ── */}
        <rect x="30" y="150" width="260" height="18" rx="2" fill="rgba(184,151,58,0.01)" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
        <text x="35" y="156" fill="rgba(184,151,58,0.25)" fontSize="3" fontFamily="monospace">ENCRYPTED DATA STREAM</text>

        {/* Encryption zone gradient bar */}
        <rect x="140" y="159" width="40" height="6" rx="1" fill="rgba(184,151,58,0.08)" className="sg-encrypt-zone" />
        <text x="160" y="163.5" textAnchor="middle" fill="rgba(184,151,58,0.3)" fontSize="2.5" fontFamily="monospace">AES-256</text>

        {/* Flowing data blocks — readable (left side) */}
        <g className="sg-data-flow" opacity="0.6">
          <rect x="48" y="160" width="12" height="4" rx="0.5" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.2)" strokeWidth="0.3" />
          <text x="50" y="163" fill="rgba(184,151,58,0.5)" fontSize="2.5" fontFamily="monospace">data</text>

          <rect x="66" y="160" width="14" height="4" rx="0.5" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.2)" strokeWidth="0.3" />
          <text x="68" y="163" fill="rgba(184,151,58,0.5)" fontSize="2.5" fontFamily="monospace">email</text>

          <rect x="86" y="160" width="12" height="4" rx="0.5" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.2)" strokeWidth="0.3" />
          <text x="88" y="163" fill="rgba(184,151,58,0.5)" fontSize="2.5" fontFamily="monospace">user</text>
        </g>

        {/* Flowing data blocks — encrypted (right side) */}
        <g className="sg-data-flow2" opacity="0.4">
          <rect x="192" y="160" width="14" height="4" rx="0.5" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" />
          <text x="194" y="163" fill="rgba(184,151,58,0.25)" fontSize="2.5" fontFamily="monospace">0xF3a</text>

          <rect x="212" y="160" width="14" height="4" rx="0.5" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" />
          <text x="214" y="163" fill="rgba(184,151,58,0.25)" fontSize="2.5" fontFamily="monospace">0x9bE</text>

          <rect x="232" y="160" width="14" height="4" rx="0.5" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" />
          <text x="234" y="163" fill="rgba(184,151,58,0.25)" fontSize="2.5" fontFamily="monospace">0x2cD</text>
        </g>

        {/* Flow arrows in data stream */}
        <path d="M110 162 L120 162 M117 160.5 L120 162 L117 163.5" stroke="rgba(184,151,58,0.2)" strokeWidth="0.4" fill="none" />
        <path d="M186 162 L196 162 M193 160.5 L196 162 L193 163.5" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" fill="none" />

        {/* ── Bottom-left: TLS handshake mini ── */}
        <rect x="12" y="100" width="68" height="40" rx="3" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <text x="16" y="107" fill="rgba(184,151,58,0.35)" fontSize="3.5" fontFamily="monospace">TLS 1.3 HANDSHAKE</text>

        {/* Client/Server handshake lines */}
        <line x1="28" y1="112" x2="28" y2="134" stroke="rgba(184,151,58,0.2)" strokeWidth="0.4" />
        <line x1="62" y1="112" x2="62" y2="134" stroke="rgba(184,151,58,0.2)" strokeWidth="0.4" />
        <text x="28" y="111" textAnchor="middle" fill="rgba(184,151,58,0.4)" fontSize="2.8" fontFamily="monospace">CLIENT</text>
        <text x="62" y="111" textAnchor="middle" fill="rgba(184,151,58,0.4)" fontSize="2.8" fontFamily="monospace">SERVER</text>

        {/* Handshake arrows */}
        <line x1="29" y1="116" x2="61" y2="119" stroke="rgba(184,151,58,0.25)" strokeWidth="0.4" className="sg-auth-flow" />
        <text x="45" y="116" textAnchor="middle" fill="rgba(184,151,58,0.2)" fontSize="2.2" fontFamily="monospace">ClientHello</text>
        <line x1="61" y1="123" x2="29" y2="126" stroke="rgba(184,151,58,0.25)" strokeWidth="0.4" className="sg-auth-flow" />
        <text x="45" y="123" textAnchor="middle" fill="rgba(184,151,58,0.2)" fontSize="2.2" fontFamily="monospace">ServerHello+Cert</text>
        <line x1="29" y1="129" x2="61" y2="132" stroke="rgba(184,151,58,0.25)" strokeWidth="0.4" className="sg-auth-flow" />
        <text x="45" y="130" textAnchor="middle" fill="rgba(184,151,58,0.2)" fontSize="2.2" fontFamily="monospace">Finished ✓</text>

        {/* ── Bottom-right: Infrastructure nodes ── */}
        <rect x="226" y="80" width="82" height="56" rx="3" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <text x="230" y="87" fill="rgba(184,151,58,0.35)" fontSize="3.5" fontFamily="monospace">INFRASTRUCTURE</text>

        {/* CDN node */}
        <circle cx="242" cy="98" r="5" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.25)" strokeWidth="0.4" />
        <text x="242" y="99.5" textAnchor="middle" fill="rgba(184,151,58,0.5)" fontSize="2.8" fontFamily="monospace">CDN</text>
        {/* Edge node */}
        <circle cx="262" cy="98" r="5" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.25)" strokeWidth="0.4" />
        <text x="262" y="99.5" textAnchor="middle" fill="rgba(184,151,58,0.5)" fontSize="2.8" fontFamily="monospace">E</text>
        {/* API node */}
        <circle cx="282" cy="98" r="5" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.25)" strokeWidth="0.4" />
        <text x="282" y="99.5" textAnchor="middle" fill="rgba(184,151,58,0.5)" fontSize="2.8" fontFamily="monospace">API</text>
        {/* DB node */}
        <circle cx="252" cy="118" r="5" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.25)" strokeWidth="0.4" />
        <text x="252" y="119.5" textAnchor="middle" fill="rgba(184,151,58,0.5)" fontSize="2.8" fontFamily="monospace">DB</text>
        {/* Storage node */}
        <circle cx="272" cy="118" r="5" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.25)" strokeWidth="0.4" />
        <text x="272" y="119.5" textAnchor="middle" fill="rgba(184,151,58,0.5)" fontSize="2.8" fontFamily="monospace">S3</text>

        {/* Connecting lines between infra nodes */}
        <line x1="247" y1="98" x2="257" y2="98" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" strokeDasharray="2 2" className="sg-auth-flow" />
        <line x1="267" y1="98" x2="277" y2="98" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" strokeDasharray="2 2" className="sg-auth-flow" />
        <line x1="258" y1="103" x2="254" y2="113" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" strokeDasharray="2 2" className="sg-auth-flow" />
        <line x1="266" y1="103" x2="270" y2="113" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" strokeDasharray="2 2" className="sg-auth-flow" />
        <line x1="282" y1="103" x2="275" y2="113" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" strokeDasharray="2 2" className="sg-auth-flow" />

        {/* SOC 2 badge */}
        <rect x="242" y="127" width="22" height="6" rx="1" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.2)" strokeWidth="0.3" />
        <text x="253" y="131" textAnchor="middle" fill="rgba(184,151,58,0.5)" fontSize="2.8" fontFamily="monospace">SOC 2</text>
        {/* ISO badge */}
        <rect x="268" y="127" width="28" height="6" rx="1" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.2)" strokeWidth="0.3" />
        <text x="282" y="131" textAnchor="middle" fill="rgba(184,151,58,0.5)" fontSize="2.8" fontFamily="monospace">ISO 27001</text>

        {/* ── Left side: Compliance shield ── */}
        <g opacity="0.6">
          {/* Small shield */}
          <path d="M100 95 L108 91 L116 95 L116 105 L108 110 L100 105Z" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.2)" strokeWidth="0.5" />
          {/* Checkmark inside */}
          <path d="M104 101 L107 104 L112 97" fill="none" stroke="#b8973a" strokeWidth="0.6" opacity="0.5" />
          <text x="108" y="116" textAnchor="middle" fill="rgba(184,151,58,0.25)" fontSize="2.5" fontFamily="monospace">COMPLIANT</text>
        </g>

        {/* ── Connecting lines from shield to panels ── */}
        {/* Shield to auth flow */}
        <line x1="145" y1="72" x2="93" y2="40" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" strokeDasharray="3 4" />
        {/* Shield to RLS */}
        <line x1="175" y1="72" x2="226" y2="40" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" strokeDasharray="3 4" />
        {/* Shield to TLS */}
        <line x1="148" y1="95" x2="80" y2="115" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" strokeDasharray="3 4" />
        {/* Shield to infra */}
        <line x1="175" y1="95" x2="226" y2="105" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" strokeDasharray="3 4" />

        {/* ── Gold dust particles ── */}
        <circle cx="25" cy="65" r="0.8" fill="#b8973a" className="sg-dust1" />
        <circle cx="295" cy="72" r="0.6" fill="#b8973a" className="sg-dust2" />
        <circle cx="135" cy="145" r="0.7" fill="#b8973a" className="sg-dust3" />
        <circle cx="195" cy="15" r="0.5" fill="#b8973a" className="sg-dust4" />
        <circle cx="70" cy="85" r="0.6" fill="#b8973a" className="sg-dust5" />
        <circle cx="210" cy="140" r="0.7" fill="#b8973a" className="sg-dust6" />
      </svg>
    </div>
  );
}

/* ─── page ─── */
export default function SeguridadPage() {
  usePageView("Seguridad");

  const cardData = [
    {
      icon: Lock,
      title: "Encriptación de Punta a Punta",
      description: "Todos los datos están protegidos:",
      items: ["TLS 1.3 para todas las conexiones", "AES-256 en reposo", "Bcrypt para contraseñas (salt rounds: 12)"],
    },
    {
      icon: Key,
      title: "Autenticación Robusta",
      description: "Control de acceso multinivel:",
      items: ["OAuth 2.0 con Google", "MFA opcional (TOTP)", "Tokens JWT con expiración"],
    },
    {
      icon: Eye,
      title: "Row Level Security",
      description: "Aislamiento a nivel de base de datos:",
      items: ["Políticas RLS en PostgreSQL", "Control RBAC granular", "Auditoría de accesos"],
    },
    {
      icon: Server,
      title: "Infraestructura Segura",
      description: "Proveedores certificados:",
      items: ["Vercel (SOC 2 Type II)", "Supabase (SOC 2, ISO 27001)", "Cloudflare (protección DDoS)"],
    },
  ];

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 selection:bg-[rgba(184,151,58,0.30)]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light"
          >
            <Shield className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Seguridad
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="text-5xl md:text-6xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Seguridad de
            <br />
            <em style={{ fontStyle: "italic", color: "#b8973a" }}>nivel empresarial</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="text-base max-w-2xl mx-auto"
            style={{
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            La seguridad de sus datos es nuestra máxima prioridad. Implementamos las mejores
            prácticas de la industria para proteger su información y la de sus clientes.
          </motion.p>
        </div>

        {/* Hero SVG */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease }}
          className="mb-16"
        >
          <SecurityArchitectureIllustration />
        </motion.div>

        {/* Security Measures Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {cardData.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease }}
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
                  {card.title}
                </h3>
                <p
                  className="text-sm leading-[1.8] mb-3"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  {card.description}
                </p>
                <ul
                  className="text-sm leading-[1.8] space-y-1"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  {card.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Compliance */}
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
              <FileCheck className="w-7 h-7" style={{ color: "#b8973a" }} />
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
                Cumplimiento Normativo
              </h2>
              <div
                className="space-y-3 text-base leading-[1.9]"
                style={{
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                <p>
                  NODDO cumple con las regulaciones de protección de datos más estrictas:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Ley 1581 de 2012 (Colombia)
                    </strong>{" "}
                    — Régimen General de Protección de Datos Personales
                  </li>
                  <li>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      GDPR-ready
                    </strong>{" "}
                    — Preparados para clientes en Europa (portabilidad, derecho al olvido, DPA)
                  </li>
                  <li>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      DIFC Data Protection Law
                    </strong>{" "}
                    — Próximamente para clientes en Dubai/UAE
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Monitoring */}
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
              <Eye className="w-7 h-7" style={{ color: "#b8973a" }} />
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
                Monitoreo y Respuesta
              </h2>
              <div
                className="space-y-3 text-base leading-[1.9]"
                style={{
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 mt-1 shrink-0"
                      style={{ color: "#b8973a" }}
                    />
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Monitoreo 24/7
                      </strong>{" "}
                      — Sentry para detección de errores en tiempo real, alertas automáticas
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 mt-1 shrink-0"
                      style={{ color: "#b8973a" }}
                    />
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Backups diarios
                      </strong>{" "}
                      — Copias automáticas cada 24h, retención 30 días, recuperación point-in-time
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 mt-1 shrink-0"
                      style={{ color: "#b8973a" }}
                    />
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Plan de respuesta a incidentes
                      </strong>{" "}
                      — Protocolo documentado para brechas de seguridad, notificación en menos de 72h
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 mt-1 shrink-0"
                      style={{ color: "#b8973a" }}
                    />
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Logs de auditoría
                      </strong>{" "}
                      — Registro de todos los accesos y cambios sensibles, retención 6 meses
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Vulnerability */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.16, ease }}
          className="glass-card p-10"
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <AlertTriangle className="w-7 h-7" style={{ color: "#b8973a" }} />
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
                Reporte de Vulnerabilidades
              </h2>
              <div
                className="space-y-3 text-base leading-[1.9]"
                style={{
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                <p>
                  Si encuentra una vulnerabilidad de seguridad en NODDO, por favor repórtela de
                  manera responsable a:
                </p>
                <div className="pl-4">
                  <strong style={{ color: "rgba(244,240,232,0.92)" }}>Email:</strong>{" "}
                  <a
                    href="mailto:security@noddo.io"
                    className="underline"
                    style={{ color: "#b8973a" }}
                  >
                    security@noddo.io
                  </a>
                </div>
                <p>
                  Le responderemos en 48 horas con confirmación y cronograma de resolución. Por
                  favor, no divulgue públicamente hasta que hayamos emitido un parche.
                </p>
                <p>
                  Agradecemos a investigadores de seguridad que reporten responsablemente con
                  reconocimiento público (opcional) y potenciales recompensas según severidad.
                </p>
              </div>
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
              className="text-2xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              ¿Preguntas sobre seguridad?
            </h2>
            <p
              className="text-sm mb-6"
              style={{
                fontWeight: 300,
                color: "rgba(244,240,232,0.55)",
              }}
            >
              Estamos felices de responder cualquier consulta sobre nuestras prácticas de seguridad
            </p>
            <a
              href="mailto:security@noddo.io"
              className="btn-mk-primary inline-flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Contactar Security Team
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
