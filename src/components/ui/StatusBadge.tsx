"use client";

import { cn } from "@/lib/utils";
import { fontSize, letterSpacing, radius, fontWeight, borderWidth } from "@/lib/design-tokens";
import { UNIT_STATUS_COLORS } from "@/lib/status-colors";
import type { UnitStatus } from "@/lib/status-colors";

interface StatusBadgeProps {
  status: UnitStatus;
  size?: "sm" | "md";
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

/**
 * StatusBadge - Specialized badge for unit status display.
 *
 * Uses centralized status colors from @/lib/status-colors for consistency
 * across inventario, torres, tipologias, and cotizador pages.
 *
 * Status types:
 * - disponible: Green (available)
 * - proximamente: Blue (coming soon)
 * - separado: Yellow (separated)
 * - reservada: Amber (reserved)
 * - vendida: Red (sold)
 *
 * Features:
 * - Optional dot indicator (useful for compact views)
 * - Optional pulse animation (for active/featured units)
 * - Consistent sizing (sm: 9px, md: 10px)
 * - Maps directly to UNIT_STATUS_COLORS constants
 */
export function StatusBadge({
  status,
  size = "md",
  dot = false,
  pulse = false,
  className,
}: StatusBadgeProps) {
  const colors = UNIT_STATUS_COLORS[status];

  const baseClass = cn(
    "inline-flex items-center font-ui uppercase",
    letterSpacing.widest,
    fontWeight.bold,
    borderWidth.thin,
    radius.full
  );

  const sizeClasses = {
    sm: `px-1.5 py-0.5 ${fontSize.caption}`,
    md: `px-2.5 py-1 ${fontSize.label}`,
  };

  const gapClass = dot ? "gap-1.5" : "";

  return (
    <span className={cn(baseClass, colors.bg, colors.text, colors.border, sizeClasses[size], gapClass, className)}>
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", colors.dot)}></span>
          )}
          <span className={cn("relative inline-flex rounded-full h-2 w-2", colors.dot)}></span>
        </span>
      )}
      {/* Status label - use translations in actual implementation */}
      <span className="whitespace-nowrap">
        {status === "disponible" && "Disponible"}
        {status === "proximamente" && "Próximamente"}
        {status === "separado" && "Separado"}
        {status === "reservada" && "Reservada"}
        {status === "vendida" && "Vendida"}
      </span>
    </span>
  );
}
