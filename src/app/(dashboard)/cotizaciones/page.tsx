"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, FileDown, Mail, RefreshCw, Download, Search,
  User, Home, Calendar, X, Filter, FileText, Building2,
  Phone, MailIcon, Clock, ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { useToast } from "@/hooks/useToast";
import { useProjects } from "@/hooks/useProjectsQuery";
import { formatCurrency } from "@/lib/currency";
import type { Currency } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
    precio_total?: number;
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
  params.set("limit", "200");
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch projects for filter dropdown
  const { data: projects } = useProjects();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["cotizaciones", search, proyectoFilter, dateFrom, dateTo],
    queryFn: () => fetchCotizaciones(search, proyectoFilter, dateFrom, dateTo),
  });

  const selectedCotizacion = useMemo(
    () => data?.cotizaciones.find((c) => c.id === selectedId) || null,
    [data, selectedId]
  );

  // Get project name by id
  const getProjectName = (proyectoId: string) =>
    projects?.find((p) => p.id === proyectoId)?.nombre || "—";

  const handleDownloadPdf = async (cot: Cotizacion) => {
    setActionLoading(`download-${cot.id}`);
    try {
      if (cot.pdf_url) {
        window.open(cot.pdf_url, "_blank");
      } else {
        // Regenerate and download
        const res = await fetch(`/api/cotizaciones/${cot.id}/regenerate`, { method: "POST" });
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (json.pdf_url) {
          window.open(json.pdf_url, "_blank");
          refetch();
        } else {
          toast.error("No se pudo generar el PDF");
        }
      }
    } catch {
      toast.error("Error al descargar PDF");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResend = async (id: string) => {
    setActionLoading(`resend-${id}`);
    try {
      const res = await fetch(`/api/cotizaciones/${id}/resend`, { method: "POST" });
      if (res.ok) {
        toast.success("Email reenviado exitosamente");
      } else {
        toast.error("Error al reenviar email");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerate = async (id: string) => {
    setActionLoading(`regen-${id}`);
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
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = () => {
    if (!data?.cotizaciones.length) return;
    const headers = ["Fecha", "Nombre", "Email", "Teléfono", "Proyecto", "Unidad", "Tipología", "Precio", "Moneda", "Agente"];
    const rows = data.cotizaciones.map((c) => [
      format(new Date(c.created_at), "yyyy-MM-dd HH:mm", { locale: es }),
      c.nombre,
      c.email,
      c.telefono || "",
      getProjectName(c.proyecto_id),
      c.unidad_snapshot.identificador,
      c.unidad_snapshot.tipologia || "",
      (c.resultado.precio_total ?? c.resultado.precio_neto).toString(),
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

  const hasFilters = search || proyectoFilter || dateFrom || dateTo;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">Cotizaciones</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Historial de cotizaciones generadas
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!data?.cotizaciones.length}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-ui text-[10px] font-bold uppercase tracking-[0.1em] hover:text-white hover:border-[var(--border-default)] transition-all disabled:opacity-40"
        >
          <Download size={13} />
          Exportar CSV
        </button>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={13} className="text-[var(--text-muted)]" />
              <span className="text-[9px] font-ui font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Total
              </span>
            </div>
            <span className="text-2xl font-mono font-medium text-[var(--text-primary)]">{data.stats.total}</span>
          </div>
          <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={13} className="text-[var(--text-muted)]" />
              <span className="text-[9px] font-ui font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Últimos 30 días
              </span>
            </div>
            <span className="text-2xl font-mono font-medium text-[var(--text-primary)]">{data.stats.thisMonth}</span>
          </div>
          <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={13} className="text-[var(--text-muted)]" />
              <span className="text-[9px] font-ui font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Valor total
              </span>
            </div>
            <span className="text-xl font-mono font-medium text-[var(--site-primary)]">
              {formatCurrency(data.stats.totalValue, "COP")}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar nombre, email, unidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass w-full pl-10 text-xs"
          />
        </div>

        {/* Project filter */}
        {projects && projects.length > 1 && (
          <select
            value={proyectoFilter || ""}
            onChange={(e) => setProyectoFilter(e.target.value || null)}
            className="input-glass text-xs min-w-[160px]"
          >
            <option value="">Todos los proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        )}

        <input
          type="date"
          value={dateFrom || ""}
          onChange={(e) => setDateFrom(e.target.value || null)}
          className="input-glass text-xs w-[140px]"
        />
        <input
          type="date"
          value={dateTo || ""}
          onChange={(e) => setDateTo(e.target.value || null)}
          className="input-glass text-xs w-[140px]"
        />

        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setDateFrom(null); setDateTo(null); setProyectoFilter(null); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <X size={12} />
            Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="px-4 py-3 text-left text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Cliente
                </th>
                {projects && projects.length > 1 && (
                  <th className="px-4 py-3 text-left text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Proyecto
                  </th>
                )}
                <th className="px-4 py-3 text-left text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Unidad
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Precio
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Fecha
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  PDF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {data?.cotizaciones.map((cot) => {
                const moneda = (cot.config_snapshot?.moneda || "COP") as Currency;
                const precio = cot.resultado?.precio_total ?? cot.resultado?.precio_neto ?? 0;
                return (
                  <tr
                    key={cot.id}
                    onClick={() => setSelectedId(cot.id)}
                    className={cn(
                      "hover:bg-[var(--surface-2)] cursor-pointer transition-colors group",
                      selectedId === cot.id && "bg-[rgba(var(--site-primary-rgb),0.04)]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--surface-3)] flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-ui font-bold text-[var(--text-secondary)] uppercase">
                            {cot.nombre.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-[var(--text-primary)] font-medium block truncate">{cot.nombre}</span>
                          <span className="text-[10px] text-[var(--text-muted)] block truncate">{cot.email}</span>
                        </div>
                      </div>
                    </td>
                    {projects && projects.length > 1 && (
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-[var(--text-tertiary)] font-ui uppercase tracking-wide">
                          {getProjectName(cot.proyecto_id)}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--text-primary)]">{cot.unidad_snapshot?.identificador || "—"}</span>
                      {cot.unidad_snapshot?.tipologia && (
                        <span className="text-[10px] text-[var(--text-muted)] block">{cot.unidad_snapshot.tipologia}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-[var(--site-primary)] font-mono font-medium">
                        {formatCurrency(precio, moneda)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        {format(new Date(cot.created_at), "dd MMM yyyy", { locale: es })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadPdf(cot); }}
                        disabled={actionLoading === `download-${cot.id}`}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] transition-colors text-[var(--text-muted)] hover:text-[var(--site-primary)]"
                        title="Descargar PDF"
                      >
                        {actionLoading === `download-${cot.id}` ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <FileDown size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!data?.cotizaciones.length && (
          <div className="py-16 text-center">
            <FileText size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm text-[var(--text-muted)]">No se encontraron cotizaciones</p>
            {hasFilters && (
              <button
                onClick={() => { setSearch(""); setDateFrom(null); setDateTo(null); setProyectoFilter(null); }}
                className="mt-2 text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--site-primary)] hover:text-white transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedCotizacion && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[var(--surface-1)] border-l border-[var(--border-subtle)] shadow-2xl z-50 flex flex-col"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
                <h3 className="font-heading text-lg font-light text-[var(--text-primary)]">Detalle</h3>
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Price hero */}
                <div className="text-center py-4">
                  <span className="font-heading text-3xl text-[var(--site-primary)]">
                    {formatCurrency(
                      selectedCotizacion.resultado?.precio_total ?? selectedCotizacion.resultado?.precio_neto ?? 0,
                      (selectedCotizacion.config_snapshot?.moneda || "COP") as Currency
                    )}
                  </span>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Clock size={11} className="text-[var(--text-muted)]" />
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {formatDistanceToNow(new Date(selectedCotizacion.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>

                {/* Client card */}
                <div className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border-subtle)]">
                  <span className="text-[9px] font-ui font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] block mb-3">
                    Cliente
                  </span>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-3)] flex items-center justify-center">
                      <span className="text-sm font-ui font-bold text-[var(--text-secondary)] uppercase">
                        {selectedCotizacion.nombre.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-[var(--text-primary)] font-medium block">{selectedCotizacion.nombre}</span>
                      {selectedCotizacion.agente_nombre && (
                        <span className="text-[10px] text-[var(--text-muted)] block">Agente: {selectedCotizacion.agente_nombre}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <MailIcon size={12} className="text-[var(--text-muted)]" />
                      {selectedCotizacion.email}
                    </div>
                    {selectedCotizacion.telefono && (
                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <Phone size={12} className="text-[var(--text-muted)]" />
                        {selectedCotizacion.telefono}
                      </div>
                    )}
                  </div>
                </div>

                {/* Unit card */}
                <div className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border-subtle)]">
                  <span className="text-[9px] font-ui font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] block mb-3">
                    Unidad
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg text-[var(--text-primary)] font-medium block">
                        {selectedCotizacion.unidad_snapshot?.identificador || "—"}
                      </span>
                      {selectedCotizacion.unidad_snapshot?.tipologia && (
                        <span className="text-xs text-[var(--text-tertiary)]">{selectedCotizacion.unidad_snapshot.tipologia}</span>
                      )}
                    </div>
                    {selectedCotizacion.unidad_snapshot?.area_m2 && (
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {selectedCotizacion.unidad_snapshot.area_m2} m²
                      </span>
                    )}
                  </div>
                  {projects && projects.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {getProjectName(selectedCotizacion.proyecto_id)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="text-center">
                  <span className="text-xs text-[var(--text-tertiary)] font-mono">
                    {format(new Date(selectedCotizacion.created_at), "dd MMMM yyyy · HH:mm", { locale: es })}
                  </span>
                </div>
              </div>

              {/* Panel actions */}
              <div className="px-6 py-4 border-t border-[var(--border-subtle)] space-y-2">
                <button
                  onClick={() => handleDownloadPdf(selectedCotizacion)}
                  disabled={actionLoading === `download-${selectedCotizacion.id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--site-primary)] text-[var(--surface-0)] font-ui text-[10px] font-bold uppercase tracking-[0.1em] hover:brightness-110 transition-all disabled:opacity-70"
                >
                  {actionLoading === `download-${selectedCotizacion.id}` ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <FileDown size={13} />
                  )}
                  Descargar PDF
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleResend(selectedCotizacion.id)}
                    disabled={!!actionLoading}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-ui text-[10px] font-bold uppercase tracking-[0.08em] hover:text-white hover:border-[var(--border-default)] transition-all disabled:opacity-50"
                  >
                    {actionLoading === `resend-${selectedCotizacion.id}` ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Mail size={12} />
                    )}
                    Reenviar
                  </button>
                  <button
                    onClick={() => handleRegenerate(selectedCotizacion.id)}
                    disabled={!!actionLoading}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-ui text-[10px] font-bold uppercase tracking-[0.08em] hover:text-white hover:border-[var(--border-default)] transition-all disabled:opacity-50"
                  >
                    {actionLoading === `regen-${selectedCotizacion.id}` ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    Regenerar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
