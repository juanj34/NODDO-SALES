"use client";

import { motion } from "framer-motion";

const themItems = [
  "$30,000 – $80,000 por proyecto",
  "3 a 6 meses de desarrollo",
  "Cada cambio requiere coordinación",
  "Inventario siempre desactualizado",
  "No captura leads ni UTMs",
  "No escala entre proyectos",
];

const usItems = [
  "Desde $149 / mes",
  "Publicado en 1 día",
  "Editas tú, en tiempo real",
  "Inventario siempre actualizado",
  "Leads con UTM por unidad",
  "Multi-proyecto en un dashboard",
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function ComparisonStrip() {
  return (
    <section className="relative z-[1] py-24 lg:py-32 px-6 lg:px-20 border-t border-[var(--mk-border-rule)]">
      <div className="max-w-[1000px] mx-auto">
        {/* Section label */}
        <div className="mk-section-label mb-16">La alternativa real</div>

        {/* vs grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-16 items-start"
        >
          {/* Left: Them */}
          <div>
            <div
              className="font-ui text-[10px] font-bold tracking-[0.2em] uppercase mb-6"
              style={{ color: "rgba(255, 255, 255, 0.2)" }}
            >
              Agencia de visualización 3D
            </div>
            {themItems.map((item) => (
              <div
                key={item}
                className="flex items-baseline gap-3 py-3.5 text-[14px] border-b border-[var(--mk-border-rule)]"
                style={{ color: "rgba(255, 255, 255, 0.3)" }}
              >
                <span
                  className="text-xs flex-shrink-0"
                  style={{ color: "rgba(255, 80, 80, 0.4)" }}
                >
                  ✗
                </span>
                {item}
              </div>
            ))}
          </div>

          {/* Center: vs */}
          <div className="hidden lg:flex flex-col items-center gap-3 pt-10">
            <div
              className="font-heading text-5xl font-light italic"
              style={{
                color: "rgba(255, 255, 255, 0.1)",
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                letterSpacing: "0.1em",
              }}
            >
              vs
            </div>
          </div>

          {/* Right: Us */}
          <div>
            <div className="font-ui text-[10px] font-bold tracking-[0.2em] uppercase mb-6 text-[var(--mk-accent)]">
              NODDO
            </div>
            {usItems.map((item) => (
              <div
                key={item}
                className="flex items-baseline gap-3 py-3.5 text-[14px] border-b border-[var(--mk-border-rule)]"
                style={{ color: "rgba(244, 240, 232, 0.8)" }}
              >
                <span
                  className="text-xs flex-shrink-0"
                  style={{ color: "var(--mk-available, #4a9e6b)" }}
                >
                  ✓
                </span>
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
