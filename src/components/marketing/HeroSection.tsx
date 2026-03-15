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
          className="text-[15px] leading-[1.85] max-w-[580px] mb-14"
          style={{ color: "rgba(244, 240, 232, 0.5)" }}
        >
          El comprador ya no pide información — <em className="italic text-[var(--mk-accent-light)]">la busca</em>.
          Dale un showroom que responda solo: <strong className="text-[var(--mk-text-primary)] font-normal">inventario
          en vivo, planos, recorridos 360° y leads cualificados</strong>.
          En vivo en <strong className="text-[var(--mk-text-primary)] font-normal">24 horas</strong>. Tú lo manejas — sin agencias, sin esperas.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
        >
          <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap mb-5">
            {/* Primary CTA with pulse */}
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
                Ver Demo Gratis
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            </div>

            <Link href="/sites/alto-de-yeguas" className="btn-mk-outline inline-flex items-center gap-2.5 whitespace-nowrap" style={{ fontSize: 13, padding: "14px 28px" }}>
              Demo en Vivo
              <ExternalLink size={13} strokeWidth={2} />
            </Link>
          </div>

          {/* Trust elements below CTAs */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* Avatar stack */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center" style={{ marginLeft: -4 }}>
                {[
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
                ].map((photoUrl, i) => (
                  <div
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "2px solid var(--mk-bg)",
                      marginLeft: i === 0 ? 0 : -10,
                      position: "relative",
                      zIndex: 5 - i,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(184,151,58,0.2)",
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
              <span style={{ fontSize: 12, color: "rgba(244,240,232,0.5)" }}>
                <strong style={{ color: "var(--mk-text-primary)", fontWeight: 500 }}>100+</strong> desarrolladores
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />

            {/* Micro-copy trust elements */}
            <div className="flex items-center gap-4 text-[11px]" style={{ color: "rgba(244,240,232,0.4)" }}>
              <div className="flex items-center gap-1.5">
                <span style={{ color: "var(--mk-accent)" }}>✓</span>
                Sin tarjeta
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ color: "var(--mk-accent)" }}>✓</span>
                Listo en 24h
              </div>
              <div className="flex items-center gap-1.5 hidden sm:flex">
                <span style={{ color: "var(--mk-accent)" }}>✓</span>
                Sin compromiso
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pulse ring keyframes */}
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
