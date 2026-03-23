"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";
import type { ActivityLog } from "@/types";

interface RecentActivityWidgetProps {
  locale: string;
}

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
            <div key={i} className="h-14 bg-[var(--surface-2)] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-[var(--text-muted)] text-xs text-center py-6">
          {locale === "es" ? "Sin actividad reciente" : "No recent activity"}
        </p>
      ) : (
        <div className="space-y-1.5">
          {activities.map((a, idx) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
            >
              <p className="text-[13px] text-[var(--text-primary)] leading-snug truncate">
                {locale === "es" ? a.description : (a.description_en || a.description)}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)]">
                <span className="truncate max-w-[150px]">{a.user_name || a.user_email}</span>
                <span className="text-[var(--border-default)]">/</span>
                <span>{relativeTime(a.created_at, locale)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
