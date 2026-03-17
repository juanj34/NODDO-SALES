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
  Home,
  ChevronRight,
} from "lucide-react";
import { CloseButton } from "@/components/ui/CloseButton";
import { cn } from "@/lib/utils";
import { getInventoryColumns, getHybridInventoryColumns, getPrimaryArea } from "@/lib/inventory-columns";
import type { Unidad, Tipologia, CotizadorConfig, InventoryColumnConfig } from "@/types";
import { useTranslation, getEstadoConfig } from "@/i18n";
import { useSiteProject } from "@/hooks/useSiteProject";
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
            <span>{String(opt.metadata?.flag ?? "")} {opt.label}</span>
          )}
          renderSelected={(opt) => (
            <span>{String(opt.metadata?.flag ?? "")} {opt.label}</span>
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
  /** Available tipologías for multi-tipo lots (tipologia_mode === 'multiple') */
  availableTipologias?: Tipologia[];
  /** Project type — used for lotes pricing logic */
  tipoProyecto?: string;
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
  columns,
}: {
  unidad: Unidad;
  tipologia: Tipologia | undefined;
  locale: string;
  tCommon: (key: string) => string;
  tSite: (key: string) => string;
  columns: InventoryColumnConfig;
}) {
  const estadoConfigMap = useMemo(() => getEstadoConfig(tCommon), [tCommon]);
  const estado = estadoConfigMap[unidad.estado];

  return (
    <div className="bg-[var(--glass-bg)] rounded-2xl p-4 mb-5 border border-[var(--border-default)]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
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
        {columns.area_construida && unidad.area_construida != null && (
          <span className="flex items-center gap-1">
            <Maximize size={12} className="text-[var(--text-tertiary)]" />
            {unidad.area_construida} m²
          </span>
        )}
        {columns.area_privada && unidad.area_privada != null && (
          <span className="flex items-center gap-1">
            <Maximize size={12} className="text-[var(--text-tertiary)]" />
            {unidad.area_privada} m²
          </span>
        )}
        {columns.area_lote && unidad.area_lote != null && (
          <span className="flex items-center gap-1">
            <Maximize size={12} className="text-[var(--text-tertiary)]" />
            {unidad.area_lote} m²
          </span>
        )}
        {columns.area_m2 && unidad.area_m2 != null && !columns.area_construida && !columns.area_privada && !columns.area_lote && (
          <span className="flex items-center gap-1">
            <Maximize size={12} className="text-[var(--text-tertiary)]" />
            {unidad.area_m2} m²
          </span>
        )}
        {columns.habitaciones && unidad.habitaciones !== null && (
          <span className="flex items-center gap-1">
            <BedDouble size={12} className="text-[var(--text-tertiary)]" />
            {unidad.habitaciones} {tSite("cotizador.hab")}
          </span>
        )}
        {columns.banos && unidad.banos !== null && (
          <span className="flex items-center gap-1">
            <Bath size={12} className="text-[var(--text-tertiary)]" />
            {unidad.banos} {tSite("cotizador.banos")}
          </span>
        )}
        {columns.lote && unidad.lote && (
          <span className="flex items-center gap-1">
            <Home size={12} className="text-[var(--text-tertiary)]" />
            {unidad.lote}
          </span>
        )}
        {columns.piso && unidad.piso && !unidad.lote && (
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-[var(--text-tertiary)]" />
            {tSite("cotizador.floor")} {unidad.piso}
          </span>
        )}
        {columns.vista && unidad.vista && (
          <span className="flex items-center gap-1">
            <Eye size={12} className="text-[var(--text-tertiary)]" />
            {unidad.vista}
          </span>
        )}
      </div>

      {columns.precio && unidad.precio && (
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
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-ui font-bold">
            {tCommon("form.fullName")}
          </label>
          <input type="text" name="nombre" placeholder="Juan Pérez" required value={formData.nombre} onChange={handleChange} className="input-glass w-full" />
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-ui font-bold">
            {tCommon("form.email")}
          </label>
          <input type="email" name="email" placeholder="juan@email.com" required value={formData.email} onChange={handleChange} className="input-glass w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-ui font-bold">
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
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-ui font-bold">
            {tCommon("form.country")}
          </label>
          <input type="text" name="pais" placeholder="Colombia" value={formData.pais} onChange={handleChange} className="input-glass w-full" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1 font-ui font-bold">
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
  availableTipologias,
  tipoProyecto,
}: CotizadorModalProps) {
  const { t: tCommon, locale } = useTranslation("common");
  const { t: tSite } = useTranslation("site");
  const proyecto = useSiteProject();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Multi-tipología: user must pick a tipología before proceeding
  const needsTipologiaSelection = !tipologia && Array.isArray(availableTipologias) && availableTipologias.length > 0;
  const [selectedTipo, setSelectedTipo] = useState<Tipologia | null>(null);
  const activeTipologia = tipologia ?? selectedTipo ?? undefined;

  const isHibrido = tipoProyecto === "hibrido";
  const unitTipoTipologia = activeTipologia?.tipo_tipologia ?? tipologia?.tipo_tipologia ?? null;
  const isLotes = isHibrido ? unitTipoTipologia === "lote" : tipoProyecto === "lotes";

  const columns = useMemo(() => {
    if (isHibrido && unitTipoTipologia) {
      return getHybridInventoryColumns(unitTipoTipologia, (proyecto as any).inventory_columns_microsite_by_type ?? proyecto.inventory_columns_by_type);
    }
    return getInventoryColumns(
      (proyecto.tipo_proyecto ?? "hibrido") as "apartamentos" | "casas" | "lotes" | "hibrido",
      (proyecto as any).inventory_columns_microsite ?? proyecto.inventory_columns
    );
  }, [isHibrido, unitTipoTipologia, proyecto.tipo_proyecto, proyecto.inventory_columns, proyecto.inventory_columns_by_type]);

  // Build a virtual unidad with tipología specs when one is selected
  const activeUnidad = useMemo(() => {
    if (!activeTipologia) return unidad;
    // Override unidad specs with tipología specs when no confirmed tipología
    if (!tipologia && selectedTipo) {
      // For lotes: sum terrain + construction prices when both exist
      let precio: number | null;
      if (isLotes && unidad.precio && selectedTipo.precio_desde) {
        precio = unidad.precio + selectedTipo.precio_desde;
      } else {
        precio = selectedTipo.precio_desde ?? unidad.precio;
      }
      return {
        ...unidad,
        area_m2: selectedTipo.area_m2 ?? unidad.area_m2,
        area_construida: selectedTipo.area_construida ?? unidad.area_construida,
        area_privada: selectedTipo.area_privada ?? unidad.area_privada,
        area_lote: selectedTipo.area_lote ?? unidad.area_lote,
        precio,
        habitaciones: selectedTipo.habitaciones ?? unidad.habitaciones,
        banos: selectedTipo.banos ?? unidad.banos,
      };
    }
    return unidad;
  }, [unidad, tipologia, selectedTipo, activeTipologia, isLotes]);

  // For lotes: track breakdown prices for the cotizador display
  const terrenoPrice = (isLotes && !tipologia && selectedTipo && unidad.precio && selectedTipo.precio_desde) ? unidad.precio : undefined;
  const construccionPrice = (isLotes && !tipologia && selectedTipo && unidad.precio && selectedTipo.precio_desde) ? selectedTipo.precio_desde : undefined;

  const useCotizador = cotizadorEnabled && cotizadorConfig && activeUnidad.precio;

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setIsSubmitted(false);
      setPdfUrl(null);
      setSelectedTipo(null);
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
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(var(--overlay-rgb), 0.90)" }}
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
            ) : needsTipologiaSelection && !selectedTipo ? (
              /* ── Tipología Selection Step (multi-tipo lots) ── */
              <div className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-white mb-1">
                  {locale === "es" ? "Seleccionar tipología" : "Select typology"}
                </h2>
                <p className="text-xs text-[var(--text-tertiary)] mb-5">
                  {locale === "es"
                    ? `El lote ${unidad.identificador} tiene ${availableTipologias!.length} tipologías disponibles`
                    : `Lot ${unidad.identificador} has ${availableTipologias!.length} available typologies`
                  }
                </p>

                <div className="space-y-3">
                  {availableTipologias!.map((tipo) => (
                    <motion.button
                      key={tipo.id}
                      type="button"
                      onClick={() => setSelectedTipo(tipo)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full text-left bg-white/5 hover:bg-white/8 border border-white/8 hover:border-[rgba(var(--site-primary-rgb),0.3)] rounded-2xl p-4 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-white">{tipo.nombre}</h3>
                        <ChevronRight size={16} className="text-[var(--text-muted)]" />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                        {columns.area_construida && tipo.area_construida != null && (
                          <span className="flex items-center gap-1">
                            <Maximize size={11} className="text-[var(--text-tertiary)]" />
                            {tipo.area_construida} m²
                          </span>
                        )}
                        {columns.area_m2 && tipo.area_m2 != null && !columns.area_construida && (
                          <span className="flex items-center gap-1">
                            <Maximize size={11} className="text-[var(--text-tertiary)]" />
                            {tipo.area_m2} m²
                          </span>
                        )}
                        {columns.area_privada && tipo.area_privada != null && (
                          <span className="flex items-center gap-1">
                            <Maximize size={11} className="text-[var(--text-tertiary)]" />
                            {tipo.area_privada} m²
                          </span>
                        )}
                        {columns.area_lote && tipo.area_lote != null && (
                          <span className="flex items-center gap-1">
                            <Maximize size={11} className="text-[var(--text-tertiary)]" />
                            {tipo.area_lote} m²
                          </span>
                        )}
                        {columns.habitaciones && tipo.habitaciones !== null && tipo.habitaciones !== undefined && (
                          <span className="flex items-center gap-1">
                            <BedDouble size={11} className="text-[var(--text-tertiary)]" />
                            {tipo.habitaciones} {locale === "es" ? "hab" : "beds"}
                          </span>
                        )}
                        {columns.banos && tipo.banos !== null && tipo.banos !== undefined && (
                          <span className="flex items-center gap-1">
                            <Bath size={11} className="text-[var(--text-tertiary)]" />
                            {tipo.banos} {locale === "es" ? "baños" : "baths"}
                          </span>
                        )}
                      </div>
                      {columns.precio && tipo.precio_desde && (
                        <p className="mt-2 text-sm font-semibold text-[var(--site-primary)]">
                          {formatPrecio(tipo.precio_desde, locale)}
                        </p>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
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

                {/* Back to tipología selection for multi-tipo */}
                {needsTipologiaSelection && selectedTipo && (
                  <button
                    type="button"
                    onClick={() => setSelectedTipo(null)}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-white mb-3 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={12} className="rotate-180" />
                    {locale === "es" ? "Cambiar tipología" : "Change typology"}
                  </button>
                )}

                {/* Unit Summary */}
                <UnitSummary
                  unidad={activeUnidad}
                  tipologia={activeTipologia}
                  locale={locale}
                  tCommon={tCommon}
                  tSite={tSite}
                  columns={columns}
                />

                {/* Flow: either enhanced cotizador or legacy lead capture */}
                {useCotizador ? (
                  <CotizadorFlow
                    unidad={activeUnidad}
                    tipologia={activeTipologia}
                    proyectoId={proyectoId}
                    config={cotizadorConfig!}
                    locale={locale}
                    tCommon={tCommon}
                    tSite={tSite}
                    columns={columns}
                    selectedTipologiaId={selectedTipo?.id}
                    terrenoPrice={terrenoPrice}
                    construccionPrice={construccionPrice}
                    onSuccess={(url) => {
                      setPdfUrl(url);
                      setIsSubmitted(true);
                    }}
                  />
                ) : (
                  <LeadCaptureFlow
                    unidad={activeUnidad}
                    tipologia={activeTipologia}
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
