"use client";

import { ExternalLink, User } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { LeadCotizacionSummary, ResultadoCotizacion } from "@/types";

interface Props {
  cotizacion: LeadCotizacionSummary;
  locale: string;
}

export function LeadCotizacionCard({ cotizacion, locale }: Props) {
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
          <a
            href={cotizacion.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.1)] transition-colors"
          >
            PDF
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
}
