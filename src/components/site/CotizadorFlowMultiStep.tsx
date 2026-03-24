"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Loader2,
  FileDown,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Eye,
  Home,
  Waves,
  UtensilsCrossed, Sun, TreePine, DoorClosed, BookOpen,
  Flame, MoveVertical, CloudSun,
} from "lucide-react";
import type {
  Unidad,
  Tipologia,
  CotizadorConfig,
  ResultadoCotizacion,
  Currency,
  InventoryColumnConfig,
} from "@/types";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { resolveDeliveryContext } from "@/lib/cotizador/delivery";
import { formatCurrency } from "@/lib/currency";
import { trackEvent } from "@/lib/tracking";
import { getUnitDisplayName } from "@/lib/unit-display";
import { MultiStepForm, useMultiStepForm } from "@/components/site/MultiStepForm";
import { TrustBadges, trustBadgePresets } from "@/components/site/TrustBadges";
import { ProcessTimeline, timelinePresets } from "@/components/site/ProcessTimeline";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";

/* ─── Shared country codes (8 countries) ─── */

const COUNTRY_CODES = [
  { code: "+57", flag: "\u{1F1E8}\u{1F1F4}", label: "CO" },
  { code: "+52", flag: "\u{1F1F2}\u{1F1FD}", label: "MX" },
  { code: "+1", flag: "\u{1F1FA}\u{1F1F8}", label: "US" },
  { code: "+507", flag: "\u{1F1F5}\u{1F1E6}", label: "PA" },
  { code: "+593", flag: "\u{1F1EA}\u{1F1E8}", label: "EC" },
  { code: "+51", flag: "\u{1F1F5}\u{1F1EA}", label: "PE" },
  { code: "+56", flag: "\u{1F1E8}\u{1F1F1}", label: "CL" },
  { code: "+34", flag: "\u{1F1EA}\u{1F1F8}", label: "ES" },
] as const;

function PhoneInput({
  value,
  onChange,
  countryCode,
  onCountryChange,
}: {
  value: string;
  onChange: (v: string) => void;
  countryCode: string;
  onCountryChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      <div className="w-[90px] shrink-0">
        <NodDoDropdown
          variant="site"
          size="sm"
          value={countryCode}
          onChange={onCountryChange}
          options={COUNTRY_CODES.map((c) => ({
            value: c.code,
            label: c.code,
            metadata: { flag: c.flag },
          }))}
          renderOption={(opt) => (
            <span>
              {String(opt.metadata?.flag ?? "")} {opt.label}
            </span>
          )}
          renderSelected={(opt) => (
            <span>
              {String(opt.metadata?.flag ?? "")} {opt.label}
            </span>
          )}
        />
      </div>
      <input
        type="tel"
        placeholder="300 000 0000"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-glass w-full"
      />
    </div>
  );
}

/* ─── Unit Details Card (Step 2) ─── */

function UnitDetailsCard({
  unidad,
  tipologia,
  columns,
  tSite,
  unitPrefix,
  areaSymbol = "m²",
}: {
  unidad: Unidad;
  tipologia: Tipologia | undefined;
  columns: InventoryColumnConfig;
  tSite: (key: string) => string;
  unitPrefix?: string | null;
  areaSymbol?: string;
}) {
  return (
    <div className="bg-[var(--glass-bg)] rounded-xl p-4 border border-[var(--border-default)]">
      <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--site-primary)] mb-2.5 font-ui font-bold">
        {getUnitDisplayName(unidad, unitPrefix)}
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {tipologia && (
          <div className="flex items-center gap-1.5">
            <Home size={12} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-primary)]">{tipologia.nombre}</span>
          </div>
        )}
        {columns.area_construida && unidad.area_construida != null && (
          <div className="flex items-center gap-1.5">
            <Maximize size={12} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-primary)]">
              {unidad.area_construida} {areaSymbol}
            </span>
          </div>
        )}
        {columns.area_privada && unidad.area_privada != null && (
          <div className="flex items-center gap-1.5">
            <Maximize size={12} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-primary)]">
              {unidad.area_privada} {areaSymbol}
            </span>
          </div>
        )}
        {columns.area_lote && unidad.area_lote != null && (
          <div className="flex items-center gap-1.5">
            <Maximize size={12} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-primary)]">
              {unidad.area_lote} {areaSymbol}
            </span>
          </div>
        )}
        {columns.area_m2 &&
          unidad.area_m2 != null &&
          !columns.area_construida &&
          !columns.area_privada &&
          !columns.area_lote && (
            <div className="flex items-center gap-1.5">
              <Maximize size={12} className="text-[var(--text-muted)]" />
              <span className="text-[var(--text-primary)]">
                {unidad.area_m2} {areaSymbol}
              </span>
            </div>
          )}
        {columns.habitaciones && unidad.habitaciones != null && (
          <div className="flex items-center gap-1.5">
            <BedDouble size={12} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-primary)]">
              {unidad.habitaciones} {tSite("cotizador.hab")}
            </span>
          </div>
        )}
        {columns.banos && unidad.banos != null && (
          <div className="flex items-center gap-1.5">
            <Bath size={12} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-primary)]">
              {unidad.banos} {tSite("cotizador.banos")}
            </span>
          </div>
        )}
        {([
          { field: "tiene_jacuzzi" as const, icon: Bath, labelKey: "tipologias.jacuzzi" },
          { field: "tiene_piscina" as const, icon: Waves, labelKey: "tipologias.piscina" },
          { field: "tiene_bbq" as const, icon: UtensilsCrossed, labelKey: "tipologias.bbq" },
          { field: "tiene_terraza" as const, icon: Sun, labelKey: "tipologias.terraza" },
          { field: "tiene_jardin" as const, icon: TreePine, labelKey: "tipologias.jardin" },
          { field: "tiene_cuarto_servicio" as const, icon: DoorClosed, labelKey: "tipologias.cuartoServicio" },
          { field: "tiene_estudio" as const, icon: BookOpen, labelKey: "tipologias.estudio" },
          { field: "tiene_chimenea" as const, icon: Flame, labelKey: "tipologias.chimenea" },
          { field: "tiene_doble_altura" as const, icon: MoveVertical, labelKey: "tipologias.dobleAltura" },
          { field: "tiene_rooftop" as const, icon: CloudSun, labelKey: "tipologias.rooftop" },
        ] as const).map(({ field, icon: Icon, labelKey }) => (
          tipologia?.[field] && (
            <div key={field} className="flex items-center gap-1.5">
              <Icon size={12} className="text-[var(--text-muted)]" />
              <span className="text-[var(--text-primary)]">{tSite(labelKey)}</span>
            </div>
          )
        ))}
        {columns.lote && unidad.lote && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-primary)]">{unidad.lote}</span>
          </div>
        )}
        {columns.piso && unidad.piso !== null && !unidad.lote && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-primary)]">
              {tSite("cotizador.floor")} {unidad.piso}
            </span>
          </div>
        )}
        {columns.vista && unidad.vista && (
          <div className="flex items-center gap-1.5">
            <Eye size={12} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-primary)]">{unidad.vista}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component Props ─── */

interface CotizadorFlowMultiStepProps {
  unidad: Unidad;
  tipologia: Tipologia | undefined;
  proyectoId: string;
  locale: string;
  tCommon: (key: string) => string;
  tSite: (key: string) => string;
  columns: InventoryColumnConfig;
  onSuccess: (pdfUrl: string | null) => void;
  /** When true, shows full cotizador with payment plan + PDF. When false, simplified lead flow. */
  cotizadorEnabled: boolean;
  /** Required when cotizadorEnabled = true */
  config?: CotizadorConfig | null;
  /** Buyer-selected tipología ID for multi-tipo lots */
  selectedTipologiaId?: string;
  /** For lotes: original terrain price before tipología sum */
  terrenoPrice?: number;
  /** For lotes: construction price from tipología */
  construccionPrice?: number;
  /** Unit display prefix */
  unitPrefix?: string | null;
  /** Area unit symbol (m² or sqft) */
  areaSymbol?: string;
}

/* ─── Unified Flow Component ─── */

export function CotizadorFlowMultiStep({
  unidad,
  tipologia,
  proyectoId,
  locale,
  tCommon,
  tSite,
  columns,
  onSuccess,
  cotizadorEnabled,
  config,
  selectedTipologiaId,
  terrenoPrice,
  construccionPrice,
  unitPrefix,
  areaSymbol = "m²",
}: CotizadorFlowMultiStepProps) {
  const isCotizador = cotizadorEnabled && !!config && !!unidad.precio;
  const { currentStep, nextStep, prevStep } = useMultiStepForm(2);

  // Track step progression
  const handleNextStep = () => {
    trackEvent(proyectoId, "cotizador_form_step_completed", undefined, {
      step: currentStep + 1,
      total_steps: 2,
      unidad: unidad.identificador,
      mode: isCotizador ? "cotizador" : "lead",
    });
    nextStep();
  };

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve delivery context for dynamic payment plans
  const deliveryContext = useMemo(() => {
    if (!config) return null;
    return resolveDeliveryContext(config);
  }, [config]);

  // Calculate quotation (only for cotizador mode)
  const resultado: ResultadoCotizacion | null = useMemo(() => {
    if (!isCotizador || !unidad.precio || !config) return null;
    try {
      return calcularCotizacion(unidad.precio, config, [], [], deliveryContext);
    } catch {
      return null;
    }
  }, [isCotizador, unidad.precio, config, deliveryContext]);

  const moneda = ((config?.moneda || "COP") as Currency);

  const canProceedFromStep1 = nombre.trim() !== "" && email.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isCotizador) {
        // Enhanced cotizador flow → POST to /api/cotizaciones
        const res = await fetch("/api/cotizaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proyecto_id: proyectoId,
            unidad_id: unidad.id,
            nombre,
            email,
            telefono: telefono ? `${countryCode} ${telefono}` : null,
            tipologia_id: selectedTipologiaId || undefined,
            utm_source: new URLSearchParams(window.location.search).get("utm_source"),
            utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
            utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          trackEvent(proyectoId, "cotizacion_submit", undefined, {
            tipologia: tipologia?.nombre || unidad.identificador,
            unidad: unidad.identificador,
          });
          onSuccess(data.pdf_url);
        } else {
          setError(tCommon("errors.submitFailed"));
        }
      } else {
        // Lead-only flow → POST to /api/leads
        const unitDetails = [
          `Unidad: ${getUnitDisplayName(unidad, unitPrefix)}`,
          tipologia ? `Tipología: ${tipologia.nombre}` : null,
          unidad.area_m2 ? `Área: ${unidad.area_m2} ${areaSymbol}` : null,
          unidad.piso ? `Piso: ${unidad.piso}` : null,
          unidad.vista ? `Vista: ${unidad.vista}` : null,
          unidad.precio
            ? `Precio: ${formatCurrency(unidad.precio, moneda)}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre,
            email,
            telefono: telefono ? `${countryCode} ${telefono}` : null,
            tipologia_interes: tipologia
              ? `${tipologia.nombre} - ${unidad.identificador}`
              : unidad.identificador,
            mensaje: mensaje
              ? `${mensaje}\n\n--- Detalle unidad ---\n${unitDetails}`
              : `Solicitud de cotización\n\n--- Detalle unidad ---\n${unitDetails}`,
            proyecto_id: proyectoId,
            utm_source: new URLSearchParams(window.location.search).get("utm_source"),
            utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
            utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
          }),
        });

        if (res.ok) {
          trackEvent(proyectoId, "lead_submit", undefined, {
            tipologia: tipologia?.nombre || unidad.identificador,
            unidad: unidad.identificador,
          });
          onSuccess(null);
        } else {
          setError(tCommon("errors.submitFailed"));
        }
      }
    } catch {
      setError(tCommon("errors.connectionError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      id: "info",
      label: tSite("cotizadorForm.step1.label"),
      title: tSite("cotizadorForm.step1.title"),
      subtitle: isCotizador
        ? tSite("cotizadorForm.step1.subtitle")
        : tSite("cotizadorForm.step1.subtitleLead"),
    },
    {
      id: "summary",
      label: tSite("cotizadorForm.step2.label"),
      title: isCotizador
        ? tSite("cotizadorForm.step2.title")
        : tSite("cotizadorForm.step2.titleLead"),
      subtitle: isCotizador
        ? tSite("cotizadorForm.step2.subtitle")
        : tSite("cotizadorForm.step2.subtitleLead"),
    },
  ];

  return (
    <MultiStepForm
      steps={steps}
      currentStep={currentStep}
      onStepChange={() => {}}
      showNavigation={false}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── Step 1: Contact Info ── */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-ui font-bold">
                  {tCommon("form.fullName")}
                </label>
                <input
                  type="text"
                  placeholder="Juan Pérez"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="input-glass w-full"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-ui font-bold">
                  {tCommon("form.email")}
                </label>
                <input
                  type="email"
                  placeholder="juan@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-glass w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-ui font-bold">
                WhatsApp
              </label>
              <PhoneInput
                value={telefono}
                onChange={setTelefono}
                countryCode={countryCode}
                onCountryChange={setCountryCode}
              />
            </div>

            <TrustBadges
              badges={isCotizador
                ? trustBadgePresets.cotizador(tSite)
                : trustBadgePresets.leadOnly(tSite)
              }
              className="mt-4"
            />

            <motion.button
              type="button"
              onClick={handleNextStep}
              disabled={!canProceedFromStep1}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-warm w-full py-3 flex items-center justify-center gap-2 text-sm tracking-[0.2em] uppercase disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isCotizador
                ? tSite("cotizadorForm.continue")
                : tSite("cotizadorForm.continueLead")}
            </motion.button>
          </div>
        )}

        {/* ── Step 2: Summary ── */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Unit Details Card */}
            <UnitDetailsCard
              unidad={unidad}
              tipologia={tipologia}
              columns={columns}
              tSite={tSite}
              unitPrefix={unitPrefix}
              areaSymbol={areaSymbol}
            />

            {/* Price display for units with price (both modes) */}
            {unidad.precio != null && (
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--glass-bg)] rounded-xl border border-[var(--border-default)]">
                <span className="text-xs text-[var(--text-secondary)]">
                  {locale === "es" ? "Precio" : "Price"}
                </span>
                <span className="text-lg font-semibold text-[var(--site-primary)] font-mono">
                  {formatCurrency(unidad.precio, moneda)}
                </span>
              </div>
            )}

            {/* Lotes: Terrain + Construction price breakdown */}
            {terrenoPrice != null && construccionPrice != null && (
              <div className="bg-[var(--glass-bg)] rounded-xl p-4 border border-[var(--border-default)]">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--site-primary)] mb-2 font-ui font-bold">
                  {tSite("cotizador.priceBreakdown")}
                </p>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-secondary)]">
                    {tSite("cotizador.terrain")}
                  </span>
                  <span className="text-[var(--text-primary)] font-mono">
                    {formatCurrency(terrenoPrice, moneda)}
                  </span>
                </div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-secondary)]">
                    {tSite("cotizador.construction")}
                  </span>
                  <span className="text-[var(--text-primary)] font-mono">
                    {formatCurrency(construccionPrice, moneda)}
                  </span>
                </div>
                <div className="h-px bg-[var(--border-default)] my-2" />
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--text-primary)]">Total</span>
                  <span className="text-[var(--site-primary)] font-mono">
                    {formatCurrency(terrenoPrice + construccionPrice, moneda)}
                  </span>
                </div>
              </div>
            )}

            {/* ── Cotizador mode: Payment Breakdown ── */}
            {isCotizador && resultado && (
              <>
                <div className="bg-[var(--glass-bg)] rounded-2xl p-4 border border-[var(--border-default)]">
                  <h4 className="text-[10px] tracking-[0.2em] uppercase text-[var(--site-primary)] mb-3 font-ui font-bold">
                    {tSite("cotizador.paymentPlan")}
                  </h4>
                  <div className="space-y-0">
                    {resultado.fases.map((fase, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between py-2.5 border-b border-[var(--border-subtle)] last:border-0"
                      >
                        <div>
                          <p className="text-xs text-[var(--text-primary)]">
                            {fase.nombre}
                          </p>
                          {fase.cuotas > 1 && (
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                              {fase.cuotas} {tSite("cotizador.installmentsOf")}{" "}
                              <span className="font-mono">
                                {formatCurrency(fase.monto_por_cuota, moneda)}
                              </span>
                              {fase.frecuencia !== "unica" &&
                                ` (${fase.frecuencia})`}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] font-medium font-mono">
                          {formatCurrency(fase.monto_total, moneda)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-[var(--border-default)]">
                    <p className="text-xs font-medium text-[var(--text-primary)]">
                      Total
                    </p>
                    <p className="text-sm font-semibold text-[var(--site-primary)] font-mono">
                      {formatCurrency(resultado.precio_neto, moneda)}
                    </p>
                  </div>
                </div>

                <div className="bg-[rgba(var(--site-primary-rgb),0.06)] rounded-lg p-3 border border-[rgba(var(--site-primary-rgb),0.15)]">
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    <FileDown size={12} className="inline mr-1 -mt-0.5" />
                    {tSite("cotizador.pdfIncludes")}
                  </p>
                </div>

                {deliveryContext && (
                  <p className="text-[9px] text-[var(--text-muted)] text-center leading-relaxed">
                    Cotización indicativa — sujeta a confirmación por el equipo comercial
                  </p>
                )}
              </>
            )}

            {/* ── Lead mode: Process timeline + Message ── */}
            {!isCotizador && (
              <>
                <div className="bg-[var(--glass-bg)] rounded-2xl p-4 border border-[var(--border-default)]">
                  <h4 className="text-[10px] tracking-[0.2em] uppercase text-[var(--site-primary)] mb-3 font-ui font-bold">
                    {tSite("cotizador.whatHappensNext")}
                  </h4>
                  <ProcessTimeline
                    steps={timelinePresets.contactFlow(tSite)}
                    variant="vertical"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-ui font-bold">
                    {tCommon("form.messageOptional")}
                  </label>
                  <textarea
                    placeholder="..."
                    rows={3}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    className="input-glass w-full resize-none"
                  />
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <motion.button
                type="button"
                onClick={prevStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-ghost flex-1 py-2.5 text-sm"
              >
                {tSite("cotizadorForm.back")}
              </motion.button>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-warm flex-[2] py-3 flex items-center justify-center gap-2 text-sm tracking-[0.2em] uppercase"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isSubmitting
                  ? tCommon("buttons.sending")
                  : isCotizador
                    ? tSite("cotizadorForm.submit")
                    : tSite("cotizadorForm.submitLead")}
              </motion.button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center mt-3">{error}</p>
            )}
          </div>
        )}
      </form>
    </MultiStepForm>
  );
}
