"use client";

import { cn } from "@/lib/utils";
import { fontSize, letterSpacing, radius, gap, iconSize } from "@/lib/design-tokens";
import type { LucideIcon } from "lucide-react";

interface DetailBoxProps {
  label: string;
  value: string | number | React.ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "compact" | "highlighted";
  className?: string;
}

/**
 * DetailBox - Reusable detail display component.
 *
 * Used extensively in cotizador page for displaying:
 * - Phase details (area, units, price)
 * - Discount summaries
 * - Options metadata
 * - PDF customization values
 *
 * Variants:
 * - default: Full padding, icon container (most common)
 * - compact: Less padding, inline icon
 * - highlighted: Gold accent border for emphasis
 *
 * Example usage:
 * ```tsx
 * <DetailBox
 *   label="Área"
 *   value="125 m²"
 *   icon={Home}
 *   variant="default"
 * />
 * ```
 */
export function DetailBox({
  label,
  value,
  icon: Icon,
  variant = "default",
  className,
}: DetailBoxProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        <div className={cn("flex items-center", gap.normal)}>
          {Icon && (
            <Icon
              size={iconSize.sm}
              className="text-[var(--site-primary)] flex-shrink-0"
            />
          )}
          <span className={cn("text-[var(--text-secondary)] uppercase", fontSize.label, letterSpacing.wider)}>
            {label}
          </span>
        </div>
        <span className={cn("text-white font-medium", fontSize.md)}>
          {value}
        </span>
      </div>
    );
  }

  if (variant === "highlighted") {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-3 bg-[rgba(var(--site-primary-rgb),0.08)] border border-[rgba(var(--site-primary-rgb),0.25)]",
          radius.lg,
          className
        )}
      >
        <div className={cn("flex items-center", gap.relaxed)}>
          {Icon && (
            <div
              className={cn(
                "w-10 h-10 flex items-center justify-center bg-[var(--site-primary)] text-black",
                radius.lg
              )}
            >
              <Icon size={iconSize.md} />
            </div>
          )}
          <span className={cn("text-[var(--site-primary)] font-bold uppercase", fontSize.label, letterSpacing.wider)}>
            {label}
          </span>
        </div>
        <span className={cn("text-white font-bold", fontSize.heading)}>
          {value}
        </span>
      </div>
    );
  }

  // variant === "default"
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 bg-[var(--surface-2)] border border-[var(--border-subtle)]",
        radius.lg,
        className
      )}
    >
      <div className={cn("flex items-center", gap.normal)}>
        {Icon && (
          <div
            className={cn(
              "w-8 h-8 flex items-center justify-center bg-[var(--surface-3)] border border-[var(--border-default)] text-[var(--text-tertiary)]",
              radius.md
            )}
          >
            <Icon size={iconSize.sm} />
          </div>
        )}
        <span className={cn("text-[var(--text-secondary)] uppercase", fontSize.label, letterSpacing.wider)}>
          {label}
        </span>
      </div>
      <span className={cn("text-white font-medium", fontSize.md)}>
        {value}
      </span>
    </div>
  );
}
