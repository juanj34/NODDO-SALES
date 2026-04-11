"use client";

import { Lock } from "lucide-react";
import { useTranslation } from "@/i18n";

/**
 * Small lock icon badge shown next to editor sidebar tabs
 * that are gated behind the Pro plan.
 */
export function PlanGateBadge({ className = "" }: { className?: string }) {
  const { t } = useTranslation("editor");

  return (
    <span
      title={t("plan.proOnly") ?? "Disponible en Plan Pro"}
      className={`inline-flex items-center justify-center ml-auto flex-shrink-0 ${className}`}
    >
      <Lock
        size={12}
        className="text-[var(--text-muted)] group-hover:text-[var(--site-primary)] transition-colors"
      />
    </span>
  );
}
