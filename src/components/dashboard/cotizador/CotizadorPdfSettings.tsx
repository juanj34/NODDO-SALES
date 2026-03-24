"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  inputClass,
  labelClass,
} from "@/components/dashboard/editor-styles";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import tooltips from "@/i18n/locales/es/tooltips";
import { fontSize, gap, letterSpacing, radius } from "@/lib/design-tokens";
import type { CotizadorConfig } from "@/types";

const DEFAULT_CONFIG: CotizadorConfig = {
  moneda: "COP",
  fases: [],
  descuentos: [],
  separacion_incluida_en_inicial: false,
  notas_legales: null,
};

export function CotizadorPdfSettings() {
  const { project, save } = useEditorProject();

  const [config, setConfig] = useState<CotizadorConfig>(() => {
    return project.cotizador_config ?? DEFAULT_CONFIG;
  });

  // Auto-save debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveConfig = useCallback((newConfig: CotizadorConfig) => {
    setConfig(newConfig);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      save({ cotizador_config: newConfig });
    }, 1500);
  }, [save]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return (
    <div className={cn("flex flex-col", gap.spacious)}>
      {/* Separación checkbox */}
      <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5", radius.xl)}>
        <label className={cn("flex items-center cursor-pointer", gap.relaxed)}>
          <input
            type="checkbox"
            checked={config.separacion_incluida_en_inicial}
            onChange={(e) => saveConfig({ ...config, separacion_incluida_en_inicial: e.target.checked })}
            className="w-4 h-4 rounded bg-[var(--surface-3)] border border-[var(--border-default)] accent-[var(--site-primary)]"
          />
          <span className={cn("text-[var(--text-secondary)] flex items-center", fontSize.md, gap.normal)}>
            La separación se descuenta de la cuota inicial
            <InfoTooltip
              content={tooltips.cotizador.separacionIncluida.long}
              variant="dashboard"
              placement="auto"
            />
          </span>
        </label>
      </div>

      {/* Fecha estimada de entrega */}
      <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5", radius.xl)}>
        <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
          Fecha estimada de entrega
        </label>
        <input
          type="text"
          value={config.fecha_estimada_entrega ?? ""}
          onChange={(e) => saveConfig({ ...config, fecha_estimada_entrega: e.target.value || undefined })}
          className={cn(inputClass, fontSize.md)}
          placeholder="Q2-2028, Diciembre 2027..."
        />
      </div>

      {/* Cover Style + Theme */}
      <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5", radius.xl)}>
        <div className={cn("grid grid-cols-2", gap.relaxed)}>
          <div>
            <label className={cn("block text-[var(--text-muted)] mb-1.5 uppercase", fontSize.label, letterSpacing.wider)}>Estilo portada</label>
            <div className="flex gap-2">
              {(["hero", "minimalista"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => saveConfig({ ...config, pdf_cover_style: style })}
                  className={cn(
                    "flex-1 px-2 py-1.5 border text-center transition-colors",
                    radius.lg, fontSize.label,
                    (config.pdf_cover_style ?? "hero") === style
                      ? "border-[rgba(var(--site-primary-rgb),0.6)] bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)]"
                      : "border-[var(--border-default)] bg-[var(--surface-3)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                  )}
                >
                  {style === "hero" ? "Hero" : "Minimal"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={cn("block text-[var(--text-muted)] mb-1.5 uppercase", fontSize.label, letterSpacing.wider)}>Tema PDF</label>
            <div className="flex gap-2">
              {(["dark", "neutral"] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => saveConfig({ ...config, pdf_theme: theme })}
                  className={cn(
                    "flex-1 px-2 py-1.5 border text-center transition-colors",
                    radius.lg, fontSize.label,
                    (config.pdf_theme ?? "neutral") === theme
                      ? "border-[rgba(var(--site-primary-rgb),0.6)] bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)]"
                      : "border-[var(--border-default)] bg-[var(--surface-3)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                  )}
                >
                  {theme === "dark" ? "Oscuro" : "Neutro"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notas legales */}
      <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5", radius.xl)}>
        <label className={cn("flex items-center text-[var(--text-muted)] mb-1 uppercase", fontSize.label, gap.normal, letterSpacing.wider)}>
          Notas legales (aparecen en el PDF)
          <InfoTooltip
            content={tooltips.cotizador.notasLegales.long}
            variant="dashboard"
            placement="auto"
          />
        </label>
        <textarea
          value={config.notas_legales ?? ""}
          onChange={(e) => saveConfig({ ...config, notas_legales: e.target.value || null })}
          rows={3}
          className={cn(inputClass, "resize-none", fontSize.md)}
          placeholder="Los precios están sujetos a cambios sin previo aviso..."
        />
      </div>

      {/* Saludo + Despedida */}
      <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5", radius.xl)}>
        <div className={cn("grid grid-cols-1 sm:grid-cols-2", gap.relaxed)}>
          <div>
            <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>Saludo</label>
            <textarea
              value={config.pdf_saludo ?? ""}
              onChange={(e) => saveConfig({ ...config, pdf_saludo: e.target.value || undefined })}
              rows={2}
              className={cn(inputClass, "resize-none", fontSize.md)}
              placeholder="Gracias por considerar nuestro proyecto..."
            />
          </div>
          <div>
            <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>Despedida</label>
            <input
              type="text"
              value={config.pdf_despedida ?? ""}
              onChange={(e) => saveConfig({ ...config, pdf_despedida: e.target.value || undefined })}
              className={cn(inputClass, fontSize.md)}
              placeholder="Cordialmente,"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
