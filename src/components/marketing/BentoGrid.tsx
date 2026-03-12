"use client";

import { motion } from "framer-motion";

const features = [
  {
    num: "01",
    title: "El Noddo Grid",
    body: "El comprador hace clic en la fachada real del edificio y ve precio, área, plano y disponibilidad — sin llamar, sin esperar, sin formularios genéricos.",
  },
  {
    num: "02",
    title: "Un día, no 4 meses",
    body: "Lo que las agencias especializadas tardan meses en construir, tú lo configuras en una tarde. Sin coordinación externa, sin dependencias.",
  },
  {
    num: "03",
    title: "Inventario en vivo",
    body: "Disponible → Separado → Reservado → Vendido. El estado de cada unidad se actualiza en tiempo real. El comprador ve la verdad.",
  },
  {
    num: "04",
    title: "Leads calificados",
    body: "Cada cotización viene con la unidad específica, tipología, piso, y UTM de origen. No hay leads genéricos — solo compradores con intención real.",
  },
  {
    num: "05",
    title: "Multi-proyecto",
    body: "Lanzas cinco proyectos en un año. Todos desde un solo dashboard. Sin contratar una agencia por cada uno. Sin volverte loco.",
  },
  {
    num: "06",
    title: "Dark-luxury by default",
    body: "Cada micrositio se ve como si lo hubiera hecho una agencia de $30M. El estándar visual está incluido. Tú solo pones el proyecto.",
  },
];

export function BentoGrid() {
  return (
    <section
      id="capacidades"
      className="relative z-[1] py-24 lg:py-32 px-4 sm:px-6 lg:px-20 border-t border-[var(--mk-border-rule)]"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Section label with extending line */}
        <div className="mk-section-label mb-16">Por qué NODDO</div>

        {/* 3-column grid with 1px gap showing as grid lines */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{
            gap: "1px",
            background: "rgba(255, 255, 255, 0.04)",
          }}
        >
          {features.map((ft, i) => (
            <motion.div
              key={ft.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: "easeOut",
              }}
              className="bg-[var(--mk-bg)] p-6 sm:p-8 lg:p-10"
            >
              {/* Number */}
              <div
                className="font-heading text-5xl font-light leading-none mb-5"
                style={{ color: "rgba(184, 151, 58, 0.2)" }}
              >
                {ft.num}
              </div>

              {/* Title */}
              <div className="font-ui text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--mk-text-primary)] mb-3">
                {ft.title}
              </div>

              {/* Body */}
              <div
                className="text-[13px] leading-[1.85]"
                style={{ color: "rgba(244, 240, 232, 0.4)" }}
              >
                {ft.body}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
