"use client";

import { HardDrive, Film, Image, Globe } from "lucide-react";
import type { PlatformStorage } from "@/types";

interface Props {
  data: PlatformStorage;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getBarColor(pct: number): string {
  if (pct >= 80) return "#ef4444";
  if (pct >= 60) return "#f59e0b";
  return "#b8973a";
}

export function StorageOverview({ data }: Props) {
  const pctUsed = data.total_limit_bytes > 0
    ? Math.round((data.total_bytes / data.total_limit_bytes) * 100)
    : 0;

  const items = [
    { label: "Total", value: data.total_bytes, limit: data.total_limit_bytes, icon: HardDrive },
    { label: "Tours 360", value: data.tours_bytes, limit: null, icon: Globe },
    { label: "Videos", value: data.videos_bytes, limit: null, icon: Film },
    { label: "Media", value: data.media_bytes, limit: null, icon: Image },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const itemPct = item.limit
          ? Math.round((item.value / item.limit) * 100)
          : data.total_bytes > 0
            ? Math.round((item.value / data.total_bytes) * 100)
            : 0;
        const barPct = item.limit ? itemPct : itemPct;
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
                <Icon size={14} className="text-[var(--text-tertiary)]" />
              </div>
              <span className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {item.label}
              </span>
            </div>
            <p className="font-heading text-xl font-light text-white mb-1">
              {formatBytes(item.value)}
            </p>
            {item.limit ? (
              <p className="font-mono text-[10px] text-[var(--text-muted)] mb-2">
                de {formatBytes(item.limit)} ({pctUsed}%)
              </p>
            ) : (
              <p className="font-mono text-[10px] text-[var(--text-muted)] mb-2">
                {itemPct}% del total
              </p>
            )}
            <div className="h-1.5 w-full bg-[var(--surface-3)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(barPct, 100)}%`,
                  backgroundColor: item.limit ? getBarColor(barPct) : "#b8973a",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
