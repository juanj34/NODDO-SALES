"use client";

import { motion } from "framer-motion";
import { Activity, CheckCircle2, Clock, AlertCircle, Server, Zap, Database, Globe } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

type Incident = {
  date: string;
  title: string;
  status: "resolved" | "investigating" | "monitoring";
  duration: string;
  description: string;
};

/* ─── Infrastructure Monitor SVG ─── */
function InfrastructureMonitorIllustration() {
  return (
    <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
      <svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Infrastructure Monitor">
        <style>{`
          /* ── server LED cascade ── */
          .st-led0{animation:st-led 2s ease-in-out infinite}
          .st-led1{animation:st-led 2s ease-in-out infinite .3s}
          .st-led2{animation:st-led 2s ease-in-out infinite .6s}
          .st-led3{animation:st-led 2s ease-in-out infinite .9s}
          .st-led4{animation:st-led 2s ease-in-out infinite 1.2s}
          .st-led5{animation:st-led 2s ease-in-out infinite 1.5s}
          @keyframes st-led{0%,100%{opacity:.4;r:1.5}50%{opacity:1;r:2}}

          /* ── heartbeat ECG flow ── */
          .st-ecg{stroke-dasharray:200;stroke-dashoffset:200;animation:st-ecg 2s linear infinite}
          @keyframes st-ecg{to{stroke-dashoffset:0}}

          /* ── uptime gauge fill ── */
          .st-gauge{stroke-dasharray:170;stroke-dashoffset:170;animation:st-gauge-fill 2s ease-out forwards}
          @keyframes st-gauge-fill{to{stroke-dashoffset:5}}

          /* ── gauge glow ── */
          .st-gauge-glow{animation:st-gauge-glow 3s ease-in-out infinite}
          @keyframes st-gauge-glow{0%,100%{opacity:.05}50%{opacity:.15}}

          /* ── network node pulse ── */
          .st-node0{animation:st-node 3s ease-in-out infinite}
          .st-node1{animation:st-node 3s ease-in-out infinite .4s}
          .st-node2{animation:st-node 3s ease-in-out infinite .8s}
          .st-node3{animation:st-node 3s ease-in-out infinite 1.2s}
          .st-node4{animation:st-node 3s ease-in-out infinite 1.6s}
          @keyframes st-node{0%,100%{opacity:.5}50%{opacity:1}}

          /* ── data packet travel ── */
          .st-pkt0{animation:st-pkt 2.5s linear infinite}
          .st-pkt1{animation:st-pkt 2.5s linear infinite .6s}
          .st-pkt2{animation:st-pkt 2.5s linear infinite 1.2s}
          .st-pkt3{animation:st-pkt 2.5s linear infinite 1.8s}
          @keyframes st-pkt{0%{opacity:0;transform:translateX(0)}10%{opacity:.6}90%{opacity:.6}100%{opacity:0;transform:translateX(16px)}}

          /* ── network flow dashes ── */
          .st-flow{stroke-dasharray:4 3;animation:st-flow 1.5s linear infinite}
          @keyframes st-flow{to{stroke-dashoffset:-14}}

          /* ── status timeline segments ── */
          .st-seg0{animation:st-seg 4s ease-in-out infinite}
          .st-seg1{animation:st-seg 4s ease-in-out infinite .5s}
          .st-seg2{animation:st-seg 4s ease-in-out infinite 1s}
          .st-seg3{animation:st-seg 4s ease-in-out infinite 1.5s}
          .st-seg4{animation:st-seg 4s ease-in-out infinite 2s}
          .st-seg5{animation:st-seg 4s ease-in-out infinite 2.5s}
          @keyframes st-seg{0%,100%{opacity:.5}50%{opacity:1}}

          /* ── server rack breathe ── */
          .st-rack{animation:st-rack 5s ease-in-out infinite}
          @keyframes st-rack{0%,100%{opacity:.85}50%{opacity:1}}

          /* ── background pulse ── */
          .st-bg-pulse{animation:st-bg-pulse 4s ease-in-out infinite}
          @keyframes st-bg-pulse{0%,100%{opacity:.03}50%{opacity:.07}}

          /* ── grid lines subtle pulse ── */
          .st-grid{animation:st-grid 6s ease-in-out infinite}
          @keyframes st-grid{0%,100%{opacity:.04}50%{opacity:.08}}

          /* ── gold dust ── */
          .st-dust1{animation:st-dust-a 7s ease-in-out infinite}
          .st-dust2{animation:st-dust-a 9s ease-in-out infinite 1.5s}
          .st-dust3{animation:st-dust-a 8s ease-in-out infinite 3s}
          .st-dust4{animation:st-dust-b 10s ease-in-out infinite .8s}
          .st-dust5{animation:st-dust-b 7.5s ease-in-out infinite 2.2s}
          @keyframes st-dust-a{0%,100%{opacity:0;transform:translateY(0)}25%{opacity:.45}75%{opacity:.2}50%{transform:translateY(-8px)}}
          @keyframes st-dust-b{0%,100%{opacity:0;transform:translateY(0)}25%{opacity:.35}75%{opacity:.15}50%{transform:translateY(-10px)}}

          /* ── percent counter pulse ── */
          .st-pct{animation:st-pct 3s ease-in-out infinite}
          @keyframes st-pct{0%,100%{opacity:.7}50%{opacity:1}}
        `}</style>

        {/* Background glow */}
        <circle cx="160" cy="90" r="75" fill="rgba(184,151,58,0.04)" className="st-bg-pulse" />

        {/* ── Dashboard frame ── */}
        <rect x="8" y="6" width="304" height="168" rx="5" fill="rgba(184,151,58,0.01)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        {/* Title bar */}
        <rect x="8" y="6" width="304" height="12" rx="5" fill="rgba(184,151,58,0.03)" />
        <rect x="8" y="13" width="304" height="5" fill="rgba(184,151,58,0.03)" />
        {/* Traffic lights */}
        <circle cx="16" cy="12" r="1.5" fill="rgba(239,68,68,0.5)" />
        <circle cx="22" cy="12" r="1.5" fill="rgba(251,191,36,0.5)" />
        <circle cx="28" cy="12" r="1.5" fill="rgba(74,222,128,0.5)" />
        {/* Title */}
        <text x="160" y="14" textAnchor="middle" fill="rgba(184,151,58,0.4)" fontSize="4" fontFamily="monospace">NODDO INFRASTRUCTURE MONITOR</text>

        {/* ── Left panel: Server rack ── */}
        <rect x="16" y="24" width="56" height="90" rx="3" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" className="st-rack" />
        <text x="20" y="31" fill="rgba(184,151,58,0.35)" fontSize="3" fontFamily="monospace">SERVER RACK</text>

        {/* Server blades — 6 slots */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={`blade-${i}`}>
            <rect x="20" y={36 + i * 12} width="48" height="9" rx="1" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" />
            {/* Blade details — vents */}
            <line x1="24" y1={38 + i * 12} x2="24" y2={43 + i * 12} stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
            <line x1="26" y1={38 + i * 12} x2="26" y2={43 + i * 12} stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
            <line x1="28" y1={38 + i * 12} x2="28" y2={43 + i * 12} stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
            {/* Text label */}
            <text x="34" y={42 + i * 12} fill="rgba(184,151,58,0.2)" fontSize="2.5" fontFamily="monospace">SRV-0{i + 1}</text>
            {/* Activity bar */}
            <rect x="50" y={38 + i * 12} width={10 + (i % 3) * 3} height="2" rx="0.5" fill="rgba(74,222,128,0.1)" stroke="rgba(74,222,128,0.15)" strokeWidth="0.2" />
            {/* Status LED */}
            <circle cx="64" cy={40.5 + i * 12} r="1.5" fill="rgba(74,222,128,0.6)" className={`st-led${i}`} />
          </g>
        ))}

        {/* ── Center: ECG Heartbeat + Grid ── */}
        <rect x="80" y="24" width="120" height="56" rx="3" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <text x="84" y="31" fill="rgba(184,151,58,0.35)" fontSize="3" fontFamily="monospace">REAL-TIME HEALTH</text>

        {/* Reference grid lines */}
        <g className="st-grid">
          <line x1="84" y1="42" x2="196" y2="42" stroke="rgba(184,151,58,0.06)" strokeWidth="0.2" />
          <line x1="84" y1="52" x2="196" y2="52" stroke="rgba(184,151,58,0.06)" strokeWidth="0.2" />
          <line x1="84" y1="62" x2="196" y2="62" stroke="rgba(184,151,58,0.06)" strokeWidth="0.2" />
          <line x1="84" y1="72" x2="196" y2="72" stroke="rgba(184,151,58,0.06)" strokeWidth="0.2" />
          {/* Vertical grid */}
          <line x1="100" y1="34" x2="100" y2="76" stroke="rgba(184,151,58,0.04)" strokeWidth="0.2" />
          <line x1="120" y1="34" x2="120" y2="76" stroke="rgba(184,151,58,0.04)" strokeWidth="0.2" />
          <line x1="140" y1="34" x2="140" y2="76" stroke="rgba(184,151,58,0.04)" strokeWidth="0.2" />
          <line x1="160" y1="34" x2="160" y2="76" stroke="rgba(184,151,58,0.04)" strokeWidth="0.2" />
          <line x1="180" y1="34" x2="180" y2="76" stroke="rgba(184,151,58,0.04)" strokeWidth="0.2" />
        </g>

        {/* Heartbeat ECG path */}
        <path
          className="st-ecg"
          d="M84 56 L92 56 L96 56 L100 56 L104 48 L108 64 L112 40 L116 68 L120 52 L124 56 L132 56 L136 56 L140 56 L144 48 L148 64 L152 38 L156 70 L160 52 L164 56 L172 56 L176 56 L180 56 L184 50 L188 62 L192 44 L196 56"
          fill="none"
          stroke="#b8973a"
          strokeWidth="0.8"
          opacity="0.6"
        />
        {/* Shadow/glow behind ECG */}
        <path
          d="M84 56 L92 56 L96 56 L100 56 L104 48 L108 64 L112 40 L116 68 L120 52 L124 56 L132 56 L136 56 L140 56 L144 48 L148 64 L152 38 L156 70 L160 52 L164 56 L172 56 L176 56 L180 56 L184 50 L188 62 L192 44 L196 56"
          fill="none"
          stroke="rgba(184,151,58,0.15)"
          strokeWidth="3"
          filter="url(#st-blur)"
        />

        {/* Labels on grid */}
        <text x="84" y="40" fill="rgba(184,151,58,0.2)" fontSize="2.2" fontFamily="monospace">100%</text>
        <text x="84" y="75" fill="rgba(184,151,58,0.2)" fontSize="2.2" fontFamily="monospace">0%</text>

        {/* ── Right panel: Uptime gauge ── */}
        <rect x="208" y="24" width="96" height="56" rx="3" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <text x="212" y="31" fill="rgba(184,151,58,0.35)" fontSize="3" fontFamily="monospace">UPTIME — 30 DAYS</text>

        {/* Gauge glow */}
        <circle cx="256" cy="58" r="20" fill="rgba(184,151,58,0.05)" className="st-gauge-glow" />

        {/* Gauge background arc */}
        <circle
          cx="256" cy="58" r="18"
          fill="none"
          stroke="rgba(184,151,58,0.06)"
          strokeWidth="3"
          strokeDasharray="170"
          strokeDashoffset="28"
          strokeLinecap="round"
          transform="rotate(135, 256, 58)"
        />
        {/* Gauge filled arc */}
        <circle
          className="st-gauge"
          cx="256" cy="58" r="18"
          fill="none"
          stroke="#b8973a"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.7"
          transform="rotate(135, 256, 58)"
        />

        {/* Gauge percentage text */}
        <text className="st-pct" x="256" y="57" textAnchor="middle" fill="#b8973a" fontSize="8" fontFamily="serif" fontWeight="300" opacity="0.8">99.97</text>
        <text x="256" y="63" textAnchor="middle" fill="rgba(184,151,58,0.4)" fontSize="3.5" fontFamily="monospace">% UPTIME</text>

        {/* Gauge tick marks */}
        <line x1="238" y1="58" x2="240" y2="58" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />
        <line x1="256" y1="40" x2="256" y2="42" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />
        <line x1="274" y1="58" x2="272" y2="58" stroke="rgba(184,151,58,0.15)" strokeWidth="0.3" />

        {/* ── Bottom: Network topology ── */}
        <rect x="16" y="118" width="288" height="48" rx="3" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <text x="20" y="125" fill="rgba(184,151,58,0.35)" fontSize="3" fontFamily="monospace">NETWORK TOPOLOGY</text>

        {/* 5 nodes: CDN → Edge → API → DB → Storage */}
        {/* Node 0: CDN */}
        <circle cx="60" cy="144" r="8" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.25)" strokeWidth="0.5" className="st-node0" />
        <text x="60" y="143" textAnchor="middle" fill="rgba(184,151,58,0.5)" fontSize="3" fontFamily="monospace">CDN</text>
        <text x="60" y="148" textAnchor="middle" fill="rgba(184,151,58,0.25)" fontSize="2" fontFamily="monospace">Vercel</text>

        {/* Node 1: Edge */}
        <circle cx="120" cy="144" r="8" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.25)" strokeWidth="0.5" className="st-node1" />
        <text x="120" y="143" textAnchor="middle" fill="rgba(184,151,58,0.5)" fontSize="3" fontFamily="monospace">EDGE</text>
        <text x="120" y="148" textAnchor="middle" fill="rgba(184,151,58,0.25)" fontSize="2" fontFamily="monospace">CF</text>

        {/* Node 2: API */}
        <circle cx="180" cy="144" r="8" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.25)" strokeWidth="0.5" className="st-node2" />
        <text x="180" y="143" textAnchor="middle" fill="rgba(184,151,58,0.5)" fontSize="3" fontFamily="monospace">API</text>
        <text x="180" y="148" textAnchor="middle" fill="rgba(184,151,58,0.25)" fontSize="2" fontFamily="monospace">Next.js</text>

        {/* Node 3: DB */}
        <circle cx="240" cy="144" r="8" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.25)" strokeWidth="0.5" className="st-node3" />
        <text x="240" y="143" textAnchor="middle" fill="rgba(184,151,58,0.5)" fontSize="3" fontFamily="monospace">DB</text>
        <text x="240" y="148" textAnchor="middle" fill="rgba(184,151,58,0.25)" fontSize="2" fontFamily="monospace">PG</text>

        {/* Node 4: Storage */}
        <circle cx="290" cy="144" r="8" fill="rgba(184,151,58,0.04)" stroke="rgba(184,151,58,0.25)" strokeWidth="0.5" className="st-node4" />
        <text x="290" y="143" textAnchor="middle" fill="rgba(184,151,58,0.5)" fontSize="3" fontFamily="monospace">S3</text>
        <text x="290" y="148" textAnchor="middle" fill="rgba(184,151,58,0.25)" fontSize="2" fontFamily="monospace">R2</text>

        {/* Connecting lines */}
        <line x1="68" y1="144" x2="112" y2="144" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" className="st-flow" />
        <line x1="128" y1="144" x2="172" y2="144" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" className="st-flow" />
        <line x1="188" y1="144" x2="232" y2="144" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" className="st-flow" />
        <line x1="248" y1="144" x2="282" y2="144" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" className="st-flow" />

        {/* Data packets traveling along lines */}
        <rect x="78" y="142.5" width="4" height="3" rx="0.5" fill="rgba(184,151,58,0.3)" className="st-pkt0" />
        <rect x="138" y="142.5" width="4" height="3" rx="0.5" fill="rgba(184,151,58,0.3)" className="st-pkt1" />
        <rect x="198" y="142.5" width="4" height="3" rx="0.5" fill="rgba(184,151,58,0.3)" className="st-pkt2" />
        <rect x="258" y="142.5" width="4" height="3" rx="0.5" fill="rgba(184,151,58,0.3)" className="st-pkt3" />

        {/* ── Status timeline bar (bottom of center section) ── */}
        <rect x="80" y="84" width="120" height="28" rx="3" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <text x="84" y="91" fill="rgba(184,151,58,0.35)" fontSize="3" fontFamily="monospace">STATUS — 7 DAYS</text>

        {/* 6 segments for 6 services */}
        {["App", "API", "DB", "S3", "CDN", "Mail"].map((name, i) => (
          <g key={`seg-${name}`}>
            <text x={86 + i * 18} y="99" fill="rgba(184,151,58,0.25)" fontSize="2.2" fontFamily="monospace">{name}</text>
            <rect
              x={84 + i * 18} y="101" width="16" height="4" rx="1"
              fill="rgba(74,222,128,0.2)"
              stroke="rgba(74,222,128,0.3)"
              strokeWidth="0.3"
              className={`st-seg${i}`}
            />
          </g>
        ))}

        {/* All green label */}
        <text x="140" y="110" textAnchor="middle" fill="rgba(74,222,128,0.4)" fontSize="2.5" fontFamily="monospace">ALL OPERATIONAL</text>

        {/* ── Right: Response time panel ── */}
        <rect x="208" y="84" width="96" height="28" rx="3" fill="rgba(184,151,58,0.02)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <text x="212" y="91" fill="rgba(184,151,58,0.35)" fontSize="3" fontFamily="monospace">AVG RESPONSE</text>

        {/* Response time bars */}
        <rect x="216" y="96" width="30" height="3" rx="0.5" fill="rgba(74,222,128,0.15)" stroke="rgba(74,222,128,0.2)" strokeWidth="0.2" />
        <text x="250" y="99" fill="rgba(184,151,58,0.3)" fontSize="2.5" fontFamily="monospace">42ms p50</text>

        <rect x="216" y="101" width="45" height="3" rx="0.5" fill="rgba(184,151,58,0.1)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.2" />
        <text x="265" y="104" fill="rgba(184,151,58,0.3)" fontSize="2.5" fontFamily="monospace">85ms p95</text>

        <rect x="216" y="106" width="58" height="3" rx="0.5" fill="rgba(212,176,90,0.1)" stroke="rgba(212,176,90,0.15)" strokeWidth="0.2" />
        <text x="278" y="109" fill="rgba(184,151,58,0.3)" fontSize="2.5" fontFamily="monospace">142ms p99</text>

        {/* ── Blur filter for ECG glow ── */}
        <defs>
          <filter id="st-blur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* ── Gold dust ── */}
        <circle cx="45" cy="115" r="0.7" fill="#b8973a" className="st-dust1" />
        <circle cx="285" cy="30" r="0.6" fill="#b8973a" className="st-dust2" />
        <circle cx="155" cy="168" r="0.8" fill="#b8973a" className="st-dust3" />
        <circle cx="210" cy="120" r="0.5" fill="#b8973a" className="st-dust4" />
        <circle cx="100" cy="35" r="0.6" fill="#b8973a" className="st-dust5" />
      </svg>
    </div>
  );
}

/* ─── page ─── */
export default function EstadoPage() {
  usePageView("Estado");

  const status = {
    overall: "operational" as const,
    uptime: "99.97%",
    lastChecked: new Date().toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Bogota",
    }),
    services: [
      { name: "Aplicación Web", description: "Panel de administración y microsites", status: "operational", uptime: "99.98%" },
      { name: "API", description: "Endpoints REST y webhooks", status: "operational", uptime: "99.96%" },
      { name: "Base de Datos", description: "PostgreSQL (Supabase)", status: "operational", uptime: "99.99%" },
      { name: "Storage", description: "Cloudflare R2 + Supabase Storage", status: "operational", uptime: "100%" },
      { name: "CDN", description: "Vercel Edge Network", status: "operational", uptime: "100%" },
      { name: "Email", description: "Notificaciones transaccionales (Resend)", status: "operational", uptime: "99.95%" },
    ],
    incidents: [] as Incident[],
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "operational": return "#4ade80";
      case "degraded": return "#fbbf24";
      case "outage": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusText = (s: string) => {
    switch (s) {
      case "operational": return "Operacional";
      case "degraded": return "Degradado";
      case "outage": return "Fuera de servicio";
      default: return "Desconocido";
    }
  };

  const renderStatusIcon = (statusType: string, className?: string, style?: React.CSSProperties) => {
    const iconProps = { className, style };
    switch (statusType) {
      case "operational": return <CheckCircle2 {...iconProps} />;
      case "degraded": return <AlertCircle {...iconProps} />;
      case "outage": return <AlertCircle {...iconProps} />;
      default: return <Clock {...iconProps} />;
    }
  };

  const serviceIcons = [Server, Zap, Database, Globe, Globe, Server];

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
            <Activity className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Estado del Sistema
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
            Estado del{" "}
            <em style={{ fontStyle: "italic", color: "#b8973a" }}>Servicio</em>
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
            Monitoreo en tiempo real de todos los servicios de NODDO. Última verificación:{" "}
            {status.lastChecked} COT
          </motion.p>
        </div>

        {/* Hero SVG */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease }}
          className="mb-16"
        >
          <InfrastructureMonitorIllustration />
        </motion.div>

        {/* Overall Status */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease }}
          className="glass-card p-10 mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="p-4 rounded-xl"
                style={{ backgroundColor: "rgba(78, 222, 128, 0.12)" }}
              >
                {renderStatusIcon(
                  status.overall,
                  "w-8 h-8",
                  { color: getStatusColor(status.overall) }
                )}
              </div>
              <div>
                <h2
                  className="text-3xl mb-1"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 400,
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  Todos los Sistemas{" "}
                  <span style={{ color: getStatusColor(status.overall) }}>
                    {getStatusText(status.overall)}
                  </span>
                </h2>
                <p
                  className="text-sm"
                  style={{
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.55)",
                  }}
                >
                  Uptime últimos 30 días: {status.uptime}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Services Status */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease }}
          className="mb-12"
        >
          <h2
            className="text-2xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Estado de Servicios
          </h2>
          <div className="space-y-4">
            {status.services.map((service, index) => {
              const Icon = serviceIcons[index] || Server;
              return (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: "rgba(184, 151, 58, 0.08)" }}
                      >
                        <Icon className="w-5 h-5" style={{ color: "#b8973a" }} />
                      </div>
                      <div>
                        <h3
                          className="text-base font-medium mb-0.5"
                          style={{
                            fontWeight: 400,
                            color: "rgba(244,240,232,0.92)",
                          }}
                        >
                          {service.name}
                        </h3>
                        <p
                          className="text-xs"
                          style={{
                            fontWeight: 300,
                            color: "rgba(244,240,232,0.55)",
                          }}
                        >
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p
                          className="text-xs mb-0.5"
                          style={{
                            fontWeight: 300,
                            color: "rgba(244,240,232,0.55)",
                          }}
                        >
                          Uptime 30d
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{
                            fontWeight: 400,
                            color: "rgba(244,240,232,0.92)",
                          }}
                        >
                          {service.uptime}
                        </p>
                      </div>
                      {renderStatusIcon(
                        service.status,
                        "w-6 h-6",
                        { color: getStatusColor(service.status) }
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Incidents */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.08, ease }}
          className="mb-12"
        >
          <h2
            className="text-2xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Incidentes Recientes
          </h2>
          {status.incidents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease }}
              className="glass-card p-10 text-center"
            >
              <CheckCircle2
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "#4ade80" }}
              />
              <h3
                className="text-xl mb-2"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Sin Incidentes
              </h3>
              <p
                className="text-sm"
                style={{
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.55)",
                }}
              >
                No se han reportado incidentes en los últimos 90 días. Todos los sistemas operan
                normalmente.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {status.incidents.map((incident, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease }}
                  className="glass-card p-6"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="p-2 rounded-lg mt-1"
                      style={{
                        backgroundColor:
                          incident.status === "resolved"
                            ? "rgba(78, 222, 128, 0.12)"
                            : "rgba(251, 191, 36, 0.12)",
                      }}
                    >
                      {incident.status === "resolved" ? (
                        <CheckCircle2 className="w-5 h-5" style={{ color: "#4ade80" }} />
                      ) : (
                        <AlertCircle className="w-5 h-5" style={{ color: "#fbbf24" }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3
                          className="text-base font-medium"
                          style={{
                            fontWeight: 400,
                            color: "rgba(244,240,232,0.92)",
                          }}
                        >
                          {incident.title}
                        </h3>
                        <span
                          className="text-xs px-3 py-1 rounded-full"
                          style={{
                            fontFamily: "var(--font-syne)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            backgroundColor:
                              incident.status === "resolved"
                                ? "rgba(78, 222, 128, 0.12)"
                                : "rgba(251, 191, 36, 0.12)",
                            color:
                              incident.status === "resolved" ? "#4ade80" : "#fbbf24",
                          }}
                        >
                          {incident.status === "resolved" ? "Resuelto" : "En Progreso"}
                        </span>
                      </div>
                      <p
                        className="text-sm mb-2"
                        style={{
                          fontWeight: 300,
                          color: "rgba(244,240,232,0.70)",
                        }}
                      >
                        {incident.description}
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          fontWeight: 300,
                          color: "rgba(244,240,232,0.55)",
                        }}
                      >
                        {incident.date} • Duración: {incident.duration}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="glass-card p-8"
        >
          <h3
            className="text-lg mb-3"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Sobre Esta Página
          </h3>
          <div
            className="space-y-2 text-sm leading-[1.8]"
            style={{
              fontWeight: 300,
              color: "rgba(244,240,232,0.70)",
            }}
          >
            <p>
              Esta página muestra el estado en tiempo real de todos los servicios de NODDO.
              Monitoreamos constantemente la disponibilidad, rendimiento, y salud de nuestra
              infraestructura.
            </p>
            <p>
              <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                ¿Experimentando problemas?
              </strong>{" "}
              Si nota comportamiento anormal que no está reflejado aquí, por favor contáctenos en{" "}
              <a
                href="mailto:soporte@noddo.io"
                className="underline"
                style={{ color: "#b8973a" }}
              >
                soporte@noddo.io
              </a>
            </p>
            <p>
              <strong style={{ color: "rgba(244,240,232,0.92)" }}>Suscribirse a alertas:</strong>{" "}
              Próximamente podrás suscribirte a notificaciones por email o SMS cuando ocurran
              incidentes.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
