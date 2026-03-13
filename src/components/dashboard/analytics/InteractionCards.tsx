"use client";

import { MessageCircle, Download, Play, MousePointerClick, FileDown } from "lucide-react";
import type { AnalyticsSummary } from "@/types";

interface Props {
  summary: AnalyticsSummary;
}

const interactions = [
  { key: "whatsapp_clicks" as const, label: "WhatsApp", icon: MessageCircle, color: "#25d366" },
  { key: "brochure_downloads" as const, label: "Brochure", icon: Download, color: "var(--site-primary)" },
  { key: "video_plays" as const, label: "Videos", icon: Play, color: "var(--site-primary)" },
  { key: "recurso_downloads" as const, label: "Recursos", icon: FileDown, color: "var(--site-primary)" },
  { key: "cta_clicks" as const, label: "CTAs", icon: MousePointerClick, color: "var(--site-primary)" },
];

export function InteractionCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {interactions.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="flex items-center gap-3 p-3.5 bg-[var(--surface-2)] rounded-xl border border-[var(--border-subtle)]"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon size={15} style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-xl font-light text-white leading-none">
              {summary[key].toLocaleString("es-CO")}
            </p>
            <p className="font-ui text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] mt-0.5">
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
