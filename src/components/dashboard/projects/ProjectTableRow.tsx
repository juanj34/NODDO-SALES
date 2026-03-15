"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit2, ExternalLink, MoreVertical, Trash2, Copy } from "lucide-react";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import type { ProyectoWithStats } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  proyecto: ProyectoWithStats;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onClone?: (id: string) => void;
  isAdmin: boolean;
}

export function ProjectTableRow({
  proyecto,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onClone,
  isAdmin,
}: Props) {
  const [showActions, setShowActions] = useState(false);
  const isPublished = proyecto.estado === "publicado";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString("es-CO", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <tr
      onClick={() => onSelect(proyecto.id)}
      className={cn(
        "border-b border-[var(--border-subtle)] transition-all cursor-pointer group",
        isSelected
          ? "bg-[var(--surface-2)] border-l-2 border-l-[var(--site-primary)]"
          : "hover:bg-[var(--surface-2)]/50"
      )}
      tabIndex={0}
      role="button"
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(proyecto.id);
        }
      }}
    >
      {/* Thumbnail */}
      <td className="px-5 py-3">
        <div className="w-16 h-10 rounded-lg overflow-hidden bg-[var(--surface-3)] border border-[var(--border-subtle)]">
          {proyecto.render_principal_url ? (
            <img
              src={proyecto.render_principal_url}
              alt={proyecto.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
              <Edit2 size={14} />
            </div>
          )}
        </div>
      </td>

      {/* Nombre */}
      <td className="px-5 py-3">
        <div>
          <p className="font-medium text-sm text-white truncate max-w-[200px]">{proyecto.nombre}</p>
          <p className="font-mono text-xs text-[var(--text-tertiary)] truncate max-w-[200px]">
            {proyecto.slug}.noddo.io
          </p>
        </div>
      </td>

      {/* Estado */}
      <td className="px-5 py-3">
        <ProjectStatusBadge estado={proyecto.estado} />
      </td>

      {/* Unidades */}
      <td className="px-5 py-3 text-center hidden md:table-cell">
        <span className="font-mono text-sm text-white">
          {proyecto.stats?.unidades_total || 0}
        </span>
      </td>

      {/* Leads 7d */}
      <td className="px-5 py-3 text-center hidden lg:table-cell">
        <span className="font-mono text-sm text-white">
          {proyecto.stats?.leads_7d || 0}
        </span>
      </td>

      {/* Visitas 7d */}
      <td className="px-5 py-3 text-center hidden xl:table-cell">
        <span className="font-mono text-sm text-white">
          {proyecto.stats?.views_7d || 0}
        </span>
      </td>

      {/* Fecha */}
      <td className="px-5 py-3 hidden sm:table-cell">
        <span className="font-mono text-xs text-[var(--text-tertiary)]">
          {formatDate(proyecto.created_at)}
        </span>
      </td>

      {/* Acciones */}
      <td className="px-5 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {/* Editar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(proyecto.id);
            }}
            className="
              p-2 rounded-lg
              text-[var(--text-muted)]
              hover:text-[var(--site-primary)]
              hover:bg-[var(--surface-3)]
              transition-colors
            "
            title="Editar proyecto"
          >
            <Edit2 size={16} />
          </button>

          {/* Ver sitio (if published) */}
          {isPublished && (
            <Link
              href={`https://${proyecto.slug}.noddo.io`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="
                p-2 rounded-lg
                text-[var(--text-muted)]
                hover:text-[var(--site-primary)]
                hover:bg-[var(--surface-3)]
                transition-colors
              "
              title="Ver sitio"
            >
              <ExternalLink size={16} />
            </Link>
          )}

          {/* Actions menu (admin only) */}
          {isAdmin && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="
                  p-2 rounded-lg
                  text-[var(--text-muted)]
                  hover:text-white
                  hover:bg-[var(--surface-3)]
                  transition-colors
                "
                title="Más acciones"
              >
                <MoreVertical size={16} />
              </button>

              {showActions && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActions(false);
                    }}
                  />
                  <div className="
                    absolute right-0 top-full mt-1 z-20
                    bg-[var(--surface-2)]
                    border border-[var(--border-default)]
                    rounded-lg
                    shadow-[0_8px_24px_rgba(0,0,0,0.4)]
                    py-1
                    min-w-[160px]
                  ">
                    {onClone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClone(proyecto.id);
                          setShowActions(false);
                        }}
                        className="
                          w-full flex items-center gap-2
                          px-4 py-2
                          text-sm text-[var(--text-secondary)]
                          hover:bg-[var(--surface-3)]
                          hover:text-white
                          transition-colors
                        "
                      >
                        <Copy size={14} />
                        Clonar
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(proyecto.id, proyecto.nombre);
                        setShowActions(false);
                      }}
                      className="
                        w-full flex items-center gap-2
                        px-4 py-2
                        text-sm text-red-400
                        hover:bg-[var(--surface-3)]
                        hover:text-red-300
                        transition-colors
                      "
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
