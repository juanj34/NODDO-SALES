"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import type { CotizadorConfig } from "@/types";
import { PlantillaEditor } from "@/components/dashboard/cotizador/PlantillaEditor";

const DEFAULT_CONFIG: CotizadorConfig = {
  moneda: "COP",
  fases: [],
  descuentos: [],
  separacion_incluida_en_inicial: true,
  notas_legales: null,
};

export function PlantillasTab() {
  const { project, save } = useEditorProject();

  const [config, setConfig] = useState<CotizadorConfig>(
    () => project.cotizador_config ?? DEFAULT_CONFIG,
  );

  // Auto-save debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveConfig = useCallback(
    (newConfig: CotizadorConfig) => {
      setConfig(newConfig);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        save({ cotizador_config: newConfig });
      }, 1500);
    },
    [save],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return (
    <PlantillaEditor
      config={config}
      saveConfig={saveConfig}
      moneda={config.moneda}
    />
  );
}
