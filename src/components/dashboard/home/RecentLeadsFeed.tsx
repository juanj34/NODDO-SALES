"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/i18n";
import type { DashboardRecentLead } from "@/types";

interface Props {
  leads: DashboardRecentLead[];
  loading: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `hace ${diffD}d`;
}

export function RecentLeadsFeed({ leads, loading }: Props) {
  const { t } = useTranslation("dashboard");

  return (
    <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Users size={14} className="text-[var(--site-primary)]" />
        <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          {t("home.recentActivity")}
        </span>
      </div>

      {loading ? (
        <div className="flex-1 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-3)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-[var(--surface-3)] rounded" />
                <div className="h-2.5 w-36 bg-[var(--surface-2)] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-xs text-[var(--text-muted)] text-center leading-relaxed">
            {t("home.noRecentActivity")}
            <br />
            <span className="text-[var(--text-muted)] opacity-60">
              {t("home.dataWillAppear")}
            </span>
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-1">
            {leads.map((lead, idx) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3 }}
                className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[rgba(184,151,58,0.1)] border border-[rgba(184,151,58,0.15)] flex items-center justify-center shrink-0">
                  <span className="font-ui text-[10px] font-bold text-[var(--site-primary)] uppercase">
                    {lead.nombre.charAt(0)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--text-primary)] truncate">
                      {lead.nombre}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[rgba(184,151,58,0.08)] text-[var(--site-primary)] shrink-0 truncate max-w-[120px]">
                      {lead.proyecto_nombre}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-[var(--text-muted)] truncate">
                    {lead.email}
                  </p>
                </div>

                {/* Time */}
                <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">
                  {timeAgo(lead.created_at)}
                </span>
              </motion.div>
            ))}
          </div>

          <Link
            href="/leads"
            className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-center gap-1.5 font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--site-primary)] hover:text-[var(--noddo-secondary)] transition-colors"
          >
            {t("home.viewAllLeads")}
            <ArrowRight size={10} />
          </Link>
        </>
      )}
    </div>
  );
}
