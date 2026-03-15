"use client";

import { motion } from "framer-motion";
import { ArrowUpDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeadStatusBadge } from "./LeadStatusBadge";
import type { LeadWithMeta } from "@/types";

interface Props {
  leads: LeadWithMeta[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  sortDir: "newest" | "oldest";
  onSortChange: (dir: "newest" | "oldest") => void;
  locale: string;
  multiProject: boolean;
}

export function LeadsCRMTable({
  leads,
  loading,
  selectedId,
  onSelect,
  sortDir,
  onSortChange,
  locale,
  multiProject,
}: Props) {
  const formatShortDate = (d: string) =>
    new Date(d).toLocaleDateString(locale === "es" ? "es-CO" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 px-5 py-4 border-b border-[var(--border-subtle)] last:border-0"
          >
            <div className="h-4 w-32 bg-[var(--surface-2)] rounded animate-pulse" />
            <div className="h-4 w-40 bg-[var(--surface-2)] rounded animate-pulse" />
            <div className="h-4 w-20 bg-[var(--surface-2)] rounded animate-pulse" />
            <div className="h-4 w-16 bg-[var(--surface-2)] rounded animate-pulse" />
            <div className="h-4 w-12 bg-[var(--surface-2)] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-heading text-xl font-light text-[var(--text-secondary)]">
          {locale === "es" ? "No hay registros" : "No leads found"}
        </p>
        <p className="text-[var(--text-muted)] text-[12px] leading-[1.7] mt-2">
          {locale === "es"
            ? "Intenta ajustar los filtros o espera nuevos registros"
            : "Try adjusting filters or wait for new leads"}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl overflow-hidden"
    >
      <table className="w-full" role="table" aria-label={locale === "es" ? "Tabla de leads" : "Leads table"}>
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th scope="col" className="text-left px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold">
              {locale === "es" ? "Nombre" : "Name"}
            </th>
            <th scope="col" className="text-left px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold hidden md:table-cell">
              {locale === "es" ? "Email" : "Email"}
            </th>
            <th scope="col" className="text-left px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold hidden lg:table-cell">
              {locale === "es" ? "Teléfono" : "Phone"}
            </th>
            {multiProject && (
              <th scope="col" className="text-left px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold hidden xl:table-cell">
                {locale === "es" ? "Proyecto" : "Project"}
              </th>
            )}
            <th scope="col" className="text-left px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold">
              Status
            </th>
            <th scope="col" className="text-center px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold">
              <span className="hidden sm:inline">{locale === "es" ? "Cotiz." : "Quotes"}</span>
              <FileText size={12} className="sm:hidden inline" aria-label={locale === "es" ? "Cotizaciones" : "Quotes"} />
            </th>
            <th scope="col" className="text-left px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold">
              <button
                onClick={() => onSortChange(sortDir === "newest" ? "oldest" : "newest")}
                className="inline-flex items-center gap-1 hover:text-[var(--text-secondary)] transition-colors"
                aria-label={locale === "es" ? `Ordenar por fecha: ${sortDir === "newest" ? "más reciente primero" : "más antiguo primero"}` : `Sort by date: ${sortDir === "newest" ? "newest first" : "oldest first"}`}
              >
                {locale === "es" ? "Fecha" : "Date"}
                <ArrowUpDown size={10} aria-hidden="true" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, idx) => {
            const isSelected = selectedId === lead.id;
            return (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => onSelect(lead.id)}
                className={cn(
                  "border-b border-[var(--border-subtle)] last:border-0 transition-colors cursor-pointer",
                  isSelected
                    ? "bg-[var(--surface-2)] border-l-2 border-l-[var(--site-primary)]"
                    : "hover:bg-[var(--surface-2)]"
                )}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(lead.id);
                  }
                }}
                aria-label={locale === "es" ? `Seleccionar lead: ${lead.nombre}` : `Select lead: ${lead.nombre}`}
                aria-selected={isSelected}
              >
                {/* Name + email on mobile */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{
                        background: `linear-gradient(135deg, rgba(var(--site-primary-rgb), 0.25), rgba(var(--site-primary-rgb), 0.08))`,
                        boxShadow: `0 0 0 1px rgba(var(--site-primary-rgb), 0.2)`,
                        color: "var(--site-primary)",
                      }}
                    >
                      {lead.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{lead.nombre}</p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate md:hidden">
                        {lead.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)] truncate max-w-[200px] hidden md:table-cell">
                  {lead.email}
                </td>
                <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)] hidden lg:table-cell">
                  {lead.telefono || "—"}
                </td>
                {multiProject && (
                  <td className="px-5 py-3.5 hidden xl:table-cell">
                    {lead.proyecto_nombre ? (
                      <span className="px-2 py-0.5 bg-[rgba(var(--site-primary-rgb),0.08)] text-[var(--site-primary)] rounded text-[10px] font-bold uppercase tracking-wider truncate max-w-[120px] inline-block">
                        {lead.proyecto_nombre}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                <td className="px-5 py-3.5">
                  <LeadStatusBadge status={lead.status} locale={locale} size="sm" />
                </td>
                <td className="px-5 py-3.5 text-center">
                  {lead.cotizaciones_count > 0 ? (
                    <span
                      className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[10px] font-bold"
                      style={{
                        background: "rgba(var(--site-primary-rgb), 0.15)",
                        color: "var(--site-primary)",
                      }}
                    >
                      {lead.cotizaciones_count}
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)] text-xs">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-[12px] text-[var(--text-tertiary)] tabular-nums whitespace-nowrap">
                  {formatShortDate(lead.created_at)}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
}
