"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  pageHeader,
  pageTitle,
  pageDescription,
  inputClass,
  labelClass,
  fieldHint,
} from "@/components/dashboard/editor-styles";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  GripVertical,
  Lock,
  Calculator,
  ChevronDown,
} from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { useToast } from "@/components/dashboard/Toast";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import type { CotizadorConfig, FaseConfig, DescuentoConfig, ResultadoCotizacion } from "@/types";

/* ─── Helpers ─── */

function uid(): string {
  return crypto.randomUUID();
}

function formatCurrency(n: number, moneda: string): string {
  const locale = moneda === "USD" ? "en-US" : moneda === "MXN" ? "es-MX" : "es-CO";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(n);
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
      className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <button
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-tertiary)] touch-none"
        >
          <GripVertical size={14} />
        </button>
        <input
          type="text"
          value={fase.nombre}
          onChange={(e) => onChange({ ...fase, nombre: e.target.value })}
          className="flex-1 bg-transparent border-none text-sm font-medium text-white focus:outline-none placeholder:text-[var(--text-muted)]"
          placeholder="Nombre de la fase"
        />
        <button
          onClick={onRemove}
          className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Type */}
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">Tipo</label>
          <div className="relative">
            <select
              value={fase.tipo}
              onChange={(e) => onChange({ ...fase, tipo: e.target.value as FaseConfig["tipo"] })}
              className="appearance-none w-full bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2 pr-7 text-xs text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
            >
              <option value="fijo">Monto fijo</option>
              <option value="porcentaje">Porcentaje</option>
              <option value="resto">Resto</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        {/* Value */}
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">
            {fase.tipo === "porcentaje" ? "Porcentaje" : fase.tipo === "fijo" ? `Valor (${moneda})` : "Auto"}
          </label>
          {fase.tipo === "resto" ? (
            <div className="bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-[var(--text-muted)]">
              Calculado automáticamente
            </div>
          ) : (
            <input
              type="number"
              value={fase.valor || ""}
              onChange={(e) => onChange({ ...fase, valor: Number(e.target.value) })}
              className="w-full bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
              placeholder={fase.tipo === "porcentaje" ? "30" : "5000000"}
            />
          )}
        </div>

        {/* Installments */}
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">Cuotas</label>
          <input
            type="number"
            min={1}
            value={fase.cuotas || ""}
            onChange={(e) => onChange({ ...fase, cuotas: Math.max(1, Number(e.target.value)) })}
            className="w-full bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">Frecuencia</label>
          <div className="relative">
            <select
              value={fase.frecuencia}
              onChange={(e) => onChange({ ...fase, frecuencia: e.target.value as FaseConfig["frecuencia"] })}
              className="appearance-none w-full bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2 pr-7 text-xs text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
            >
              {FRECUENCIAS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}

/* ─── Main Page ─── */

export default function CotizadorConfigPage() {
  const { project, save } = useEditorProject();
  const toast = useToast();

  const cotizadorEnabled = project.cotizador_enabled;

  // Local state for config editing
  const [config, setConfig] = useState<CotizadorConfig>(() => {
    return project.cotizador_config ?? DEFAULT_CONFIG;
  });

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
      save({ cotizador_config: newConfig });
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

  // If cotizador is not enabled, show locked state
  if (!cotizadorEnabled) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <div className={pageHeader}>
          <div>
            <h1 className={pageTitle}>Cotizador</h1>
            <p className={pageDescription}>Configura la estructura de pagos para tus unidades</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center mb-6">
            <Lock size={24} className="text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg text-white font-light mb-2">Módulo Premium</h3>
          <p className="text-sm text-[var(--text-tertiary)] max-w-sm leading-relaxed mb-6">
            El cotizador automático genera PDFs de cotización branded para tus compradores.
            Contacta a NODDO para activar este módulo.
          </p>
          <a
            href="https://wa.me/971585407848?text=Quiero%20activar%20el%20cotizador"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-[var(--site-primary)] text-[#141414] rounded-xl font-ui text-xs font-bold uppercase tracking-[0.1em] hover:brightness-110 transition-all"
          >
            <Calculator size={14} />
            Contactar NODDO
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className={pageHeader}>
        <div>
          <h1 className={pageTitle}>Cotizador</h1>
          <p className={pageDescription}>Configura la estructura de pagos para las cotizaciones de tus unidades</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Config */}
        <div className="space-y-6">
          {/* Currency */}
          <div>
            <label className={labelClass}>Moneda</label>
            <div className="relative w-32">
              <select
                value={config.moneda}
                onChange={(e) => saveConfig({ ...config, moneda: e.target.value })}
                className="appearance-none w-full bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2.5 pr-8 text-sm text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
              >
                {MONEDAS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>
          </div>

          {/* Phases */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelClass}>Fases de pago</label>
              <button
                onClick={addFase}
                className="flex items-center gap-1 text-xs text-[var(--site-primary)] hover:text-[var(--site-primary)]/80 transition-colors"
              >
                <Plus size={13} /> Agregar fase
              </button>
            </div>
            <Reorder.Group axis="y" values={config.fases} onReorder={reorderFases} className="space-y-3">
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
                className="flex items-center gap-1 text-xs text-[var(--site-primary)] hover:text-[var(--site-primary)]/80 transition-colors"
              >
                <Plus size={13} /> Agregar descuento
              </button>
            </div>
            <div className="space-y-3">
              {config.descuentos.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] py-3">Sin descuentos configurados</p>
              )}
              {config.descuentos.map((desc) => (
                <div
                  key={desc.id}
                  className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={desc.nombre}
                      onChange={(e) => updateDescuento(desc.id, { ...desc, nombre: e.target.value })}
                      className="flex-1 bg-transparent border-none text-sm font-medium text-white focus:outline-none placeholder:text-[var(--text-muted)]"
                      placeholder="Nombre del descuento"
                    />
                    <button
                      onClick={() => removeDescuento(desc.id)}
                      className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">Tipo</label>
                      <div className="relative">
                        <select
                          value={desc.tipo}
                          onChange={(e) => updateDescuento(desc.id, { ...desc, tipo: e.target.value as DescuentoConfig["tipo"] })}
                          className="appearance-none w-full bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2 pr-7 text-xs text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                        >
                          <option value="porcentaje">Porcentaje</option>
                          <option value="fijo">Monto fijo</option>
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                        {desc.tipo === "porcentaje" ? "%" : config.moneda}
                      </label>
                      <input
                        type="number"
                        value={desc.valor || ""}
                        onChange={(e) => updateDescuento(desc.id, { ...desc, valor: Number(e.target.value) })}
                        className="w-full bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                        placeholder={desc.tipo === "porcentaje" ? "5" : "10000000"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-medium text-white">Opciones</h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.separacion_incluida_en_inicial}
                onChange={(e) => saveConfig({ ...config, separacion_incluida_en_inicial: e.target.checked })}
                className="w-4 h-4 rounded bg-[var(--surface-3)] border border-[var(--border-default)] accent-[var(--site-primary)]"
              />
              <span className="text-xs text-[var(--text-secondary)]">
                La separación se descuenta de la cuota inicial
              </span>
            </label>

            <div>
              <label className="block text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Notas legales (aparecen en el PDF)
              </label>
              <textarea
                value={config.notas_legales ?? ""}
                onChange={(e) => saveConfig({ ...config, notas_legales: e.target.value || null })}
                rows={3}
                className={cn(inputClass, "text-xs resize-none")}
                placeholder="Los precios están sujetos a cambios sin previo aviso..."
              />
            </div>
          </div>

          {/* PDF Customization */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-medium text-white">Personalización del PDF</h3>

            <div>
              <label className="block text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Saludo personalizado
              </label>
              <textarea
                value={config.pdf_saludo ?? ""}
                onChange={(e) => saveConfig({ ...config, pdf_saludo: e.target.value || undefined })}
                rows={2}
                className={cn(inputClass, "text-xs resize-none")}
                placeholder="Gracias por considerar nuestro proyecto como su nuevo hogar..."
              />
              <p className={fieldHint}>Aparece en la página de oferta. Dejar vacío para usar el saludo por defecto.</p>
            </div>

            <div>
              <label className="block text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Despedida
              </label>
              <input
                type="text"
                value={config.pdf_despedida ?? ""}
                onChange={(e) => saveConfig({ ...config, pdf_despedida: e.target.value || undefined })}
                className={cn(inputClass, "text-xs")}
                placeholder="Cordialmente,"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Fecha estimada de entrega
              </label>
              <input
                type="text"
                value={config.fecha_estimada_entrega ?? ""}
                onChange={(e) => saveConfig({ ...config, fecha_estimada_entrega: e.target.value || undefined })}
                className={cn(inputClass, "text-xs")}
                placeholder="Diciembre 2027"
              />
              <p className={fieldHint}>Se muestra en la sección de detalle de unidad del PDF.</p>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-6">
            <h3 className="text-sm font-medium text-white mb-4">Vista previa</h3>

            {/* Sample price input */}
            <div className="mb-5">
              <label className="block text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Precio de ejemplo ({config.moneda})
              </label>
              <input
                type="number"
                value={samplePrice || ""}
                onChange={(e) => setSamplePrice(Number(e.target.value))}
                className="w-full bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
              />
            </div>

            {preview && (
              <div className="space-y-4">
                {/* Breakdown */}
                <div className="space-y-2">
                  {preview.fases.map((fase, i) => (
                    <div key={i} className="flex items-start justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                      <div>
                        <p className="text-xs text-white font-medium">{fase.nombre}</p>
                        {fase.cuotas > 1 && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {fase.cuotas} cuotas de {formatCurrency(fase.monto_por_cuota, config.moneda)}
                            {fase.frecuencia !== "unica" && ` (${fase.frecuencia})`}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-medium">
                        {formatCurrency(fase.monto_total, config.moneda)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]">
                  <p className="text-sm font-medium text-white">Total</p>
                  <p className="text-sm font-semibold text-[var(--site-primary)]">
                    {formatCurrency(preview.precio_neto, config.moneda)}
                  </p>
                </div>

                {/* Percentage check */}
                {(() => {
                  const totalFases = preview.fases.reduce((sum, f) => sum + f.monto_total, 0);
                  const diff = Math.abs(totalFases - preview.precio_neto);
                  if (diff > 1) {
                    return (
                      <p className="text-[10px] text-yellow-400 mt-2">
                        ⚠ Las fases suman {formatCurrency(totalFases, config.moneda)} — diferencia de {formatCurrency(diff, config.moneda)} con el total
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {!preview && config.fases.length > 0 && (
              <p className="text-xs text-[var(--text-muted)]">Ingresa un precio para ver la vista previa</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
