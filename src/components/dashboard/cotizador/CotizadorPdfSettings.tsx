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
import { FileUploader } from "@/components/dashboard/FileUploader";
import { X } from "lucide-react";
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
      {/* Micrositio — Plan de Pagos background */}
      <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5", radius.xl)}>
        <label className={cn("block text-[var(--text-muted)] mb-3 uppercase", fontSize.label, letterSpacing.wider)}>
          Fondo del Plan de Pagos (micrositio)
        </label>
        <p className={cn("text-[var(--text-muted)] mb-3", fontSize.caption)}>
          Imagen decorativa que aparece de fondo con baja opacidad en la sección de plan de pagos del micrositio.
        </p>
        {config.plan_pago_bg_url ? (
          <div className="relative w-full max-w-sm">
            <img
              src={config.plan_pago_bg_url}
              alt="Fondo plan de pagos"
              className={cn("w-full h-40 object-cover border border-[var(--border-subtle)]", radius.lg)}
            />
            <button
              type="button"
              onClick={() => saveConfig({ ...config, plan_pago_bg_url: undefined })}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full transition-colors"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        ) : (
          <FileUploader
            onUpload={(url) => saveConfig({ ...config, plan_pago_bg_url: url })}
            currentUrl={null}
            folder={`proyectos/${project.id}/cotizador`}
            label="Subir imagen de fondo"
            aspect="video"
          />
        )}
      </div>

      {/* Nombre personalizado del plan */}
      <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5", radius.xl)}>
        <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
          Nombre del plan de pagos
        </label>
        <input
          type="text"
          value={config.payment_plan_nombre ?? ""}
          onChange={(e) => saveConfig({ ...config, payment_plan_nombre: e.target.value || undefined })}
          className={cn(inputClass, fontSize.md)}
          placeholder="Plan de Pagos"
        />
        <p className={cn("text-[var(--text-muted)] mt-1.5", fontSize.caption)}>
          Aparece como título en el micrositio y en el PDF. Si no se llena, se usa el título por defecto.
        </p>
      </div>

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

      {/* Tipo de entrega */}
      <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5", radius.xl)}>
        <label className={cn("block text-[var(--text-muted)] mb-2 uppercase", fontSize.label, letterSpacing.wider)}>
          Tipo de entrega
        </label>
        <div className="flex gap-2 mb-3">
          {([
            { value: null, label: "Sin configurar" },
            { value: "fecha_fija" as const, label: "Fecha fija" },
            { value: "plazo_desde_compra" as const, label: "Plazo desde compra" },
          ] as const).map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => saveConfig({
                ...config,
                tipo_entrega: opt.value,
                // Clear date when switching to null
                ...(opt.value === null ? { fecha_estimada_entrega: undefined, plazo_entrega_meses: undefined } : {}),
              })}
              className={cn(
                "flex-1 px-2 py-1.5 border text-center transition-colors",
                radius.lg, fontSize.label,
                (config.tipo_entrega ?? null) === opt.value
                  ? "border-[rgba(var(--site-primary-rgb),0.6)] bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)]"
                  : "border-[var(--border-default)] bg-[var(--surface-3)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {config.tipo_entrega === "fecha_fija" && (
          <div>
            <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
              Fecha de entrega
            </label>
            <input
              type="date"
              value={config.fecha_estimada_entrega ?? ""}
              onChange={(e) => saveConfig({ ...config, fecha_estimada_entrega: e.target.value || undefined })}
              className={cn(inputClass, fontSize.md)}
            />
            <p className={cn("text-[var(--text-muted)] mt-1.5", fontSize.caption)}>
              Las cuotas se ajustan automáticamente según los meses restantes hasta esta fecha
            </p>
          </div>
        )}

        {config.tipo_entrega === "plazo_desde_compra" && (
          <div>
            <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
              Plazo de entrega (meses)
            </label>
            <input
              type="number"
              value={config.plazo_entrega_meses ?? 24}
              onChange={(e) => saveConfig({ ...config, plazo_entrega_meses: parseInt(e.target.value) || 24 })}
              min={6}
              max={120}
              className={cn(inputClass, fontSize.md, "w-32")}
            />
            <p className={cn("text-[var(--text-muted)] mt-1.5", fontSize.caption)}>
              El plan de pagos se calcula desde la fecha de cotización + este plazo
            </p>
          </div>
        )}
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
