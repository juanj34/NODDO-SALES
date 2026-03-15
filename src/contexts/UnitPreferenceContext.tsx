"use client";

import { createContext, useContext, ReactNode } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useSiteProject } from "@/hooks/useSiteProject";
import type { UnitOfMeasurement } from "@/types";

interface UnitPreferenceContextValue {
  baseUnit: UnitOfMeasurement;
  displayUnit: UnitOfMeasurement;
  setDisplayUnit: (unit: UnitOfMeasurement) => void;
}

const UnitPreferenceContext = createContext<UnitPreferenceContextValue | null>(null);

export function UnitPreferenceProvider({ children }: { children: ReactNode }) {
  const proyecto = useSiteProject();
  const baseUnit = proyecto.unidad_medida_base;

  // Persist user's unit preference per project in localStorage
  const [displayUnit, setDisplayUnit] = usePersistedState<UnitOfMeasurement>(
    "unit",
    baseUnit,
    proyecto.slug
  );

  return (
    <UnitPreferenceContext.Provider
      value={{
        baseUnit,
        displayUnit,
        setDisplayUnit,
      }}
    >
      {children}
    </UnitPreferenceContext.Provider>
  );
}

export function useUnitPreference() {
  const ctx = useContext(UnitPreferenceContext);
  if (!ctx) {
    throw new Error("useUnitPreference must be used within UnitPreferenceProvider");
  }
  return ctx;
}
