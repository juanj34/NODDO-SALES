"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { inputClass } from "@/components/dashboard/editor-styles";
import { cn } from "@/lib/utils";
import { fontSize, gap, letterSpacing, radius, iconSize, iconColor } from "@/lib/design-tokens";
import { FileUploader } from "@/components/dashboard/FileUploader";
import {
  X,
  Image as ImageIcon,
  Layout,
  Minus,
  Moon,
  Sun,
  FileText,
  MessageSquareQuote,
  Scale,
  Palette,
} from "lucide-react";
import type { CotizadorConfig } from "@/types";

const DEFAULT_CONFIG: CotizadorConfig = {
  moneda: "COP",
  fases: [],
  descuentos: [],
  separacion_incluida_en_inicial: false,
  notas_legales: null,
};

/* ── Reusable sub-components ─────────────────────────────────────────── */

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={cn(
        "w-7 h-7 flex items-center justify-center rounded-lg",
        "bg-[rgba(var(--site-primary-rgb),0.1)]"
      )}>
        <Icon size={iconSize.sm} className={iconColor.primary} />
      </div>
      <h3 className={cn("text-[var(--text-muted)] uppercase", fontSize.label, letterSpacing.wider)}>
        {title}
      </h3>
    </div>
  );
}

function ToggleOption({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border transition-colors",
        radius.sm, fontSize.label,
        active
          ? "border-[rgba(var(--site-primary-rgb),0.6)] bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)]"
          : "border-[var(--border-default)] bg-[var(--surface-3)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
      )}
    >
      <Icon size={iconSize.sm} />
      <span>{label}</span>
    </button>
  );
}

function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider, className)}>
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className={cn("text-[var(--text-muted)] mt-1.5", fontSize.caption)}>{children}</p>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */

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

  const cardClass = cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5", radius.xl);

  return (
    <div className={cn("flex flex-col", gap.spacious)}>

      {/* ── 1. Micrositio settings ──────────────────────────────────────── */}
      <div className={cardClass}>
        <SectionHeader icon={Layout} title="Micrositio" />

        <div className="flex items-center gap-1.5 mb-1">
          <ImageIcon size={iconSize.xs} className={iconColor.muted} />
          <FieldLabel className="mb-0">Imagen de fondo del micrositio</FieldLabel>
        </div>
        <Hint>Imagen de fondo para la página de plan de pagos en el micrositio.</Hint>

        <div className="w-48 mt-3">
          {config.plan_pago_bg_url ? (
            <div className="relative">
              <img
                src={config.plan_pago_bg_url}
                alt="Fondo plan de pagos"
                className={cn("w-full h-24 object-cover border border-[var(--border-subtle)]", radius.sm)}
              />
              <button
                type="button"
                onClick={() => saveConfig({ ...config, plan_pago_bg_url: undefined })}
                className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full transition-colors"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ) : (
            <FileUploader
              onUpload={(url) => saveConfig({ ...config, plan_pago_bg_url: url })}
              currentUrl={null}
              folder={`proyectos/${project.id}/cotizador`}
              label="Subir imagen"
              aspect="video"
              compact
            />
          )}
        </div>
      </div>

      {/* ── 2. Diseño del PDF ───────────────────────────────────────────── */}
      <div className={cardClass}>
        <SectionHeader icon={Palette} title="Diseño del PDF" />

        <div className={cn("grid grid-cols-2", gap.relaxed)}>
          <div>
            <FieldLabel>Estilo portada</FieldLabel>
            <div className="flex gap-2">
              <ToggleOption
                active={(config.pdf_cover_style ?? "hero") === "hero"}
                onClick={() => saveConfig({ ...config, pdf_cover_style: "hero" })}
                icon={Layout}
                label="Hero"
              />
              <ToggleOption
                active={(config.pdf_cover_style ?? "hero") === "minimalista"}
                onClick={() => saveConfig({ ...config, pdf_cover_style: "minimalista" })}
                icon={Minus}
                label="Minimal"
              />
            </div>
          </div>
          <div>
            <FieldLabel>Tema PDF</FieldLabel>
            <div className="flex gap-2">
              <ToggleOption
                active={(config.pdf_theme ?? "neutral") === "dark"}
                onClick={() => saveConfig({ ...config, pdf_theme: "dark" })}
                icon={Moon}
                label="Oscuro"
              />
              <ToggleOption
                active={(config.pdf_theme ?? "neutral") === "neutral"}
                onClick={() => saveConfig({ ...config, pdf_theme: "neutral" })}
                icon={Sun}
                label="Neutro"
              />
            </div>
          </div>
        </div>

        {/* PDF logos override */}
        <div className="border-t border-[var(--border-subtle)] pt-4 mt-4">
          <div className="flex items-center gap-1.5 mb-1">
            <ImageIcon size={iconSize.xs} className={iconColor.muted} />
            <FieldLabel className="mb-0">Logos para el PDF</FieldLabel>
          </div>
          <Hint>Si tus logos son blancos (para fondo oscuro), sube versiones oscuras para las paginas internas del PDF.</Hint>

          <div className={cn("grid grid-cols-2 mt-3", gap.relaxed)}>
            <div>
              <FieldLabel>Logo constructora (PDF)</FieldLabel>
              {config.pdf_logo_constructora_url ? (
                <div className="relative">
                  <img
                    src={config.pdf_logo_constructora_url}
                    alt="Logo constructora PDF"
                    className={cn("w-full h-16 object-contain border border-[var(--border-subtle)] bg-white p-2", radius.sm)}
                  />
                  <button
                    type="button"
                    onClick={() => saveConfig({ ...config, pdf_logo_constructora_url: null })}
                    className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ) : (
                <FileUploader
                  onUpload={(url) => saveConfig({ ...config, pdf_logo_constructora_url: url })}
                  currentUrl={null}
                  folder={`proyectos/${project.id}/cotizador`}
                  label="Subir logo"
                  aspect="video"
                  compact
                />
              )}
            </div>
            <div>
              <FieldLabel>Logo proyecto (PDF)</FieldLabel>
              {config.pdf_logo_proyecto_url ? (
                <div className="relative">
                  <img
                    src={config.pdf_logo_proyecto_url}
                    alt="Logo proyecto PDF"
                    className={cn("w-full h-16 object-contain border border-[var(--border-subtle)] bg-white p-2", radius.sm)}
                  />
                  <button
                    type="button"
                    onClick={() => saveConfig({ ...config, pdf_logo_proyecto_url: null })}
                    className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ) : (
                <FileUploader
                  onUpload={(url) => saveConfig({ ...config, pdf_logo_proyecto_url: url })}
                  currentUrl={null}
                  folder={`proyectos/${project.id}/cotizador`}
                  label="Subir logo"
                  aspect="video"
                  compact
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Contenido del PDF ────────────────────────────────────────── */}
      <div className={cardClass}>
        <SectionHeader icon={FileText} title="Contenido del PDF" />

        {/* Saludo + Despedida */}
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 mb-5", gap.relaxed)}>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquareQuote size={iconSize.xs} className={iconColor.muted} />
              <FieldLabel className="mb-0">Saludo</FieldLabel>
            </div>
            <textarea
              value={config.pdf_saludo ?? ""}
              onChange={(e) => saveConfig({ ...config, pdf_saludo: e.target.value || undefined })}
              rows={2}
              className={cn(inputClass, "resize-none", fontSize.md)}
              placeholder="Gracias por considerar nuestro proyecto..."
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquareQuote size={iconSize.xs} className={cn(iconColor.muted, "scale-x-[-1]")} />
              <FieldLabel className="mb-0">Despedida</FieldLabel>
            </div>
            <input
              type="text"
              value={config.pdf_despedida ?? ""}
              onChange={(e) => saveConfig({ ...config, pdf_despedida: e.target.value || undefined })}
              className={cn(inputClass, fontSize.md)}
              placeholder="Cordialmente,"
            />
          </div>
        </div>

        {/* Notas legales hint */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <div className="flex items-center gap-1.5">
            <Scale size={iconSize.xs} className={iconColor.muted} />
            <FieldLabel className="mb-0">Notas legales</FieldLabel>
          </div>
          <Hint>Las notas legales se configuran dentro de cada plantilla de pago, en la pestaña Plantillas.</Hint>
        </div>
      </div>
    </div>
  );
}
