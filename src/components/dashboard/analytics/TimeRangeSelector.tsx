"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type TimeRange = "7d" | "30d" | "90d" | "custom";

interface Props {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  onCustomRange?: (from: Date, to: Date) => void;
}

const presets: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
];

function toInputDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function TimeRangeSelector({ value, onChange, onCustomRange }: Props) {
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toInputDate(d);
  });
  const [customTo, setCustomTo] = useState(() => toInputDate(new Date()));

  const handleCustomSelect = () => {
    onChange("custom");
    onCustomRange?.(new Date(customFrom + "T00:00:00"), new Date(customTo + "T23:59:59"));
  };

  const handleDateChange = (type: "from" | "to", val: string) => {
    if (type === "from") setCustomFrom(val);
    else setCustomTo(val);

    const from = type === "from" ? val : customFrom;
    const to = type === "to" ? val : customTo;

    if (from && to && value === "custom") {
      onCustomRange?.(new Date(from + "T00:00:00"), new Date(to + "T23:59:59"));
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-0.5">
        {presets.map((opt) => (
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
        <button
          onClick={handleCustomSelect}
          className={cn(
            "px-3 py-1.5 font-ui text-[10px] font-bold uppercase tracking-[0.1em] rounded-md transition-all",
            value === "custom"
              ? "bg-[var(--site-primary)] text-[#141414] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          Custom
        </button>
      </div>

      {value === "custom" && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={customFrom}
            max={customTo}
            onChange={(e) => handleDateChange("from", e.target.value)}
            className="input-glass px-2 py-1 text-[11px] font-mono w-[130px]"
          />
          <span className="text-[var(--text-muted)] text-[10px]">—</span>
          <input
            type="date"
            value={customTo}
            min={customFrom}
            max={toInputDate(new Date())}
            onChange={(e) => handleDateChange("to", e.target.value)}
            className="input-glass px-2 py-1 text-[11px] font-mono w-[130px]"
          />
        </div>
      )}
    </div>
  );
}
