"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/**
 * CSS-rendered browser window mockup showing a realistic Noddo microsite.
 * Uses actual HTML/Tailwind — not SVG shapes.
 */
export function HeroMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Soft gold glow behind */}
      <div
        className="absolute -inset-16 pointer-events-none rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(212,165,116,0.08) 0%, transparent 70%)",
        }}
      />

      {/* ─── Primary window: Microsite ─── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 rounded-xl overflow-hidden border border-white/10"
        style={{
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* Browser chrome */}
        <div className="h-8 bg-[#1A1A1D] flex items-center gap-1.5 px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/70" />
          <div className="ml-4 flex-1 max-w-[200px] h-4 rounded bg-white/5 flex items-center px-2">
            <span className="text-[7px] text-white/25 font-mono truncate">
              noddo.io/sites/tu-proyecto
            </span>
          </div>
        </div>

        {/* Microsite content */}
        <div className="relative aspect-[16/10] bg-[#0A0A0B] overflow-hidden">
          {/* Hero background image */}
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=75"
            alt=""
            fill
            priority
            className="object-cover opacity-40"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/60 to-transparent" />

          {/* Nav dots — left edge */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {[true, false, false, false, false].map((active, i) => (
              <div
                key={i}
                className={`rounded-full ${active ? "w-2 h-2 bg-[#D4A574]" : "w-1.5 h-1.5 bg-white/15"}`}
              />
            ))}
          </div>

          {/* Project name + CTA */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
            <p className="text-[7px] tracking-[0.3em] text-white/30 uppercase mb-1">
              Proyecto Residencial
            </p>
            <h3 className="text-sm font-bold text-white/80 tracking-widest mb-3">
              ALTO DE YEGUAS
            </h3>
            <div className="inline-block px-4 py-1.5 rounded text-[7px] font-semibold tracking-[0.2em] bg-gradient-to-r from-[#D4A574] to-[#C49560] text-[#0A0A0B]">
              EXPLORAR
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Secondary window: Dashboard ─── */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute -bottom-6 -right-4 w-[58%] z-20 rounded-lg overflow-hidden border border-white/8"
        style={{
          boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Browser chrome — dark dashboard */}
        <div className="h-7 bg-[#111113] flex items-center gap-1.5 px-2.5 border-b border-white/6">
          <div className="w-2 h-2 rounded-full bg-[#FF5F56]/60" />
          <div className="w-2 h-2 rounded-full bg-[#FFBD2E]/60" />
          <div className="w-2 h-2 rounded-full bg-[#27C93F]/60" />
          <div className="ml-3 flex-1 max-w-[160px] h-3.5 rounded bg-white/5 flex items-center px-2">
            <span className="text-[6px] text-white/25 font-mono truncate">
              noddo.io/editor/alto-de-yeg...
            </span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="bg-[#0A0A0B] flex" style={{ height: "140px" }}>
          {/* Sidebar */}
          <div className="w-16 bg-[#111113] border-r border-white/6 py-2 px-1.5 flex flex-col gap-1">
            {["Config", "Galería", "Tipos", "Ubica.", "Videos"].map(
              (label, i) => (
                <div
                  key={label}
                  className={`flex items-center gap-1 px-1.5 py-1 rounded text-[5px] ${
                    i === 1
                      ? "bg-[rgba(212,165,116,0.10)] text-[#D4A574] font-medium"
                      : "text-white/35"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-sm ${
                      i === 1 ? "bg-[#D4A574]" : "bg-white/15"
                    }`}
                  />
                  {label}
                </div>
              )
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 p-2.5 overflow-hidden">
            <p className="text-[7px] font-semibold text-white/90 mb-0.5">
              Galería
            </p>
            <p className="text-[5px] text-white/35 mb-2">
              Administra tus categorías
            </p>

            {/* Image grid */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=200&q=60",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=60",
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=200&q=60",
              ].map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-[4/3] rounded overflow-hidden bg-[#1A1A1D]"
                >
                  <Image src={src} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <p className="text-[4.5px] text-white/35">Exteriores</p>
              <p className="text-[4.5px] text-white/35">Interiores</p>
              <p className="text-[4.5px] text-white/35">Amenidades</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
