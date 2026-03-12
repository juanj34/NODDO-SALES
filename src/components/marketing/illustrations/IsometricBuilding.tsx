"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

/* ── Color constants ── */
const GOLD = "#b8973a";
const GOLD_LIGHT = "#d4b05a";
const PAPER = "#f4f0e8";
const CHARCOAL = "#141414";
const AVAILABLE = "#4a9e6b";
const RESERVED = "#c4853a";
const SOLD = "#888";

/* ── Isometric math helpers ── */
// Left face: world = (60+lx, 130+ly - lx*0.25)
function lfPt(lx: number, ly: number): [number, number] {
  return [60 + lx, 130 + ly - lx * 0.25];
}
function makePoly(lx: number, ly: number, w: number, h: number): string {
  const tl = lfPt(lx, ly);
  const tr = lfPt(lx + w, ly);
  const br = lfPt(lx + w, ly + h);
  const bl = lfPt(lx, ly + h);
  return `${tl[0]},${tl[1]} ${tr[0]},${tr[1]} ${br[0]},${br[1]} ${bl[0]},${bl[1]}`;
}

/* ── Unit positions on left face (10 floors × 4 cols) ── */
const UNIT_POSITIONS = [
  // Floor 1
  { lx: 14, ly: 295, lw: 30, lh: 18, label: "Piso 1 · Unidad 1A" },
  { lx: 62, ly: 295, lw: 30, lh: 18, label: "Piso 1 · Unidad 1B" },
  { lx: 110, ly: 295, lw: 30, lh: 18, label: "Piso 1 · Unidad 1C" },
  { lx: 158, ly: 295, lw: 30, lh: 18, label: "Piso 1 · Unidad 1D" },
  // Floor 2
  { lx: 14, ly: 263, lw: 30, lh: 18, label: "Piso 2 · Unidad 2A" },
  { lx: 62, ly: 263, lw: 30, lh: 18, label: "Piso 2 · Unidad 2B" },
  { lx: 110, ly: 263, lw: 30, lh: 18, label: "Piso 2 · Unidad 2C" },
  { lx: 158, ly: 263, lw: 30, lh: 18, label: "Piso 2 · Unidad 2D" },
  // Floor 3
  { lx: 14, ly: 231, lw: 30, lh: 18, label: "Piso 3 · Unidad 3A" },
  { lx: 62, ly: 231, lw: 30, lh: 18, label: "Piso 3 · Unidad 3B" },
  { lx: 110, ly: 231, lw: 30, lh: 18, label: "Piso 3 · Unidad 3C" },
  { lx: 158, ly: 231, lw: 30, lh: 18, label: "Piso 3 · Unidad 3D" },
  // Floor 4
  { lx: 14, ly: 199, lw: 30, lh: 18, label: "Piso 4 · Unidad 4A" },
  { lx: 62, ly: 199, lw: 30, lh: 18, label: "Piso 4 · Unidad 4B" },
  { lx: 110, ly: 199, lw: 30, lh: 18, label: "Piso 4 · Unidad 4C" },
  { lx: 158, ly: 199, lw: 30, lh: 18, label: "Piso 4 · Unidad 4D" },
  // Floor 5
  { lx: 14, ly: 167, lw: 30, lh: 18, label: "Piso 5 · Unidad 5A" },
  { lx: 62, ly: 167, lw: 30, lh: 18, label: "Piso 5 · Unidad 5B" },
  { lx: 110, ly: 167, lw: 30, lh: 18, label: "Piso 5 · Unidad 5C" },
  { lx: 158, ly: 167, lw: 30, lh: 18, label: "Piso 5 · Unidad 5D" },
  // Floor 6
  { lx: 14, ly: 135, lw: 30, lh: 18, label: "Piso 6 · Unidad 6A" },
  { lx: 62, ly: 135, lw: 30, lh: 18, label: "Piso 6 · Unidad 6B" },
  { lx: 110, ly: 135, lw: 30, lh: 18, label: "Piso 6 · Unidad 6C" },
  { lx: 158, ly: 135, lw: 30, lh: 18, label: "Piso 6 · Unidad 6D" },
  // Floor 7
  { lx: 14, ly: 103, lw: 30, lh: 18, label: "Piso 7 · Unidad 7A" },
  { lx: 62, ly: 103, lw: 30, lh: 18, label: "Piso 7 · Unidad 7B" },
  { lx: 110, ly: 103, lw: 30, lh: 18, label: "Piso 7 · Unidad 7C" },
  { lx: 158, ly: 103, lw: 30, lh: 18, label: "Piso 7 · Unidad 7D" },
  // Floor 8
  { lx: 14, ly: 71, lw: 30, lh: 18, label: "Piso 8 · Unidad 8A" },
  { lx: 62, ly: 71, lw: 30, lh: 18, label: "Piso 8 · Unidad 8B" },
  { lx: 110, ly: 71, lw: 30, lh: 18, label: "Piso 8 · Unidad 8C" },
  { lx: 158, ly: 71, lw: 30, lh: 18, label: "Piso 8 · Unidad 8D" },
  // Floor 9
  { lx: 14, ly: 39, lw: 30, lh: 18, label: "Piso 9 · Unidad 9A" },
  { lx: 62, ly: 39, lw: 30, lh: 18, label: "Piso 9 · Unidad 9B" },
  { lx: 110, ly: 39, lw: 30, lh: 18, label: "Piso 9 · Unidad 9C" },
  { lx: 158, ly: 39, lw: 30, lh: 18, label: "Piso 9 · Unidad 9D" },
  // Floor 10 — penthouse (taller)
  { lx: 14, ly: 7, lw: 34, lh: 21, label: "Piso 10 · Unidad 10A" },
  { lx: 62, ly: 7, lw: 34, lh: 21, label: "Piso 10 · Unidad 10B" },
  { lx: 110, ly: 7, lw: 34, lh: 21, label: "Piso 10 · Unidad 10C" },
  { lx: 158, ly: 7, lw: 34, lh: 21, label: "Piso 10 · Unidad 10D" },
];

const PRICES = [
  "$198,000", "$215,000", "$234,000", "$251,000", "$268,000",
  "$287,000", "$305,000", "$322,000", "$341,000", "$358,000",
];
const TYPES = ["Tipo A · 62 m²", "Tipo B · 78 m²", "Tipo C · 91 m²", "Tipo D · 105 m²"];
const LEADS = [
  { name: "María García", detail: "Interesada en Piso 4 · Tipo B — Instagram Ads" },
  { name: "Carlos Mendoza", detail: "Consultó Piso 7 · Tipo D — Google Ads" },
  { name: "Ana Restrepo", detail: "Exploró Piso 2 · Tipo A — Referido" },
  { name: "Luisa Vargas", detail: "Cotizó Piso 10 · Tipo C — Facebook Ads" },
  { name: "Jorge Ramírez", detail: "Interesado en Piso 5 · Tipo E — LinkedIn" },
];

/* ── Availability dot initial states ── */
const INITIAL_DOT_COLORS = [
  AVAILABLE, AVAILABLE, RESERVED, AVAILABLE, SOLD, AVAILABLE,
  AVAILABLE, SOLD, RESERVED, AVAILABLE, AVAILABLE, SOLD,
];

/* ══════════════════════════════════════════
   Building SVG — perspective-correct isometric
   ══════════════════════════════════════════ */
function BuildingSVG({ svgRef }: { svgRef: React.RefObject<SVGSVGElement | null> }) {
  /* Left face windows: 10 floors × 4 cols as parallelograms */
  const leftWindows: { points: string; floor: number; col: number; isPenthouse: boolean }[] = [];
  for (let floor = 1; floor <= 10; floor++) {
    const isPenthouse = floor === 10;
    for (let col = 1; col <= 4; col++) {
      const lx = 14 + (col - 1) * 48;
      const ly = 295 - (floor - 1) * 32;
      const lw = isPenthouse ? 34 : 30;
      const lh = isPenthouse ? 21 : 18;
      leftWindows.push({ points: makePoly(lx, ly, lw, lh), floor, col, isPenthouse });
    }
  }

  /* Right face windows: 10 floors × 4 cols as parallelograms */
  // Right face shear: world = (260+lx, 80+ly + lx*0.25)
  function rfPt(lx: number, ly: number): [number, number] {
    return [260 + lx, 80 + ly + lx * 0.25];
  }
  function makeRightPoly(lx: number, ly: number, w: number, h: number): string {
    const tl = rfPt(lx, ly);
    const tr = rfPt(lx + w, ly);
    const br = rfPt(lx + w, ly + h);
    const bl = rfPt(lx, ly + h);
    return `${tl[0]},${tl[1]} ${tr[0]},${tr[1]} ${br[0]},${br[1]} ${bl[0]},${bl[1]}`;
  }

  const rightWindows: { points: string; floor: number; col: number; isPenthouse: boolean }[] = [];
  for (let floor = 1; floor <= 10; floor++) {
    const isPenthouse = floor === 10;
    for (let col = 1; col <= 4; col++) {
      const lx = 12 + (col - 1) * 46;
      const ly = 298 - (floor - 1) * 32;
      const lw = isPenthouse ? 32 : 28;
      const lh = isPenthouse ? 20 : 17;
      rightWindows.push({ points: makeRightPoly(lx, ly, lw, lh), floor, col, isPenthouse });
    }
  }

  /* Balcony slabs — every 2 floors (2, 4, 6, 8) */
  const balconyFloors = [2, 4, 6, 8];
  const leftBalconies: { points: string }[] = [];
  const rightBalconies: { points: string }[] = [];

  for (const floor of balconyFloors) {
    for (let col = 1; col <= 4; col++) {
      // Left balcony: small slab below each window
      const lx = 12 + (col - 1) * 48;
      const ly = 295 - (floor - 1) * 32 + 19;
      leftBalconies.push({ points: makePoly(lx, ly, 34, 4) });
      // Right balcony
      const rx = 10 + (col - 1) * 46;
      const ry = 298 - (floor - 1) * 32 + 17.5;
      rightBalconies.push({ points: makeRightPoly(rx, ry, 32, 4) });
    }
  }

  /* Floor lines */
  const floorLineYs = Array.from({ length: 9 }, (_, i) => {
    const ly = 32 * (i + 1);
    return ly;
  });

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 520 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{
        filter: "drop-shadow(0 40px 80px rgba(0,0,0,.8))",
        animation: "buildingFloat 6s ease-in-out infinite",
      }}
    >
      <defs>
        <linearGradient id="fL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1d1d1d" />
          <stop offset="100%" stopColor="#272727" />
        </linearGradient>
        <linearGradient id="fR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0d0d0d" />
          <stop offset="100%" stopColor="#151515" />
        </linearGradient>
        <linearGradient id="roofG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#303030" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
        <linearGradient id="gEdge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8c96a" stopOpacity=".9" />
          <stop offset="50%" stopColor="#b8973a" stopOpacity=".6" />
          <stop offset="100%" stopColor="#b8973a" stopOpacity=".1" />
        </linearGradient>
        <linearGradient id="winDepthL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8a040" stopOpacity=".18" />
          <stop offset="100%" stopColor="#8a6820" stopOpacity=".05" />
        </linearGradient>
        <linearGradient id="winDepthR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#80b4d8" stopOpacity=".14" />
          <stop offset="100%" stopColor="#4080a8" stopOpacity=".04" />
        </linearGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="260" cy="498" rx="160" ry="12" fill="rgba(0,0,0,.5)" />

      {/* Base platform */}
      <polygon points="60,450 260,490 460,450 260,410" fill="#1c1c1c" stroke="rgba(184,151,58,.2)" strokeWidth="1" />
      <polygon points="60,450 60,462 260,502 260,490" fill="#111" />
      <polygon points="460,450 460,462 260,502 260,490" fill="#181818" />

      {/* ═══ LEFT FACE ═══ */}
      <polygon points="60,450 60,130 260,80 260,400" fill="url(#fL)" />

      {/* Floor lines — left face */}
      {floorLineYs.map((ly, i) => (
        <line
          key={`fl-l-${i}`}
          x1="60" y1={130 + ly}
          x2="260" y2={80 + ly}
          stroke="rgba(184,151,58,.08)" strokeWidth=".7"
        />
      ))}

      {/* Left face windows */}
      {leftWindows.map(({ points, floor, col, isPenthouse }) => (
        <polygon
          key={`lw-${floor}-${col}`}
          data-win="left"
          points={points}
          fill="url(#winDepthL)"
          stroke="rgba(184,151,58,.3)"
          strokeWidth={isPenthouse ? ".9" : ".8"}
        />
      ))}

      {/* Left face balconies */}
      {leftBalconies.map((b, i) => (
        <polygon
          key={`lb-${i}`}
          points={b.points}
          fill="#1c1c1c"
          stroke="rgba(184,151,58,.2)"
          strokeWidth=".5"
        />
      ))}

      {/* ═══ RIGHT FACE ═══ */}
      <polygon points="260,400 260,80 460,130 460,450" fill="url(#fR)" />

      {/* Floor lines — right face */}
      {floorLineYs.map((ly, i) => (
        <line
          key={`fl-r-${i}`}
          x1="260" y1={80 + ly}
          x2="460" y2={130 + ly}
          stroke="rgba(100,140,180,.07)" strokeWidth=".7"
        />
      ))}

      {/* Right face windows */}
      {rightWindows.map(({ points, floor, col, isPenthouse }) => (
        <polygon
          key={`rw-${floor}-${col}`}
          data-win="right"
          points={points}
          fill="url(#winDepthR)"
          stroke="rgba(130,180,220,.22)"
          strokeWidth={isPenthouse ? ".9" : ".8"}
        />
      ))}

      {/* Right face balconies */}
      {rightBalconies.map((b, i) => (
        <polygon
          key={`rb-${i}`}
          points={b.points}
          fill="#111"
          stroke="rgba(130,180,220,.12)"
          strokeWidth=".5"
        />
      ))}

      {/* ═══ ROOF ═══ */}
      <polygon points="60,130 260,80 460,130 260,180" fill="url(#roofG)" />
      <line x1="60" y1="130" x2="260" y2="180" stroke="rgba(184,151,58,.1)" strokeWidth=".5" />
      <line x1="460" y1="130" x2="260" y2="180" stroke="rgba(184,151,58,.06)" strokeWidth=".5" />
      <line x1="60" y1="130" x2="260" y2="80" stroke="rgba(184,151,58,.28)" strokeWidth=".8" />
      <line x1="460" y1="130" x2="260" y2="80" stroke="rgba(184,151,58,.2)" strokeWidth=".8" />

      {/* Rooftop details */}
      <rect x="230" y="72" width="24" height="14" rx="1" fill="#222" stroke="rgba(184,151,58,.2)" strokeWidth=".8" />
      <rect x="258" y="69" width="12" height="12" rx="1" fill="#1a1a1a" stroke="rgba(184,151,58,.15)" strokeWidth=".8" />
      <rect x="274" y="74" width="18" height="10" rx="1" fill="#1c1c1c" stroke="rgba(184,151,58,.12)" strokeWidth=".8" />
      <circle cx="242" cy="77" r="3" fill="rgba(184,151,58,.65)" />
      <circle cx="242" cy="77" r="7" fill="rgba(184,151,58,.08)" />

      {/* ═══ STRUCTURAL EDGES ═══ */}
      <line x1="60" y1="130" x2="60" y2="450" stroke="url(#gEdge)" strokeWidth="1.2" />
      <line x1="260" y1="80" x2="260" y2="400" stroke="url(#gEdge)" strokeWidth="2.2" />
      <line x1="460" y1="130" x2="460" y2="450" stroke="rgba(184,151,58,.2)" strokeWidth=".8" />
      <line x1="60" y1="130" x2="260" y2="80" stroke="rgba(184,151,58,.5)" strokeWidth="1.2" />
      <line x1="460" y1="130" x2="260" y2="80" stroke="rgba(184,151,58,.32)" strokeWidth="1" />

      {/* Ground floor entrance — left */}
      <polygon points="150,429.5 178,422.0 178,442.0 150,449.5" fill="rgba(184,151,58,.06)" stroke="rgba(184,151,58,.25)" strokeWidth=".8" />
      <line x1="164" y1="430" x2="164" y2="449" stroke="rgba(184,151,58,.14)" strokeWidth=".5" />
      {/* Ground floor entrance — right */}
      <polygon points="302,438.5 330,445.5 330,449.5 302,442.5" fill="rgba(130,180,220,.06)" stroke="rgba(130,180,220,.18)" strokeWidth=".8" />

      {/* Selected unit highlight (will be moved by JS) */}
      <polygon
        data-sel-unit=""
        points={makePoly(62, 199, 30, 18)}
        fill="rgba(184,151,58,.42)"
        stroke="rgba(184,151,58,.98)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════
   Floating card components
   ══════════════════════════════════════════ */

function FloorplanCard() {
  return (
    <div
      className="rounded-[10px] px-3.5 py-3 backdrop-blur-xl"
      style={{
        background: "rgba(20,20,20,0.82)",
        border: "1px solid rgba(184,151,58,0.25)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        width: 172,
      }}
    >
      <p className="font-ui uppercase mb-2" style={{ fontSize: 8, letterSpacing: "0.3em", color: GOLD }}>
        PLANTA
      </p>
      <svg viewBox="0 0 140 70" fill="none" className="w-full mb-2.5" style={{ height: 56 }}>
        <rect x="4" y="4" width="132" height="62" rx="2" stroke={GOLD} strokeWidth="1.2" strokeOpacity="0.5" fill="none" />
        <rect x="4" y="4" width="72" height="38" stroke={GOLD} strokeWidth="0.6" strokeOpacity="0.25" fill="rgba(184,151,58,0.06)" />
        <text x="40" y="26" textAnchor="middle" fill={GOLD} fillOpacity="0.35" fontSize="6" fontFamily="monospace">LIVING</text>
        <rect x="76" y="4" width="60" height="38" stroke={GOLD} strokeWidth="0.6" strokeOpacity="0.25" fill="rgba(184,151,58,0.04)" />
        <text x="106" y="26" textAnchor="middle" fill={GOLD} fillOpacity="0.3" fontSize="5.5" fontFamily="monospace">COCINA</text>
        <rect x="4" y="42" width="48" height="24" stroke={GOLD} strokeWidth="0.6" strokeOpacity="0.25" fill="rgba(184,151,58,0.05)" />
        <text x="28" y="57" textAnchor="middle" fill={GOLD} fillOpacity="0.3" fontSize="5" fontFamily="monospace">HAB 1</text>
        <rect x="52" y="42" width="44" height="24" stroke={GOLD} strokeWidth="0.6" strokeOpacity="0.25" fill="rgba(184,151,58,0.05)" />
        <text x="74" y="57" textAnchor="middle" fill={GOLD} fillOpacity="0.3" fontSize="5" fontFamily="monospace">HAB 2</text>
        <rect x="96" y="42" width="40" height="12" stroke={GOLD} strokeWidth="0.5" strokeOpacity="0.2" fill="rgba(184,151,58,0.03)" />
        <text x="116" y="51" textAnchor="middle" fill={GOLD} fillOpacity="0.25" fontSize="4.5" fontFamily="monospace">BAÑO 1</text>
        <rect x="96" y="54" width="40" height="12" stroke={GOLD} strokeWidth="0.5" strokeOpacity="0.2" fill="rgba(184,151,58,0.03)" />
        <text x="116" y="63" textAnchor="middle" fill={GOLD} fillOpacity="0.25" fontSize="4.5" fontFamily="monospace">BAÑO 2</text>
        <path d="M 28 42 A 8 8 0 0 1 36 42" stroke={GOLD} strokeWidth="0.5" strokeOpacity="0.3" fill="none" />
        <path d="M 60 42 A 8 8 0 0 1 68 42" stroke={GOLD} strokeWidth="0.5" strokeOpacity="0.3" fill="none" />
      </svg>
      <p className="font-heading" style={{ fontSize: 22, fontWeight: 300, color: PAPER, lineHeight: 1.1, marginBottom: 3 }}>
        78 m&sup2;
      </p>
      <p style={{ fontSize: 9, color: "rgba(244,240,232,0.4)" }}>2 hab &middot; 2 baños</p>
    </div>
  );
}

function PriceCard({ price, unitLabel, typeLabel }: { price: string; unitLabel: string; typeLabel: string }) {
  return (
    <div
      className="rounded-[10px] px-4 py-2.5 backdrop-blur-xl"
      style={{
        background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
        boxShadow: "0 8px 28px rgba(184,151,58,0.25), 0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <p className="font-ui uppercase" style={{ fontSize: 7, letterSpacing: "0.3em", color: "rgba(20,20,20,0.6)", marginBottom: 2 }}>
        {unitLabel}
      </p>
      <p className="font-heading" style={{ fontSize: 26, fontWeight: 600, color: CHARCOAL, lineHeight: 1 }}>
        {price}
      </p>
      <p style={{ fontSize: 8, color: "rgba(20,20,20,0.5)", marginTop: 2 }}>{typeLabel}</p>
    </div>
  );
}

function AvailabilityCard({ dotColors }: { dotColors: string[] }) {
  return (
    <div
      className="rounded-[10px] px-3.5 py-3 backdrop-blur-xl"
      style={{
        background: "rgba(20,20,20,0.82)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        width: 148,
      }}
    >
      <p className="font-ui uppercase mb-2" style={{ fontSize: 8, letterSpacing: "0.3em", color: GOLD }}>
        INVENTARIO
      </p>
      <div className="flex flex-wrap gap-[4px] mb-2.5">
        {dotColors.map((c, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: 10, height: 10, background: c,
              opacity: c === SOLD ? 0.5 : 0.85,
              transition: "background 0.4s ease",
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        {[
          { c: AVAILABLE, l: "Disp." },
          { c: RESERVED, l: "Reserv." },
          { c: SOLD, l: "Vendido" },
        ].map(({ c, l }) => (
          <div key={l} className="flex items-center gap-1">
            <div className="rounded-full" style={{ width: 5, height: 5, background: c, opacity: c === SOLD ? 0.5 : 0.85 }} />
            <span style={{ fontSize: 7, color: "rgba(244,240,232,0.35)" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadCard({ name, detail }: { name: string; detail: string }) {
  return (
    <div
      className="rounded-[10px] px-3.5 py-2.5 backdrop-blur-xl"
      style={{
        background: "rgba(20,20,20,0.82)",
        border: "1px solid rgba(74,158,107,0.3)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        width: 160,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="relative flex-shrink-0">
          <div className="rounded-full" style={{ width: 8, height: 8, background: AVAILABLE }} />
          <div
            className="absolute inset-[-4px] rounded-full"
            style={{ background: "rgba(74,158,107,.25)", animation: "leadPulse 2s infinite" }}
          />
        </div>
        <p className="font-ui uppercase" style={{ fontSize: 8, letterSpacing: "0.3em", color: AVAILABLE }}>
          NUEVO LEAD
        </p>
      </div>
      <p className="font-heading" style={{ fontSize: 16, fontWeight: 300, color: PAPER, lineHeight: 1.2 }}>
        {name}
      </p>
      <p style={{ fontSize: 9, color: "rgba(244,240,232,0.4)", marginTop: 2 }}>{detail}</p>
    </div>
  );
}

function ProgressCard() {
  return (
    <div
      className="rounded-[10px] px-3.5 py-2.5 backdrop-blur-xl"
      style={{
        background: "rgba(20,20,20,0.82)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        width: 140,
      }}
    >
      <p className="font-ui uppercase mb-1.5" style={{ fontSize: 8, letterSpacing: "0.3em", color: GOLD }}>
        AVANCE
      </p>
      <div className="flex items-baseline gap-1.5 mb-2">
        <p className="font-heading" style={{ fontSize: 22, fontWeight: 300, color: PAPER, lineHeight: 1 }}>68%</p>
        <p style={{ fontSize: 9, color: "rgba(244,240,232,0.4)" }}>completado</p>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})` }}
          initial={{ width: "0%" }}
          animate={{ width: "68%" }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
      <p style={{ fontSize: 8, color: "rgba(244,240,232,0.35)", marginTop: 6 }}>Entrega: Q2 2026</p>
    </div>
  );
}

/* ══════════════════════════════════════════
   Card cycling animation hook
   ══════════════════════════════════════════ */
function useCardCycle(
  ref: React.RefObject<HTMLDivElement | null>,
  inAnim: string,
  outAnim: string,
  holdMs: number,
  offsetMs: number,
) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function clearTimers() {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    }

    function addTimer(fn: () => void, ms: number) {
      const t = setTimeout(fn, ms);
      timersRef.current.push(t);
      return t;
    }

    function cycle() {
      if (!el) return;
      // IN
      el.style.animation = "none";
      el.style.opacity = "0";
      addTimer(() => {
        if (!el) return;
        el.style.animation = `${inAnim} .6s cubic-bezier(.22,1,.36,1) forwards`;
        el.style.opacity = "";
        // HOLD then OUT
        addTimer(() => {
          if (!el) return;
          el.style.animation = `${outAnim} .5s ease forwards`;
          addTimer(() => {
            if (!el) return;
            el.style.opacity = "0";
            el.style.animation = "none";
            addTimer(cycle, 800 + Math.random() * 600);
          }, 500);
        }, holdMs);
      }, 20);
    }

    // Start after offset
    const startTimer = setTimeout(cycle, offsetMs + 1200);
    timersRef.current.push(startTimer);

    return () => {
      clearTimeout(startTimer);
      clearTimers();
    };
  }, [ref, inAnim, outAnim, holdMs, offsetMs]);
}

/* ══════════════════════════════════════════
   Main export: IsometricBuilding
   ══════════════════════════════════════════ */
export function IsometricBuilding({ className }: { className?: string }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateY = useTransform(mouseX, [-1, 1], [-4, 4]);
  const rotateX = useTransform(mouseY, [-1, 1], [2.5, -2.5]);

  // Card refs for cycling
  const cardFloorplanRef = useRef<HTMLDivElement>(null);
  const cardPriceRef = useRef<HTMLDivElement>(null);
  const cardAvailRef = useRef<HTMLDivElement>(null);
  const cardProgressRef = useRef<HTMLDivElement>(null);
  const cardLeadRef = useRef<HTMLDivElement>(null);

  // Price card state (updated by unit travel)
  const [priceData, setPriceData] = useState({ price: "$287,000", unitLabel: "Piso 4 · Unidad 4B", typeLabel: "Tipo B · 78 m²" });

  // Availability dot colors
  const [dotColors, setDotColors] = useState(INITIAL_DOT_COLORS);

  // Lead card state
  const [leadData, setLeadData] = useState(LEADS[0]);

  // Card cycling animations
  useCardCycle(cardFloorplanRef, "cardInLeft", "cardOutLeft", 4500, 0);
  useCardCycle(cardPriceRef, "cardInRight", "cardOutRight", 4000, 700);
  useCardCycle(cardAvailRef, "cardInLeft", "cardOutLeft", 4200, 1400);
  useCardCycle(cardProgressRef, "cardInRight", "cardOutRight", 3800, 2100);
  useCardCycle(cardLeadRef, "cardInUp", "cardOutUp", 3500, 2800);

  /* ── Parallax ── */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = sceneRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouseX.set(nx);
      mouseY.set(ny);
    },
    [mouseX, mouseY],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  /* ── Window Blink Animation ── */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    let timeout: ReturnType<typeof setTimeout>;
    const wins = svg.querySelectorAll<SVGPolygonElement>("polygon[data-win]");
    const selUnit = svg.querySelector<SVGPolygonElement>("polygon[data-sel-unit]");

    function blinkRandom() {
      const idx = Math.floor(Math.random() * wins.length);
      const w = wins[idx];
      if (w === selUnit) {
        timeout = setTimeout(blinkRandom, 100);
        return;
      }
      w.style.transition = "opacity .8s ease";
      const cur = parseFloat(w.style.opacity || "1");
      w.style.opacity = cur > 0.55
        ? (Math.random() * 0.2 + 0.05).toFixed(2)
        : (Math.random() * 0.6 + 0.4).toFixed(2);
      timeout = setTimeout(blinkRandom, Math.random() * 500 + 150);
    }

    blinkRandom();
    return () => clearTimeout(timeout);
  }, []);

  /* ── Selected Unit Travel ── */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const selUnit = svg.querySelector<SVGPolygonElement>("polygon[data-sel-unit]");
    if (!selUnit) return;

    let currentIdx = 13; // floor 4, col B
    const interval = setInterval(() => {
      // Deselect
      selUnit.setAttribute("fill", "rgba(184,151,58,.06)");
      selUnit.setAttribute("stroke", "rgba(184,151,58,.12)");
      selUnit.setAttribute("stroke-width", ".5");

      // Pick next
      currentIdx = (currentIdx + Math.floor(Math.random() * 6) + 4) % UNIT_POSITIONS.length;
      const u = UNIT_POSITIONS[currentIdx];

      // Move
      selUnit.setAttribute("points", makePoly(u.lx, u.ly, u.lw, u.lh));
      selUnit.setAttribute("fill", "rgba(184,151,58,.42)");
      selUnit.setAttribute("stroke", "rgba(184,151,58,.98)");
      selUnit.setAttribute("stroke-width", "1.5");

      // Update price card data
      setPriceData({
        price: PRICES[Math.floor(Math.random() * PRICES.length)],
        unitLabel: u.label,
        typeLabel: TYPES[Math.floor(Math.random() * TYPES.length)],
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  /* ── Availability Dot Animation ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setDotColors(prev => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        const colors = [AVAILABLE, RESERVED, SOLD];
        next[idx] = colors[Math.floor(Math.random() * colors.length)];
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  /* ── Lead Rotation ── */
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % LEADS.length;
      setLeadData(LEADS[idx]);
    }, 5200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={sceneRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative select-none ${className ?? ""}`}
      style={{ width: 560, height: 580 }}
    >
      {/* Glow behind building */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%", left: "50%",
          width: 360, height: 360,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(184,151,58,.06) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "glowPulse 4s ease-in-out infinite",
        }}
      />

      {/* Shimmer line */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "50%", top: "8%",
          width: 2, height: 48,
          background: `linear-gradient(to bottom, transparent, ${GOLD_LIGHT}, transparent)`,
          transform: "translateX(-1px)",
          animation: "shimmerDown 3.5s ease-in-out infinite",
          opacity: 0.6,
          zIndex: 10,
        }}
      />

      {/* Building with parallax */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ rotateY, rotateX, perspective: 800 }}
      >
        <div className="w-[520px] h-[520px]">
          <BuildingSVG svgRef={svgRef} />
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          Floating data cards (cycling)
         ═══════════════════════════════════ */}

      {/* 1. Floor plan (top-left) */}
      <div
        ref={cardFloorplanRef}
        className="absolute z-20 pointer-events-none"
        style={{ top: 12, left: 0, opacity: 0 }}
      >
        <FloorplanCard />
      </div>

      {/* 2. Price (top-right) */}
      <div
        ref={cardPriceRef}
        className="absolute z-20 pointer-events-none"
        style={{ top: 48, right: 4, opacity: 0 }}
      >
        <PriceCard {...priceData} />
      </div>

      {/* 3. Availability (bottom-left) */}
      <div
        ref={cardAvailRef}
        className="absolute z-20 pointer-events-none"
        style={{ bottom: 68, left: 8, opacity: 0 }}
      >
        <AvailabilityCard dotColors={dotColors} />
      </div>

      {/* 4. Lead (bottom-right) */}
      <div
        ref={cardLeadRef}
        className="absolute z-20 pointer-events-none"
        style={{ bottom: 56, right: 0, opacity: 0 }}
      >
        <LeadCard {...leadData} />
      </div>

      {/* 5. Progress (middle-right) */}
      <div
        ref={cardProgressRef}
        className="absolute z-20 pointer-events-none"
        style={{ top: 240, right: -4, opacity: 0 }}
      >
        <ProgressCard />
      </div>
    </div>
  );
}
