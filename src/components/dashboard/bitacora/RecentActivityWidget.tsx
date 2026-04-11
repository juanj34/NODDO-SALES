"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock, ChevronRight, FolderOpen, Home, Image, Video,
  MessageSquare, FileText, Users, Package, Layers, ToggleLeft,
} from "lucide-react";
import type { ActivityLog } from "@/types";

interface RecentActivityWidgetProps {
  locale: string;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  project: FolderOpen,
  unit: Home,
  tipologia: Package,
  gallery: Image,
  video: Video,
  lead: MessageSquare,
  cotizacion: FileText,
  colaborador: Users,
  content: Layers,
  other: ToggleLeft,
};

const CATEGORY_COLORS: Record<string, string> = {
  project: "184, 151, 58",
  unit: "59, 130, 246",
  tipologia: "139, 92, 246",
  gallery: "236, 72, 153",
  video: "239, 68, 68",
  lead: "34, 197, 94",
  cotizacion: "251, 146, 60",
  colaborador: "168, 85, 247",
  content: "14, 165, 233",
  other: "148, 163, 184",
};

function relativeTime(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === "es" ? "ahora" : "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function getInlineDetail(activity: ActivityLog, locale: string): string | null {
  const m = activity.metadata || {};
  const isEs = locale === "es";

  if (activity.action_type === "project.update" && Array.isArray(m.changedFields)) {
    const count = (m.changedFields as string[]).length;
    if (count === 0) return null;
    if (count <= 2) return (m.changedFields as string[]).join(", ");
    return isEs ? `${count} campos` : `${count} fields`;
  }

  if (activity.action_type === "unit.state_change") {
    return `${m.estadoAnterior} → ${m.estadoNuevo}`;
  }

  if (activity.action_type === "unit.price_change") {
    return `$${typeof m.precioAnterior === "number" ? m.precioAnterior.toLocaleString("es-CO") : m.precioAnterior} → $${typeof m.precioNuevo === "number" ? m.precioNuevo.toLocaleString("es-CO") : m.precioNuevo}`;
  }

  return null;
}

export function RecentActivityWidget({ locale }: RecentActivityWidgetProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bitacora?limit=5")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => setActivities(json.data || []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-light flex items-center gap-2">
          <Clock size={18} className="text-[var(--site-primary)]" />
          {locale === "es" ? "Actividad reciente" : "Recent activity"}
        </h3>
        <Link
          href="/bitacora"
          className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--site-primary)] transition-colors flex items-center gap-1"
        >
          {locale === "es" ? "Ver todo" : "View all"}
          <ChevronRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--surface-2)] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-[var(--text-muted)] text-xs text-center py-6">
          {locale === "es" ? "Sin actividad reciente" : "No recent activity"}
        </p>
      ) : (
        <div className="space-y-1.5">
          {activities.map((a, idx) => {
            const Icon = CATEGORY_ICONS[a.action_category] || CATEGORY_ICONS.other;
            const rgb = CATEGORY_COLORS[a.action_category] || CATEGORY_COLORS.other;
            const detail = getInlineDetail(a, locale);

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
              >
                {/* Category icon */}
                <div
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                  style={{
                    background: `rgba(${rgb}, 0.12)`,
                  }}
                >
                  <Icon size={14} className="text-white/60" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--text-primary)] leading-snug truncate">
                    {locale === "es" ? a.description : (a.description_en || a.description)}
                  </p>

                  {/* Inline detail */}
                  {detail && (
                    <p className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5 truncate">
                      {detail}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[var(--text-muted)]">
                    <span className="truncate max-w-[120px]">{a.user_name || a.user_email}</span>
                    <span className="text-[var(--border-default)]">·</span>
                    <span>{relativeTime(a.created_at, locale)}</span>
                    {a.proyecto_nombre && (
                      <>
                        <span className="text-[var(--border-default)]">·</span>
                        <span className="truncate max-w-[100px]" style={{ color: `rgba(${rgb}, 0.8)` }}>
                          {a.proyecto_nombre}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
