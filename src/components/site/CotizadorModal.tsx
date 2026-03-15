"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  CheckCircle,
  Loader2,
  Maximize,
  BedDouble,
  Bath,
  MapPin,
  Eye,
  ShieldCheck,
  Mail,
  FileDown,
} from "lucide-react";
import { CloseButton } from "@/components/ui/CloseButton";
import { cn } from "@/lib/utils";
import type { Unidad, Tipologia, CotizadorConfig } from "@/types";
import { useTranslation, getEstadoConfig } from "@/i18n";
import { trackEvent } from "@/lib/tracking";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { TrustBadges, trustBadgePresets } from "@/components/site/TrustBadges";
import { CotizadorFlowMultiStep } from "@/components/site/CotizadorFlowMultiStep";

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
            <span>{opt.metadata?.flag} {opt.label}</span>
          )}
          renderSelected={(opt) => (
            <span>{opt.metadata?.flag} {opt.label}</span>
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

interface CotizadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidad: Unidad;
  tipologia: Tipologia | undefined;
  proyectoId: string;
  cotizadorConfig?: CotizadorConfig | null;
  cotizadorEnabled?: boolean;
}

function formatPrecio(precio: number, locale: string): string {
  return new Intl.NumberFormat(locale === "es" ? "es-CO" : "en-US", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(precio);
}

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  pais: string;
  mensaje: string;
}

/* ─── Unit Summary Card (shared by both flows) ─── */

function UnitSummary({
  unidad,
  tipologia,
  locale,
  tCommon,
  tSite,
}: {
  unidad: Unidad;
  tipologia: Tipologia | undefined;
  locale: string;
  tCommon: (key: string) => string;
  tSite: (key: string) => string;
}) {
  const estadoConfigMap = useMemo(() => getEstadoConfig(tCommon), [tCommon]);
  const estado = estadoConfigMap[unidad.estado];

  return (
    <div className="bg-white/5 rounded-2xl p-4 mb-5 border border-white/8">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-white">
            {unidad.identificador}
          </h3>
          {tipologia && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {tipologia.nombre}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full", estado.dot)} />
          <span className={cn("text-xs font-medium", estado.color)}>
            {estado.label}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--text-secondary)]">
        {unidad.area_m2 && (
          <span className="flex items-center gap-1">
            <Maximize size={12} className="text-[var(--text-tertiary)]" />
            {unidad.area_m2} m²
          </span>
        )}
        {unidad.habitaciones !== null && (
          <span className="flex items-center gap-1">
            <BedDouble size={12} className="text-[var(--text-tertiary)]" />
            {unidad.habitaciones} {tSite("cotizador.hab")}
          </span>
        )}
        {unidad.banos !== null && (
          <span className="flex items-center gap-1">
            <Bath size={12} className="text-[var(--text-tertiary)]" />
            {unidad.banos} {tSite("cotizador.banos")}
          </span>
        )}
        {unidad.piso && (
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-[var(--text-tertiary)]" />
            {tSite("cotizador.floor")} {unidad.piso}
          </span>
        )}
        {unidad.vista && (
          <span className="flex items-center gap-1">
            <Eye size={12} className="text-[var(--text-tertiary)]" />
            {unidad.vista}
          </span>
        )}
      </div>

      {unidad.precio && (
        <p className="mt-3 text-lg font-semibold text-[var(--site-primary)]">
          {formatPrecio(unidad.precio, locale)}
        </p>
      )}
    </div>
  );
}

/* ─── Legacy Lead Form (when cotizador is NOT enabled) ─── */

function LeadCaptureFlow({
  unidad,
  tipologia,
  proyectoId,
  locale,
  tCommon,
  tSite,
  onSuccess,
}: {
  unidad: Unidad;
  tipologia: Tipologia | undefined;
  proyectoId: string;
  locale: string;
  tCommon: (key: string) => string;
  tSite: (key: string) => string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    email: "",
    telefono: "",
    pais: "",
    mensaje: "",
  });
  const [countryCode, setCountryCode] = useState("+57");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const unitDetails = [
      `Unidad: ${unidad.identificador}`,
      tipologia ? `Tipología: ${tipologia.nombre}` : null,
      unidad.area_m2 ? `Área: ${unidad.area_m2} m²` : null,
      unidad.piso ? `Piso: ${unidad.piso}` : null,
      unidad.vista ? `Vista: ${unidad.vista}` : null,
      unidad.precio ? `Precio: ${formatPrecio(unidad.precio, locale)}` : null,
    ].filter(Boolean).join(" · ");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono ? `${countryCode} ${formData.telefono}` : null,
          pais: formData.pais || null,
          tipologia_interes: tipologia
            ? `${tipologia.nombre} - ${unidad.identificador}`
            : unidad.identificador,
          mensaje: formData.mensaje
            ? `${formData.mensaje}\n\n--- Detalle unidad ---\n${unitDetails}`
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
        onSuccess();
      } else {
        setError(tCommon("errors.submitFailed"));
      }
    } catch {
      setError(tCommon("errors.connectionError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-mono">
            {tCommon("form.fullName")}
          </label>
          <input type="text" name="nombre" placeholder="Juan Pérez" required value={formData.nombre} onChange={handleChange} className="input-glass w-full" />
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-mono">
            {tCommon("form.email")}
          </label>
          <input type="email" name="email" placeholder="juan@email.com" required value={formData.email} onChange={handleChange} className="input-glass w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-mono">
            {tCommon("form.phone")}
          </label>
          <PhoneInput
            value={formData.telefono}
            onChange={(v) => setFormData((prev) => ({ ...prev, telefono: v }))}
            countryCode={countryCode}
            onCountryChange={setCountryCode}
          />
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-mono">
            {tCommon("form.country")}
          </label>
          <input type="text" name="pais" placeholder="Colombia" value={formData.pais} onChange={handleChange} className="input-glass w-full" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-mono">
          {tCommon("form.messageOptional")}
        </label>
        <textarea name="mensaje" placeholder="..." rows={2} value={formData.mensaje} onChange={handleChange} className="input-glass w-full resize-none" />
      </div>

      {/* Trust Badges */}
      <TrustBadges badges={trustBadgePresets.cotizador(tSite)} className="mt-4" />

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn-warm w-full py-3 flex items-center justify-center gap-2 text-sm tracking-[0.2em] uppercase"
      >
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {isSubmitting ? tCommon("buttons.sending") : tCommon("buttons.requestQuote")}
      </motion.button>
      {error && (
        <p className="text-red-400 text-sm text-center mt-3" role="alert">{error}</p>
      )}
      <div className="flex items-center justify-center gap-2 pt-1">
        <ShieldCheck size={14} className="text-[rgba(var(--site-primary-rgb),0.4)]" />
        <p className="text-[10px] text-[var(--text-muted)]">{tSite("contacto.trustLine")}</p>
      </div>
    </form>
  );
}

/* ─── Enhanced Cotizador Flow (when cotizador IS enabled) ─── */
// Using multi-step flow from CotizadorFlowMultiStep component
const CotizadorFlow = CotizadorFlowMultiStep;

/* ─── Main Modal ─── */

export function CotizadorModal({
  isOpen,
  onClose,
  unidad,
  tipologia,
  proyectoId,
  cotizadorConfig,
  cotizadorEnabled,
}: CotizadorModalProps) {
  const { t: tCommon, locale } = useTranslation("common");
  const { t: tSite } = useTranslation("site");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const useCotizador = cotizadorEnabled && cotizadorConfig && unidad.precio;

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setIsSubmitted(false);
      setPdfUrl(null);
    }, 300);
  }, [onClose]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--surface-1)] rounded-3xl border border-[rgba(var(--site-primary-rgb),0.15)] shadow-[0_0_40px_rgba(var(--site-primary-rgb),0.08)]"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <CloseButton
              onClick={handleClose}
              variant="dark"
              size={16}
              className="absolute top-4 right-4 z-10"
            />

            {isSubmitted ? (
              /* ── Success State ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 flex flex-col items-center justify-center gap-4"
              >
                <div className="animate-success-pop">
                  <div className="w-16 h-16 rounded-full bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.2)] flex items-center justify-center">
                    <CheckCircle size={32} className="text-[var(--site-primary)]" />
                  </div>
                </div>
                <h3 className="text-xl text-white font-light">
                  {useCotizador ? tSite("cotizador.quoteSent") : tSite("contacto.successHeading")}
                </h3>
                <p className="text-[var(--text-tertiary)] text-sm text-center max-w-xs">
                  {useCotizador
                    ? tSite("cotizador.checkEmailPdf")
                    : tCommon("success.advisorContactUnit", { unit: unidad.identificador })
                  }
                </p>
                {useCotizador && pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-all"
                  >
                    <FileDown size={14} />
                    {tSite("cotizador.downloadPdf")}
                  </a>
                )}
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)]">
                    {tSite("contacto.successNext")}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="mt-2 btn-outline-warm px-6 py-2.5 text-sm tracking-wider cursor-pointer"
                >
                  {tCommon("buttons.close")}
                </button>
              </motion.div>
            ) : (
              /* ── Form State ── */
              <div className="p-6 sm:p-8">
                {/* Header */}
                <h2 className="text-lg font-semibold text-white mb-1">
                  {tSite("cotizador.heading")}
                </h2>
                <p className="text-xs text-[var(--text-tertiary)] mb-5">
                  {useCotizador
                    ? tSite("cotizador.subtitleCotizador")
                    : tSite("cotizador.subtitle")
                  }
                </p>

                {/* Unit Summary */}
                <UnitSummary
                  unidad={unidad}
                  tipologia={tipologia}
                  locale={locale}
                  tCommon={tCommon}
                  tSite={tSite}
                />

                {/* Flow: either enhanced cotizador or legacy lead capture */}
                {useCotizador ? (
                  <CotizadorFlow
                    unidad={unidad}
                    tipologia={tipologia}
                    proyectoId={proyectoId}
                    config={cotizadorConfig!}
                    locale={locale}
                    tCommon={tCommon}
                    tSite={tSite}
                    onSuccess={(url) => {
                      setPdfUrl(url);
                      setIsSubmitted(true);
                    }}
                  />
                ) : (
                  <LeadCaptureFlow
                    unidad={unidad}
                    tipologia={tipologia}
                    proyectoId={proyectoId}
                    locale={locale}
                    tCommon={tCommon}
                    tSite={tSite}
                    onSuccess={() => setIsSubmitted(true)}
                  />
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
