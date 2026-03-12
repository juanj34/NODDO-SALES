"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "Noddo transformó completamente nuestra sala de ventas. Los clientes llegan más informados y el cierre de ventas se aceleró un 40%.",
    name: "Carolina Vélez",
    role: "Directora Comercial",
    company: "Constructora Primavera",
  },
  {
    quote:
      "Antes tardábamos semanas en actualizar nuestro material de ventas. Con Noddo lo hacemos en minutos y el resultado es impecable.",
    name: "Andrés Restrepo",
    role: "Gerente de Proyectos",
    company: "Grupo Inmobiliario AR",
  },
  {
    quote:
      "La experiencia que Noddo ofrece a nuestros compradores es de otro nivel. Es como tener una sala de ventas digital 24/7.",
    name: "María José Duarte",
    role: "CEO",
    company: "Duarte & Asociados",
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function Testimonials() {
  return (
    <section className="py-24 lg:py-32 relative z-[1] border-t border-[var(--mk-border-rule)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="mk-section-label mb-16"
        >
          Testimonios
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(255,255,255,0.04)]">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease }}
              className="bg-[var(--mk-bg)] p-8 flex flex-col"
            >
              {/* Gold quote mark */}
              <svg
                className="w-6 h-6 mb-6 opacity-30"
                viewBox="0 0 32 32"
                fill="var(--mk-accent)"
                aria-hidden="true"
              >
                <path d="M6 18c0-3.3 2.7-6 6-6V8c-5.5 0-10 4.5-10 10v10h10V18H6zm16 0c0-3.3 2.7-6 6-6V8c-5.5 0-10 4.5-10 10v10h10V18h-6z" />
              </svg>

              {/* Quote */}
              <p
                className="text-[13px] leading-[1.85] mb-8 flex-1"
                style={{ color: "rgba(244, 240, 232, 0.5)" }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div
                className="pt-5"
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 flex items-center justify-center text-[9px] font-ui font-bold tracking-wider"
                    style={{
                      background: "rgba(184, 151, 58, 0.08)",
                      color: "var(--mk-accent)",
                      border: "1px solid rgba(184, 151, 58, 0.2)",
                    }}
                  >
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-ui text-[11px] font-semibold text-[var(--mk-text-primary)] tracking-wide">
                      {t.name}
                    </p>
                    <p
                      className="text-[9px] tracking-[0.1em]"
                      style={{ color: "rgba(244, 240, 232, 0.3)" }}
                    >
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
