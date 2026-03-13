"use client";

import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import Link from "next/link";
import { Edit2, ExternalLink, Trash2, Eye, UserCheck } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { Proyecto } from "@/types";

interface Props {
  proyecto: Proyecto;
  stats?: { views_7d: number; leads_7d: number };
  index: number;
  isAdmin: boolean;
  onDelete: (id: string, name: string) => void;
}

const estadoColors: Record<string, string> = {
  publicado: "bg-emerald-500/15 text-emerald-400",
  borrador: "bg-amber-500/15 text-amber-400",
  archivado: "bg-neutral-500/15 text-neutral-400",
};

export function EnhancedProjectCard({ proyecto, stats, index, isAdmin, onDelete }: Props) {
  const { t } = useTranslation("dashboard");
  const isPublished = proyecto.estado === "publicado";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Tilt
        glareEnable={true}
        glareMaxOpacity={0.08}
        glareColor="#ffffff"
        glarePosition="all"
        glareBorderRadius="12px"
        tiltMaxAngleX={4}
        tiltMaxAngleY={4}
        scale={1.02}
        transitionSpeed={2000}
        className={`group bg-[var(--surface-1)] border rounded-xl overflow-hidden hover:shadow-[var(--shadow-lg)] transition-all duration-300 h-full flex flex-col ${
          isPublished
            ? "border-[rgba(184,151,58,0.12)] shadow-[0_0_24px_rgba(184,151,58,0.04)]"
            : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
        }`}
      >
        {/* Image */}
        <div className="aspect-video relative overflow-hidden">
          {proyecto.render_principal_url ? (
            <img
              src={proyecto.render_principal_url}
              alt={proyecto.nombre}
              className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-[3000ms] ease-out"
            />
          ) : (
            <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] text-sm">
              {t("proyectos.noImage")}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-1)] via-[var(--surface-1)]/20 to-transparent opacity-70" />

          {/* Status badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {isPublished && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
            )}
            <span
              className={`px-2.5 py-1 rounded-lg font-ui text-[10px] tracking-wider uppercase font-bold backdrop-blur-sm ${
                estadoColors[proyecto.estado] || estadoColors.borrador
              }`}
            >
              {proyecto.estado}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-base font-medium tracking-wide mb-1 text-[var(--text-primary)]">
            {proyecto.nombre}
          </h3>
          <p className="text-[var(--text-muted)] text-xs mb-3">
            {proyecto.constructora_nombre || t("proyectos.noDeveloper")} &bull;{" "}
            {proyecto.subdomain || proyecto.slug}.noddo.co
          </p>

          {/* Mini stats */}
          {stats && (stats.views_7d > 0 || stats.leads_7d > 0) && (
            <div className="flex items-center gap-3 mb-3 font-mono text-[10px] text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1">
                <Eye size={10} className="text-[var(--text-muted)]" />
                {stats.views_7d.toLocaleString("es-CO")} visitas
              </span>
              <span className="w-px h-3 bg-[var(--border-subtle)]" />
              <span className="flex items-center gap-1">
                <UserCheck size={10} className="text-[var(--text-muted)]" />
                {stats.leads_7d} leads
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto">
            <Link
              href={`/editor/${proyecto.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[0.625rem] font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-all"
            >
              <Edit2 size={12} />
              {t("proyectos.edit")}
            </Link>
            {isPublished && (
              <Link
                href={`/sites/${proyecto.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[0.625rem] font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-all"
              >
                <ExternalLink size={12} />
                {t("proyectos.viewSite")}
              </Link>
            )}
            {isAdmin && (
              <button
                onClick={() => onDelete(proyecto.id, proyecto.nombre)}
                className="ml-auto p-2 rounded-[0.625rem] text-red-400/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </Tilt>
    </motion.div>
  );
}
