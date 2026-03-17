"use client";

import { cn } from "@/lib/utils";
import { fontSize, fontWeight, letterSpacing } from "@/lib/design-tokens";

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  variant?: "form" | "section" | "card";
  className?: string;
}

/**
 * Unified Label component using Syne font for ALL labels.
 *
 * Variants:
 * - form: Form field labels (11px, semibold, wider tracking)
 * - section: Section labels above groups of content (10px, bold, wider tracking)
 * - card: Small labels inside cards (10px, bold, wider tracking, more muted)
 *
 * Typography: Always Syne (font-ui), UPPERCASE with tracking
 */
export function Label({ children, htmlFor, variant = "form", className }: LabelProps) {
  const baseClass = "font-ui uppercase block";

  const variantClasses = {
    form: `${fontSize.body} ${fontWeight.semibold} ${letterSpacing.wider} text-[var(--text-secondary)] mb-1.5`,
    section: `${fontSize.label} ${fontWeight.bold} ${letterSpacing.wider} text-[var(--text-tertiary)] mb-2`,
    card: `${fontSize.label} ${fontWeight.bold} ${letterSpacing.wider} text-[var(--text-tertiary)] mb-0.5`,
  };

  return (
    <label
      htmlFor={htmlFor}
      className={cn(baseClass, variantClasses[variant], className)}
    >
      {children}
    </label>
  );
}
