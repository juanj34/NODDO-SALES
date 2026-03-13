"use client";

import { cn } from "@/lib/utils";

export type TimeRange = "7d" | "30d" | "90d";

interface Props {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const options: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
];

export function TimeRangeSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 font-ui text-[10px] font-bold uppercase tracking-[0.1em] rounded-md transition-all",
            value === opt.value
              ? "bg-[var(--site-primary)] text-[#141414] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
