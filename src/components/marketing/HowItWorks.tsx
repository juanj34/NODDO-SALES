"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useBooking } from "./BookingProvider";

/* ── Step 01: Dashboard / Upload panel ── */
function IllustrationUpload() {
  return (
    <svg viewBox="0 0 220 150" fill="none" width="220" height="150">
      {/* Panel frame */}
      <rect x="10" y="10" width="200" height="130" rx="4" stroke="#b8973a" strokeWidth="0.8" opacity="0.4" />
      {/* Title bar */}
      <line x1="10" y1="30" x2="210" y2="30" stroke="#b8973a" strokeWidth="0.5" opacity="0.25" />
      {/* 3 dots in title bar */}
      <circle cx="22" cy="20" r="2" fill="rgba(184,151,58,0.3)" />
      <circle cx="30" cy="20" r="2" fill="rgba(184,151,58,0.2)" />
      <circle cx="38" cy="20" r="2" fill="rgba(184,151,58,0.15)" />

      {/* Left: form fields */}
      {/* Project name field */}
      <rect x="22" y="40" width="80" height="8" rx="1.5" stroke="#b8973a" strokeWidth="0.5" opacity="0.3" />
      <line x1="26" y1="44" x2="70" y2="44" stroke="#b8973a" strokeWidth="0.8" opacity="0.5" />
      {/* Location field with pin */}
      <rect x="22" y="56" width="80" height="8" rx="1.5" stroke="#b8973a" strokeWidth="0.5" opacity="0.3" />
      <circle cx="28" cy="60" r="2" stroke="#b8973a" strokeWidth="0.5" opacity="0.5" />
      <line x1="34" y1="60" x2="62" y2="60" stroke="#b8973a" strokeWidth="0.6" opacity="0.4" />
      {/* Description field (taller) */}
      <rect x="22" y="72" width="80" height="18" rx="1.5" stroke="#b8973a" strokeWidth="0.5" opacity="0.25" />
      <line x1="26" y1="78" x2="90" y2="78" stroke="#b8973a" strokeWidth="0.4" opacity="0.25" />
      <line x1="26" y1="83" x2="76" y2="83" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />

      {/* Right: image placeholders (renders) */}
      <rect x="116" y="40" width="40" height="28" rx="2" stroke="#b8973a" strokeWidth="0.6" opacity="0.35" />
      {/* Mountain/image icon inside */}
      <path d="M122 62 L130 54 L136 58 L142 50 L150 62" stroke="#b8973a" strokeWidth="0.5" opacity="0.3" />
      <circle cx="126" cy="50" r="2" stroke="#b8973a" strokeWidth="0.4" opacity="0.3" />

      <rect x="162" y="40" width="40" height="28" rx="2" stroke="#b8973a" strokeWidth="0.6" opacity="0.35" />
      {/* Grid icon inside */}
      <line x1="170" y1="48" x2="194" y2="48" stroke="#b8973a" strokeWidth="0.3" opacity="0.25" />
      <line x1="170" y1="54" x2="194" y2="54" stroke="#b8973a" strokeWidth="0.3" opacity="0.25" />
      <line x1="182" y1="44" x2="182" y2="64" stroke="#b8973a" strokeWidth="0.3" opacity="0.25" />

      {/* Small thumbnail row */}
      <rect x="116" y="74" width="26" height="16" rx="1.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.25" />
      <rect x="146" y="74" width="26" height="16" rx="1.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.25" />
      <rect x="176" y="74" width="26" height="16" rx="1.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.25" />

      {/* Progress bar at bottom */}
      <rect x="22" y="106" width="180" height="5" rx="2.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />
      <rect x="22" y="106" width="120" height="5" rx="2.5" fill="rgba(184,151,58,0.2)" />

      {/* Upload arrow */}
      <path d="M110 118 L110 128" stroke="#b8973a" strokeWidth="0.8" opacity="0.4" />
      <path d="M106 122 L110 118 L114 122" stroke="#b8973a" strokeWidth="0.8" opacity="0.4" strokeLinecap="round" />
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
      {/* Building outline — isometric-ish two faces */}
      {/* Left face */}
      <polygon points="24,20 94,10 94,120 24,130" stroke="#b8973a" strokeWidth="0.8" opacity="0.3" fill="none" />
      {/* Right face */}
      <polygon points="94,10 168,20 168,130 94,120" stroke="#b8973a" strokeWidth="0.7" opacity="0.25" fill="none" />
      {/* Center edge */}
      <line x1="94" y1="10" x2="94" y2="120" stroke="#b8973a" strokeWidth="1.2" opacity="0.5" />
      {/* Top edge */}
      <line x1="24" y1="20" x2="94" y2="10" stroke="#b8973a" strokeWidth="0.8" opacity="0.4" />
      <line x1="94" y1="10" x2="168" y2="20" stroke="#b8973a" strokeWidth="0.7" opacity="0.35" />

      {/* Floor lines — left face */}
      {[0, 1, 2, 3, 4].map(i => (
        <line key={`fl${i}`} x1="24" y1={42 + i * 16} x2="94" y2={32 + i * 16} stroke="#b8973a" strokeWidth="0.3" opacity="0.15" />
      ))}
      {/* Floor lines — right face */}
      {[0, 1, 2, 3, 4].map(i => (
        <line key={`fr${i}`} x1="94" y1={32 + i * 16} x2="168" y2={42 + i * 16} stroke="#b8973a" strokeWidth="0.3" opacity="0.12" />
      ))}

      {/* Unit dots — the Noddo Grid */}
      {units.map((u, i) => (
        <circle key={i} cx={u.x} cy={u.y} r="4" fill={u.c} opacity="0.7" />
      ))}

      {/* Cursor pointer selecting a unit */}
      <circle cx="74" cy="62" r="7" stroke="#b8973a" strokeWidth="1" opacity="0.6" fill="none" />
      <line x1="79" y1="67" x2="86" y2="74" stroke="#b8973a" strokeWidth="0.8" opacity="0.5" />

      {/* Floating tooltip card */}
      <rect x="150" y="55" width="62" height="34" rx="2" fill="rgba(20,20,20,0.9)" stroke="#b8973a" strokeWidth="0.6" opacity="0.6" />
      <line x1="156" y1="64" x2="200" y2="64" stroke="#b8973a" strokeWidth="0.5" opacity="0.4" />
      <line x1="156" y1="72" x2="190" y2="72" stroke="rgba(244,240,232,0.15)" strokeWidth="0.4" />
      <line x1="156" y1="78" x2="180" y2="78" stroke="rgba(244,240,232,0.1)" strokeWidth="0.4" />
      {/* Connector line from unit to tooltip */}
      <line x1="81" y1="62" x2="150" y2="68" stroke="#b8973a" strokeWidth="0.4" opacity="0.3" strokeDasharray="3 2" />

      {/* Legend — bottom */}
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
      {/* Browser frame */}
      <rect x="10" y="10" width="200" height="130" rx="4" stroke="#b8973a" strokeWidth="0.8" opacity="0.4" />
      {/* Title bar */}
      <line x1="10" y1="28" x2="210" y2="28" stroke="#b8973a" strokeWidth="0.5" opacity="0.25" />
      {/* Browser dots */}
      <circle cx="22" cy="19" r="2" fill="rgba(184,151,58,0.3)" />
      <circle cx="30" cy="19" r="2" fill="rgba(184,151,58,0.2)" />
      <circle cx="38" cy="19" r="2" fill="rgba(184,151,58,0.15)" />
      {/* URL bar */}
      <rect x="50" y="15" width="110" height="8" rx="4" stroke="#b8973a" strokeWidth="0.4" opacity="0.25" />
      {/* URL text line */}
      <line x1="56" y1="19" x2="130" y2="19" stroke="#b8973a" strokeWidth="0.5" opacity="0.35" />

      {/* ── Miniature microsite content ── */}
      {/* Hero image area */}
      <rect x="18" y="34" width="184" height="40" rx="1" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />
      {/* Gradient overlay */}
      <rect x="18" y="54" width="184" height="20" fill="rgba(184,151,58,0.06)" />
      {/* Title lines */}
      <line x1="26" y1="62" x2="90" y2="62" stroke="#b8973a" strokeWidth="0.8" opacity="0.4" />
      <line x1="26" y1="68" x2="70" y2="68" stroke="#b8973a" strokeWidth="0.5" opacity="0.25" />

      {/* Mini building silhouette in hero */}
      <rect x="150" y="38" width="16" height="32" stroke="#b8973a" strokeWidth="0.4" opacity="0.15" />
      <rect x="168" y="44" width="12" height="26" stroke="#b8973a" strokeWidth="0.3" opacity="0.12" />
      <rect x="138" y="48" width="10" height="22" stroke="#b8973a" strokeWidth="0.3" opacity="0.1" />

      {/* Content cards below hero */}
      <rect x="18" y="80" width="56" height="30" rx="1.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />
      <rect x="80" y="80" width="56" height="30" rx="1.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />
      <rect x="142" y="80" width="56" height="30" rx="1.5" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />
      {/* Card content lines */}
      <line x1="24" y1="92" x2="60" y2="92" stroke="#b8973a" strokeWidth="0.3" opacity="0.15" />
      <line x1="24" y1="97" x2="50" y2="97" stroke="#b8973a" strokeWidth="0.3" opacity="0.1" />
      <line x1="86" y1="92" x2="122" y2="92" stroke="#b8973a" strokeWidth="0.3" opacity="0.15" />
      <line x1="86" y1="97" x2="110" y2="97" stroke="#b8973a" strokeWidth="0.3" opacity="0.1" />
      <line x1="148" y1="92" x2="184" y2="92" stroke="#b8973a" strokeWidth="0.3" opacity="0.15" />
      <line x1="148" y1="97" x2="174" y2="97" stroke="#b8973a" strokeWidth="0.3" opacity="0.1" />

      {/* ── Share / radiating connections ── */}
      {/* Central share node */}
      <circle cx="110" cy="126" r="5" stroke="#b8973a" strokeWidth="0.8" opacity="0.5" fill="rgba(184,151,58,0.08)" />
      {/* Link icon inside */}
      <path d="M107 126 L113 126" stroke="#b8973a" strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
      <path d="M108 124 C106 124 105 125 105 126 C105 127 106 128 108 128" stroke="#b8973a" strokeWidth="0.6" opacity="0.4" fill="none" />
      <path d="M112 124 C114 124 115 125 115 126 C115 127 114 128 112 128" stroke="#b8973a" strokeWidth="0.6" opacity="0.4" fill="none" />

      {/* Radiating lines to channels */}
      <line x1="105" y1="124" x2="60" y2="118" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" strokeDasharray="3 2" />
      <line x1="115" y1="124" x2="160" y2="118" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" strokeDasharray="3 2" />
      <line x1="105" y1="128" x2="70" y2="138" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" strokeDasharray="3 2" />
      <line x1="115" y1="128" x2="150" y2="138" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" strokeDasharray="3 2" />

      {/* Channel endpoint dots */}
      <circle cx="58" cy="117" r="3" stroke="#b8973a" strokeWidth="0.5" opacity="0.35" fill="none" />
      <circle cx="162" cy="117" r="3" stroke="#b8973a" strokeWidth="0.5" opacity="0.35" fill="none" />
      <circle cx="68" cy="139" r="3" stroke="#b8973a" strokeWidth="0.5" opacity="0.35" fill="none" />
      <circle cx="152" cy="139" r="3" stroke="#b8973a" strokeWidth="0.5" opacity="0.35" fill="none" />
    </svg>
  );
}

const steps = [
  {
    num: "01",
    illustration: <IllustrationUpload />,
    title: "Sube tu proyecto",
    body: "Nombre, ubicación, renders, planos y tipologías. Todo desde un panel simple. Sin código, sin agencia, sin fricción.",
    tag: "5 minutos",
  },
  {
    num: "02",
    illustration: <IllustrationGrid />,
    title: "Configura el Noddo Grid",
    body: "Asigna cada unidad en la fachada. Define precio, área, estado y tipología. El Grid se actualiza en tiempo real a medida que vendes.",
    tag: "30 minutos",
  },
  {
    num: "03",
    illustration: <IllustrationShare />,
    title: "Comparte el link",
    body: "Tu sala de ventas queda en [proyecto].noddo.io — lista para campañas, WhatsApp, redes y equipos comerciales. Los leads llegan solos.",
    tag: "Publicado en 1 día",
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function HowItWorks() {
  const { openBooking } = useBooking();

  return (
    <section className="relative z-[1] py-28 lg:py-40 px-6 lg:px-20 border-t border-[var(--mk-border-rule)]">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="mk-section-label mb-6">Cómo funciona</div>

        <h2 className="mk-section-heading mb-16">
          Tres pasos. <em>Un día.</em>
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
            ¿Listo para publicar tu proyecto <span style={{ color: "var(--mk-accent-light)", fontStyle: "italic" }}>en 24 horas</span>?
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
                Agendar Llamada
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-[12px]" style={{ color: "rgba(244,240,232,0.35)" }}>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--mk-accent)" }}>✓</span>
              Sin código
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--mk-accent)" }}>✓</span>
              Sin agencia
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--mk-accent)" }}>✓</span>
              Sin esperar
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
