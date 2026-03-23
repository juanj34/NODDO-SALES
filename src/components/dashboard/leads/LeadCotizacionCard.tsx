"use client";

import { useState } from "react";
import { ExternalLink, Download, Send, Loader2, User } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { LeadCotizacionSummary, ResultadoCotizacion } from "@/types";

interface Props {
  cotizacion: LeadCotizacionSummary;
  locale: string;
  onResendSuccess?: () => void;
}

export function LeadCotizacionCard({ cotizacion, locale, onResendSuccess }: Props) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const snapshot = cotizacion.unidad_snapshot || {};
  const identificador = (snapshot.identificador as string) || "—";
  const tipologia = (snapshot.tipologia_nombre as string) || "";
  const resultado = cotizacion.resultado as ResultadoCotizacion | null;
  const precioNeto = resultado?.precio_neto ?? 0;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale === "es" ? "es-CO" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    try {
      const res = await fetch(`/api/cotizaciones/${cotizacion.id}/resend`, {
        method: "POST",
      });
      if (res.ok) {
        setResent(true);
        onResendSuccess?.();
        setTimeout(() => setResent(false), 3000);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="p-3 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">
            {identificador}
          </p>
          {tipologia && (
            <p className="text-[11px] text-[var(--text-muted)]">{tipologia}</p>
          )}
        </div>
        <span className="text-sm font-medium text-[var(--site-primary)] whitespace-nowrap">
          {precioNeto > 0 ? formatCurrency(precioNeto, "COP") : "—"}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
          <span>{formatDate(cotizacion.created_at)}</span>
          {cotizacion.agente_nombre && (
            <span className="flex items-center gap-1">
              <User size={10} />
              {cotizacion.agente_nombre}
            </span>
          )}
        </div>

        {cotizacion.pdf_url && (
          <div className="flex items-center gap-1">
            <a
              href={cotizacion.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.1)] transition-colors"
              title="Ver PDF"
            >
              <ExternalLink size={10} />
            </a>
            <a
              href={cotizacion.pdf_url}
              download
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
              title="Descargar"
            >
              <Download size={10} />
            </a>
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors disabled:opacity-50"
              title="Reenviar al cliente"
            >
              {resending ? (
                <Loader2 size={10} className="animate-spin" />
              ) : resent ? (
                <span className="text-green-400 text-[9px] font-ui uppercase">Enviado</span>
              ) : (
                <Send size={10} />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
