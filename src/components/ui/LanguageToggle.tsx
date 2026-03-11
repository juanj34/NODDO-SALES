"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
  compact?: boolean;
}

export function LanguageToggle({ className, compact }: LanguageToggleProps) {
  const { locale, setLocale } = useLanguage();

  if (compact) {
    return (
      <button
        onClick={() => setLocale(locale === "es" ? "en" : "es")}
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer",
          "bg-white/[0.04] hover:bg-white/[0.08] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
          className
        )}
      >
        {locale === "es" ? "EN" : "ES"}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center bg-white/[0.04] rounded-full border border-[var(--border-subtle)] p-0.5",
        className
      )}
    >
      {/* Active indicator */}
      <motion.div
        className="absolute h-[calc(100%-4px)] w-[calc(50%-2px)] rounded-full"
        style={{ background: "rgba(var(--site-primary-rgb), 0.15)", border: "1px solid rgba(var(--site-primary-rgb), 0.3)" }}
        animate={{ x: locale === "es" ? 2 : "calc(100% + 2px)" }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
      />

      <button
        onClick={() => setLocale("es")}
        className={cn(
          "relative z-10 px-3 py-1 text-[10px] font-bold tracking-wider rounded-full transition-colors cursor-pointer",
          locale === "es" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        )}
      >
        ES
      </button>
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "relative z-10 px-3 py-1 text-[10px] font-bold tracking-wider rounded-full transition-colors cursor-pointer",
          locale === "en" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        )}
      >
        EN
      </button>
    </div>
  );
}
