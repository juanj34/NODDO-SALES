"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, Globe, Settings, Server } from "lucide-react";
import { HeroSection } from "@/components/marketing/HeroSection";
import { BentoGrid } from "@/components/marketing/BentoGrid";
import { ShowcaseCarousel } from "@/components/marketing/ShowcaseCarousel";
import { MagneticButton } from "@/components/ui/MagneticButton";

/* ─── Animation helpers ─── */

const ease = [0.25, 0.46, 0.45, 0.94] as const;

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Data ─── */

const steps = [
  {
    num: "01",
    title: "Crea tu Masterplan",
    desc: "Sube tu información básica, logos, colores y un render principal. Tu plataforma nace instantáneamente.",
    icon: (
      <svg viewBox="0 0 80 60" fill="none" className="w-20 h-15" aria-hidden="true">
        {/* Upload document with converging arrows */}
        <rect x="22" y="8" width="36" height="44" rx="4" fill="none" stroke="var(--mk-border-rule)" strokeWidth="1.5" />
        <rect x="30" y="18" width="20" height="3" rx="1" fill="var(--mk-border-rule)" />
        <rect x="30" y="26" width="14" height="3" rx="1" fill="var(--mk-border-rule)" opacity="0.6" />
        <rect x="30" y="34" width="18" height="3" rx="1" fill="var(--mk-border-rule)" opacity="0.4" />
        {/* Upload arrow */}
        <path d="M40 48 L40 55" stroke="var(--mk-accent)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M36 51 L40 47 L44 51" stroke="var(--mk-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Color swatch */}
        <circle cx="12" cy="20" r="5" fill="var(--mk-accent)" opacity="0.3" />
        <circle cx="68" cy="20" r="5" fill="var(--mk-border-rule)" opacity="0.5" />
        {/* Connecting lines */}
        <path d="M17 20 L22 20" stroke="var(--mk-border-rule)" strokeWidth="0.5" strokeDasharray="2 2" />
        <path d="M58 20 L63 20" stroke="var(--mk-border-rule)" strokeWidth="0.5" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Sube tu Inventario",
    desc: "Configura tus tipologías, torres y unidades con sus estados de venta actualizados.",
    icon: (
      <svg viewBox="0 0 80 60" fill="none" className="w-20 h-15" aria-hidden="true">
        {/* Spreadsheet grid */}
        {[0, 1, 2, 3, 4].map((row) => (
          <g key={`r-${row}`}>
            {[0, 1, 2, 3].map((col) => (
              <rect
                key={`c-${row}-${col}`}
                x={10 + col * 16}
                y={8 + row * 10}
                width="14"
                height="8"
                rx="1"
                fill={col === 1 ? "rgba(99,102,241,0.15)" : "none"}
                stroke="var(--mk-border-rule)"
                strokeWidth="0.5"
              />
            ))}
          </g>
        ))}
        {/* Tower icon */}
        <rect x="16" y="2" width="8" height="4" rx="1" fill="var(--mk-accent)" opacity="0.4" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Vende como Nunca",
    desc: "Genera enlaces mágicos, compártelos con tus clientes o muéstralos en la sala de ventas.",
    icon: (
      <svg viewBox="0 0 80 60" fill="none" className="w-20 h-15" aria-hidden="true">
        {/* Center link */}
        <circle cx="40" cy="30" r="8" fill="none" stroke="var(--mk-accent)" strokeWidth="1.5" />
        <path d="M37 30 L43 30 M40 27 L40 33" stroke="var(--mk-accent)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Device icons radiating outward */}
        {/* Phone */}
        <rect x="8" y="16" width="10" height="16" rx="2" fill="none" stroke="var(--mk-border-rule)" strokeWidth="1" />
        <circle cx="13" cy="29" r="1" fill="var(--mk-border-rule)" />
        {/* Laptop */}
        <rect x="58" y="18" width="16" height="10" rx="1" fill="none" stroke="var(--mk-border-rule)" strokeWidth="1" />
        <rect x="56" y="28" width="20" height="2" rx="1" fill="var(--mk-border-rule)" opacity="0.5" />
        {/* Tablet */}
        <rect x="30" y="48" width="20" height="10" rx="2" fill="none" stroke="var(--mk-border-rule)" strokeWidth="1" />
        {/* Radiating lines */}
        <path d="M32 28 L18 24" stroke="var(--mk-border-rule)" strokeWidth="0.5" strokeDasharray="2 2" />
        <path d="M48 30 L58 24" stroke="var(--mk-border-rule)" strokeWidth="0.5" strokeDasharray="2 2" />
        <path d="M40 38 L40 48" stroke="var(--mk-border-rule)" strokeWidth="0.5" strokeDasharray="2 2" />
      </svg>
    ),
  },
];

const features = [
  {
    icon: Zap,
    title: "Actualizaciones rápidas",
    desc: "Sube o modifica datos, planos, o precios en segundos.",
    accent: "rgba(245,158,11,0.08)",
    accentBorder: "rgba(245,158,11,0.3)",
    accentLine: "#F59E0B",
  },
  {
    icon: Globe,
    title: "Cualquier pantalla",
    desc: "Experiencia premium en sala de ventas, iPad o celular del cliente.",
    accent: "rgba(59,130,246,0.08)",
    accentBorder: "rgba(59,130,246,0.3)",
    accentLine: "#3B82F6",
  },
  {
    icon: Settings,
    title: "Lista en minutos",
    desc: "Setup en minutos comparado a desarrollos que tardan meses.",
    accent: "rgba(16,185,129,0.08)",
    accentBorder: "rgba(16,185,129,0.3)",
    accentLine: "#10B981",
  },
  {
    icon: Server,
    title: "Infraestructura robusta",
    desc: "Uptime garantizado de nivel corporativo para tus transacciones.",
    accent: "rgba(99,102,241,0.08)",
    accentBorder: "rgba(99,102,241,0.3)",
    accentLine: "#6366F1",
  },
];

/* ─── Page ─── */

export default function MarketingHomePage() {
  return (
    <div className="bg-[var(--mk-bg)] min-h-screen text-[var(--mk-text-secondary)] overflow-hidden selection:bg-[var(--mk-accent)] selection:text-white">
      {/* ====== 1. HERO ====== */}
      <HeroSection />

      {/* ====== 2. CAPABILITIES ====== */}
      <BentoGrid />

      {/* ====== 3. SHOWCASE CAROUSEL ====== */}
      <ShowcaseCarousel />

      {/* ====== 4. HOW IT WORKS ====== */}
      <section className="py-24 lg:py-32 bg-[var(--mk-bg)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <FadeIn>
            <p className="text-[11px] tracking-[0.3em] uppercase text-[var(--mk-text-muted)] mb-4">
              CÓMO FUNCIONA
            </p>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold tracking-tight text-[var(--mk-text-primary)] mb-16">
              Tres pasos para empezar.
            </h2>
          </FadeIn>

          {/* Horizontal rule */}
          <div className="h-px bg-[var(--mk-border-rule)]" />

          {steps.map((step, i) => (
            <div key={step.num}>
              <FadeIn delay={i * 0.1}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12 py-10 lg:py-14">
                  {/* Styled number circle */}
                  <div className="w-14 h-14 rounded-full border-2 border-[var(--mk-border-rule)] bg-[var(--mk-surface-3)] flex items-center justify-center shrink-0">
                    <span className="font-heading text-lg font-bold text-[var(--mk-text-primary)]">
                      {step.num}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 max-w-lg">
                    <h3 className="font-heading text-xl lg:text-2xl font-semibold text-[var(--mk-text-primary)] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-base text-[var(--mk-text-secondary)] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  {/* Mini illustration — desktop only */}
                  <div className="hidden lg:flex items-center justify-center shrink-0 w-24">
                    {step.icon}
                  </div>
                </div>
              </FadeIn>
              {/* Rule after each item */}
              <div className="h-px bg-[var(--mk-border-rule)]" />
            </div>
          ))}
        </div>
      </section>

      {/* ====== 5. FEATURES GRID ====== */}
      <section className="py-24 lg:py-32 bg-[var(--mk-bg-alt)] relative">
        {/* Subtle dot grid behind */}
        <div className="absolute inset-0 bg-dot-grid pointer-events-none opacity-50" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
          <FadeIn className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-5xl font-bold tracking-tight text-[var(--mk-text-primary)] mb-4">
              Noddo redefine las reglas del juego.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((ft, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="relative bg-[var(--mk-surface-3)] border border-[var(--mk-border-subtle)] rounded-xl h-full hover:shadow-[var(--mk-shadow-md)] hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden">
                  {/* Accent top line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: ft.accentLine }}
                  />

                  <div className="p-6">
                    {/* Icon container — larger, with accent bg */}
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 border transition-all duration-300"
                      style={{
                        background: ft.accent,
                        borderColor: "var(--mk-border-subtle)",
                      }}
                    >
                      <ft.icon
                        className="transition-colors duration-300"
                        style={{ color: ft.accentLine }}
                        size={28}
                      />
                    </div>

                    <h4 className="font-semibold text-[var(--mk-text-primary)] mb-2 text-lg">
                      {ft.title}
                    </h4>
                    <p className="text-sm text-[var(--mk-text-tertiary)] leading-relaxed">
                      {ft.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 6. CTA SECTION (dark band for contrast) ====== */}
      <section className="py-32 lg:py-40 px-6 bg-[var(--mk-bg-dark)] relative overflow-hidden">
        {/* Radial gradient atmosphere */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Decorative circles */}
        <div
          className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full border pointer-events-none"
          style={{ borderColor: "rgba(255,255,255,0.03)" }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-[350px] h-[350px] rounded-full border pointer-events-none"
          style={{ borderColor: "rgba(255,255,255,0.02)" }}
        />

        {/* Noise overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "url(/noise.svg)",
            backgroundRepeat: "repeat",
            mixBlendMode: "overlay",
          }}
        />

        <FadeIn className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-heading text-4xl lg:text-6xl font-bold tracking-tight text-[var(--mk-text-inverse)] mb-8">
            Comienza a vender más rápido.
          </h2>
          <p className="text-lg text-white/50 mb-12 max-w-2xl mx-auto">
            Únete a la plataforma que está revolucionando la forma en que el
            mundo presenta proyectos inmobiliarios.
          </p>
          <MagneticButton
            className="inline-flex items-center gap-2 px-10 py-4 text-base font-medium bg-[var(--mk-bg)] text-[var(--mk-text-primary)] rounded-lg hover:bg-white transition-colors duration-200"
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            Crear mi primer proyecto <ArrowRight size={18} />
          </MagneticButton>
        </FadeIn>
      </section>
    </div>
  );
}
