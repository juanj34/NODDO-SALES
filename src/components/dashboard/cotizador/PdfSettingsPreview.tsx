"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { Loader2, FileText, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CotizadorConfig } from "@/types";

/* ── Component ── */

export function PdfSettingsPreview() {
  const { project } = useEditorProject();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialLoad = useRef(true);

  // Find a demo unit with a price
  const demoUnit = useMemo(() => {
    return project.unidades?.find((u) => u.precio && u.precio > 0) ?? null;
  }, [project.unidades]);

  // Build a stable key from PDF-relevant config fields
  const configKey = useMemo(() => {
    const config = (project.cotizador_config ?? {}) as CotizadorConfig;
    return JSON.stringify({
      pdf_cover_style: config.pdf_cover_style,
      pdf_theme: config.pdf_theme,
      pdf_saludo: config.pdf_saludo,
      pdf_despedida: config.pdf_despedida,
      pdf_logo_constructora_url: config.pdf_logo_constructora_url,
      pdf_logo_proyecto_url: config.pdf_logo_proyecto_url,
      plan_pago_bg_url: config.plan_pago_bg_url,
      payment_plan_nombre: config.payment_plan_nombre,
      portada_url: config.portada_url,
    });
  }, [project.cotizador_config]);

  const fetchPreview = useCallback(async () => {
    if (!demoUnit) return;

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
        body: JSON.stringify({
          proyecto_id: project.id,
          unidad_id: demoUnit.id,
          tipologia_id: demoUnit.tipologia_id || undefined,
          nombre: "Vista previa",
          email: "preview@noddo.io",
        }),
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
  }, [project.id, demoUnit, configKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh when config changes
  useEffect(() => {
    if (!demoUnit) return;

    const delay = initialLoad.current ? 300 : 800;
    initialLoad.current = false;

    const timer = setTimeout(() => {
      fetchPreview();
    }, delay);

    return () => clearTimeout(timer);
  }, [fetchPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // No units available
  if (!demoUnit) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <AlertCircle size={24} className="text-[var(--text-muted)]" />
        <p className="text-xs text-[var(--text-tertiary)]">
          Agrega una unidad con precio para ver la vista previa del PDF.
        </p>
      </div>
    );
  }

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
