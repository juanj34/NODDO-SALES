"use client";

import { motion } from "framer-motion";
import { Monitor, Map, BarChart3, Users } from "lucide-react";

const capabilities = [
  {
    title: "Presentaciones Inmersivas",
    desc: "Transforma tus renders en recorridos interactivos con fachadas, interiores y masterplan completo.",
    icon: Monitor,
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=75",
    gradient: "from-indigo-950/80 via-slate-900/60 to-transparent",
  },
  {
    title: "Mapas Cinematográficos",
    desc: "Mapas satelitales interactivos con contexto hiperrealista del entorno y puntos de interés integrados.",
    icon: Map,
    image:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=75",
    gradient: "from-emerald-950/80 via-slate-900/60 to-transparent",
  },
  {
    title: "Inventario en Tiempo Real",
    desc: "Disponibilidad sincronizada directamente sobre la maqueta. Disponible, reservado o vendido al instante.",
    icon: BarChart3,
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=75",
    gradient: "from-amber-950/80 via-slate-900/60 to-transparent",
  },
  {
    title: "Gestor Comercial Integrado",
    desc: "Cotizador inteligente con captación automática de leads. Rastrea cada interacción y optimiza ventas.",
    icon: Users,
    image:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=75",
    gradient: "from-violet-950/80 via-slate-900/60 to-transparent",
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function BentoGrid() {
  return (
    <section
      id="capacidades"
      className="py-24 lg:py-32 max-w-7xl mx-auto px-6 lg:px-12"
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease }}
        className="mb-12"
      >
        <p className="text-[11px] tracking-[0.3em] uppercase mb-4 text-[var(--mk-text-muted)]">
          CAPACIDADES
        </p>
        <h2 className="font-heading text-3xl lg:text-5xl font-bold tracking-tight text-[var(--mk-text-primary)]">
          Innovaciones que te ayudan a destacar.
        </h2>
      </motion.div>

      {/* 2×2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
        {capabilities.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.1, ease }}
            className="group rounded-[1.25rem] overflow-hidden hover:shadow-[var(--mk-shadow-lg)] hover:-translate-y-0.5 transition-all duration-500 relative"
          >
            {/* Background image */}
            <div className="aspect-[16/10] relative overflow-hidden">
              <img
                src={item.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-t ${item.gradient}`}
              />
              {/* Dark overlay for readability */}
              <div className="absolute inset-0 bg-black/20" />

              {/* Icon badge */}
              <div className="absolute top-4 left-4 w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <item.icon size={20} className="text-white/80" />
              </div>

              {/* Content overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-heading text-lg lg:text-xl font-semibold text-white mb-1.5">
                  {item.title}
                </h3>
                <p className="text-[13px] text-white/60 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
