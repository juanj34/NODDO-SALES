"use client";

import { motion } from "framer-motion";
import {
  FolderOpen, Home, Image, Video, MessageSquare, FileText,
  Users, Package, Layers, ToggleLeft,
} from "lucide-react";
import type { ActivityLog } from "@/types";

interface ActivityTimelineProps {
  activities: ActivityLog[];
  loading: boolean;
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
  project: "184, 151, 58",       // gold
  unit: "59, 130, 246",          // blue
  tipologia: "139, 92, 246",     // purple
  gallery: "236, 72, 153",       // pink
  video: "239, 68, 68",          // red
  lead: "34, 197, 94",           // green
  cotizacion: "251, 146, 60",    // orange
  colaborador: "168, 85, 247",   // violet
  content: "14, 165, 233",       // sky
  other: "148, 163, 184",        // slate
};

function relativeTime(iso: string, locale: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = now - t;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === "es" ? "ahora" : "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(iso).toLocaleDateString(locale === "es" ? "es-CO" : "en-US", { month: "short", day: "numeric" });
}

/* ── Human-readable metadata display ──────────────────────────────────── */

const FIELD_LABELS: Record<string, { es: string; en: string }> = {
  nombre: { es: "Nombre", en: "Name" },
  slug: { es: "Slug", en: "Slug" },
  descripcion: { es: "Descripción", en: "Description" },
  estado: { es: "Estado", en: "Status" },
  color_primario: { es: "Color primario", en: "Primary color" },
  color_secundario: { es: "Color secundario", en: "Secondary color" },
  color_fondo: { es: "Color de fondo", en: "Background color" },
  logo_url: { es: "Logo", en: "Logo" },
  favicon_url: { es: "Favicon", en: "Favicon" },
  render_principal_url: { es: "Render principal", en: "Main render" },
  hero_video_url: { es: "Video hero", en: "Hero video" },
  whatsapp_numero: { es: "WhatsApp", en: "WhatsApp" },
  ubicacion_direccion: { es: "Ubicación", en: "Location" },
  ubicacion_lat: { es: "Latitud", en: "Latitude" },
  ubicacion_lng: { es: "Longitud", en: "Longitude" },
  brochure_url: { es: "Brochure", en: "Brochure" },
  tour_360_url: { es: "Tour 360", en: "360 Tour" },
  constructora_nombre: { es: "Constructora", en: "Developer" },
  subdomain: { es: "Subdominio", en: "Subdomain" },
  custom_domain: { es: "Dominio personalizado", en: "Custom domain" },
  email_config: { es: "Config. correos", en: "Email config" },
  webhook_config: { es: "Webhooks", en: "Webhooks" },
  cotizador_enabled: { es: "Cotizador", en: "Quote builder" },
  secciones_visibles: { es: "Secciones visibles", en: "Visible sections" },
  inventory_columns: { es: "Columnas inventario", en: "Inventory columns" },
  tipo_proyecto: { es: "Tipo proyecto", en: "Project type" },
  moneda_base: { es: "Moneda", en: "Currency" },
  idioma: { es: "Idioma", en: "Language" },
  etapa_label: { es: "Etapa", en: "Stage" },
  disponibilidad_config: { es: "Config. disponibilidad", en: "Availability config" },
  estado_construccion: { es: "Estado construcción", en: "Construction status" },
  precio_source: { es: "Fuente de precios", en: "Price source" },
};

function truncateValue(v: unknown, max = 60): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "✓" : "✗";
  if (typeof v === "number") return v.toLocaleString("es-CO");
  if (typeof v === "object") {
    const s = JSON.stringify(v);
    return s.length > max ? s.slice(0, max) + "…" : s;
  }
  const s = String(v);
  // For URLs, show just the filename
  if (s.startsWith("http") && s.length > max) {
    const parts = s.split("/");
    return "…/" + (parts[parts.length - 1] || "").slice(0, 40);
  }
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function MetadataDisplay({
  actionType,
  metadata,
  locale,
}: {
  actionType: string;
  metadata: Record<string, unknown>;
  locale: string;
}) {
  const isEs = locale === "es";

  // project.update — show changed fields with before/after
  if (actionType === "project.update" && metadata.changes) {
    const changes = metadata.changes as Record<string, { from: unknown; to: unknown }>;
    const entries = Object.entries(changes);
    if (entries.length === 0) return null;
    return (
      <div className="space-y-1">
        {entries.map(([field, { from, to }]) => {
          const label = FIELD_LABELS[field]?.[isEs ? "es" : "en"] || field;
          return (
            <div key={field} className="flex items-start gap-2 text-[11px]">
              <span className="text-[var(--text-tertiary)] min-w-[120px] shrink-0 font-mono text-[10px]">
                {label}
              </span>
              <span className="text-red-400/70 line-through truncate max-w-[160px]" title={String(from ?? "")}>
                {truncateValue(from, 30)}
              </span>
              <span className="text-[var(--text-muted)]">→</span>
              <span className="text-emerald-400/80 truncate max-w-[160px]" title={String(to ?? "")}>
                {truncateValue(to, 30)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // unit.state_change — show state transition
  if (actionType === "unit.state_change") {
    return (
      <div className="flex items-center gap-2 text-[11px]">
        <span className="font-mono text-[var(--text-tertiary)]">{String(metadata.identificador || "")}</span>
        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-mono text-[10px]">
          {String(metadata.estadoAnterior || "")}
        </span>
        <span className="text-[var(--text-muted)]">→</span>
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">
          {String(metadata.estadoNuevo || "")}
        </span>
      </div>
    );
  }

  // unit.price_change — show formatted price diff
  if (actionType === "unit.price_change") {
    const fmt = (v: unknown) => typeof v === "number" ? `$${v.toLocaleString("es-CO")}` : String(v ?? "—");
    return (
      <div className="flex items-center gap-2 text-[11px]">
        <span className="font-mono text-[var(--text-tertiary)]">{String(metadata.identificador || "")}</span>
        <span className="font-mono text-red-400/70">{fmt(metadata.precioAnterior)}</span>
        <span className="text-[var(--text-muted)]">→</span>
        <span className="font-mono text-emerald-400/80">{fmt(metadata.precioNuevo)}</span>
      </div>
    );
  }

  // Generic: show key metadata as label:value pairs
  const skipKeys = ["changedFields", "changes"];
  const entries = Object.entries(metadata).filter(([k]) => !skipKeys.includes(k));
  if (entries.length === 0) return null;

  return (
    <div className="space-y-1">
      {entries.slice(0, 8).map(([key, val]) => (
        <div key={key} className="flex items-start gap-2 text-[11px]">
          <span className="text-[var(--text-tertiary)] min-w-[100px] shrink-0 font-mono text-[10px]">
            {FIELD_LABELS[key]?.[isEs ? "es" : "en"] || key}
          </span>
          <span className="text-[var(--text-secondary)] truncate">
            {truncateValue(val, 50)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ActivityTimeline({ activities, loading, locale }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-start animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-3)] shrink-0" />
            <div className="flex-1 glass-card p-4">
              <div className="h-4 bg-[var(--surface-3)] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[var(--surface-2)] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <ToggleLeft size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
        <p className="text-[var(--text-tertiary)] text-sm">
          {locale === "es" ? "No hay actividades registradas" : "No activities recorded"}
        </p>
      </div>
    );
  }

  // Group by day
  const groups: { label: string; items: ActivityLog[] }[] = [];
  let currentLabel = "";

  for (const a of activities) {
    const d = new Date(a.created_at);
    const label = d.toLocaleDateString(locale === "es" ? "es-CO" : "en-US", {
      weekday: "long", day: "numeric", month: "long",
    });
    if (label !== currentLabel) {
      groups.push({ label, items: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].items.push(a);
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          {/* Day header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] whitespace-nowrap">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          {/* Timeline */}
          <div className="relative pl-14 space-y-2">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-[var(--border-subtle)]" />

            {group.items.map((activity, idx) => {
              const Icon = CATEGORY_ICONS[activity.action_category] || CATEGORY_ICONS.other;
              const rgb = CATEGORY_COLORS[activity.action_category] || CATEGORY_COLORS.other;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  className="relative"
                >
                  {/* Icon node */}
                  <div
                    className="absolute -left-14 top-3 w-[38px] h-[38px] rounded-xl border border-[var(--border-default)] flex items-center justify-center z-10"
                    style={{
                      background: `rgba(${rgb}, 0.12)`,
                      boxShadow: `0 0 16px rgba(${rgb}, 0.1)`,
                    }}
                  >
                    <Icon size={16} className="text-white/70" />
                  </div>

                  {/* Card */}
                  <div className="glass-card p-4 hover:border-[var(--border-strong)] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] leading-snug">
                          {locale === "es" ? activity.description : (activity.description_en || activity.description)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[var(--text-muted)]">
                          <span className="truncate max-w-[180px]">{activity.user_name || activity.user_email}</span>
                          <span className="text-[var(--border-default)]">/</span>
                          <span>{relativeTime(activity.created_at, locale)}</span>
                          {activity.proyecto_nombre && (
                            <>
                              <span className="text-[var(--border-default)]">/</span>
                              <span className="text-[var(--site-primary)] truncate max-w-[140px]">{activity.proyecto_nombre}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Category badge */}
                      <span
                        className="shrink-0 inline-block px-2 py-0.5 rounded-md font-ui text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          background: `rgba(${rgb}, 0.12)`,
                          color: `rgba(${rgb}, 1)`,
                        }}
                      >
                        {activity.action_category}
                      </span>
                    </div>

                    {/* Expandable metadata */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <details className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)]">
                        <summary className="cursor-pointer text-[11px] text-[var(--text-muted)] hover:text-[var(--text-tertiary)] transition-colors">
                          {locale === "es" ? "Ver detalles" : "View details"}
                        </summary>
                        <div className="mt-2 space-y-1.5">
                          <MetadataDisplay actionType={activity.action_type} metadata={activity.metadata} locale={locale} />
                        </div>
                      </details>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
