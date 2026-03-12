"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "Lanzamos Torre Candelaria en 3 días. Antes con la agencia nos tardamos 5 meses en tener algo parecido — y costó 12 veces más. Los leads que llegan ya saben qué piso y qué tipología quieren.",
    name: "Jorge Mora",
    initials: "JM",
    role: "Director Comercial · Arco Urbano",
  },
  {
    quote:
      "Manejamos 4 proyectos simultáneos desde un solo dashboard. Antes necesitaba un equipo de marketing para cada uno. Ahora mi equipo de ventas tiene todo en tiempo real.",
    name: "Lorena Castaño",
    initials: "LC",
    role: "Gerente General · Vértice Grupo",
  },
  {
    quote:
      "El Noddo Grid fue lo que convenció a nuestra junta. Los compradores pueden hacer clic en el edificio y ver exactamente qué unidades quedan. Eso no lo tiene ningún brochure del mercado.",
    name: "Ricardo Fuentes",
    initials: "RF",
    role: "VP de Proyectos · Cimientos & Co",
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
          Lo que dicen los desarrolladores
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(255,255,255,0.04)]">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease }}
              className="bg-[var(--mk-bg)] p-8 lg:p-10 flex flex-col relative"
            >
              {/* Stars */}
              <div
                className="absolute"
                style={{
                  top: 36,
                  right: 36,
                  color: "var(--mk-accent)",
                  fontSize: 10,
                  letterSpacing: 2,
                }}
              >
                ★★★★★
              </div>

              {/* Quote mark */}
              <span
                className="font-heading block mb-4"
                style={{
                  fontSize: 80,
                  fontWeight: 300,
                  lineHeight: 0.6,
                  color: "rgba(184,151,58,0.15)",
                }}
              >
                &ldquo;
              </span>

              {/* Quote text */}
              <p
                className="text-[13px] leading-[1.9] mb-7 flex-1 italic"
                style={{ color: "rgba(244, 240, 232, 0.6)" }}
              >
                {t.quote}
              </p>

              {/* Divider */}
              <div
                className="mb-5"
                style={{
                  width: 32,
                  height: 1,
                  background: "rgba(184,151,58,0.3)",
                }}
              />

              {/* Author */}
              <div className="flex items-center gap-3.5">
                {/* Avatar */}
                <div
                  className="flex-shrink-0 flex items-center justify-center font-heading"
                  style={{
                    width: 40,
                    height: 40,
                    background: "#1e1e1e",
                    border: "1px solid rgba(184,151,58,0.15)",
                    fontSize: 16,
                    fontWeight: 300,
                    color: "var(--mk-accent)",
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-ui text-[11px] font-bold tracking-[0.06em] text-[var(--mk-text-primary)] mb-0.5">
                    {t.name}
                  </p>
                  <p
                    className="text-[9px] tracking-[0.1em]"
                    style={{ color: "rgba(244, 240, 232, 0.3)" }}
                  >
                    {t.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
