"use client";

import { cn } from "@/lib/utils";
import { fontSize, letterSpacing, radius, gap, fontWeight } from "@/lib/design-tokens";

export interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "default" | "pills" | "underline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Unified TabNavigation component for consistent tab UI across dashboard and editor.
 *
 * Variants:
 * - default: Background fills (torres, tipologias style)
 * - pills: Rounded pill style (analytics style)
 * - underline: Bottom border indicator
 *
 * Sizes:
 * - sm: 10px text (caption/label usage)
 * - md: 12px text (subtitle usage)
 * - lg: 14px text (body/base usage)
 */
export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  variant = "default",
  size = "md",
  className,
}: TabNavigationProps) {
  const baseClass = cn(
    "inline-flex items-center font-ui",
    variant === "pills" ? cn("p-1 bg-[var(--surface-2)] border border-[var(--border-subtle)]", radius.lg) : "",
    gap.compact
  );

  const sizeClasses = {
    sm: fontSize.label,
    md: fontSize.subtitle,
    lg: fontSize.base,
  };

  const getTabClass = (tab: Tab) => {
    const isActive = tab.id === activeTab;

    if (variant === "pills") {
      return cn(
        "flex items-center px-3 py-1.5 cursor-pointer transition-all font-semibold uppercase",
        letterSpacing.wider,
        radius.md,
        gap.compact,
        sizeClasses[size],
        isActive
          ? "bg-[var(--site-primary)] text-black shadow-lg shadow-[rgba(var(--site-primary-rgb),0.3)]"
          : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-3)]"
      );
    }

    if (variant === "underline") {
      return cn(
        "flex items-center px-4 py-2 cursor-pointer transition-all border-b-2 font-semibold uppercase",
        letterSpacing.wider,
        gap.compact,
        sizeClasses[size],
        isActive
          ? "border-[var(--site-primary)] text-white"
          : "border-transparent text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)]"
      );
    }

    // variant === "default"
    return cn(
      "flex items-center px-4 py-2 cursor-pointer transition-all font-semibold uppercase border-t-2",
      letterSpacing.wider,
      radius.md,
      gap.compact,
      sizeClasses[size],
      isActive
        ? "bg-[var(--surface-2)] border-[var(--site-primary)] text-white"
        : "bg-transparent border-transparent text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-1)]"
    );
  };

  return (
    <div className={cn(baseClass, className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={getTabClass(tab)}
          type="button"
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                "flex items-center justify-center min-w-[20px] h-5 px-1.5 font-mono font-bold",
                radius.full,
                fontSize.caption,
                tab.id === activeTab
                  ? "bg-black/20 text-black"
                  : "bg-[var(--surface-3)] text-[var(--text-muted)]"
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
