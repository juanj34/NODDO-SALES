"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileDown, Mail, RefreshCw, Download } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/currency";
import type { Currency } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Cotizacion {
  id: string;
  created_at: string;
  nombre: string;
  email: string;
  telefono: string | null;
  proyecto_id: string;
  unidad_id: string;
  unidad_snapshot: {
    identificador: string;
    tipologia: string | null;
    precio: number;
    area_m2: number | null;
  };
  resultado: {
    precio_neto: number;
  };
  config_snapshot: {
    moneda: string;
  };
  pdf_url: string | null;
  agente_nombre: string | null;
}

interface CotizacionesResponse {
  cotizaciones: Cotizacion[];
  total: number;
  stats: {
    total: number;
    thisMonth: number;
    totalValue: number;
  };
}

async function fetchCotizaciones(
  search: string,
  proyectoId: string | null,
  dateFrom: string | null,
  dateTo: string | null
): Promise<CotizacionesResponse> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (proyectoId) params.set("proyecto_id", proyectoId);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  params.set("limit", "100");

  const res = await fetch(`/api/cotizaciones?${params}`);
  if (!res.ok) throw new Error("Error al cargar cotizaciones");
  return res.json();
}

export default function CotizacionesPage() {
  const { t } = useTranslation("dashboard");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [proyectoFilter, setProyectoFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["cotizaciones", search, proyectoFilter, dateFrom, dateTo],
    queryFn: () => fetchCotizaciones(search, proyectoFilter, dateFrom, dateTo),
  });

  const selectedCotizacion = useMemo(
    () => data?.cotizaciones.find((c) => c.id === selectedId) || null,
    [data, selectedId]
  );

  const handleResend = async (id: string) => {
    try {
      const res = await fetch(`/api/cotizaciones/${id}/resend`, { method: "POST" });
      if (res.ok) {
        toast.success("Email reenviado exitosamente");
      } else {
        toast.error("Error al reenviar email");
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  const handleRegenerate = async (id: string) => {
    try {
      const res = await fetch(`/api/cotizaciones/${id}/regenerate`, { method: "POST" });
      if (res.ok) {
        toast.success("PDF regenerado exitosamente");
        refetch();
      } else {
        toast.error("Error al regenerar PDF");
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  const exportCSV = () => {
    if (!data?.cotizaciones.length) return;

    const headers = ["Fecha", "Nombre", "Email", "Teléfono", "Unidad", "Tipología", "Precio", "Moneda", "Agente"];
    const rows = data.cotizaciones.map((c) => [
      format(new Date(c.created_at), "yyyy-MM-dd HH:mm", { locale: es }),
      c.nombre,
      c.email,
      c.telefono || "",
      c.unidad_snapshot.identificador,
      c.unidad_snapshot.tipologia || "",
      c.resultado.precio_neto.toString(),
      c.config_snapshot.moneda || "COP",
      c.agente_nombre || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cotizaciones-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("cotizaciones.title")}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {t("cotizaciones.description")}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!data?.cotizaciones.length}
          className="btn-outline-warm px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      {/* Stats Panel */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--surface-1)] rounded-xl p-5 border border-[var(--border-subtle)]">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-ui font-bold mb-2">
              Total Cotizaciones
            </p>
            <p className="text-3xl font-semibold text-white">{data.stats.total}</p>
          </div>
          <div className="bg-[var(--surface-1)] rounded-xl p-5 border border-[var(--border-subtle)]">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-ui font-bold mb-2">
              Últimos 30 días
            </p>
            <p className="text-3xl font-semibold text-white">{data.stats.thisMonth}</p>
          </div>
          <div className="bg-[var(--surface-1)] rounded-xl p-5 border border-[var(--border-subtle)]">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-ui font-bold mb-2">
              Valor Total
            </p>
            <p className="text-3xl font-semibold text-[var(--site-primary)]">
              {formatCurrency(data.stats.totalValue, "COP")}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--border-subtle)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre, email o unidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass"
          />
          <input
            type="date"
            value={dateFrom || ""}
            onChange={(e) => setDateFrom(e.target.value || null)}
            className="input-glass"
            placeholder="Desde"
          />
          <input
            type="date"
            value={dateTo || ""}
            onChange={(e) => setDateTo(e.target.value || null)}
            className="input-glass"
            placeholder="Hasta"
          />
          <button
            onClick={() => {
              setSearch("");
              setDateFrom(null);
              setDateTo(null);
              setProyectoFilter(null);
            }}
            className="btn-ghost text-sm"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Unidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Precio
                </th>
                <th className="px-4 py-3 text-left text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  PDF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {data?.cotizaciones.map((cot) => (
                <tr
                  key={cot.id}
                  onClick={() => setSelectedId(cot.id)}
                  className="hover:bg-[var(--surface-2)] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {format(new Date(cot.created_at), "dd MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{cot.nombre}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{cot.email}</td>
                  <td className="px-4 py-3 text-sm text-white">
                    {cot.unidad_snapshot.identificador}
                    {cot.unidad_snapshot.tipologia && (
                      <span className="text-xs text-[var(--text-muted)] ml-1">
                        ({cot.unidad_snapshot.tipologia})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--site-primary)] font-medium">
                    {formatCurrency(
                      cot.resultado.precio_neto,
                      (cot.config_snapshot.moneda || "COP") as Currency
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {cot.pdf_url ? (
                      <a
                        href={cot.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[var(--site-primary)] hover:text-[var(--site-primary-light)] transition-colors"
                      >
                        <FileDown size={16} />
                      </a>
                    ) : (
                      <span className="text-[var(--text-muted)] text-xs">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!data?.cotizaciones.length && (
          <div className="py-12 text-center text-[var(--text-muted)]">
            No se encontraron cotizaciones
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedCotizacion && (
        <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-[var(--surface-1)] border-l border-[var(--border-subtle)] shadow-2xl p-6 overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Detalle de Cotización</h3>
            <button
              onClick={() => setSelectedId(null)}
              className="text-[var(--text-muted)] hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-ui font-bold mb-1">
                Cliente
              </p>
              <p className="text-sm text-white">{selectedCotizacion.nombre}</p>
              <p className="text-sm text-[var(--text-secondary)]">{selectedCotizacion.email}</p>
              {selectedCotizacion.telefono && (
                <p className="text-sm text-[var(--text-secondary)]">{selectedCotizacion.telefono}</p>
              )}
            </div>

            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-ui font-bold mb-1">
                Unidad
              </p>
              <p className="text-sm text-white">{selectedCotizacion.unidad_snapshot.identificador}</p>
              {selectedCotizacion.unidad_snapshot.tipologia && (
                <p className="text-sm text-[var(--text-secondary)]">
                  {selectedCotizacion.unidad_snapshot.tipologia}
                </p>
              )}
              {selectedCotizacion.unidad_snapshot.area_m2 && (
                <p className="text-sm text-[var(--text-secondary)]">
                  {selectedCotizacion.unidad_snapshot.area_m2} m²
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-ui font-bold mb-1">
                Precio
              </p>
              <p className="text-lg text-[var(--site-primary)] font-semibold">
                {formatCurrency(
                  selectedCotizacion.resultado.precio_neto,
                  (selectedCotizacion.config_snapshot.moneda || "COP") as Currency
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-ui font-bold mb-1">
                Fecha
              </p>
              <p className="text-sm text-white">
                {format(new Date(selectedCotizacion.created_at), "dd MMMM yyyy - HH:mm", {
                  locale: es,
                })}
              </p>
            </div>

            {selectedCotizacion.agente_nombre && (
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-ui font-bold mb-1">
                  Agente
                </p>
                <p className="text-sm text-white">{selectedCotizacion.agente_nombre}</p>
              </div>
            )}

            <div className="pt-4 space-y-2">
              {selectedCotizacion.pdf_url && (
                <a
                  href={selectedCotizacion.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-warm w-full py-2 flex items-center justify-center gap-2 text-sm"
                >
                  <FileDown size={16} />
                  Descargar PDF
                </a>
              )}
              <button
                onClick={() => handleResend(selectedCotizacion.id)}
                className="btn-outline-warm w-full py-2 flex items-center justify-center gap-2 text-sm"
              >
                <Mail size={16} />
                Reenviar Email
              </button>
              <button
                onClick={() => handleRegenerate(selectedCotizacion.id)}
                className="btn-ghost w-full py-2 flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw size={16} />
                Regenerar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for detail panel on mobile */}
      {selectedCotizacion && (
        <div
          onClick={() => setSelectedId(null)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
        />
      )}
    </div>
  );
}
