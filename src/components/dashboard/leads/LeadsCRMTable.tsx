"use client";

import { motion } from "framer-motion";
import { ArrowUpDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label, Badge } from "@/components/ui";
import { fontSize } from "@/lib/design-tokens";
import { LeadStatusBadge } from "./LeadStatusBadge";
import type { LeadWithMeta } from "@/types";

export interface TeamMember {
  id: string;
  nombre: string;
  email: string;
  rol: "director" | "asesor";
}

interface Props {
  leads: LeadWithMeta[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  sortDir: "newest" | "oldest";
  onSortChange: (dir: "newest" | "oldest") => void;
  locale: string;
  multiProject: boolean;
  canAssign?: boolean;
  team?: TeamMember[];
  onAssign?: (leadId: string, userId: string | null) => void;
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
  canAssign,
  team,
  onAssign,
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
        <p className={cn("text-[var(--text-muted)] leading-[1.7] mt-2", fontSize.subtitle)}>
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
            <th scope="col" className="text-left px-5 py-3">
              <Label variant="section" className="mb-0">{locale === "es" ? "Nombre" : "Name"}</Label>
            </th>
            <th scope="col" className="text-left px-5 py-3 hidden md:table-cell">
              <Label variant="section" className="mb-0">{locale === "es" ? "Email" : "Email"}</Label>
            </th>
            <th scope="col" className="text-left px-5 py-3 hidden lg:table-cell">
              <Label variant="section" className="mb-0">{locale === "es" ? "Teléfono" : "Phone"}</Label>
            </th>
            {multiProject && (
              <th scope="col" className="text-left px-5 py-3 hidden xl:table-cell">
                <Label variant="section" className="mb-0">{locale === "es" ? "Proyecto" : "Project"}</Label>
              </th>
            )}
            <th scope="col" className="text-left px-5 py-3">
              <Label variant="section" className="mb-0">Status</Label>
            </th>
            {canAssign && (
              <th scope="col" className="text-left px-5 py-3 hidden lg:table-cell">
                <Label variant="section" className="mb-0">{locale === "es" ? "Asignado" : "Assigned"}</Label>
              </th>
            )}
            <th scope="col" className="text-center px-5 py-3">
              <Label variant="section" className="mb-0">
                <span className="hidden sm:inline">{locale === "es" ? "Cotiz." : "Quotes"}</span>
                <FileText size={12} className="sm:hidden inline" aria-label="NodDo Quote" />
              </Label>
            </th>
            <th scope="col" className="text-left px-5 py-3">
              <button
                onClick={() => onSortChange(sortDir === "newest" ? "oldest" : "newest")}
                className="inline-flex items-center gap-1 hover:text-[var(--text-secondary)] transition-colors"
                aria-label={locale === "es" ? `Ordenar por fecha: ${sortDir === "newest" ? "más reciente primero" : "más antiguo primero"}` : `Sort by date: ${sortDir === "newest" ? "newest first" : "oldest first"}`}
              >
                <Label variant="section" className="mb-0">
                  {locale === "es" ? "Fecha" : "Date"}
                  <ArrowUpDown size={10} aria-hidden="true" className="inline ml-1" />
                </Label>
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
                      className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0", fontSize.body)}
                      style={{
                        background: `linear-gradient(135deg, rgba(var(--site-primary-rgb), 0.25), rgba(var(--site-primary-rgb), 0.08))`,
                        boxShadow: `0 0 0 1px rgba(var(--site-primary-rgb), 0.2)`,
                        color: "var(--site-primary)",
                      }}
                    >
                      {lead.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-white truncate", fontSize.md)}>{lead.nombre}</p>
                      <p className={cn("text-[var(--text-muted)] truncate md:hidden", fontSize.body)}>
                        {lead.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={cn("px-5 py-3.5 text-[var(--text-secondary)] truncate max-w-[200px] hidden md:table-cell", fontSize.md)}>
                  {lead.email}
                </td>
                <td className={cn("px-5 py-3.5 text-[var(--text-secondary)] hidden lg:table-cell", fontSize.md)}>
                  {lead.telefono || "—"}
                </td>
                {multiProject && (
                  <td className="px-5 py-3.5 hidden xl:table-cell">
                    {lead.proyecto_nombre ? (
                      <Badge variant="primary" size="sm" className="truncate max-w-[120px]">
                        {lead.proyecto_nombre}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                <td className="px-5 py-3.5">
                  <LeadStatusBadge status={lead.status} locale={locale} size="sm" />
                </td>
                {canAssign && (
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <AssigneeCell
                      lead={lead}
                      team={team || []}
                      onAssign={onAssign}
                      locale={locale}
                    />
                  </td>
                )}
                <td className="px-5 py-3.5 text-center">
                  {lead.cotizaciones_count > 0 ? (
                    <Badge variant="primary" size="sm" className="min-w-[22px] h-[22px] px-1.5">
                      {lead.cotizaciones_count}
                    </Badge>
                  ) : (
                    <span className={cn("text-[var(--text-muted)]", fontSize.subtitle)}>—</span>
                  )}
                </td>
                <td className={cn("px-5 py-3.5 text-[var(--text-tertiary)] tabular-nums whitespace-nowrap", fontSize.subtitle)}>
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

function AssigneeCell({
  lead,
  team,
  onAssign,
  locale,
}: {
  lead: LeadWithMeta;
  team: TeamMember[];
  onAssign?: (leadId: string, userId: string | null) => void;
  locale: string;
}) {
  if (!onAssign) {
    return (
      <span className={cn("text-[var(--text-muted)]", fontSize.subtitle)}>
        {lead.asignado_nombre || (locale === "es" ? "Sin asignar" : "Unassigned")}
      </span>
    );
  }

  return (
    <select
      value={lead.asignado_a || ""}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        onAssign(lead.id, e.target.value || null);
      }}
      className={cn(
        "bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-[11px] max-w-[140px] truncate",
        "focus:outline-none focus:ring-1 focus:ring-[var(--site-primary)] transition-colors",
        lead.asignado_a ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
      )}
    >
      <option value="">{locale === "es" ? "Sin asignar" : "Unassigned"}</option>
      {team.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nombre}
        </option>
      ))}
    </select>
  );
}
