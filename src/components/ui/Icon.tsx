"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconSize, iconColor, type IconSize, type IconColor } from "@/lib/design-tokens";

interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  color?: IconColor;
  className?: string;
}

/**
 * Unified Icon component for all Lucide icons.
 *
 * Enforces consistent sizing and coloring across the platform.
 * Prevents fragmentation of icon sizes (12px, 14px, 16px, 20px, etc.)
 *
 * Usage:
 * ```tsx
 * <Icon icon={DollarSign} size="md" color="primary" />
 * <Icon icon={Plus} size="lg" color="secondary" />
 * ```
 */
export function Icon({ icon: IconComponent, size = "md", color = "tertiary", className }: IconProps) {
  return (
    <IconComponent
      size={iconSize[size]}
      className={cn(iconColor[color], className)}
      strokeWidth={2}
    />
  );
}
