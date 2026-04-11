"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Torre } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TowerCompositionDiagramProps {
  torre: Torre;
  className?: string;
  /** Highlighted floor number (1-indexed from bottom). Used to show which floor a selected unit is on. */
  highlightFloor?: number | null;
}

interface FloorSection {
  key: string;
  label: string;
  labelShort: string;
  count: number;
  color: string;
  borderColor: string;
  textColor: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TowerCompositionDiagram({ torre, className, highlightFloor }: TowerCompositionDiagramProps) {
  const sections = useMemo(() => {
    if ((torre.tipo ?? "torre") === "urbanismo") return [];

    const s = torre.pisos_sotano ?? 0;
    const pb = torre.pisos_planta_baja ?? 0;
    const pod = torre.pisos_podio ?? 0;
    const res = torre.pisos_residenciales ?? 0;
    const rt = torre.pisos_rooftop ?? 0;

    const all: FloorSection[] = [
      {
        key: "basement",
        label: "Sótano",
        labelShort: "SÓT",
        count: s,
        color: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.08)",
        textColor: "rgba(255,255,255,0.3)",
      },
      {
        key: "ground",
        label: "Planta Baja",
        labelShort: "PB",
        count: pb,
        color: "rgba(52,211,153,0.12)",
        borderColor: "rgba(52,211,153,0.2)",
        textColor: "rgba(52,211,153,0.7)",
      },
      {
        key: "podium",
        label: "Podio",
        labelShort: "POD",
        count: pod,
        color: "rgba(147,197,253,0.10)",
        borderColor: "rgba(147,197,253,0.18)",
        textColor: "rgba(147,197,253,0.7)",
      },
      {
        key: "residential",
        label: "Residencial",
        labelShort: "RES",
        count: res,
        color: "rgba(var(--site-primary-rgb),0.14)",
        borderColor: "rgba(var(--site-primary-rgb),0.3)",
        textColor: "var(--site-primary)",
      },
      {
        key: "rooftop",
        label: "Rooftop",
        labelShort: "RT",
        count: rt,
        color: "rgba(var(--site-primary-rgb),0.25)",
        borderColor: "rgba(var(--site-primary-rgb),0.45)",
        textColor: "var(--site-primary)",
      },
    ];

    return all.filter((sec) => sec.count > 0);
  }, [torre]);

  const total = useMemo(() => sections.reduce((sum, s) => sum + s.count, 0), [sections]);

  if (sections.length === 0 || total === 0) return null;

  // Build floor index ranges for highlight detection
  let floorCursor = 1;
  const sectionRanges = sections.map((sec) => {
    const start = floorCursor;
    const end = floorCursor + sec.count - 1;
    floorCursor = end + 1;
    return { ...sec, floorStart: start, floorEnd: end };
  });

  return (
    <div className={cn("flex items-stretch gap-0", className)}>
      {/* ── Building elevation ── */}
      <div className="relative flex flex-col-reverse w-[52px]" style={{ height: Math.min(total * 12 + 8, 200) }}>
        {sectionRanges.map((sec, i) => {
          const isHighlighted = highlightFloor != null && highlightFloor >= sec.floorStart && highlightFloor <= sec.floorEnd;
          return (
            <motion.div
              key={sec.key}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.23, 1, 0.32, 1],
              }}
              className={cn(
                "w-full relative transition-all duration-300",
                i === sectionRanges.length - 1 && "rounded-t-md",
                i === 0 && "rounded-b-md",
              )}
              style={{
                flex: sec.count,
                transformOrigin: "bottom",
                background: sec.color,
                borderLeft: `1px solid ${sec.borderColor}`,
                borderRight: `1px solid ${sec.borderColor}`,
                borderTop: `1px solid ${sec.borderColor}`,
                borderBottom: i === 0 ? `1px solid ${sec.borderColor}` : "none",
                boxShadow: isHighlighted
                  ? `inset 0 0 12px rgba(var(--site-primary-rgb),0.3), 0 0 8px rgba(var(--site-primary-rgb),0.15)`
                  : "none",
              }}
            >
              {/* Floor count inside section */}
              {sec.count > 0 && (
                <span
                  className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-medium tracking-wider"
                  style={{ color: sec.textColor }}
                >
                  {sec.count}
                </span>
              )}

              {/* Dashed separator for basement */}
              {sec.key === "basement" && (
                <div
                  className="absolute top-0 left-1 right-1 border-t border-dashed"
                  style={{ borderColor: "rgba(255,255,255,0.15)" }}
                />
              )}
            </motion.div>
          );
        })}

        {/* Ground line */}
        <div className="absolute left-[-6px] right-[-6px] z-10" style={{ bottom: `${((sections[0]?.key === "basement" ? sections[0].count : 0) / total) * 100}%` }}>
          <div className="h-px bg-white/20" />
        </div>
      </div>

      {/* ── Labels column ── */}
      <div className="relative flex flex-col-reverse ml-2.5" style={{ height: Math.min(total * 12 + 8, 200) }}>
        {sectionRanges.map((sec) => (
          <motion.div
            key={sec.key}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex items-center"
            style={{ flex: sec.count }}
          >
            <span
              className="font-mono text-[9px] font-light tracking-[0.15em] uppercase whitespace-nowrap"
              style={{ color: sec.textColor }}
            >
              {sec.labelShort}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ── Total indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="ml-auto flex flex-col justify-end pl-3"
      >
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-lg font-light text-[var(--text-secondary)] leading-none">
            {total}
          </span>
          <span className="font-mono text-[8px] font-light tracking-[0.2em] uppercase text-[var(--text-muted)]">
            pisos
          </span>
        </div>
      </motion.div>
    </div>
  );
}
