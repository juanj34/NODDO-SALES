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
        className="w-full flex items-center gap-3 px-6 py-5 text-left group cursor-pointer hover:bg-[var(--surface-2)] transition-colors rounded-xl"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
          style={{
            background: isExpanded
              ? `rgba(var(--site-primary-rgb), 0.15)`
              : "var(--surface-2)",
            boxShadow: isExpanded
              ? `0 0 20px rgba(var(--site-primary-rgb), 0.15)`
              : "none",
          }}
        >
          <Icon
            size={18}
            style={{
              color: isExpanded
                ? "var(--site-primary)"
                : "var(--text-tertiary)",
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-medium text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
            {description}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="shrink-0"
        >
          <ChevronRight
            size={16}
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
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6">
              {/* Divider */}
              <div
                className="border-t"
                style={{ borderColor: "rgba(var(--site-primary-rgb), 0.1)" }}
              />

              {/* Content body */}
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.8]">
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
                <div className="space-y-3">
                  <h4 className="font-ui text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-bold">
                    Consejos
                  </h4>
                  {tips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex gap-3 rounded-xl px-4 py-3.5"
                      style={{
                        background: `rgba(var(--site-primary-rgb), 0.08)`,
                        border: `1px solid rgba(var(--site-primary-rgb), 0.2)`,
                      }}
                    >
                      <Lightbulb
                        size={16}
                        className="shrink-0 mt-0.5"
                        style={{ color: "var(--site-primary)" }}
                      />
                      <p className="text-xs text-[var(--text-secondary)] leading-[1.7]">
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
