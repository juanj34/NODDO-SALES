"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroMockup } from "./illustrations/HeroMockup";

const stats = [
  { value: "48+", label: "Proyectos Activos" },
  { value: "12K", label: "Cotizaciones Generadas" },
  { value: "$20M", label: "Ventas Facilitadas" },
  { value: "100%", label: "Impacto Visual" },
];

export function HeroSection() {
  return (
    <section className="pt-32 lg:pt-40 pb-16 lg:pb-24 px-6 lg:px-12 bg-[var(--mk-bg)] relative overflow-hidden">
      {/* Dot grid background */}
      <div className="absolute inset-0 bg-dot-grid pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Top hero area — 2-column layout */}
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-8 relative">
          {/* Left column — text */}
          <div className="lg:w-1/2 relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              className="text-[11px] uppercase tracking-[0.3em] text-[var(--mk-text-muted)] mb-6"
            >
              PLATAFORMA PROPTECH
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="font-heading text-[clamp(2.75rem,6vw,5.5rem)] font-bold leading-[1.05] tracking-tight text-[var(--mk-text-primary)] mb-8"
            >
              Vende proyectos inmobiliarios de clase mundial.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
              className="text-lg text-[var(--mk-text-secondary)] max-w-xl mb-10 leading-relaxed"
            >
              Noddo transforma tus renders en plataformas de venta premium
              interactivas. Galerías, mapas 3D, inventario en tiempo real y
              más.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link
                href="/crear"
                className="btn-mk-primary px-7 py-3.5 inline-flex items-center gap-2"
              >
                Comenzar Gratis
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#demo"
                className="btn-mk-outline px-7 py-3.5 inline-flex items-center"
              >
                Ver Demo
              </Link>
            </motion.div>
          </div>

          {/* Right column — Product mockup */}
          <div className="hidden lg:block lg:w-1/2 relative">
            <HeroMockup className="w-full max-w-[580px] ml-auto" />
          </div>
        </div>

        {/* Full-width horizontal rule */}
        <div className="my-12 h-px w-full bg-[var(--mk-border-rule)]" />

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-wrap items-center gap-y-8"
        >
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 && (
                <div className="hidden sm:block w-px h-12 bg-[var(--mk-border-rule)] mx-8 lg:mx-12" />
              )}
              <div className="flex flex-col gap-1 min-w-[120px]">
                <span className="font-heading text-3xl lg:text-4xl font-semibold text-[var(--mk-text-primary)]">
                  {stat.value}
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--mk-text-muted)]">
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
