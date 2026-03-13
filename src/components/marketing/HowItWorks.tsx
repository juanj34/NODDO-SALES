"use client";

import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="5" width="16" height="12" stroke="rgba(184,151,58,.6)" strokeWidth="1.2" fill="none" />
        <line x1="2" y1="9" x2="18" y2="9" stroke="rgba(184,151,58,.3)" strokeWidth="1" />
        <rect x="7" y="2" width="6" height="4" stroke="rgba(184,151,58,.4)" strokeWidth="1" fill="none" />
      </svg>
    ),
    title: "Sube tu proyecto",
    body: "Nombre, ubicación, renders, planos y tipologías. Todo desde un panel simple. Sin código, sin agencia, sin fricción.",
    tag: "5 minutos",
  },
  {
    num: "02",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polygon points="10,2 18,17 2,17" stroke="rgba(184,151,58,.6)" strokeWidth="1.2" fill="none" />
        <line x1="10" y1="7" x2="10" y2="13" stroke="rgba(184,151,58,.4)" strokeWidth="1" />
        <circle cx="10" cy="15" r="1" fill="rgba(184,151,58,.6)" />
      </svg>
    ),
    title: "Configura el Noddo Grid",
    body: "Asigna cada unidad en la fachada. Define precio, área, estado y tipología. El Grid se actualiza en tiempo real a medida que vendes.",
    tag: "30 minutos",
  },
  {
    num: "03",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="rgba(184,151,58,.6)" strokeWidth="1.2" fill="none" />
        <path d="M7 10 L10 13 L14 7" stroke="rgba(184,151,58,.6)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    ),
    title: "Comparte el link",
    body: "Tu sala de ventas queda en [proyecto].noddo.io — lista para campañas, WhatsApp, redes y equipos comerciales. Los leads llegan solos.",
    tag: "Publicado en 1 día",
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function HowItWorks() {
  return (
    <section className="relative z-[1] py-28 lg:py-40 px-6 lg:px-20 border-t border-[var(--mk-border-rule)]">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="mk-section-label mb-6">Cómo funciona</div>

        <h2 className="mk-section-heading mb-16">
          Tres pasos.<br />
          <em>Un día.</em>
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
              style={{ padding: "52px 40px", background: "var(--mk-bg)" }}
            >
              {/* Number */}
              <div
                className="font-heading leading-none mb-7"
                style={{ fontSize: 72, fontWeight: 300, color: "rgba(184,151,58,0.15)", letterSpacing: "-0.03em" }}
              >
                {step.num}
              </div>

              {/* Icon */}
              <div
                className="flex items-center justify-center mb-5"
                style={{ width: 40, height: 40, border: "1px solid rgba(184,151,58,0.3)" }}
              >
                {step.icon}
              </div>

              {/* Title */}
              <div className="font-ui text-[13px] font-bold uppercase tracking-[0.08em] mb-3" style={{ color: "var(--mk-text-primary)" }}>
                {step.title}
              </div>

              {/* Body */}
              <div className="text-[12px] leading-[1.8]" style={{ color: "rgba(244,240,232,0.55)" }}>
                {step.body}
              </div>

              {/* Tag */}
              <span
                className="inline-block mt-5 font-ui text-[9px] tracking-[0.2em] uppercase"
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
      </div>
    </section>
  );
}
