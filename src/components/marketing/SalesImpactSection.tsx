"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useBooking } from "./BookingProvider";

/* ── stat data ───────────────────────────────────────── */

interface StatCell {
  kind: "stat";
  value: number;
  suffix: string;
  category: string;
  description: string;
}

interface QuoteCell {
  kind: "quote";
  text: string;
  role: string;
}

type Cell = StatCell | QuoteCell;

const cells: Cell[] = [
  {
    kind: "stat",
    value: 3,
    suffix: "x",
    category: "Presentaciones",
    description:
      "más rápido presentan los equipos que tienen toda la información del proyecto centralizada en un solo lugar",
  },
  {
    kind: "stat",
    value: 93,
    suffix: "%",
    category: "Engagement",
    description:
      "de los compradores potenciales se involucran más cuando pueden explorar un micrositio interactivo vs. recibir un PDF estático",
  },
  {
    kind: "stat",
    value: 47,
    suffix: "%",
    category: "Eficiencia",
    description:
      "del tiempo del asesor se invertía en buscar archivos, actualizar disponibilidad y armar presentaciones — no en vender",
  },
  {
    kind: "stat",
    value: 2.4,
    suffix: "x",
    category: "Captura",
    description:
      "más oportunidades capturadas cuando el formulario de contacto está integrado en la experiencia y rastrea la fuente",
  },
  {
    kind: "quote",
    text: "El asesor que no busca archivos vende 3 veces más.",
    role: "Director Comercial",
  },
];

/* ── animated counter ────────────────────────────────── */

function AnimatedStat({
  value,
  suffix,
  large,
  delay,
}: {
  value: number;
  suffix: string;
  large?: boolean;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState("0");
  const [visible, setVisible] = useState(false);
  const counted = useRef(false);

  const hasDecimal = value % 1 !== 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            if (!counted.current) {
              counted.current = true;
              const start = performance.now();
              const duration = 1600;
              const animate = (now: number) => {
                const p = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                const current = eased * value;
                setDisplay(
                  hasDecimal ? current.toFixed(1) : Math.floor(current).toString()
                );
                if (p < 1) requestAnimationFrame(animate);
              };
              setTimeout(() => requestAnimationFrame(animate), delay);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [value, delay, hasDecimal]);

  return (
    <div
      ref={ref}
      className="font-heading leading-none"
      style={{
        fontSize: large ? "clamp(48px, 6vw, 72px)" : "clamp(36px, 4.5vw, 56px)",
        fontWeight: 300,
        color: "var(--mk-accent-light)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        transitionDelay: `${delay}ms`,
      }}
    >
      {display}
      <span
        style={{
          fontSize: "0.45em",
          color: "rgba(184,151,58,0.5)",
          marginLeft: 2,
        }}
      >
        {suffix}
      </span>
    </div>
  );
}

/* ── section ─────────────────────────────────────────── */

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function SalesImpactSection() {
  const { openBooking } = useBooking();

  // Extract cells by position
  const featured = cells[0] as StatCell; // 3x — large
  const right1 = cells[1] as StatCell; // 93%
  const bottom1 = cells[2] as StatCell; // 47%
  const bottom2 = cells[3] as StatCell; // 2.4x
  const quote = cells[4] as QuoteCell;

  return (
    <section className="relative z-[1] py-20 lg:py-28 px-6 lg:px-20 border-t border-[var(--mk-border-rule)]">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
        >
          <div className="mk-section-label mb-5">El impacto</div>
          <h2 className="mk-section-heading mb-12 lg:mb-16">
            Los equipos que centralizan, <em>venden más.</em>
          </h2>
        </motion.div>

        {/* ── Desktop bento grid ──────────────────────── */}
        <div
          className="hidden md:grid"
          style={{
            gridTemplateColumns: "repeat(12, 1fr)",
            gridTemplateRows: "auto auto",
            gap: "1px",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {/* Row 1 — Featured stat (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0, ease }}
            style={{
              gridColumn: "span 7",
              padding: "52px 44px",
              background: "var(--mk-bg)",
            }}
          >
            <AnimatedStat
              value={featured.value}
              suffix={featured.suffix}
              large
              delay={0}
            />
            <p
              className="text-[13px] leading-[1.8] mt-4 max-w-[420px]"
              style={{ color: "rgba(244,240,232,0.5)" }}
            >
              {featured.description}
            </p>
            <div
              className="mt-6 mb-3"
              style={{
                width: 32,
                height: 1,
                background: "rgba(184,151,58,0.3)",
              }}
            />
            <div
              className="font-ui text-[9px] tracking-[0.18em] uppercase"
              style={{ color: "rgba(244,240,232,0.25)" }}
            >
              {featured.category}
            </div>
          </motion.div>

          {/* Row 1 — Right stat (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            style={{
              gridColumn: "span 5",
              padding: "52px 40px",
              background: "var(--mk-bg)",
            }}
          >
            <AnimatedStat
              value={right1.value}
              suffix={right1.suffix}
              delay={100}
            />
            <p
              className="text-[12px] leading-[1.8] mt-4"
              style={{ color: "rgba(244,240,232,0.45)" }}
            >
              {right1.description}
            </p>
            <div
              className="mt-6 mb-3"
              style={{
                width: 32,
                height: 1,
                background: "rgba(184,151,58,0.3)",
              }}
            />
            <div
              className="font-ui text-[9px] tracking-[0.18em] uppercase"
              style={{ color: "rgba(244,240,232,0.25)" }}
            >
              {right1.category}
            </div>
          </motion.div>

          {/* Row 2 — Stat (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            style={{
              gridColumn: "span 4",
              padding: "44px 36px",
              background: "var(--mk-bg)",
            }}
          >
            <AnimatedStat
              value={bottom1.value}
              suffix={bottom1.suffix}
              delay={200}
            />
            <p
              className="text-[12px] leading-[1.8] mt-4"
              style={{ color: "rgba(244,240,232,0.45)" }}
            >
              {bottom1.description}
            </p>
            <div
              className="mt-5 mb-3"
              style={{
                width: 32,
                height: 1,
                background: "rgba(184,151,58,0.3)",
              }}
            />
            <div
              className="font-ui text-[9px] tracking-[0.18em] uppercase"
              style={{ color: "rgba(244,240,232,0.25)" }}
            >
              {bottom1.category}
            </div>
          </motion.div>

          {/* Row 2 — Stat (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
            style={{
              gridColumn: "span 4",
              padding: "44px 36px",
              background: "var(--mk-bg)",
            }}
          >
            <AnimatedStat
              value={bottom2.value}
              suffix={bottom2.suffix}
              delay={300}
            />
            <p
              className="text-[12px] leading-[1.8] mt-4"
              style={{ color: "rgba(244,240,232,0.45)" }}
            >
              {bottom2.description}
            </p>
            <div
              className="mt-5 mb-3"
              style={{
                width: 32,
                height: 1,
                background: "rgba(184,151,58,0.3)",
              }}
            />
            <div
              className="font-ui text-[9px] tracking-[0.18em] uppercase"
              style={{ color: "rgba(244,240,232,0.25)" }}
            >
              {bottom2.category}
            </div>
          </motion.div>

          {/* Row 2 — Quote (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            className="flex flex-col justify-center"
            style={{
              gridColumn: "span 4",
              padding: "44px 36px",
              background: "var(--mk-bg)",
              borderLeft: "2px solid rgba(184,151,58,0.2)",
            }}
          >
            <p
              className="font-heading text-[18px] italic leading-[1.7] mb-6"
              style={{
                fontWeight: 300,
                color: "rgba(244,240,232,0.6)",
              }}
            >
              &ldquo;{quote.text}&rdquo;
            </p>
            <div
              className="font-ui text-[9px] tracking-[0.18em] uppercase"
              style={{ color: "rgba(184,151,58,0.4)" }}
            >
              — {quote.role}
            </div>
          </motion.div>
        </div>

        {/* ── Mobile stack ────────────────────────────── */}
        <div
          className="md:hidden flex flex-col"
          style={{ gap: "1px", background: "rgba(255,255,255,0.04)" }}
        >
          {/* Stats */}
          {[featured, right1, bottom1, bottom2].map((stat, i) => (
            <motion.div
              key={stat.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              style={{
                padding: "40px 28px",
                background: "var(--mk-bg)",
              }}
            >
              <AnimatedStat
                value={stat.value}
                suffix={stat.suffix}
                large={i === 0}
                delay={i * 80}
              />
              <p
                className="text-[12px] leading-[1.8] mt-3"
                style={{ color: "rgba(244,240,232,0.45)" }}
              >
                {stat.description}
              </p>
              <div
                className="mt-5 mb-2.5"
                style={{
                  width: 32,
                  height: 1,
                  background: "rgba(184,151,58,0.3)",
                }}
              />
              <div
                className="font-ui text-[9px] tracking-[0.18em] uppercase"
                style={{ color: "rgba(244,240,232,0.25)" }}
              >
                {stat.category}
              </div>
            </motion.div>
          ))}

          {/* Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.32, ease }}
            style={{
              padding: "40px 28px",
              background: "var(--mk-bg)",
              borderLeft: "2px solid rgba(184,151,58,0.2)",
            }}
          >
            <p
              className="font-heading text-[18px] italic leading-[1.7] mb-5"
              style={{
                fontWeight: 300,
                color: "rgba(244,240,232,0.6)",
              }}
            >
              &ldquo;{quote.text}&rdquo;
            </p>
            <div
              className="font-ui text-[9px] tracking-[0.18em] uppercase"
              style={{ color: "rgba(184,151,58,0.4)" }}
            >
              — {quote.role}
            </div>
          </motion.div>
        </div>

        {/* CTA Banner after stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.4, ease }}
          className="mt-16"
          style={{
            background: "linear-gradient(135deg, rgba(184,151,58,0.08) 0%, rgba(184,151,58,0.04) 100%)",
            border: "1px solid rgba(184,151,58,0.2)",
            borderRadius: "16px",
            padding: "48px 40px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative corner accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 200,
              height: 200,
              background: "radial-gradient(circle at top right, rgba(184,151,58,0.12), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div className="relative z-[1] text-center max-w-[680px] mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp size={20} stroke="#b8973a" strokeWidth={2} />
              <span
                className="font-ui text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "var(--mk-accent)" }}
              >
                Únete a los equipos que venden más
              </span>
            </div>

            <h3
              className="font-heading text-[clamp(24px,3.5vw,36px)] font-light leading-[1.2] mb-6"
              style={{ color: "var(--mk-text-primary)" }}
            >
              Centraliza tu proyecto. <em className="italic" style={{ color: "var(--mk-accent-light)" }}>Vende 3x más.</em>
            </h3>

            <p
              className="text-[13px] leading-[1.8] mb-8"
              style={{ color: "rgba(244,240,232,0.5)" }}
            >
              Los mejores equipos comerciales usan NODDO para presentar más rápido,
              capturar más leads y cerrar más ventas.
            </p>

            <div className="flex items-center justify-center gap-4">
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
                  Ver Cómo Funciona
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Mini social proof */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="flex items-center" style={{ marginLeft: -4 }}>
                {[
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
                ].map((photoUrl, i) => (
                  <div
                    key={i}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: "2px solid rgba(18,18,18,0.9)",
                      marginLeft: i === 0 ? 0 : -8,
                      position: "relative",
                      zIndex: 4 - i,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={photoUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 11, color: "rgba(244,240,232,0.4)" }}>
                <strong style={{ color: "var(--mk-text-primary)", fontWeight: 500 }}>100+</strong> equipos comerciales
              </span>
            </div>
          </div>

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
        </motion.div>
      </div>
    </section>
  );
}
