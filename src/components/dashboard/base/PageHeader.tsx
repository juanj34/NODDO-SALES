"use client";

import type { LucideIcon } from "lucide-react";
import {
  pageHeader,
  pageTitle,
  pageDescription,
} from "@/components/dashboard/editor-styles";

/**
 * PageHeader Component - Standardized page header for editor pages
 *
 * Used across all editor pages (config, galería, ubicación, etc.)
 *
 * @example
 * ```tsx
 * <PageHeader
 *   icon={Settings}
 *   title="Configuración"
 *   description="Personaliza tu proyecto"
 * />
 * ```
 */

interface PageHeaderProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Page title (main heading) */
  title: string;
  /** Optional description text below title */
  description?: string;
  /** Optional action buttons/elements to display on the right */
  actions?: React.ReactNode;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className={pageHeader}>
      <div className="flex items-center gap-3">
        {/* Icon circle */}
        <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
          <Icon size={18} className="text-[var(--site-primary)]" />
        </div>

        {/* Title and description */}
        <div>
          <h2 className={pageTitle}>{title}</h2>
          {description && (
            <p className={pageDescription}>{description}</p>
          )}
        </div>
      </div>

      {/* Optional actions (buttons, etc.) */}
      {actions && <div>{actions}</div>}
    </div>
  );
}
