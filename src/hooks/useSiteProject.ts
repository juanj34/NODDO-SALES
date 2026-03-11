"use client";

import { createContext, useContext } from "react";
import type { ProyectoCompleto } from "@/types";

interface SiteProjectContextValue {
  proyecto: ProyectoCompleto;
  basePath: string;
}

export const SiteProjectContext =
  createContext<SiteProjectContextValue | null>(null);

export function useSiteProject(): ProyectoCompleto {
  const ctx = useContext(SiteProjectContext);
  if (!ctx)
    throw new Error("useSiteProject must be used within SiteProjectContext");
  return ctx.proyecto;
}

export function useSiteBasePath(): string {
  const ctx = useContext(SiteProjectContext);
  if (!ctx)
    throw new Error("useSiteBasePath must be used within SiteProjectContext");
  return ctx.basePath;
}
