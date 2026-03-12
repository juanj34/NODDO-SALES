"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HelpStepList } from "./HelpStepList";

interface HelpArticleProps {
  id: string;
  title: string;
  description: string;
  content: string;
  steps?: readonly string[];
  tips?: readonly string[];
  icon: LucideIcon;
  isExpanded: boolean;
  onToggle: () => void;
}

export function HelpArticle({
  id,
  title,
  description,
  content,
  steps,
  tips,
  icon: Icon,
  isExpanded,
  onToggle,
}: HelpArticleProps) {
  return (
    <div
      id={`help-${id}`}
      className="rounded-xl border transition-colors duration-200"
      style={{
        background: "var(--surface-1)",
        borderColor: isExpanded
          ? "rgba(var(--site-primary-rgb), 0.2)"
          : "var(--border-subtle)",
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left group cursor-pointer"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
          style={{
            background: isExpanded
              ? `rgba(var(--site-primary-rgb), 0.12)`
              : "var(--surface-2)",
          }}
        >
          <Icon
            size={15}
            style={{
              color: isExpanded
                ? "var(--site-primary)"
                : "var(--text-tertiary)",
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
            {description}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronRight
            size={14}
            className="text-[var(--text-muted)] group-hover:text-[var(--site-primary)] transition-colors"
          />
        </motion.div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5">
              {/* Divider */}
              <div
                className="border-t"
                style={{ borderColor: "var(--border-subtle)" }}
              />

              {/* Content body */}
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {content}
              </p>

              {/* Steps */}
              {steps && steps.length > 0 && (
                <div>
                  <h4 className="font-ui text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-bold mb-3">
                    Paso a paso
                  </h4>
                  <HelpStepList steps={steps} />
                </div>
              )}

              {/* Tips */}
              {tips && tips.length > 0 && (
                <div className="space-y-2">
                  {tips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex gap-2.5 rounded-lg px-3.5 py-3"
                      style={{
                        background: `rgba(var(--site-primary-rgb), 0.05)`,
                        border: `1px solid rgba(var(--site-primary-rgb), 0.12)`,
                      }}
                    >
                      <Lightbulb
                        size={13}
                        className="shrink-0 mt-0.5"
                        style={{ color: "var(--site-primary)" }}
                      />
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
