"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { NodDoLogo } from "./NodDoLogo";

interface UnifiedEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "outline";
  };
  illustration?: "logo" | "custom";
  className?: string;
}

export function UnifiedEmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration = "logo",
  className = "",
}: UnifiedEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Icon/Illustration */}
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{
            background:
              "linear-gradient(135deg, rgba(184,151,58,0.15), rgba(184,151,58,0.05))",
            border: "1px solid rgba(184,151,58,0.15)",
            boxShadow: "0 0 40px rgba(184,151,58,0.08)",
          }}
        >
          {illustration === "logo" ? (
            <NodDoLogo
              height={14}
              colorNod="var(--text-secondary)"
              colorDo="var(--site-primary)"
            />
          ) : Icon ? (
            <Icon size={24} className="text-[var(--site-primary)]" />
          ) : null}
        </div>

        {/* Title */}
        <h2 className="font-heading text-2xl sm:text-3xl font-light text-[var(--text-primary)] mb-3 tracking-wide">
          {title}
        </h2>

        {/* Description */}
        <p className="text-[var(--text-tertiary)] text-sm font-mono font-light leading-relaxed mb-8">
          {description}
        </p>

        {/* Action button */}
        {action && (
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onClick={action.onClick}
            className={
              action.variant === "outline"
                ? "btn-outline-warm px-6 py-3"
                : "btn-warm px-6 py-3"
            }
          >
            <span className="font-ui text-xs font-bold uppercase tracking-wider">
              {action.label}
            </span>
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

/**
 * Variante compacta para usar en tablas/listas
 */
export function CompactEmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon?: LucideIcon;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
          <Icon size={20} className="text-[var(--text-muted)]" />
        </div>
      )}
      <p className="text-sm text-[var(--text-tertiary)] font-mono mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--site-primary)] hover:text-[var(--site-primary-light)] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
