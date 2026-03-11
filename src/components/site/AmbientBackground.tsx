"use client";

import { motion, useReducedMotion } from "framer-motion";

interface AmbientBackgroundProps {
  variant?: "gold" | "blue" | "emerald";
}

const VARIANTS = {
  gold: {
    orb1: "#D4A574",
    orb2: "#D97706",
    orb3: "#92400E",
  },
  blue: {
    orb1: "#3B82F6",
    orb2: "#4F46E5",
    orb3: "#06B6D4",
  },
  emerald: {
    orb1: "#10B981",
    orb2: "#0D9488",
    orb3: "#22C55E",
  },
};

export function AmbientBackground({ variant = "gold" }: AmbientBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();
  const colors = VARIANTS[variant];

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Orb 1 — large warm glow, top-left */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.orb1}55 0%, ${colors.orb1}20 40%, transparent 70%)`,
          top: "-10%",
          left: "-5%",
          filter: "blur(80px)",
        }}
        animate={{
          x: [0, 80, -40, 60, 0],
          y: [0, 60, 120, -30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Orb 2 — bottom-right accent */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.orb2}40 0%, ${colors.orb2}15 40%, transparent 70%)`,
          bottom: "-15%",
          right: "-10%",
          filter: "blur(80px)",
        }}
        animate={{
          x: [0, -100, 30, -70, 0],
          y: [0, -50, -100, 30, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Orb 3 — center drifting */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.orb3}30 0%, ${colors.orb3}10 40%, transparent 70%)`,
          top: "30%",
          left: "35%",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, -60, 80, -30, 0],
          y: [0, 80, -50, 60, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
