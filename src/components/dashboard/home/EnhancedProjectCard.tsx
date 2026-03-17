"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import Link from "next/link";
import { Edit2, ExternalLink, Trash2, Eye, UserCheck, Zap, Copy, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { Proyecto } from "@/types";

interface Props {
  proyecto: Proyecto;
  stats?: {
    views_7d: number;
    leads_7d: number;
    visitors_7d?: number;
    interactions_7d?: number;
    sparkline?: { bucket: string; views: number }[];
  };
  index: number;
  isAdmin: boolean;
  onDelete: (id: string, name: string) => void;
  onClone?: (id: string) => void;
  cloning?: boolean;
}

const estadoBadge: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  publicado: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    label: "LIVE",
  },
  borrador: {
    dot: "bg-amber-400",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    label: "BORRADOR",
  },
  archivado: {
    dot: "bg-neutral-400",
    bg: "bg-neutral-500/10",
    text: "text-neutral-400",
    label: "ARCHIVADO",
  },
};

export function EnhancedProjectCard({ proyecto, stats, index, isAdmin, onDelete, onClone, cloning }: Props) {
  const { t } = useTranslation("dashboard");
  const isPublished = proyecto.estado === "publicado";
  const badge = estadoBadge[proyecto.estado] || estadoBadge.borrador;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Tilt
        glareEnable={true}
        glareMaxOpacity={0.05}
        glareColor="#ffffff"
        glarePosition="all"
        glareBorderRadius="12px"
        tiltMaxAngleX={3}
        tiltMaxAngleY={3}
        scale={1.02}
        transitionSpeed={2000}
        className={`group bg-[var(--surface-1)] rounded-xl overflow-hidden h-full flex flex-col transition-all duration-300 ${
          isPublished
            ? "border border-[rgba(184,151,58,0.15)] shadow-[0_0_30px_rgba(184,151,58,0.05)] hover:shadow-[0_8px_40px_rgba(184,151,58,0.08)]"
            : "border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
        }`}
      >
        {/* Image */}
        <div className="h-[200px] relative overflow-hidden">
          {proyecto.render_principal_url ? (
            <Image src={proyecto.render_principal_url} alt="" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={index === 0} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-[3000ms] ease-out" />
          ) : (
            <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] text-sm">
              {t("proyectos.noImage")}
            </div>
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-1)] via-transparent to-transparent" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(10,10,11,0.35) 100%)",
            }}
          />

          {/* Status badge — top left */}
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md bg-black/40 border border-white/10">
              <span className="relative flex h-1.5 w-1.5">
                {isPublished && (
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${badge.dot} opacity-50`}
                  />
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${badge.dot}`} />
              </span>
              <span className={`font-ui text-[9px] font-bold uppercase tracking-[0.12em] ${badge.text}`}>
                {badge.label}
              </span>
            </div>
          </div>

        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-heading text-lg font-light tracking-wide text-[var(--text-primary)] mb-1">
            {proyecto.nombre}
          </h3>
          <p className="font-mono text-[11px] text-[var(--text-muted)] mb-3">
            {proyecto.constructora_nombre || t("proyectos.noDeveloper")} &bull;{" "}
            <span className="text-[var(--site-primary)] opacity-60">
              {proyecto.subdomain || proyecto.slug}.noddo.io
            </span>
          </p>

          {/* Stats row */}
          {stats && (stats.views_7d > 0 || stats.leads_7d > 0 || (stats.interactions_7d || 0) > 0) && (
            <div className="flex items-center gap-4 border-t border-[var(--border-subtle)] pt-3 mt-auto mb-3">
              <StatPill icon={<Eye size={11} />} value={stats.views_7d} label="visitas" />
              <StatPill icon={<UserCheck size={11} />} value={stats.leads_7d} label="leads" />
              {(stats.interactions_7d || 0) > 0 && (
                <StatPill icon={<Zap size={11} />} value={stats.interactions_7d || 0} label="inter." />
              )}
              <span className="ml-auto font-ui text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                7d
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto">
            <Link
              href={`/editor/${proyecto.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[0.625rem] font-ui text-[10px] font-bold uppercase tracking-[0.1em] bg-[rgba(184,151,58,0.12)] text-[var(--site-primary)] border border-[rgba(184,151,58,0.2)] hover:bg-[rgba(184,151,58,0.2)] hover:border-[rgba(184,151,58,0.35)] transition-all"
            >
              <Edit2 size={12} />
              {t("proyectos.edit")}
            </Link>
            {isPublished && (
              <Link
                href={`/sites/${proyecto.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[0.625rem] font-ui text-[10px] font-bold uppercase tracking-[0.1em] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-all"
              >
                <ExternalLink size={12} />
                {t("proyectos.viewSite")}
              </Link>
            )}
            {isAdmin && (
              <div className="ml-auto flex items-center gap-1">
                {onClone && (
                  <button
                    onClick={() => onClone(proyecto.id)}
                    disabled={cloning}
                    className="p-2 rounded-[0.625rem] text-[var(--text-muted)]/30 hover:text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-all disabled:opacity-50"
                    title="Duplicar proyecto"
                  >
                    {cloning ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                  </button>
                )}
                <button
                  onClick={() => onDelete(proyecto.id, proyecto.nombre)}
                  className="p-2 rounded-[0.625rem] text-red-400/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </Tilt>
    </motion.div>
  );
}

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[var(--text-muted)]">{icon}</span>
      <span className="font-mono text-[12px] text-white font-medium">
        {value.toLocaleString("es-CO")}
      </span>
      <span className="font-mono text-[10px] text-[var(--text-muted)]">{label}</span>
    </div>
  );
}
