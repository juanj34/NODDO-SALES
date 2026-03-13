"use client";

import type { PlatformFunnel } from "@/types";

interface Props {
  data: PlatformFunnel;
}

const STAGES: { key: keyof PlatformFunnel; label: string }[] = [
  { key: "signed_up", label: "Registrados" },
  { key: "project_created", label: "Proyecto creado" },
  { key: "content_added", label: "Contenido agregado" },
  { key: "published", label: "Publicado" },
  { key: "first_lead", label: "Primer lead" },
];

export function FunnelChart({ data }: Props) {
  const maxValue = data.signed_up || 1;

  return (
    <div className="space-y-3">
      {STAGES.map((stage, i) => {
        const value = data[stage.key];
        const pct = Math.round((value / maxValue) * 100);
        const widthPct = Math.max(pct, 6);
        const conversionFromPrev =
          i > 0 && data[STAGES[i - 1].key] > 0
            ? Math.round((value / data[STAGES[i - 1].key]) * 100)
            : null;

        return (
          <div key={stage.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                {stage.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-white">{value}</span>
                {conversionFromPrev !== null && (
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    ({conversionFromPrev}%)
                  </span>
                )}
              </div>
            </div>
            <div className="h-6 w-full bg-[var(--surface-2)] rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, #b8973a ${Math.max(0, 100 - i * 20)}%, #a07e2e)`,
                  opacity: 1 - i * 0.12,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
