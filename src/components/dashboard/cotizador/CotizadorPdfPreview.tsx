"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Loader2, FileText, RefreshCw, X } from "lucide-react";
import type { Currency, DescuentoConfig, ComplementoSeleccion } from "@/types";
import type { PaymentRow } from "@/lib/cotizador/payment-rows";
import { paymentRowsToFases } from "@/lib/cotizador/payment-rows";
import { cn } from "@/lib/utils";

/* ── Props ── */

interface CotizadorPdfPreviewProps {
  projectId: string;
  unitId: string;
  tipologiaId?: string | null;
  paymentRows: PaymentRow[];
  effectiveTotal: number;
  adHocDiscounts: DescuentoConfig[];
  complementoSelections: ComplementoSeleccion[];
  precioBaseParqCount: number;
  precioBaseDepoCount: number;
  paymentPlanNombre: string;
  priceOverride: number | null;
  idioma: "es" | "en";
  monedaSecundaria: Currency | null;
  tipoCambio: number | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  amoblado: boolean;
  agenteId?: string;
  agenteNombre?: string;
  hasParqPrecioBase: boolean;
  hasDepoPrecioBase: boolean;
  onClose: () => void;
}

/* ── Component ── */

export function CotizadorPdfPreview({
  projectId,
  unitId,
  tipologiaId,
  paymentRows,
  effectiveTotal,
  adHocDiscounts,
  complementoSelections,
  precioBaseParqCount,
  precioBaseDepoCount,
  paymentPlanNombre,
  priceOverride,
  idioma,
  monedaSecundaria,
  tipoCambio,
  clientName,
  clientEmail,
  clientPhone,
  amoblado,
  agenteId,
  agenteNombre,
  hasParqPrecioBase,
  hasDepoPrecioBase,
  onClose,
}: CotizadorPdfPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialLoad = useRef(true);

  // Build a stable serialized key from all inputs that affect the PDF
  const previewPayload = useMemo(() => ({
    proyecto_id: projectId,
    unidad_id: unitId,
    tipologia_id: tipologiaId || undefined,
    nombre: clientName.trim() || undefined,
    email: clientEmail.trim() || undefined,
    telefono: clientPhone.trim() || undefined,
    agente_id: agenteId,
    agente_nombre: agenteNombre,
    custom_fases: paymentRowsToFases(paymentRows, effectiveTotal),
    custom_descuentos: adHocDiscounts,
    complemento_selections: complementoSelections.filter((c) => !c.es_precio_base).map((c) => ({
      complemento_id: c.complemento_id,
      es_extra: c.es_extra ?? false,
      precio_negociado: c.precio_negociado,
    })),
    precio_base_parqueaderos: hasParqPrecioBase ? precioBaseParqCount : undefined,
    precio_base_depositos: hasDepoPrecioBase ? precioBaseDepoCount : undefined,
    separacion_incluida: false,
    payment_plan_nombre: paymentPlanNombre || undefined,
    precio_negociado: priceOverride ?? undefined,
    amoblado: amoblado || undefined,
    idioma,
    moneda_secundaria: monedaSecundaria ?? undefined,
    tipo_cambio: tipoCambio ?? undefined,
  }), [
    projectId, unitId, tipologiaId, clientName, clientEmail, clientPhone,
    agenteId, agenteNombre, paymentRows, effectiveTotal, adHocDiscounts,
    complementoSelections, precioBaseParqCount, precioBaseDepoCount,
    hasParqPrecioBase, hasDepoPrecioBase, paymentPlanNombre,
    priceOverride, amoblado, idioma, monedaSecundaria, tipoCambio,
  ]);

  const previewKey = useMemo(() => JSON.stringify(previewPayload), [previewPayload]);

  const fetchPreview = useCallback(async () => {
    // Abort previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cotizaciones/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: previewKey,
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error" }));
        setError(err.error || "Error al generar preview");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [previewKey]);

  // Auto-refresh: debounce changes
  useEffect(() => {
    // Load immediately on first render, then debounce subsequent changes
    const delay = initialLoad.current ? 100 : 1500;
    initialLoad.current = false;

    const timer = setTimeout(() => {
      fetchPreview();
    }, delay);

    return () => clearTimeout(timer);
  }, [fetchPreview]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] shrink-0">
        <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] flex items-center gap-2">
          <FileText size={12} className="text-[var(--site-primary)]" />
          Vista previa PDF
        </span>
        <div className="flex items-center gap-2">
          {loading && (
            <Loader2 size={12} className="animate-spin text-[var(--site-primary)]" />
          )}
          <button
            type="button"
            onClick={fetchPreview}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-white transition-all disabled:opacity-50"
            title="Actualizar preview"
          >
            <RefreshCw size={12} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-white transition-all"
            title="Cerrar preview"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* PDF viewer */}
      <div className="flex-1 relative bg-[#525659]">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            {loading ? (
              <>
                <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
                <span className="text-[10px] text-[var(--text-muted)]">Generando preview...</span>
              </>
            ) : error ? (
              <>
                <FileText size={24} className="text-red-400/50" />
                <span className="text-[10px] text-red-400">{error}</span>
                <button
                  onClick={fetchPreview}
                  className="text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--site-primary)] hover:text-white transition-colors"
                >
                  Reintentar
                </button>
              </>
            ) : (
              <>
                <FileText size={24} className="text-[var(--text-muted)]/30" />
                <span className="text-[10px] text-[var(--text-muted)]">Preview no disponible</span>
              </>
            )}
          </div>
        )}

        {/* Loading overlay when refreshing existing preview */}
        {loading && pdfUrl && (
          <div className={cn(
            "absolute top-0 right-0 m-3 px-2.5 py-1.5 rounded-lg",
            "bg-[var(--surface-0)]/80 backdrop-blur-sm border border-[var(--border-subtle)]",
            "flex items-center gap-2"
          )}>
            <Loader2 size={10} className="animate-spin text-[var(--site-primary)]" />
            <span className="text-[9px] text-[var(--text-muted)]">Actualizando...</span>
          </div>
        )}
      </div>
    </div>
  );
}
