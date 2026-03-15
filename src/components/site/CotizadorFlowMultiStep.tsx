"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle, FileDown, Mail, MapPin, BedDouble, Bath, Maximize, Eye } from "lucide-react";
import type { Unidad, Tipologia, CotizadorConfig, ResultadoCotizacion, Currency } from "@/types";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { formatCurrency } from "@/lib/currency";
import { trackEvent } from "@/lib/tracking";
import { MultiStepForm, useMultiStepForm } from "@/components/site/MultiStepForm";
import { TrustBadges, trustBadgePresets } from "@/components/site/TrustBadges";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryChange: (code: string) => void;
}

const COUNTRY_CODES = [
  { code: "+57", flag: "🇨🇴", label: "CO" },
  { code: "+52", flag: "🇲🇽", label: "MX" },
  { code: "+1", flag: "🇺🇸", label: "US" },
];

function PhoneInput({ value, onChange, countryCode, onCountryChange }: PhoneInputProps) {
  return (
    <div className="flex gap-2">
      <select
        value={countryCode}
        onChange={(e) => onCountryChange(e.target.value)}
        className="input-glass w-24 text-sm"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="300 000 0000"
        className="input-glass flex-1"
      />
    </div>
  );
}

interface CotizadorFlowMultiStepProps {
  unidad: Unidad;
  tipologia: Tipologia | undefined;
  proyectoId: string;
  config: CotizadorConfig;
  locale: string;
  tCommon: (key: string) => string;
  tSite: (key: string) => string;
  onSuccess: (pdfUrl: string | null) => void;
}

export function CotizadorFlowMultiStep({
  unidad,
  tipologia,
  proyectoId,
  config,
  locale,
  tCommon,
  tSite,
  onSuccess,
}: CotizadorFlowMultiStepProps) {
  const { currentStep, nextStep, prevStep } = useMultiStepForm(2);

  // Track step progression
  const handleNextStep = () => {
    trackEvent(proyectoId, "cotizador_form_step_completed", undefined, {
      step: currentStep + 1,
      total_steps: 2,
      unidad: unidad.identificador,
    });
    nextStep();
  };

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate quotation
  const resultado: ResultadoCotizacion | null = useMemo(() => {
    if (!unidad.precio) return null;
    try {
      return calcularCotizacion(unidad.precio, config, []);
    } catch {
      return null;
    }
  }, [unidad.precio, config]);

  const moneda = (config.moneda || "COP") as Currency;

  const canProceedFromStep1 = nombre !== "" && email !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: proyectoId,
          unidad_id: unidad.id,
          nombre,
          email,
          telefono: telefono ? `${countryCode} ${telefono}` : null,
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
      subtitle: tSite("cotizadorForm.step1.subtitle"),
    },
    {
      id: "summary",
      label: tSite("cotizadorForm.step2.label"),
      title: tSite("cotizadorForm.step2.title"),
      subtitle: tSite("cotizadorForm.step2.subtitle"),
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
        {/* Step 1: Contact Info */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-mono">
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
                <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-mono">
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
              <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-mono">
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
              badges={trustBadgePresets.cotizador(tSite)}
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
              {tSite("cotizadorForm.continue")}
            </motion.button>
          </div>
        )}

        {/* Step 2: Payment Summary + Unit Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Unit Summary */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/8">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--site-primary)] mb-2 font-ui font-bold">
                Unidad {unidad.identificador}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {tipologia && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-muted)]">Tipo:</span>
                    <span className="text-white">{tipologia.nombre}</span>
                  </div>
                )}
                {unidad.area_m2 && (
                  <div className="flex items-center gap-1.5">
                    <Maximize size={12} className="text-[var(--text-muted)]" />
                    <span className="text-white">{unidad.area_m2} m²</span>
                  </div>
                )}
                {unidad.habitaciones && (
                  <div className="flex items-center gap-1.5">
                    <BedDouble size={12} className="text-[var(--text-muted)]" />
                    <span className="text-white">{unidad.habitaciones} hab</span>
                  </div>
                )}
                {unidad.banos && (
                  <div className="flex items-center gap-1.5">
                    <Bath size={12} className="text-[var(--text-muted)]" />
                    <span className="text-white">{unidad.banos} baños</span>
                  </div>
                )}
                {unidad.piso !== null && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-[var(--text-muted)]" />
                    <span className="text-white">Piso {unidad.piso}</span>
                  </div>
                )}
                {unidad.vista && (
                  <div className="flex items-center gap-1.5">
                    <Eye size={12} className="text-[var(--text-muted)]" />
                    <span className="text-white">{unidad.vista}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Breakdown */}
            {resultado && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/8">
                <h4 className="text-[10px] tracking-[0.2em] uppercase text-[var(--site-primary)] mb-3 font-ui font-bold">
                  {tSite("cotizador.paymentPlan")}
                </h4>
                <div className="space-y-0">
                  {resultado.fases.map((fase, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between py-2.5 border-b border-white/5 last:border-0"
                    >
                      <div>
                        <p className="text-xs text-white">{fase.nombre}</p>
                        {fase.cuotas > 1 && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {fase.cuotas} {tSite("cotizador.installmentsOf")}{" "}
                            {formatCurrency(fase.monto_por_cuota, moneda)}
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
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/10">
                  <p className="text-xs font-medium text-white">Total</p>
                  <p className="text-sm font-semibold text-[var(--site-primary)]">
                    {formatCurrency(resultado.precio_neto, moneda)}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-[rgba(var(--site-primary-rgb),0.06)] rounded-lg p-3 border border-[rgba(var(--site-primary-rgb),0.15)]">
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                <FileDown size={12} className="inline mr-1 -mt-0.5" />
                El PDF incluye: detalles completos de la unidad, plan de pagos
                detallado y contacto directo del asesor
              </p>
            </div>

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
                className="btn-warm flex-1 py-3 flex items-center justify-center gap-2 text-sm tracking-[0.2em] uppercase"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isSubmitting
                  ? tCommon("buttons.sending")
                  : tSite("cotizadorForm.submit")}
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
