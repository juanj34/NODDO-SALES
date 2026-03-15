"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  inputClass,
  labelClass,
  fieldHint,
} from "@/components/dashboard/editor-styles";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  GripVertical,
  Lock,
  Calculator,
} from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import type { CotizadorConfig, FaseConfig, DescuentoConfig, ResultadoCotizacion } from "@/types";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { formatCurrency } from "@/lib/currency";
import { useLanguage } from "@/i18n/LanguageProvider";

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
  const { t } = useLanguage();

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
          <label className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">
            Tipo
            <InfoTooltip
              content={t.tooltips.cotizador.tipoFase.long}
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
          <NodDoDropdown
            variant="dashboard"
            size="sm"
            value={fase.frecuencia}
            onChange={(val) => onChange({ ...fase, frecuencia: val as FaseConfig["frecuencia"] })}
            options={FRECUENCIAS.map((f) => ({ value: f.value, label: f.label }))}
          />
        </div>
      </div>
    </Reorder.Item>
  );
}

/* ─── Main Page ─── */

export default function CotizadorConfigPage() {
  const { project, save } = useEditorProject();
  const { t } = useLanguage();

  const cotizadorEnabled = project.cotizador_enabled;

  // Local state for config editing
  const [config, setConfig] = useState<CotizadorConfig>(() => {
    return project.cotizador_config ?? DEFAULT_CONFIG;
  });

  const moneda = (config.moneda || "COP") as Currency;

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
        <PageHeader
          icon={Calculator}
          title="Cotizador"
          description="Configura la estructura de pagos para tus unidades"
        />
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
      <PageHeader
        icon={Calculator}
        title="Cotizador"
        description="Configura la estructura de pagos para las cotizaciones de tus unidades"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Config */}
        <div className="space-y-6">
          {/* Currency */}
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              Moneda
              <InfoTooltip
                content={t.tooltips.cotizador.moneda.long}
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
              <span className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                La separación se descuenta de la cuota inicial
                <InfoTooltip
                  content={t.tooltips.cotizador.separacionIncluida.long}
                  variant="dashboard"
                  placement="auto"
                />
              </span>
            </label>

            <div>
              <label className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Notas legales (aparecen en el PDF)
                <InfoTooltip
                  content={t.tooltips.cotizador.notasLegales.long}
                  variant="dashboard"
                  placement="auto"
                />
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
                            {fase.cuotas} cuotas de {formatCurrency(fase.monto_por_cuota, moneda)}
                            {fase.frecuencia !== "unica" && ` (${fase.frecuencia})`}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-medium">
                        {formatCurrency(fase.monto_total, moneda)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]">
                  <p className="text-sm font-medium text-white">Total</p>
                  <p className="text-sm font-semibold text-[var(--site-primary)]">
                    {formatCurrency(preview.precio_neto, moneda)}
                  </p>
                </div>

                {/* Percentage check */}
                {(() => {
                  const totalFases = preview.fases.reduce((sum, f) => sum + f.monto_total, 0);
                  const diff = Math.abs(totalFases - preview.precio_neto);
                  if (diff > 1) {
                    return (
                      <p className="text-[10px] text-yellow-400 mt-2">
                        ⚠ Las fases suman {formatCurrency(totalFases, moneda)} — diferencia de {formatCurrency(diff, moneda)} con el total
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
