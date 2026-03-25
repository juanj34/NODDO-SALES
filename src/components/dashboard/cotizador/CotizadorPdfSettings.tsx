"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { inputClass } from "@/components/dashboard/editor-styles";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import tooltips from "@/i18n/locales/es/tooltips";
import { fontSize, gap, letterSpacing, radius, iconSize, iconColor } from "@/lib/design-tokens";
import { FileUploader } from "@/components/dashboard/FileUploader";
import {
  X,
  Image as ImageIcon,
  Type,
  CalendarOff,
  CalendarDays,
  Timer,
  Layout,
  Minus,
  Moon,
  Sun,
  FileText,
  MessageSquareQuote,
  Scale,
  Truck,
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

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-start">
          {/* Plan name */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Type size={iconSize.xs} className={iconColor.muted} />
              <FieldLabel className="mb-0">Nombre del plan de pagos</FieldLabel>
            </div>
            <input
              type="text"
              value={config.payment_plan_nombre ?? ""}
              onChange={(e) => saveConfig({ ...config, payment_plan_nombre: e.target.value || undefined })}
              className={cn(inputClass, fontSize.md)}
              placeholder="Plan de Pagos"
            />
            <Hint>Título en el micrositio y en el PDF. Si vacío, se usa el título por defecto.</Hint>
          </div>

          {/* Background image — compact */}
          <div className="w-48">
            <div className="flex items-center gap-1.5 mb-1">
              <ImageIcon size={iconSize.xs} className={iconColor.muted} />
              <FieldLabel className="mb-0">Imagen de fondo</FieldLabel>
            </div>
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
      </div>

      {/* ── 2. Cálculo ──────────────────────────────────────────────────── */}
      <div className={cardClass}>
        <SectionHeader icon={Scale} title="Configuración de cálculo" />

        {/* Separación checkbox */}
        <label className={cn("flex items-center cursor-pointer mb-5", gap.relaxed)}>
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

        {/* Tipo de entrega */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Truck size={iconSize.xs} className={iconColor.muted} />
            <FieldLabel className="mb-0">Tipo de entrega</FieldLabel>
          </div>
          <div className="flex gap-2 mb-3">
            <ToggleOption
              active={(config.tipo_entrega ?? null) === null}
              onClick={() => saveConfig({ ...config, tipo_entrega: null, fecha_estimada_entrega: undefined, plazo_entrega_meses: undefined })}
              icon={CalendarOff}
              label="Sin configurar"
            />
            <ToggleOption
              active={config.tipo_entrega === "fecha_fija"}
              onClick={() => saveConfig({ ...config, tipo_entrega: "fecha_fija" })}
              icon={CalendarDays}
              label="Fecha fija"
            />
            <ToggleOption
              active={config.tipo_entrega === "plazo_desde_compra"}
              onClick={() => saveConfig({ ...config, tipo_entrega: "plazo_desde_compra" })}
              icon={Timer}
              label="Plazo desde compra"
            />
          </div>

          {config.tipo_entrega === "fecha_fija" && (
            <div className="ml-0.5">
              <FieldLabel>Fecha de entrega</FieldLabel>
              <input
                type="date"
                value={config.fecha_estimada_entrega ?? ""}
                onChange={(e) => saveConfig({ ...config, fecha_estimada_entrega: e.target.value || undefined })}
                className={cn(inputClass, fontSize.md, "w-56")}
              />
              <Hint>Las cuotas se ajustan automáticamente según los meses restantes hasta esta fecha</Hint>
            </div>
          )}

          {config.tipo_entrega === "plazo_desde_compra" && (
            <div className="ml-0.5">
              <FieldLabel>Plazo de entrega (meses)</FieldLabel>
              <input
                type="number"
                value={config.plazo_entrega_meses ?? 24}
                onChange={(e) => saveConfig({ ...config, plazo_entrega_meses: parseInt(e.target.value) || 24 })}
                min={6}
                max={120}
                className={cn(inputClass, fontSize.md, "w-32")}
              />
              <Hint>El plan de pagos se calcula desde la fecha de cotización + este plazo</Hint>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Diseño del PDF ───────────────────────────────────────────── */}
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
      </div>

      {/* ── 4. Contenido del PDF ────────────────────────────────────────── */}
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

        {/* Notas legales */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Scale size={iconSize.xs} className={iconColor.muted} />
            <FieldLabel className="mb-0 flex items-center gap-2">
              Notas legales
              <InfoTooltip
                content={tooltips.cotizador.notasLegales.long}
                variant="dashboard"
                placement="auto"
              />
            </FieldLabel>
          </div>
          <textarea
            value={config.notas_legales ?? ""}
            onChange={(e) => saveConfig({ ...config, notas_legales: e.target.value || null })}
            rows={3}
            className={cn(inputClass, "resize-none", fontSize.md)}
            placeholder="Los precios están sujetos a cambios sin previo aviso..."
          />
        </div>
      </div>
    </div>
  );
}
