"use client";

import { createContext, useContext } from "react";
import type { ProyectoCompleto } from "@/types";

export const SiteProjectContext = createContext<ProyectoCompleto | null>(null);

export function useSiteProject(): ProyectoCompleto {
  const ctx = useContext(SiteProjectContext);
  if (!ctx) throw new Error("useSiteProject must be used within SiteProjectContext");
  return ctx;
}
