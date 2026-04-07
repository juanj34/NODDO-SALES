"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SectionTransition } from "@/components/site/SectionTransition";
import { SiteEmptyState } from "@/components/site/SiteEmptyState";
import { useSiteProject } from "@/hooks/useSiteProject";
import { useSectionVisibility } from "@/hooks/useSectionVisibility";
import { useTranslation } from "@/i18n";
import { formatCurrency } from "@/lib/currency";
import { getUnitDisplayName } from "@/lib/unit-display";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { resolveTemplate } from "@/lib/cotizador/plantilla-pago";
import { paymentRowsToFases } from "@/lib/cotizador/payment-rows";
import type { Unidad, CotizadorConfig, FaseResultado, PlantillaPago } from "@/types";

type MonedaType = "COP" | "USD" | "MXN" | "AED" | "EUR";

export default function PlanDePagoPage() {
  const sectionVisible = useSectionVisibility("plan_pago");
  const proyecto = useSiteProject();
  const { t } = useTranslation("site");

  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const config = proyecto.cotizador_config as CotizadorConfig | null;

  // Find plantilla enabled for micrositio — falls back to default or first
  const plantillaMicro = useMemo((): PlantillaPago | null => {
    const plantillas = config?.plantillas_pago ?? [];
    return plantillas.find((p) => p.habilitada_micrositio) ?? plantillas.find((p) => p.es_default) ?? plantillas[0] ?? null;
  }, [config]);

  const moneda = (plantillaMicro?.moneda ?? config?.moneda ?? proyecto.moneda_base ?? "COP") as MonedaType;
  const unitPrefix = proyecto.unidad_display_prefix;
  const tipologias = useMemo(() => proyecto.tipologias ?? [], [proyecto.tipologias]);
  const isTipologiaPricing = proyecto.precio_source === "tipologia";
  const bgUrl = config?.plan_pago_bg_url;

  const getUnitPrice = useCallback((unit: Unidad): number | null => {
    if (!isTipologiaPricing) return unit.precio;
    if (unit.tipologia_id) {
      const tipo = tipologias.find(t => t.id === unit.tipologia_id);
      return tipo?.precio_desde ?? null;
    }
    return null;
  }, [isTipologiaPricing, tipologias]);

  const availableUnits = useMemo(() => {
    return (proyecto.unidades ?? [])
      .filter(u => u.estado === "disponible" || u.estado === "proximamente")
      .filter(u => getUnitPrice(u) !== null)
      .sort((a, b) => a.identificador.localeCompare(b.identificador, "es", { numeric: true }));
  }, [proyecto.unidades, getUnitPrice]);

  const selectedUnit = useMemo(
    () => availableUnits.find(u => u.id === selectedUnitId) ?? null,
    [availableUnits, selectedUnitId]
  );

  const selectedTipologia = useMemo(() => {
    if (!selectedUnit?.tipologia_id) return null;
    return tipologias.find(t => t.id === selectedUnit.tipologia_id) ?? null;
  }, [selectedUnit, tipologias]);

  const resultado = useMemo(() => {
    if (!selectedUnit || !config) return null;
    const price = getUnitPrice(selectedUnit);
    if (!price) return null;

    // If there's a micrositio plantilla, resolve its template into fases
    if (plantillaMicro) {
      const rows = resolveTemplate(plantillaMicro, "", "");
      const fases = paymentRowsToFases(rows, price);
      const mergedConfig: CotizadorConfig = {
        ...config,
        moneda: plantillaMicro.moneda ?? config.moneda,
        separacion_incluida_en_inicial: plantillaMicro.separacion_incluida_en_inicial ?? config.separacion_incluida_en_inicial,
        cargos_adicionales: plantillaMicro.cargos_adicionales ?? config.cargos_adicionales,
        // Legacy fallback
        impuestos: !plantillaMicro.cargos_adicionales && !config.cargos_adicionales ? (plantillaMicro.impuestos ?? config.impuestos) : undefined,
        admin_fee: !plantillaMicro.cargos_adicionales && !config.cargos_adicionales ? (plantillaMicro.admin_fee ?? config.admin_fee) : undefined,
        admin_fee_label: !plantillaMicro.cargos_adicionales && !config.cargos_adicionales ? (plantillaMicro.admin_fee_label ?? config.admin_fee_label) : undefined,
        notas_legales: plantillaMicro.notas_legales !== undefined ? plantillaMicro.notas_legales : config.notas_legales,
        fases,
      };
      return calcularCotizacion(price, mergedConfig);
    }

    return calcularCotizacion(price, config);
  }, [selectedUnit, config, getUnitPrice, plantillaMicro]);

  // Detect separación → cuota inicial grouping
  const sepGroup = useMemo(() => {
    if (!resultado || resultado.fases.length < 2) return null;
    const fases = resultado.fases;
    const first = fases[0];
    const second = fases[1];
    // Separación is typically a small fixed amount + cuota inicial percentage
    if (!first || !second) return null;
    if (first.porcentaje != null && first.porcentaje < 5 && second.porcentaje != null && second.porcentaje >= 10) {
      return { pct: second.porcentaje, total: (first.monto_total ?? 0) + (second.monto_total ?? 0) };
    }
    return null;
  }, [resultado]);

  // Separate regular phases from the "entrega" (last resto-type phase)
  const { regularFases, entregaFase } = useMemo(() => {
    if (!resultado) return { regularFases: [], entregaFase: null };
    const fases = resultado.fases;
    // Find the last phase that's likely the delivery phase (usually the resto/largest final phase)
    const lastFase = fases[fases.length - 1];
    const isEntrega = fases.length > 1 && lastFase && (
      lastFase.nombre.toLowerCase().includes("entrega") ||
      lastFase.nombre.toLowerCase().includes("completion") ||
      lastFase.nombre.toLowerCase().includes("handover") ||
      (lastFase.porcentaje && lastFase.porcentaje >= 20 && lastFase.cuotas === 1)
    );
    if (isEntrega) {
      return { regularFases: fases.slice(0, -1), entregaFase: lastFase };
    }
    return { regularFases: fases, entregaFase: null };
  }, [resultado]);

  if (!sectionVisible) return null;

  if (!config || !proyecto.cotizador_enabled) {
    return (
      <SectionTransition>
        <SiteEmptyState
          variant="inventario"
          title={t("planPago.notAvailable")}
          description={t("planPago.notConfigured")}
        />
      </SectionTransition>
    );
  }

  if (availableUnits.length === 0) {
    return (
      <SectionTransition>
        <SiteEmptyState
          variant="inventario"
          title={t("planPago.noUnitsAvailable")}
          description={t("planPago.noUnitsDescription")}
        />
      </SectionTransition>
    );
  }

  const frequencyLabel = (freq: string) => {
    const key = freq as "unica" | "mensual" | "bimestral" | "trimestral";
    return t(`planPago.frequency.${key}`);
  };

  return (
    <SectionTransition className="relative min-h-screen flex flex-col items-center">
      {/* Background image with gradient overlay */}
      {bgUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={bgUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.12 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, var(--site-bg) 0%, transparent 20%, transparent 70%, var(--site-bg) 100%)`,
            }}
          />
        </div>
      )}

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-20 lg:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h1 className="font-site-heading text-[clamp(36px,5vw,64px)] font-light italic text-[var(--text-primary)] leading-[1.1]">
            {plantillaMicro?.titulo ?? config.payment_plan_nombre ?? t("planPago.heading")}
          </h1>
          <p className="font-mono text-[13px] text-[var(--text-secondary)] leading-[1.7] max-w-md mx-auto mt-4">
            {t("planPago.subtitle")}
          </p>
        </motion.div>

        {/* Unit Selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12 max-w-md mx-auto relative"
        >
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-[0.75rem] bg-white/[0.04] border border-[var(--border-default)] backdrop-blur-sm text-left transition-colors hover:border-[rgba(var(--site-primary-rgb),0.3)] focus:outline-none focus:ring-1 focus:ring-[var(--site-primary)]"
          >
            <span className={`font-mono text-[13px] ${selectedUnit ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}>
              {selectedUnit
                ? `${getUnitDisplayName(selectedUnit, unitPrefix)}${selectedTipologia ? ` — ${selectedTipologia.nombre}` : ""}${selectedUnit.area_m2 ? ` — ${selectedUnit.area_m2}m²` : ""}`
                : t("planPago.selectUnit")
              }
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-tertiary)] shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-20 top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-[0.75rem] bg-[var(--surface-3,#222226)] border border-[var(--border-default)] shadow-lg backdrop-blur-xl"
              >
                {availableUnits.map(unit => {
                  const price = getUnitPrice(unit);
                  const tipo = unit.tipologia_id ? tipologias.find(t => t.id === unit.tipologia_id) : null;
                  return (
                    <button
                      key={unit.id}
                      onClick={() => { setSelectedUnitId(unit.id); setDropdownOpen(false); }}
                      className={`w-full text-left px-5 py-3 font-mono text-[12px] transition-colors hover:bg-[rgba(var(--site-primary-rgb),0.08)] ${
                        unit.id === selectedUnitId
                          ? "text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.06)]"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      <span className="text-[var(--text-primary)] font-medium">
                        {getUnitDisplayName(unit, unitPrefix)}
                      </span>
                      {tipo && <span className="ml-2 text-[var(--text-tertiary)]">{tipo.nombre}</span>}
                      {unit.area_m2 && <span className="ml-2 text-[var(--text-muted)]">{unit.area_m2}m²</span>}
                      {price != null && (
                        <span className="ml-2 text-[var(--site-primary)]">
                          {formatCurrency(price, moneda)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Payment Breakdown */}
        <AnimatePresence mode="wait">
          {!selectedUnit && (
            <motion.p
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center font-mono text-[12px] text-[var(--text-muted)] mt-8"
            >
              {t("planPago.selectPrompt")}
            </motion.p>
          )}

          {selectedUnit && resultado && (
            <motion.div
              key={selectedUnit.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Cuota inicial grouping label */}
              {sepGroup && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <div className="h-px flex-1 bg-[rgba(var(--site-primary-rgb),0.15)]" />
                  <span className="font-ui text-[10px] tracking-[0.18em] uppercase text-[var(--site-primary)] font-bold whitespace-nowrap">
                    {t("planPago.cuotaInicial")} ({sepGroup.pct}%) — {formatCurrency(sepGroup.total, moneda)}
                  </span>
                  <div className="h-px flex-1 bg-[rgba(var(--site-primary-rgb),0.15)]" />
                </motion.div>
              )}

              {/* Regular payment phases — 3-column grid with bordered cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                {regularFases.map((fase: FaseResultado, i: number) => (
                  <PhaseCard
                    key={`${selectedUnit.id}-${i}`}
                    fase={fase}
                    index={i}
                    moneda={moneda}
                    frequencyLabel={frequencyLabel}
                    installmentsLabel={t("planPago.installments")}
                    isSepGroup={!!sepGroup && i < 2}
                  />
                ))}
              </div>

              {/* Entrega — full-width featured card */}
              {entregaFase && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: regularFases.length * 0.08 }}
                  className="mb-8 flex flex-col items-center text-center px-8 py-10 rounded-[1.25rem] border border-[rgba(var(--site-primary-rgb),0.20)] bg-white/[0.02] backdrop-blur-sm"
                >
                  <span className="font-site-heading text-[clamp(40px,6vw,72px)] font-light italic text-[var(--text-primary)] leading-none">
                    {entregaFase.porcentaje ?? 0}%
                  </span>
                  <div className="w-16 h-px bg-[var(--site-primary)] opacity-40 my-4" />
                  <span className="font-mono text-[13px] text-[var(--text-secondary)] leading-[1.7]">
                    {entregaFase.nombre}
                  </span>
                  <span className="font-mono text-[15px] text-[var(--site-primary)] tabular-nums font-medium mt-1">
                    {formatCurrency(entregaFase.monto_total, moneda)}
                  </span>
                </motion.div>
              )}

              {/* Delivery date note */}
              {(plantillaMicro?.fecha_estimada_entrega ?? config.fecha_estimada_entrega) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center font-ui text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-8"
                >
                  {t("planPago.heading")}:{" "}
                  <span className="font-bold text-[var(--text-secondary)]">
                    {plantillaMicro?.fecha_estimada_entrega ?? config.fecha_estimada_entrega}
                  </span>
                </motion.p>
              )}

              {/* Total bar */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (regularFases.length + 1) * 0.08 }}
                className="flex items-center justify-between px-8 py-6 rounded-[1.25rem] bg-white/[0.03] border border-[rgba(var(--site-primary-rgb),0.15)]"
              >
                <span className="font-ui text-[11px] tracking-[0.2em] uppercase text-[var(--text-secondary)] font-bold">
                  {t("planPago.total")}
                </span>
                <span className="font-site-heading text-[clamp(24px,3.5vw,36px)] font-light text-[var(--site-primary)]">
                  {formatCurrency(resultado.precio_neto, moneda)}
                </span>
              </motion.div>

              {/* Legal notes */}
              {(plantillaMicro?.notas_legales ?? config.notas_legales) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 text-center font-mono text-[11px] text-[var(--text-muted)] leading-[1.8] max-w-2xl mx-auto"
                >
                  {plantillaMicro?.notas_legales ?? config.notas_legales}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SectionTransition>
  );
}

/* ── Phase Card Component ─────────────────────────────── */

function PhaseCard({
  fase,
  index,
  moneda,
  frequencyLabel,
  installmentsLabel,
  isSepGroup,
}: {
  fase: FaseResultado;
  index: number;
  moneda: MonedaType;
  frequencyLabel: (freq: string) => string;
  installmentsLabel: string;
  isSepGroup?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`group flex flex-col items-center text-center px-4 py-8 rounded-[1.25rem] border bg-white/[0.02] backdrop-blur-sm transition-colors ${
        isSepGroup
          ? "border-[rgba(var(--site-primary-rgb),0.15)] hover:border-[rgba(var(--site-primary-rgb),0.30)]"
          : "border-[var(--border-subtle)] hover:border-[rgba(var(--site-primary-rgb),0.20)]"
      }`}
    >
      {/* Large percentage */}
      <span className="font-site-heading text-[clamp(32px,5vw,52px)] font-light italic text-[var(--text-primary)] leading-none">
        {fase.porcentaje ?? 0}%
      </span>

      {/* Gold underline */}
      <div className="w-10 h-px bg-[var(--site-primary)] opacity-40 my-3" />

      {/* Phase name */}
      <span className="font-mono text-[12px] text-[var(--text-secondary)] leading-[1.7] mb-1">
        {fase.nombre}
      </span>

      {/* Amount */}
      <span className="font-mono text-[13px] text-[var(--site-primary)] tabular-nums font-medium">
        {formatCurrency(fase.monto_total, moneda)}
      </span>

      {/* Installment detail */}
      {fase.cuotas > 1 && (
        <span className="font-mono text-[10px] text-[var(--text-muted)] mt-2">
          {fase.cuotas} {installmentsLabel} {formatCurrency(fase.monto_por_cuota, moneda)}
        </span>
      )}

      {/* Frequency badge */}
      {fase.frecuencia && fase.frecuencia !== "unica" && (
        <span className="mt-2 font-ui text-[9px] tracking-[0.15em] uppercase text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-full px-2.5 py-0.5">
          {frequencyLabel(fase.frecuencia)}
        </span>
      )}

      {/* Date */}
      {fase.fecha && (
        <span className="font-ui text-[9px] tracking-[0.12em] uppercase text-[var(--text-muted)] mt-3">
          {fase.fecha}
        </span>
      )}
    </motion.div>
  );
}
