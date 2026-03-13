"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface Project {
  name: string;
  location: string;
  city: string;
  units: string;
  sold: string;
  leads: string;
  statusColor?: string;
}

const projects: Project[] = [
  { name: "Torre Candelaria 90", location: "Cl. 53 #13-21 · Bogotá D.C.", city: "Bogotá · Chapinero", units: "124", sold: "68%", leads: "847" },
  { name: "Parque Envigado Residencias", location: "Cra. 43A #18 Sur · Medellín", city: "Medellín · El Poblado", units: "88", sold: "41%", leads: "392" },
  { name: "Morada 170 — Torres", location: "Av. 6A Norte #24N · Cali", city: "Cali · Ciudad Jardín", units: "216", sold: "22%", leads: "1.2k", statusColor: "#c4853a" },
];

const VISIBLE_CARDS = 3;

/* Mini isometric building SVG for thumbnail */
function BuildingThumb({ seed }: { seed: number }) {
  const lx = 30 + seed * 10;
  const rx = 230 - seed * 10;
  const apex = 130;
  const top = 30 + seed * 5;
  const bot = 190 - seed * 2;
  return (
    <svg viewBox="0 0 260 200" fill="none" width="260" height="200" style={{ opacity: 0.45 }}>
      <polygon points={`${lx},${bot} ${lx},${top + 30} ${apex},${top} ${apex},${bot - 30}`} fill="#1a1a1a" />
      <polygon points={`${apex},${bot - 30} ${apex},${top} ${rx},${top + 30} ${rx},${bot}`} fill="#111" />
      {/* Floor lines */}
      {[0, 1, 2, 3].map((fl) => (
        <line key={fl} x1={lx} y1={top + 30 + fl * 26} x2={apex} y2={top + fl * 26} stroke="rgba(184,151,58,.12)" strokeWidth=".8" />
      ))}
      {/* Edge lines */}
      <line x1={lx} y1={top + 30} x2={apex} y2={top} stroke="rgba(184,151,58,.5)" strokeWidth="1.2" />
      <line x1={apex} y1={top} x2={rx} y2={top + 30} stroke="rgba(184,151,58,.32)" strokeWidth="1" />
      <line x1={apex} y1={top} x2={apex} y2={bot - 30} stroke="rgba(184,151,58,.7)" strokeWidth="1.8" />
      {/* Some windows */}
      {[0, 1, 2].map((row) =>
        [0, 1].map((col) => (
          <polygon
            key={`${row}-${col}`}
            points={`${lx + 18 + col * 32},${top + 60 + row * 26} ${lx + 38 + col * 32},${top + 54 + row * 26} ${lx + 38 + col * 32},${top + 66 + row * 26} ${lx + 18 + col * 32},${top + 72 + row * 26}`}
            fill="rgba(184,151,58,.22)"
          />
        ))
      )}
    </svg>
  );
}

const CARD_W_DESKTOP = 420;
const CARD_W_MOBILE = 300;
const GAP = 24;
const ease = [0.25, 0.46, 0.45, 0.94] as const;

function getCardW() {
  return typeof window !== "undefined" && window.innerWidth < 640
    ? CARD_W_MOBILE
    : CARD_W_DESKTOP;
}

export function ProjectsShowcase() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  const slideTo = (i: number) => {
    const cardW = getCardW();
    const max = Math.max(0, projects.length - VISIBLE_CARDS);
    const next = Math.max(0, Math.min(i, max));
    setIdx(next);
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${next * (cardW + GAP)}px)`;
    }
  };

  return (
    <section
      className="relative z-[1] border-t border-[var(--mk-border-rule)] overflow-hidden"
      style={{ padding: "120px 0 120px 24px" }}
    >
      {/* Header */}
      <div
        className="flex items-end justify-between mb-15 px-6 lg:px-20"
        style={{ maxWidth: "calc(100% - 80px)", marginBottom: 60 }}
      >
        <div>
          <div className="mk-section-label mb-6">Proyectos en vivo</div>
          <h2 className="mk-section-heading mb-5">
            Ya están vendiendo<br />
            <em>con Noddo.</em>
          </h2>
          <p className="text-[13px] leading-[1.7] max-w-[420px]" style={{ color: "rgba(244,240,232,0.55)" }}>
            Cada uno de estos proyectos tiene su sala de ventas activa con Noddo. El comprador explora, cotiza y se convierte — sin llamada previa.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => slideTo(idx - 1)}
            aria-label="Proyectos anteriores"
            className="flex items-center justify-center hover:border-[rgba(255,255,255,0.25)] hover:text-[rgba(244,240,232,0.7)]"
            style={{
              width: 44, height: 44,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "none",
              color: "rgba(244,240,232,0.4)",
              fontSize: 14,
              cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
            }}
          >
            ←
          </button>
          <button
            onClick={() => slideTo(idx + 1)}
            aria-label="Siguientes proyectos"
            className="flex items-center justify-center hover:border-[rgba(255,255,255,0.25)] hover:text-[rgba(244,240,232,0.7)]"
            style={{
              width: 44, height: 44,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "none",
              color: "rgba(244,240,232,0.4)",
              fontSize: 14,
              cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Track */}
      <div style={{ overflow: "hidden" }}>
        <motion.div
          ref={trackRef}
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="flex"
          style={{ gap: GAP, transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}
        >
          {projects.map((proj, i) => (
            <div
              key={proj.name}
              className="flex-shrink-0 overflow-hidden w-[300px] sm:w-[420px]"
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                background: "#111",
                transition: "border-color 0.3s",
              }}
            >
              {/* Thumbnail */}
              <div
                className="relative flex items-center justify-center overflow-hidden"
                style={{ height: 220, background: "#0a0a0a" }}
              >
                <BuildingThumb seed={i} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))" }} />
                <span
                  className="absolute font-ui text-[8px] tracking-[0.25em] uppercase"
                  style={{
                    top: 16, left: 16,
                    color: "var(--mk-accent)",
                    background: "rgba(0,0,0,0.7)",
                    padding: "5px 10px",
                    border: "1px solid rgba(184,151,58,0.2)",
                  }}
                >
                  {proj.city}
                </span>
                <div
                  className="absolute"
                  style={{
                    top: 16, right: 16,
                    width: 8, height: 8, borderRadius: "50%",
                    background: proj.statusColor || "var(--mk-available)",
                    boxShadow: `0 0 0 3px ${proj.statusColor ? "rgba(196,133,58,0.2)" : "rgba(74,158,107,0.2)"}`,
                  }}
                />
              </div>

              {/* Info */}
              <div style={{ padding: 24 }}>
                <div className="font-heading text-[22px] font-light mb-1" style={{ color: "var(--mk-text-primary)" }}>
                  {proj.name}
                </div>
                <div className="text-[10px] tracking-[0.1em] mb-5" style={{ color: "rgba(244,240,232,0.3)" }}>
                  {proj.location}
                </div>

                {/* Stats */}
                <div
                  className="grid grid-cols-3 mb-5"
                  style={{ gap: "1px", background: "rgba(255,255,255,0.05)" }}
                >
                  {[
                    { val: proj.units, label: "Unidades" },
                    { val: proj.sold, label: "Vendido" },
                    { val: proj.leads, label: "Leads" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "#111", padding: 12 }}>
                      <div className="font-heading text-[18px] font-light" style={{ color: "var(--mk-accent-light)" }}>
                        {s.val}
                      </div>
                      <div className="text-[8px] tracking-[0.12em] mt-0.5" style={{ color: "rgba(244,240,232,0.25)" }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                <span
                  className="font-ui text-[9px] font-bold tracking-[0.18em] uppercase inline-flex items-center gap-2"
                  style={{ color: "rgba(244,240,232,0.3)", textDecoration: "none", transition: "color 0.2s" }}
                >
                  Ver sala de ventas →
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
