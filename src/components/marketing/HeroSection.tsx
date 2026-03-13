"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { IsometricBuilding } from "./illustrations/IsometricBuilding";
import { useBooking } from "./BookingProvider";

const stats = [
  { value: "1 día", label: "De idea a publicado" },
  { value: "$0", label: "Costo de agencia" },
  { value: "24/7", label: "Sala de ventas activa" },
];

export function HeroSection() {
  const { openBooking } = useBooking();
  return (
    <section className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2 items-center px-6 lg:px-24 gap-8 lg:gap-12 overflow-hidden z-[1]">
      {/* ── LEFT: Copy ── */}
      <div className="relative z-[2] pt-32 lg:pt-0">
        {/* Label with gold line */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex items-center gap-3.5 mb-7"
        >
          <span
            className="block w-8 h-px"
            style={{ background: "var(--mk-accent)" }}
          />
          <span className="font-ui text-[10px] tracking-[0.35em] uppercase text-[var(--mk-accent)]">
            Showroom digital para constructoras
          </span>
        </motion.div>

        {/* Hero title — Cormorant Garamond */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="font-heading text-[clamp(36px,5.5vw,96px)] font-light leading-[1.05] tracking-[-0.02em] text-[var(--mk-text-primary)] mb-8"
        >
          Tu proyecto merece
          <br />
          <em className="italic text-[var(--mk-accent-light)]">más que un brochure.</em>
        </motion.h1>

        {/* Subtitle — DM Mono */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="text-[15px] leading-[1.85] max-w-[480px] mb-14"
          style={{ color: "rgba(244, 240, 232, 0.5)" }}
        >
          El comprador ya no pide información — <em className="italic text-[var(--mk-accent-light)]">la busca</em>.
          Dale un showroom que responda solo: <strong className="text-[var(--mk-text-primary)] font-normal">inventario
          en vivo, planos, recorridos 360° y leads cualificados</strong>.
          Listo en <strong className="text-[var(--mk-text-primary)] font-normal">3 días</strong>, sin código.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="flex items-center gap-5 flex-wrap sm:flex-nowrap"
        >
          <button onClick={openBooking} className="btn-mk-primary inline-flex items-center gap-2.5 whitespace-nowrap">
            Agendar Demo
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
          <Link href="/sites/alto-de-yeguas" className="btn-mk-outline inline-flex items-center gap-2.5 whitespace-nowrap">
            Demo en Vivo
            <ExternalLink size={13} strokeWidth={2} />
          </Link>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: "easeOut" }}
          className="flex gap-6 sm:gap-12 mt-16 pt-10 flex-wrap sm:flex-nowrap"
          style={{ borderTop: "1px solid rgba(244, 240, 232, 0.06)" }}
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="font-heading text-5xl font-light leading-none mb-1.5 text-[var(--mk-accent-light)]">
                {stat.value}
              </div>
              <div
                className="font-ui text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "rgba(244, 240, 232, 0.5)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT: Isometric Building ── */}
      <div className="hidden lg:flex items-center justify-center h-screen">
        <IsometricBuilding />
      </div>

      {/* ── Scroll hint ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2, ease: "easeOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[2]"
      >
        <div
          className="w-px h-10"
          style={{
            background:
              "linear-gradient(to bottom, rgba(184, 151, 58, 0.6), transparent)",
            animation: "scrollPulse 2s infinite",
          }}
        />
        <span
          className="text-[8px] tracking-[0.3em] uppercase"
          style={{ color: "rgba(244, 240, 232, 0.2)" }}
        >
          Scroll
        </span>
      </motion.div>

      {/* Scroll pulse keyframes */}
      <style jsx>{`
        @keyframes scrollPulse {
          0%,
          100% {
            opacity: 0.6;
            transform: scaleY(1);
          }
          50% {
            opacity: 0.2;
            transform: scaleY(0.6);
          }
        }
      `}</style>
    </section>
  );
}
