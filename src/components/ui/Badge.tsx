"use client";

import { cn } from "@/lib/utils";
import { fontSize, fontWeight, letterSpacing, radius, borderWidth } from "@/lib/design-tokens";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "error" | "muted";
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

/**
 * Unified Badge component for status indicators, labels, and tags.
 *
 * Variants:
 * - default: Neutral gray
 * - primary: Gold accent (site-primary)
 * - success: Green (published, completed)
 * - warning: Amber (pending, in progress)
 * - error: Red (failed, error)
 * - muted: Very subtle gray
 *
 * Features:
 * - Optional dot indicator (useful for status badges)
 * - Optional pulse animation (for active/live states)
 * - Consistent sizing (sm: 9px, md: 10px)
 */
export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
  dot = false,
  pulse = false
}: BadgeProps) {
  const baseClass = `inline-flex items-center font-ui uppercase ${letterSpacing.widest} ${fontWeight.bold} ${borderWidth.thin} ${radius.full}`;

  const variantClasses = {
    default: "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border-default)]",
    primary: "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] border-[rgba(var(--site-primary-rgb),0.25)]",
    success: "bg-green-500/15 text-green-400 border-green-500/20",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    error: "bg-red-500/15 text-red-400 border-red-500/20",
    muted: "bg-[var(--surface-3)] text-[var(--text-tertiary)] border-[var(--border-subtle)]",
  };

  const sizeClasses = {
    sm: `px-1.5 py-0.5 ${fontSize.caption}`,
    md: `px-2.5 py-1 ${fontSize.label}`,
  };

  const dotColorClasses = {
    default: "bg-[var(--text-secondary)]",
    primary: "bg-[var(--site-primary)]",
    success: "bg-green-400",
    warning: "bg-amber-400",
    error: "bg-red-400",
    muted: "bg-[var(--text-tertiary)]",
  };

  const gapClass = dot ? "gap-1.5" : "";

  return (
    <span className={cn(baseClass, variantClasses[variant], sizeClasses[size], gapClass, className)}>
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColorClasses[variant]}`}></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColorClasses[variant]}`}></span>
        </span>
      )}
      {children}
    </span>
  );
}
