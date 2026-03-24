"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  inputClass,
  labelClass,
  fieldHint,
} from "@/components/dashboard/editor-styles";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
} from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import type { CotizadorConfig, FaseConfig, DescuentoConfig, ResultadoCotizacion } from "@/types";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { formatCurrency } from "@/lib/currency";
import type { Currency } from "@/lib/currency";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import tooltips from "@/i18n/locales/es/tooltips";
import { fontSize, gap, letterSpacing, radius } from "@/lib/design-tokens";

/* ─── Helpers ─── */

function uid(): string {
  return crypto.randomUUID();
}

const FRECUENCIAS = [
  { value: "unica", label: "Única" },
  { value: "mensual", label: "Mensual" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
] as const;

const MONEDAS = [
  { value: "COP", label: "COP" },
  { value: "USD", label: "USD" },
  { value: "MXN", label: "MXN" },
  { value: "AED", label: "AED" },
  { value: "EUR", label: "EUR" },
] as const;

const DEFAULT_CONFIG: CotizadorConfig = {
  moneda: "COP",
  fases: [
    { id: uid(), nombre: "Separación", tipo: "fijo", valor: 5000000, cuotas: 1, frecuencia: "unica" },
    { id: uid(), nombre: "Cuota inicial", tipo: "porcentaje", valor: 30, cuotas: 6, frecuencia: "mensual" },
    { id: uid(), nombre: "Contra entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
  descuentos: [],
  separacion_incluida_en_inicial: false,
  notas_legales: null,
};

/* ─── Reorderable Phase Card ─── */

function FaseCard({
  fase,
  onChange,
  onRemove,
  moneda,
}: {
  fase: FaseConfig;
  onChange: (updated: FaseConfig) => void;
  onRemove: () => void;
  moneda: string;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={fase}
      dragListener={false}
      dragControls={controls}
      className={cn("bg-[var(--surface-2)] border border-[var(--border-subtle)] p-4 select-none", radius.xl, gap.relaxed, "flex flex-col")}
    >
      <div className={cn("flex items-center", gap.normal)}>
        <button
          onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
          className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-tertiary)] touch-none"
        >
          <GripVertical size={14} />
        </button>
        <input
          type="text"
          value={fase.nombre}
          onChange={(e) => onChange({ ...fase, nombre: e.target.value })}
          className={cn("flex-1 bg-transparent border-none font-medium text-white focus:outline-none placeholder:text-[var(--text-muted)]", fontSize.md)}
          placeholder="Nombre de la fase"
        />
        <button
          onClick={onRemove}
          className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className={cn("grid grid-cols-1 sm:grid-cols-2", gap.relaxed)}>
        {/* Type */}
        <div>
          <label className={cn("flex items-center mb-1 text-[var(--text-muted)] uppercase", fontSize.label, gap.normal, letterSpacing.wider)}>
            Tipo
            <InfoTooltip
              content={tooltips.cotizador.tipoFase.long}
              variant="dashboard"
              placement="auto"
            />
          </label>
          <NodDoDropdown
            variant="dashboard"
            size="sm"
            value={fase.tipo}
            onChange={(val) => onChange({ ...fase, tipo: val as FaseConfig["tipo"] })}
            options={[
              { value: "fijo", label: "Monto fijo" },
              { value: "porcentaje", label: "Porcentaje" },
              { value: "resto", label: "Resto" },
            ]}
          />
        </div>

        {/* Value */}
        <div>
          <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
            {fase.tipo === "porcentaje" ? "Porcentaje" : fase.tipo === "fijo" ? `Valor (${moneda})` : "Auto"}
          </label>
          {fase.tipo === "resto" ? (
            <div className={cn("bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-[var(--text-muted)]", radius.lg, fontSize.md)}>
              Calculado automáticamente
            </div>
          ) : fase.tipo === "fijo" ? (
            <CurrencyInput
              value={fase.valor || ""}
              onChange={(v) => onChange({ ...fase, valor: Number(v) })}
              currency={moneda as Currency}
              placeholder="5,000,000"
              inputClassName={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
            />
          ) : (
            <input
              type="number"
              value={fase.valor || ""}
              onChange={(e) => onChange({ ...fase, valor: Number(e.target.value) })}
              className={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
              placeholder="30"
            />
          )}
        </div>

        {/* Installments */}
        <div>
          <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>Cuotas</label>
          <input
            type="number"
            min={1}
            value={fase.cuotas || ""}
            onChange={(e) => onChange({ ...fase, cuotas: Math.max(1, Number(e.target.value)) })}
            className={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
          />
        </div>

        {/* Frequency */}
        <div>
          <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>Frecuencia</label>
          <NodDoDropdown
            variant="dashboard"
            size="sm"
            value={fase.frecuencia}
            onChange={(val) => onChange({ ...fase, frecuencia: val as FaseConfig["frecuencia"] })}
            options={FRECUENCIAS.map((f) => ({ value: f.value, label: f.label }))}
          />
        </div>

        {/* Date */}
        <div className="sm:col-span-2">
          <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>Fecha</label>
          <input
            type="text"
            value={fase.fecha ?? ""}
            onChange={(e) => onChange({ ...fase, fecha: e.target.value || undefined })}
            className={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
            placeholder="ej. 01/03/2026, A la firma, Al 50% de obra..."
          />
        </div>
      </div>
    </Reorder.Item>
  );
}

/* ─── CotizadorSandbox ─── */

export function CotizadorSandbox() {
  const { project, save } = useEditorProject();

  const cotizadorEnabled = project.cotizador_enabled;

  // Local state for config editing
  const [config, setConfig] = useState<CotizadorConfig>(() => {
    return project.cotizador_config ?? DEFAULT_CONFIG;
  });

  const moneda = (config.moneda || "COP") as Currency;
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Sample price for preview
  const cheapestUnit = useMemo(() => {
    const available = (project.unidades ?? []).filter((u) => u.estado === "disponible" && u.precio != null);
    if (available.length === 0) return null;
    return available.reduce((min, u) => (u.precio! < min.precio! ? u : min), available[0]);
  }, [project.unidades]);

  const [samplePrice, setSamplePrice] = useState<number>(() => cheapestUnit?.precio ?? 350000000);

  // Calculate preview
  const preview: ResultadoCotizacion | null = useMemo(() => {
    if (config.fases.length === 0 || samplePrice <= 0) return null;
    try {
      return calcularCotizacion(samplePrice, config, []);
    } catch {
      return null;
    }
  }, [samplePrice, config]);

  // Auto-save debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveConfig = useCallback((newConfig: CotizadorConfig) => {
    setConfig(newConfig);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      save({ cotizador_config: newConfig, cotizador_enabled: true });
    }, 1500);
  }, [save]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Phase handlers
  const updateFase = useCallback((id: string, updated: FaseConfig) => {
    saveConfig({ ...config, fases: config.fases.map((f) => f.id === id ? updated : f) });
  }, [config, saveConfig]);

  const removeFase = useCallback((id: string) => {
    saveConfig({ ...config, fases: config.fases.filter((f) => f.id !== id) });
  }, [config, saveConfig]);

  const addFase = useCallback(() => {
    const newFase: FaseConfig = {
      id: uid(),
      nombre: "Nueva fase",
      tipo: "porcentaje",
      valor: 10,
      cuotas: 1,
      frecuencia: "unica",
    };
    saveConfig({ ...config, fases: [...config.fases, newFase] });
  }, [config, saveConfig]);

  const reorderFases = useCallback((newOrder: FaseConfig[]) => {
    saveConfig({ ...config, fases: newOrder });
  }, [config, saveConfig]);

  // Discount handlers
  const addDescuento = useCallback(() => {
    const newDesc: DescuentoConfig = {
      id: uid(),
      nombre: "Nuevo descuento",
      tipo: "porcentaje",
      valor: 5,
    };
    saveConfig({ ...config, descuentos: [...config.descuentos, newDesc] });
  }, [config, saveConfig]);

  const updateDescuento = useCallback((id: string, updated: DescuentoConfig) => {
    saveConfig({ ...config, descuentos: config.descuentos.map((d) => d.id === id ? updated : d) });
  }, [config, saveConfig]);

  const removeDescuento = useCallback((id: string) => {
    saveConfig({ ...config, descuentos: config.descuentos.filter((d) => d.id !== id) });
  }, [config, saveConfig]);

  // Toggle cotizador enabled/disabled
  const handleToggleEnabled = useCallback(() => {
    const newVal = !cotizadorEnabled;
    save({ cotizador_enabled: newVal, ...(newVal && !project.cotizador_config ? { cotizador_config: config } : {}) });
  }, [cotizadorEnabled, save, config, project.cotizador_config]);

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2", gap.spacious)}>
      {/* Left: Config */}
      <div className={cn("flex flex-col", gap.spacious)}>
        {/* Enable toggle */}
        <div className={cn("flex items-center justify-between p-4 bg-[var(--surface-1)] border border-[var(--border-subtle)]", radius.xl)}>
          <div>
            <p className={cn("text-white font-medium", fontSize.md)}>Cotizador</p>
            <p className={cn("text-[var(--text-muted)]", fontSize.label)}>
              {cotizadorEnabled ? "Activo — tus agentes pueden generar cotizaciones" : "Desactivado"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleEnabled}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors",
              cotizadorEnabled ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"
            )}
          >
            <span className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
              cotizadorEnabled ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>

        {/* Basics row */}
        <div className={cn("grid grid-cols-2", gap.relaxed)}>
          <div>
            <label className={cn(labelClass, "flex items-center", gap.normal)}>
              Moneda
              <InfoTooltip
                content={tooltips.cotizador.moneda.long}
                variant="dashboard"
                placement="auto"
              />
            </label>
            <div className="w-32">
              <NodDoDropdown
                variant="dashboard"
                size="md"
                value={config.moneda}
                onChange={(val) => saveConfig({ ...config, moneda: val })}
                options={MONEDAS.map((m) => ({ value: m.value, label: m.label }))}
              />
            </div>
          </div>
          <div>
            <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
              Nombre del plan
            </label>
            <input
              type="text"
              value={config.payment_plan_nombre ?? ""}
              onChange={(e) => saveConfig({ ...config, payment_plan_nombre: e.target.value || undefined })}
              className={cn(inputClass, fontSize.md)}
              placeholder="ej. Plan 30/70, EID Promotion..."
            />
          </div>
        </div>

        {/* Admin fee */}
        <div className={cn("grid grid-cols-2", gap.relaxed)}>
          <div>
            <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
              Admin Fee ({config.moneda})
            </label>
            <CurrencyInput
              value={config.admin_fee ?? ""}
              onChange={(v) => saveConfig({ ...config, admin_fee: Number(v) || undefined })}
              currency={moneda as Currency}
              inputClassName={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
              placeholder="0"
            />
          </div>
          <div>
            <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
              Etiqueta del admin fee
            </label>
            <input
              type="text"
              value={config.admin_fee_label ?? ""}
              onChange={(e) => saveConfig({ ...config, admin_fee_label: e.target.value || undefined })}
              className={cn(inputClass, fontSize.md)}
              placeholder="Admin Fee"
            />
          </div>
        </div>

        {/* Phases */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className={labelClass}>Fases de pago</label>
            <button
              onClick={addFase}
              className={cn("flex items-center text-[var(--site-primary)] hover:text-[var(--site-primary)]/80 transition-colors", gap.compact, fontSize.md)}
            >
              <Plus size={13} /> Agregar fase
            </button>
          </div>
          <Reorder.Group axis="y" values={config.fases} onReorder={reorderFases} className={cn("flex flex-col", gap.relaxed)}>
            {config.fases.map((fase) => (
              <FaseCard
                key={fase.id}
                fase={fase}
                onChange={(updated) => updateFase(fase.id, updated)}
                onRemove={() => removeFase(fase.id)}
                moneda={config.moneda}
              />
            ))}
          </Reorder.Group>
        </div>

        {/* Discounts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className={labelClass}>Descuentos</label>
            <button
              onClick={addDescuento}
              className={cn("flex items-center text-[var(--site-primary)] hover:text-[var(--site-primary)]/80 transition-colors", gap.compact, fontSize.md)}
            >
              <Plus size={13} /> Agregar descuento
            </button>
          </div>
          <div className={cn("flex flex-col", gap.relaxed)}>
            {config.descuentos.length === 0 && (
              <p className={cn("text-[var(--text-muted)] py-3", fontSize.md)}>Sin descuentos configurados</p>
            )}
            {config.descuentos.map((desc) => (
              <div
                key={desc.id}
                className={cn("bg-[var(--surface-2)] border border-[var(--border-subtle)] p-4", radius.xl)}
              >
                <div className={cn("flex items-center mb-3", gap.normal)}>
                  <input
                    type="text"
                    value={desc.nombre}
                    onChange={(e) => updateDescuento(desc.id, { ...desc, nombre: e.target.value })}
                    className={cn("flex-1 bg-transparent border-none font-medium text-white focus:outline-none placeholder:text-[var(--text-muted)]", fontSize.md)}
                    placeholder="Nombre del descuento"
                  />
                  <button
                    onClick={() => removeDescuento(desc.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className={cn("grid grid-cols-1 sm:grid-cols-2", gap.relaxed)}>
                  <div>
                    <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>Tipo</label>
                    <NodDoDropdown
                      variant="dashboard"
                      size="sm"
                      value={desc.tipo}
                      onChange={(val) => updateDescuento(desc.id, { ...desc, tipo: val as DescuentoConfig["tipo"] })}
                      options={[
                        { value: "porcentaje", label: "Porcentaje" },
                        { value: "fijo", label: "Monto fijo" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
                      {desc.tipo === "porcentaje" ? "%" : config.moneda}
                    </label>
                    {desc.tipo === "fijo" ? (
                      <CurrencyInput
                        value={desc.valor || ""}
                        onChange={(v) => updateDescuento(desc.id, { ...desc, valor: Number(v) })}
                        currency={moneda as Currency}
                        placeholder="10,000,000"
                        inputClassName={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
                      />
                    ) : (
                      <input
                        type="number"
                        value={desc.valor || ""}
                        onChange={(e) => updateDescuento(desc.id, { ...desc, valor: Number(e.target.value) })}
                        className={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
                        placeholder="5"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced options (collapsed) */}
        <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] overflow-hidden", radius.xl)}>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className={cn("w-full flex items-center justify-between p-4 hover:bg-[var(--surface-2)] transition-colors")}
          >
            <span className={cn("font-medium text-[var(--text-secondary)]", fontSize.md)}>Opciones avanzadas</span>
            <ChevronDown size={14} className={cn("text-[var(--text-muted)] transition-transform", advancedOpen && "rotate-180")} />
          </button>

          {advancedOpen && (
            <div className={cn("px-5 pb-5 flex flex-col", gap.loose)}>
              {/* Separación checkbox */}
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

              {/* Fecha estimada de entrega */}
              <div>
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

              {/* Notas legales */}
              <div>
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

              {/* Cover Style + Theme */}
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

              {/* Saludo + Despedida */}
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
          )}
        </div>
      </div>

      {/* Right: Preview */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6", radius.xl)}>
          <h3 className={cn("font-medium text-white mb-4", fontSize.md)}>Vista previa</h3>

          {/* Sample price input */}
          <div className="mb-5">
            <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
              Precio de ejemplo ({config.moneda})
            </label>
            <CurrencyInput
              value={samplePrice || ""}
              onChange={(v) => setSamplePrice(Number(v))}
              currency={moneda as Currency}
              inputClassName={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2.5 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
            />
          </div>

          {preview && (
            <div className={cn("flex flex-col", gap.loose)}>
              {/* Breakdown */}
              <div className={cn("flex flex-col", gap.normal)}>
                {preview.fases.map((fase, i) => (
                  <div key={i} className="flex items-start justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                    <div>
                      <p className={cn("text-white font-medium", fontSize.md)}>{fase.nombre}</p>
                      {fase.fecha && (
                        <p className={cn("text-[var(--text-muted)] mt-0.5", fontSize.label)}>{fase.fecha}</p>
                      )}
                      {fase.cuotas > 1 && (
                        <p className={cn("text-[var(--text-muted)] mt-0.5", fontSize.label)}>
                          {fase.cuotas} cuotas de {formatCurrency(fase.monto_por_cuota, moneda)}
                          {fase.frecuencia !== "unica" && ` (${fase.frecuencia})`}
                        </p>
                      )}
                    </div>
                    <p className={cn("text-[var(--text-secondary)] font-medium", fontSize.md)}>
                      {formatCurrency(fase.monto_total, moneda)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]">
                <p className={cn("font-medium text-white", fontSize.md)}>Total</p>
                <p className={cn("font-semibold text-[var(--site-primary)]", fontSize.md)}>
                  {formatCurrency(preview.precio_neto, moneda)}
                </p>
              </div>

              {/* Percentage check */}
              {(() => {
                const totalFases = preview.fases.reduce((sum, f) => sum + f.monto_total, 0);
                const diff = Math.abs(totalFases - preview.precio_neto);
                if (diff > 1) {
                  return (
                    <p className={cn("text-yellow-400 mt-2", fontSize.label)}>
                      Las fases suman {formatCurrency(totalFases, moneda)} — diferencia de {formatCurrency(diff, moneda)} con el total
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {!preview && config.fases.length > 0 && (
            <p className={cn("text-[var(--text-muted)]", fontSize.md)}>Ingresa un precio para ver la vista previa</p>
          )}
        </div>
      </div>
    </div>
  );
}
