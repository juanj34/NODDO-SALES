"use client";

import { useUnitPreference } from "@/contexts/UnitPreferenceContext";
import { UNIT_CONFIG } from "@/lib/units";
import { motion } from "framer-motion";

export function UnitToggle() {
  const { displayUnit, setDisplayUnit } = useUnitPreference();

  return (
    <div className="inline-flex items-center gap-1 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-0.5">
      {(["m2", "sqft"] as const).map((unit) => {
        const isActive = displayUnit === unit;
        return (
          <button
            key={unit}
            onClick={() => setDisplayUnit(unit)}
            className="relative px-3 py-1.5 text-xs font-medium transition-colors rounded-md"
            style={{
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="unit-toggle-bg"
                className="absolute inset-0 bg-[var(--surface-3)] rounded-md"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{UNIT_CONFIG[unit].symbol}</span>
          </button>
        );
      })}
    </div>
  );
}
