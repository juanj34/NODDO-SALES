"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Maximize,
  BedDouble,
  Bath,
  MapPin,
  Eye,
  Mail,
  FileDown,
  Home,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import { CloseButton } from "@/components/ui/CloseButton";
import { cn } from "@/lib/utils";
import { getUnitDisplayName } from "@/lib/unit-display";
import {
  getInventoryColumns,
  getHybridInventoryColumns,
} from "@/lib/inventory-columns";
import { formatCurrency } from "@/lib/currency";
import { UNIT_CONFIG } from "@/lib/units";
import type {
  Unidad,
  Tipologia,
  CotizadorConfig,
  InventoryColumnConfig,
  Currency,
  UnitOfMeasurement,
} from "@/types";
import { useTranslation, getEstadoConfig } from "@/i18n";
import { useSiteProject } from "@/hooks/useSiteProject";
import { CotizadorFlowMultiStep } from "@/components/site/CotizadorFlowMultiStep";

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

/* ─── Unit Summary Card ─── */

function UnitSummary({
  unidad,
  tipologia,
  tCommon,
  tSite,
  columns,
  unitPrefix,
  renderUrl,
  areaSymbol,
}: {
  unidad: Unidad;
  tipologia: Tipologia | undefined;
  tCommon: (key: string) => string;
  tSite: (key: string) => string;
  columns: InventoryColumnConfig;
  unitPrefix?: string | null;
  renderUrl?: string | null;
  areaSymbol: string;
}) {
  const estadoConfigMap = useMemo(() => getEstadoConfig(tCommon), [tCommon]);
  const estado = estadoConfigMap[unidad.estado];

  return (
    <div className="bg-[var(--glass-bg)] rounded-2xl mb-5 border border-[var(--border-default)] overflow-hidden">
      {/* Render image hero */}
      {renderUrl && (
        <div className="relative h-36 w-full">
          <Image
            src={renderUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 672px) 100vw, 672px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-1)] via-transparent to-transparent" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {getUnitDisplayName(unidad, unitPrefix)}
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
              {unidad.area_construida} {areaSymbol}
            </span>
          )}
          {columns.area_privada && unidad.area_privada != null && (
            <span className="flex items-center gap-1">
              <Maximize size={12} className="text-[var(--text-tertiary)]" />
              {unidad.area_privada} {areaSymbol}
            </span>
          )}
          {columns.area_lote && unidad.area_lote != null && (
            <span className="flex items-center gap-1">
              <Maximize size={12} className="text-[var(--text-tertiary)]" />
              {unidad.area_lote} {areaSymbol}
            </span>
          )}
          {columns.area_m2 &&
            unidad.area_m2 != null &&
            !columns.area_construida &&
            !columns.area_privada &&
            !columns.area_lote && (
              <span className="flex items-center gap-1">
                <Maximize size={12} className="text-[var(--text-tertiary)]" />
                {unidad.area_m2} {areaSymbol}
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
      </div>
    </div>
  );
}

/* ─── Success State ─── */

function SuccessState({
  isCotizador,
  pdfUrl,
  unidad,
  unitPrefix,
  whatsappNumero,
  tSite,
  tCommon,
  onClose,
}: {
  isCotizador: boolean;
  pdfUrl: string | null;
  unidad: Unidad;
  unitPrefix?: string | null;
  whatsappNumero?: string | null;
  tSite: (key: string) => string;
  tCommon: (key: string) => string;
  onClose: () => void;
}) {
  const unitName = getUnitDisplayName(unidad, unitPrefix);

  const whatsappUrl = whatsappNumero
    ? `https://wa.me/${whatsappNumero.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola, acabo de solicitar una cotización para ${unitName}`
      )}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 sm:p-10 flex flex-col items-center justify-center gap-5"
    >
      {/* Animated checkmark */}
      <div className="animate-success-pop">
        <div className="w-18 h-18 rounded-full bg-[rgba(var(--site-primary-rgb),0.12)] border border-[rgba(var(--site-primary-rgb),0.25)] flex items-center justify-center shadow-[0_0_30px_rgba(var(--site-primary-rgb),0.15)]">
          <CheckCircle size={36} className="text-[var(--site-primary)]" />
        </div>
      </div>

      {/* Main message */}
      <h3 className="text-xl text-white font-light text-center">
        {isCotizador
          ? tSite("cotizador.quoteSent")
          : tSite("cotizador.requestSent")}
      </h3>
      <p className="text-[var(--text-secondary)] text-sm text-center max-w-sm">
        {isCotizador
          ? tSite("cotizador.checkEmailPdf")
          : tSite("cotizador.checkEmailLead")}
      </p>

      {/* PDF download button (cotizador only) */}
      {isCotizador && pdfUrl && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-warm px-6 py-3 flex items-center gap-2.5 text-sm tracking-[0.15em] uppercase"
        >
          <FileDown size={16} />
          {tSite("cotizador.downloadPdf")}
        </a>
      )}

      {/* What happens next timeline */}
      <div className="w-full max-w-sm mt-2">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] font-ui font-bold mb-3">
          {tSite("cotizador.whatHappensNext")}
        </p>
        <div className="space-y-3">
          {[
            isCotizador
              ? tSite("cotizador.nextStep1Quote")
              : tSite("cotizador.nextStep1Lead"),
            tSite("cotizador.nextStep2"),
            tSite("cotizador.nextStep3"),
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[rgba(var(--site-primary-rgb),0.12)] border border-[rgba(var(--site-primary-rgb),0.2)] flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] text-[var(--site-primary)] font-bold font-mono">
                  {i + 1}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] pt-0.5">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm mt-2">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-warm w-full sm:flex-1 px-5 py-2.5 flex items-center justify-center gap-2 text-sm tracking-wider"
          >
            <MessageCircle size={16} />
            {tSite("cotizador.whatsappFollowUp")}
          </a>
        )}
        <button
          onClick={onClose}
          className="btn-ghost w-full sm:flex-1 px-5 py-2.5 text-sm tracking-wider cursor-pointer"
        >
          {tCommon("buttons.close")}
        </button>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <Mail size={14} className="text-[var(--text-muted)]" />
        <p className="text-[10px] text-[var(--text-muted)]">
          {tSite("contacto.successNext")}
        </p>
      </div>
    </motion.div>
  );
}

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
  const needsTipologiaSelection =
    !tipologia &&
    Array.isArray(availableTipologias) &&
    availableTipologias.length > 0;
  const [selectedTipo, setSelectedTipo] = useState<Tipologia | null>(null);
  const activeTipologia = tipologia ?? selectedTipo ?? undefined;

  const isHibrido = tipoProyecto === "hibrido";
  const unitTipoTipologia =
    activeTipologia?.tipo_tipologia ?? tipologia?.tipo_tipologia ?? null;
  const isLotes = isHibrido
    ? unitTipoTipologia === "lote"
    : tipoProyecto === "lotes";

  const columns = useMemo(() => {
    if (isHibrido && unitTipoTipologia) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return getHybridInventoryColumns(
        unitTipoTipologia,
        (proyecto as any).inventory_columns_microsite_by_type ??
          proyecto.inventory_columns_by_type
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getInventoryColumns(
      (proyecto.tipo_proyecto ?? "hibrido") as
        | "apartamentos"
        | "casas"
        | "lotes"
        | "hibrido",
      (proyecto as any).inventory_columns_microsite ??
        proyecto.inventory_columns
    );
  }, [
    isHibrido,
    unitTipoTipologia,
    proyecto.tipo_proyecto,
    proyecto.inventory_columns,
    proyecto.inventory_columns_by_type,
  ]);

  // Build a virtual unidad with tipología specs when one is selected
  const activeUnidad = useMemo(() => {
    if (!activeTipologia) return unidad;
    if (!tipologia && selectedTipo) {
      let precio: number | null;
      if (isLotes && unidad.precio && selectedTipo.precio_desde) {
        precio = unidad.precio + selectedTipo.precio_desde;
      } else {
        precio = selectedTipo.precio_desde ?? unidad.precio;
      }
      return {
        ...unidad,
        area_m2: selectedTipo.area_m2 ?? unidad.area_m2,
        area_construida:
          selectedTipo.area_construida ?? unidad.area_construida,
        area_privada: selectedTipo.area_privada ?? unidad.area_privada,
        area_lote: selectedTipo.area_lote ?? unidad.area_lote,
        precio,
        habitaciones: selectedTipo.habitaciones ?? unidad.habitaciones,
        banos: selectedTipo.banos ?? unidad.banos,
      };
    }
    return unidad;
  }, [unidad, tipologia, selectedTipo, activeTipologia, isLotes]);

  // For lotes: track breakdown prices
  const terrenoPrice =
    isLotes &&
    !tipologia &&
    selectedTipo &&
    unidad.precio &&
    selectedTipo.precio_desde
      ? unidad.precio
      : undefined;
  const construccionPrice =
    isLotes &&
    !tipologia &&
    selectedTipo &&
    unidad.precio &&
    selectedTipo.precio_desde
      ? selectedTipo.precio_desde
      : undefined;

  const isCotizador = !!(
    cotizadorEnabled &&
    cotizadorConfig &&
    activeUnidad.precio
  );

  const moneda = (cotizadorConfig?.moneda || proyecto.moneda_base || "COP") as Currency;
  const areaSymbol = UNIT_CONFIG[(proyecto.unidad_medida_base || "m2") as UnitOfMeasurement]?.symbol ?? "m²";

  // Get render image for the unit summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderUrl =
    activeTipologia?.renders?.[0] ??
    ((proyecto as any).render_principal_url as string | null) ??
    null;

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

          {/* Modal — widened to max-w-2xl */}
          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--surface-1)] rounded-3xl border border-[rgba(var(--site-primary-rgb),0.15)] shadow-[0_0_60px_rgba(var(--site-primary-rgb),0.1)]"
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
              <SuccessState
                isCotizador={isCotizador}
                pdfUrl={pdfUrl}
                unidad={unidad}
                unitPrefix={proyecto.unidad_display_prefix}
                whatsappNumero={proyecto.whatsapp_numero}
                tSite={tSite}
                tCommon={tCommon}
                onClose={handleClose}
              />
            ) : needsTipologiaSelection && !selectedTipo ? (
              /* ── Tipología Selection Step (multi-tipo lots) ── */
              <div className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-white mb-1">
                  {locale === "es"
                    ? "Seleccionar tipología"
                    : "Select typology"}
                </h2>
                <p className="text-xs text-[var(--text-tertiary)] mb-5">
                  {locale === "es"
                    ? `${getUnitDisplayName(unidad, proyecto.unidad_display_prefix)} tiene ${availableTipologias!.length} tipologías disponibles`
                    : `${getUnitDisplayName(unidad, proyecto.unidad_display_prefix)} has ${availableTipologias!.length} available typologies`}
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
                        <h3 className="text-sm font-semibold text-white">
                          {tipo.nombre}
                        </h3>
                        <ChevronRight
                          size={16}
                          className="text-[var(--text-muted)]"
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                        {columns.area_construida &&
                          tipo.area_construida != null && (
                            <span className="flex items-center gap-1">
                              <Maximize
                                size={11}
                                className="text-[var(--text-tertiary)]"
                              />
                              {tipo.area_construida} {areaSymbol}
                            </span>
                          )}
                        {columns.area_m2 &&
                          tipo.area_m2 != null &&
                          !columns.area_construida && (
                            <span className="flex items-center gap-1">
                              <Maximize
                                size={11}
                                className="text-[var(--text-tertiary)]"
                              />
                              {tipo.area_m2} {areaSymbol}
                            </span>
                          )}
                        {columns.area_privada && tipo.area_privada != null && (
                          <span className="flex items-center gap-1">
                            <Maximize
                              size={11}
                              className="text-[var(--text-tertiary)]"
                            />
                            {tipo.area_privada} {areaSymbol}
                          </span>
                        )}
                        {columns.area_lote && tipo.area_lote != null && (
                          <span className="flex items-center gap-1">
                            <Maximize
                              size={11}
                              className="text-[var(--text-tertiary)]"
                            />
                            {tipo.area_lote} {areaSymbol}
                          </span>
                        )}
                        {columns.habitaciones &&
                          tipo.habitaciones !== null &&
                          tipo.habitaciones !== undefined && (
                            <span className="flex items-center gap-1">
                              <BedDouble
                                size={11}
                                className="text-[var(--text-tertiary)]"
                              />
                              {tipo.habitaciones}{" "}
                              {locale === "es" ? "hab" : "beds"}
                            </span>
                          )}
                        {columns.banos &&
                          tipo.banos !== null &&
                          tipo.banos !== undefined && (
                            <span className="flex items-center gap-1">
                              <Bath
                                size={11}
                                className="text-[var(--text-tertiary)]"
                              />
                              {tipo.banos}{" "}
                              {locale === "es" ? "baños" : "baths"}
                            </span>
                          )}
                      </div>
                      {columns.precio && tipo.precio_desde && (
                        <p className="mt-2 text-sm font-semibold text-[var(--site-primary)]">
                          {formatCurrency(tipo.precio_desde, moneda)}
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
                  {isCotizador
                    ? tSite("cotizador.subtitleCotizador")
                    : tSite("cotizador.subtitleLead")}
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

                {/* Unit Summary with render image */}
                <UnitSummary
                  unidad={activeUnidad}
                  tipologia={activeTipologia}
                  tCommon={tCommon}
                  tSite={tSite}
                  columns={columns}
                  unitPrefix={proyecto.unidad_display_prefix}
                  renderUrl={renderUrl}
                  areaSymbol={areaSymbol}
                />

                {/* Unified multi-step flow (works for both cotizador and lead modes) */}
                <CotizadorFlowMultiStep
                  unidad={activeUnidad}
                  tipologia={activeTipologia}
                  proyectoId={proyectoId}
                  locale={locale}
                  tCommon={tCommon}
                  tSite={tSite}
                  columns={columns}
                  cotizadorEnabled={isCotizador}
                  config={cotizadorConfig}
                  selectedTipologiaId={selectedTipo?.id}
                  terrenoPrice={terrenoPrice}
                  construccionPrice={construccionPrice}
                  unitPrefix={proyecto.unidad_display_prefix}
                  areaSymbol={areaSymbol}
                  onSuccess={(url) => {
                    setPdfUrl(url);
                    setIsSubmitted(true);
                  }}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
