"use client";

import { motion, useMotionValue, useTransform, type Variants } from "framer-motion";
import { useCallback, useRef } from "react";

/* ── Color constants ── */
const GOLD = "#b8973a";
const GOLD_LIGHT = "#d4b05a";
const PAPER = "#f4f0e8";
const CHARCOAL = "#141414";
const AVAILABLE = "#4a9e6b";
const RESERVED = "#c4853a";
const SOLD = "#888";

/* ── Availability dot grid data ── */
const DOTS_GRID: ("a" | "r" | "s")[][] = [
  ["a", "a", "s", "r", "a", "a"],
  ["s", "a", "a", "a", "r", "s"],
  ["a", "r", "a", "s", "a", "a"],
  ["a", "a", "a", "a", "a", "r"],
];
const dotColor = (t: "a" | "r" | "s") =>
  t === "a" ? AVAILABLE : t === "r" ? RESERVED : SOLD;

/* ── Stagger delays for floating cards ── */
const CARD_DELAYS = [1.2, 1.6, 2.0, 2.4, 2.8];

/* ── Card entrance animation ── */
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.92 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

/* ── Isometric SVG building ── */
function BuildingSVG() {
  /* Left face window rows (10 floors, bottom to top) */
  const leftFloors = Array.from({ length: 10 }, (_, i) => {
    const y = 370 - i * 32;
    const goldOpacity = 0.08 + (i / 9) * 0.28; // bottom=0.08, top=0.36
    return { y, goldOpacity, floor: i };
  });

  /* Right face window rows */
  const rightFloors = Array.from({ length: 10 }, (_, i) => {
    const y = 370 - i * 32;
    return { y, floor: i };
  });

  return (
    <svg
      viewBox="0 0 460 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        {/* Gold window glow gradient */}
        <linearGradient id="goldWindowGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} stopOpacity="0.6" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.2" />
        </linearGradient>

        {/* Left face gradient */}
        <linearGradient id="leftFaceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2a2f" />
          <stop offset="100%" stopColor="#1a1a1d" />
        </linearGradient>

        {/* Right face gradient */}
        <linearGradient id="rightFaceGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#222226" />
          <stop offset="100%" stopColor="#1e1e22" />
        </linearGradient>

        {/* Roof gold gradient */}
        <linearGradient id="roofGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} stopOpacity="0.3" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.15" />
        </linearGradient>

        {/* Shadow blur */}
        <filter id="shadowBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
        </filter>

        {/* Pulse glow for selected unit */}
        <filter id="pulseGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>

      {/* ── Shadow ellipse ── */}
      <ellipse
        cx="230"
        cy="472"
        rx="140"
        ry="18"
        fill="rgba(0,0,0,0.35)"
        filter="url(#shadowBlur)"
      />

      {/* ── Platform / base ── */}
      {/* Top face of platform */}
      <polygon
        points="230,430 340,375 230,445 120,375"
        fill="#2a2a2f"
        stroke={GOLD}
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />
      {/* Left face of platform */}
      <polygon
        points="120,375 230,445 230,455 120,385"
        fill="#1a1a1d"
        stroke={GOLD}
        strokeWidth="0.4"
        strokeOpacity="0.15"
      />
      {/* Right face of platform */}
      <polygon
        points="340,375 230,445 230,455 340,385"
        fill="#222226"
        stroke={GOLD}
        strokeWidth="0.4"
        strokeOpacity="0.15"
      />

      {/* ── Building left face ── */}
      <polygon
        points="120,375 230,440 230,70 120,28"
        fill="url(#leftFaceGrad)"
      />
      {/* Left face border */}
      <line
        x1="120"
        y1="28"
        x2="120"
        y2="375"
        stroke={GOLD}
        strokeWidth="1"
        strokeOpacity="0.35"
      />
      <line
        x1="120"
        y1="375"
        x2="230"
        y2="440"
        stroke={GOLD}
        strokeWidth="0.6"
        strokeOpacity="0.2"
      />

      {/* ── Building right face ── */}
      <polygon
        points="230,440 340,375 340,28 230,70"
        fill="url(#rightFaceGrad)"
      />
      {/* Right face border */}
      <line
        x1="340"
        y1="28"
        x2="340"
        y2="375"
        stroke={GOLD}
        strokeWidth="1"
        strokeOpacity="0.35"
      />
      <line
        x1="340"
        y1="375"
        x2="230"
        y2="440"
        stroke={GOLD}
        strokeWidth="0.6"
        strokeOpacity="0.2"
      />

      {/* ── Roof top face ── */}
      <polygon
        points="230,70 120,28 230,12 340,28"
        fill="url(#roofGold)"
        stroke={GOLD}
        strokeWidth="1"
        strokeOpacity="0.5"
      />

      {/* ── Gold roof peak accent line ── */}
      <line
        x1="120"
        y1="28"
        x2="340"
        y2="28"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="230"
        y1="12"
        x2="230"
        y2="70"
        stroke={GOLD}
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />

      {/* ── Left face windows (10 floors, 4 windows each) ── */}
      {leftFloors.map(({ y, goldOpacity, floor }) =>
        [0, 1, 2, 3].map((col) => {
          // Isometric perspective: windows follow the slant
          const xBase = 130 + col * 22;
          const yOffset = col * 5.8; // isometric slant for each column
          const wy = y + yOffset;
          const ww = 16;
          const wh = 20;

          return (
            <g key={`left-${floor}-${col}`}>
              {/* Window pane */}
              <rect
                x={xBase}
                y={wy}
                width={ww}
                height={wh}
                rx="1"
                fill={`rgba(184,151,58,${goldOpacity})`}
              />
              {/* Window frame */}
              <rect
                x={xBase}
                y={wy}
                width={ww}
                height={wh}
                rx="1"
                fill="none"
                stroke={GOLD}
                strokeWidth="0.4"
                strokeOpacity={0.15 + goldOpacity * 0.4}
              />
              {/* Horizontal mullion */}
              <line
                x1={xBase}
                y1={wy + wh * 0.45}
                x2={xBase + ww}
                y2={wy + wh * 0.45}
                stroke={GOLD}
                strokeWidth="0.3"
                strokeOpacity={0.12}
              />
            </g>
          );
        })
      )}

      {/* ── Right face windows (10 floors, 4 windows each) ── */}
      {rightFloors.map(({ y, floor }) =>
        [0, 1, 2, 3].map((col) => {
          const xBase = 244 + col * 22;
          const yOffset = -(col * 5.8); // opposite slant for right face
          const wy = y + yOffset;
          const ww = 16;
          const wh = 20;

          return (
            <g key={`right-${floor}-${col}`}>
              {/* Window pane — subtle white */}
              <rect
                x={xBase}
                y={wy}
                width={ww}
                height={wh}
                rx="1"
                fill="rgba(255,255,255,0.04)"
              />
              {/* Window frame */}
              <rect
                x={xBase}
                y={wy}
                width={ww}
                height={wh}
                rx="1"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.4"
              />
              {/* Horizontal mullion */}
              <line
                x1={xBase}
                y1={wy + wh * 0.45}
                x2={xBase + ww}
                y2={wy + wh * 0.45}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.3"
              />
            </g>
          );
        })
      )}

      {/* ── Vertical floor separation lines — left face ── */}
      {leftFloors.map(({ y, floor }) => (
        <line
          key={`lf-line-${floor}`}
          x1="125"
          y1={y + 26}
          x2="224"
          y2={y + 26 + 23}
          stroke={GOLD}
          strokeWidth="0.3"
          strokeOpacity="0.1"
        />
      ))}

      {/* ── Vertical floor separation lines — right face ── */}
      {rightFloors.map(({ y, floor }) => (
        <line
          key={`rf-line-${floor}`}
          x1="236"
          y1={y + 26 + 23}
          x2="335"
          y2={y + 26}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="0.3"
        />
      ))}

      {/* ── Selected unit highlight (floor 6, col 1 on left face) — pulses ── */}
      <g>
        {/* Glow behind */}
        <rect
          x="152"
          y={370 - 6 * 32 + 5.8}
          width="16"
          height="20"
          rx="1"
          fill={GOLD_LIGHT}
          opacity="0.35"
          filter="url(#pulseGlow)"
        >
          <animate
            attributeName="opacity"
            values="0.35;0.55;0.35"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </rect>
        {/* Bright window */}
        <rect
          x="152"
          y={370 - 6 * 32 + 5.8}
          width="16"
          height="20"
          rx="1"
          fill={GOLD_LIGHT}
          opacity="0.7"
        >
          <animate
            attributeName="opacity"
            values="0.7;0.9;0.7"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </rect>
        {/* Gold border */}
        <rect
          x="152"
          y={370 - 6 * 32 + 5.8}
          width="16"
          height="20"
          rx="1"
          fill="none"
          stroke={GOLD_LIGHT}
          strokeWidth="1.2"
        >
          <animate
            attributeName="strokeOpacity"
            values="0.8;1;0.8"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </rect>
      </g>

      {/* ── Gold corner accent edges ── */}
      {/* Front vertical edge */}
      <line
        x1="230"
        y1="70"
        x2="230"
        y2="440"
        stroke={GOLD}
        strokeWidth="1.2"
        strokeOpacity="0.5"
      />
      {/* Top left edge */}
      <line
        x1="120"
        y1="28"
        x2="230"
        y2="12"
        stroke={GOLD}
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />
      {/* Top right edge */}
      <line
        x1="340"
        y1="28"
        x2="230"
        y2="12"
        stroke={GOLD}
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

/* ── Main export ── */
export function IsometricBuilding({ className }: { className?: string }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateY = useTransform(mouseX, [-1, 1], [-3, 3]);
  const rotateX = useTransform(mouseY, [-1, 1], [3, -3]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = sceneRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouseX.set(nx);
      mouseY.set(ny);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={sceneRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative select-none ${className ?? ""}`}
      style={{ width: 520, height: 520 }}
    >
      {/* Gold ambient glow behind building */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(184,151,58,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Building with float animation + parallax */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          rotateY,
          rotateX,
          perspective: 800,
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{
          y: {
            duration: 6,
            ease: "easeInOut",
            repeat: Infinity,
          },
        }}
      >
        <div className="w-[380px] h-[420px]">
          <BuildingSVG />
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════
          Floating data cards
         ═══════════════════════════════════════════ */}

      {/* ── 1. Floor plan card (top-left) ── */}
      <motion.div
        custom={CARD_DELAYS[0]}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="absolute z-20"
        style={{ top: 32, left: 0 }}
      >
        <div
          className="rounded-[10px] px-3.5 py-3 backdrop-blur-xl"
          style={{
            background: "rgba(20,20,20,0.82)",
            border: `1px solid rgba(184,151,58,0.25)`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            width: 172,
          }}
        >
          {/* Tag */}
          <p
            className="font-ui uppercase mb-2"
            style={{
              fontSize: 8,
              letterSpacing: "0.3em",
              color: GOLD,
            }}
          >
            PLANTA
          </p>

          {/* Mini floor plan SVG */}
          <svg
            viewBox="0 0 140 70"
            fill="none"
            className="w-full mb-2.5"
            style={{ height: 56 }}
          >
            {/* Outer walls */}
            <rect
              x="4"
              y="4"
              width="132"
              height="62"
              rx="2"
              stroke={GOLD}
              strokeWidth="1.2"
              strokeOpacity="0.5"
              fill="none"
            />
            {/* Living/dining area */}
            <rect
              x="4"
              y="4"
              width="72"
              height="38"
              stroke={GOLD}
              strokeWidth="0.6"
              strokeOpacity="0.25"
              fill={`rgba(184,151,58,0.06)`}
            />
            <text
              x="40"
              y="26"
              textAnchor="middle"
              fill={GOLD}
              fillOpacity="0.35"
              fontSize="6"
              fontFamily="monospace"
            >
              LIVING
            </text>
            {/* Kitchen */}
            <rect
              x="76"
              y="4"
              width="60"
              height="38"
              stroke={GOLD}
              strokeWidth="0.6"
              strokeOpacity="0.25"
              fill={`rgba(184,151,58,0.04)`}
            />
            <text
              x="106"
              y="26"
              textAnchor="middle"
              fill={GOLD}
              fillOpacity="0.3"
              fontSize="5.5"
              fontFamily="monospace"
            >
              COCINA
            </text>
            {/* Bedroom 1 */}
            <rect
              x="4"
              y="42"
              width="48"
              height="24"
              stroke={GOLD}
              strokeWidth="0.6"
              strokeOpacity="0.25"
              fill={`rgba(184,151,58,0.05)`}
            />
            <text
              x="28"
              y="57"
              textAnchor="middle"
              fill={GOLD}
              fillOpacity="0.3"
              fontSize="5"
              fontFamily="monospace"
            >
              HAB 1
            </text>
            {/* Bedroom 2 */}
            <rect
              x="52"
              y="42"
              width="44"
              height="24"
              stroke={GOLD}
              strokeWidth="0.6"
              strokeOpacity="0.25"
              fill={`rgba(184,151,58,0.05)`}
            />
            <text
              x="74"
              y="57"
              textAnchor="middle"
              fill={GOLD}
              fillOpacity="0.3"
              fontSize="5"
              fontFamily="monospace"
            >
              HAB 2
            </text>
            {/* Bathrooms */}
            <rect
              x="96"
              y="42"
              width="40"
              height="12"
              stroke={GOLD}
              strokeWidth="0.5"
              strokeOpacity="0.2"
              fill={`rgba(184,151,58,0.03)`}
            />
            <text
              x="116"
              y="51"
              textAnchor="middle"
              fill={GOLD}
              fillOpacity="0.25"
              fontSize="4.5"
              fontFamily="monospace"
            >
              BAÑO 1
            </text>
            <rect
              x="96"
              y="54"
              width="40"
              height="12"
              stroke={GOLD}
              strokeWidth="0.5"
              strokeOpacity="0.2"
              fill={`rgba(184,151,58,0.03)`}
            />
            <text
              x="116"
              y="63"
              textAnchor="middle"
              fill={GOLD}
              fillOpacity="0.25"
              fontSize="4.5"
              fontFamily="monospace"
            >
              BAÑO 2
            </text>
            {/* Door arcs */}
            <path
              d="M 28 42 A 8 8 0 0 1 36 42"
              stroke={GOLD}
              strokeWidth="0.5"
              strokeOpacity="0.3"
              fill="none"
            />
            <path
              d="M 60 42 A 8 8 0 0 1 68 42"
              stroke={GOLD}
              strokeWidth="0.5"
              strokeOpacity="0.3"
              fill="none"
            />
          </svg>

          {/* Specs */}
          <p
            className="font-heading"
            style={{
              fontSize: 22,
              fontWeight: 300,
              color: PAPER,
              lineHeight: 1.1,
              marginBottom: 3,
            }}
          >
            78 m&sup2;
          </p>
          <p
            style={{
              fontSize: 9,
              color: `rgba(244,240,232,0.4)`,
            }}
          >
            2 hab &middot; 2 ba&ntilde;os
          </p>
        </div>
      </motion.div>

      {/* ── 2. Price tag (top-right) ── */}
      <motion.div
        custom={CARD_DELAYS[1]}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="absolute z-20"
        style={{ top: 48, right: 4 }}
      >
        <div
          className="rounded-[10px] px-4 py-2.5 backdrop-blur-xl"
          style={{
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
            boxShadow: `0 8px 28px rgba(184,151,58,0.25), 0 2px 8px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Tag */}
          <p
            className="font-ui uppercase"
            style={{
              fontSize: 7,
              letterSpacing: "0.3em",
              color: "rgba(20,20,20,0.6)",
              marginBottom: 2,
            }}
          >
            DESDE
          </p>
          <p
            className="font-heading"
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: CHARCOAL,
              lineHeight: 1,
            }}
          >
            $287,000
          </p>
        </div>
      </motion.div>

      {/* ── 3. Availability dots (bottom-left) ── */}
      <motion.div
        custom={CARD_DELAYS[2]}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="absolute z-20"
        style={{ bottom: 68, left: 8 }}
      >
        <div
          className="rounded-[10px] px-3.5 py-3 backdrop-blur-xl"
          style={{
            background: "rgba(20,20,20,0.82)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            width: 148,
          }}
        >
          {/* Tag */}
          <p
            className="font-ui uppercase mb-2"
            style={{
              fontSize: 8,
              letterSpacing: "0.3em",
              color: GOLD,
            }}
          >
            INVENTARIO
          </p>

          {/* Dot grid */}
          <div className="flex flex-col gap-[5px] mb-2.5">
            {DOTS_GRID.map((row, ri) => (
              <div key={ri} className="flex gap-[5px]">
                {row.map((t, ci) => (
                  <div
                    key={ci}
                    className="rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      background: dotColor(t),
                      opacity: t === "s" ? 0.5 : 0.85,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3">
            {[
              { c: AVAILABLE, l: "Disp." },
              { c: RESERVED, l: "Reserv." },
              { c: SOLD, l: "Vendido" },
            ].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1">
                <div
                  className="rounded-full"
                  style={{
                    width: 5,
                    height: 5,
                    background: c,
                    opacity: c === SOLD ? 0.5 : 0.85,
                  }}
                />
                <span
                  style={{
                    fontSize: 7,
                    color: "rgba(244,240,232,0.35)",
                  }}
                >
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── 4. Lead notification (bottom-right) ── */}
      <motion.div
        custom={CARD_DELAYS[3]}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="absolute z-20"
        style={{ bottom: 56, right: 0 }}
      >
        <div
          className="rounded-[10px] px-3.5 py-2.5 backdrop-blur-xl"
          style={{
            background: "rgba(20,20,20,0.82)",
            border: `1px solid rgba(74,158,107,0.3)`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            width: 160,
          }}
        >
          {/* Tag */}
          <p
            className="font-ui uppercase mb-1.5"
            style={{
              fontSize: 8,
              letterSpacing: "0.3em",
              color: AVAILABLE,
            }}
          >
            NUEVO LEAD
          </p>

          <div className="flex items-center gap-2">
            {/* Pulsing green dot */}
            <div className="relative flex-shrink-0">
              <div
                className="rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  background: AVAILABLE,
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: AVAILABLE }}
                animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            </div>

            <div>
              <p
                className="font-heading"
                style={{
                  fontSize: 16,
                  fontWeight: 300,
                  color: PAPER,
                  lineHeight: 1.2,
                }}
              >
                Mar&iacute;a Garc&iacute;a
              </p>
              <p
                style={{
                  fontSize: 9,
                  color: "rgba(244,240,232,0.4)",
                }}
              >
                Hace 2 min &middot; WhatsApp
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 5. Progress bar (middle-right) ── */}
      <motion.div
        custom={CARD_DELAYS[4]}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="absolute z-20"
        style={{ top: 240, right: -4 }}
      >
        <div
          className="rounded-[10px] px-3.5 py-2.5 backdrop-blur-xl"
          style={{
            background: "rgba(20,20,20,0.82)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            width: 140,
          }}
        >
          {/* Tag */}
          <p
            className="font-ui uppercase mb-1.5"
            style={{
              fontSize: 8,
              letterSpacing: "0.3em",
              color: GOLD,
            }}
          >
            AVANCE
          </p>

          <div className="flex items-baseline gap-1.5 mb-2">
            <p
              className="font-heading"
              style={{
                fontSize: 22,
                fontWeight: 300,
                color: PAPER,
                lineHeight: 1,
              }}
            >
              68%
            </p>
            <p
              style={{
                fontSize: 9,
                color: "rgba(244,240,232,0.4)",
              }}
            >
              completado
            </p>
          </div>

          {/* Progress track */}
          <div
            className="rounded-full overflow-hidden"
            style={{
              height: 5,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
              }}
              initial={{ width: "0%" }}
              animate={{ width: "68%" }}
              transition={{
                duration: 1.4,
                delay: CARD_DELAYS[4] + 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
