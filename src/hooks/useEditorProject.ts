"use client";

import { createContext, useContext } from "react";
import type { Proyecto, ProyectoCompleto } from "@/types";

interface EditorProjectContextValue {
  project: ProyectoCompleto;
  loading: boolean;
  saving: boolean;
  save: (data: Partial<Proyecto>) => Promise<boolean>;
  refresh: () => Promise<void>;
  updateLocal: (updater: (prev: ProyectoCompleto) => ProyectoCompleto) => void;
  projectId: string;
}

export const EditorProjectContext =
  createContext<EditorProjectContextValue | null>(null);

export function useEditorProject(): EditorProjectContextValue {
  const ctx = useContext(EditorProjectContext);
  if (!ctx) {
    throw new Error(
      "useEditorProject must be used within EditorProjectContext.Provider"
    );
  }
  return ctx;
}
