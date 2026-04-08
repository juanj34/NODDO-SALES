"use client";

import { useUnitPreference } from "@/contexts/UnitPreferenceContext";
import { UNIT_CONFIG } from "@/lib/units";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function UnitToggle() {
  const { displayUnit, setDisplayUnit } = useUnitPreference();

  return (
    <div className="relative inline-flex items-center bg-white/[0.04] rounded-full border border-[var(--border-subtle)] p-0.5">
      {/* Active indicator */}
      <motion.div
        className="absolute h-[calc(100%-4px)] w-[calc(50%-2px)] rounded-full"
        style={{ background: "rgba(var(--site-primary-rgb), 0.15)", border: "1px solid rgba(var(--site-primary-rgb), 0.3)" }}
        animate={{ x: displayUnit === "m2" ? 2 : "calc(100% + 2px)" }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
      />

      {(["m2", "sqft"] as const).map((unit) => {
        const isActive = displayUnit === unit;
        return (
          <button
            key={unit}
            onClick={() => setDisplayUnit(unit)}
            className={cn(
              "relative z-10 px-3 py-1 text-[10px] font-bold tracking-wider rounded-full transition-colors cursor-pointer",
              isActive ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            {UNIT_CONFIG[unit].symbol}
          </button>
        );
      })}
    </div>
  );
}
