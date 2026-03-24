"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import { sectionCard, badgeGold } from "@/components/dashboard/editor-styles";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import {
  Eye, EyeOff, RotateCcw,
  Image as ImageIcon, Layers, Package, Building2,
  Map as MapIcon, MapPin, Film, FileText, HardHat, Globe, MessageCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import type { SeccionesVisibles } from "@/types";
import {
  SECTION_KEYS,
  getEffectiveVisibility,
  SECTION_DISPLAY,
} from "@/lib/secciones-visibles";

/* ── Icon map for dynamic resolution ─────────────────────────────── */

const ICON_MAP: Record<string, LucideIcon> = {
  ImageIcon, Layers, Package, Building2,
  MapIcon, MapPin, Film, FileText, HardHat, Globe, MessageCircle,
};

/* ── Page ─────────────────────────────────────────────────────────── */

export default function VisibilidadPage() {
  const { project, save } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();

  /* ── Local state ── */
  const [visibility, setVisibility] = useState<SeccionesVisibles>(
    getEffectiveVisibility(project.secciones_visibles)
  );

  // Sync from project on external change
  useEffect(() => {
    setVisibility(getEffectiveVisibility(project.secciones_visibles));
  }, [project.secciones_visibles]);

  /* ── Derived ── */
  const hiddenCount = useMemo(
    () => SECTION_KEYS.filter((k) => !visibility[k]).length,
    [visibility]
  );

  /* ── Save handler ── */
  const handleSave = useCallback(async () => {
    const allVisible = SECTION_KEYS.every((k) => visibility[k]);
    const ok = await save({
      secciones_visibles: allVisible ? null : visibility,
    } as any);
    if (!ok) toast.error(t("general.saveError"));
  }, [save, visibility, toast, t]);

  /* ── Auto-save (same pattern as config page) ── */
  const handleSaveRef = useRef(handleSave);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => handleSaveRef.current(), 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        handleSaveRef.current();
      }
    };
  }, []);

  /* ── Toggle a section ── */
  const handleToggle = useCallback((key: keyof SeccionesVisibles) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  /* ── Reset all to visible ── */
  const handleResetAll = useCallback(() => {
    setVisibility(getEffectiveVisibility(null));
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <PageHeader
        icon={Eye}
        title={t("visibility.title")}
        description={t("visibility.description")}
      />

      <div className={sectionCard}>
        {/* Header with badge + reset */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className={badgeGold}>
              {hiddenCount === 0
                ? t("visibility.allVisible")
                : t("visibility.someHidden", { count: String(hiddenCount) })}
            </span>
          </div>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors cursor-pointer"
            >
              <RotateCcw size={11} />
              {t("visibility.resetAll")}
            </button>
          )}
        </div>

        {/* Section toggles — 2-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SECTION_DISPLAY.map((section) => {
            const isOn = visibility[section.key];
            const SectionIcon = ICON_MAP[section.icon] || Eye;

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => handleToggle(section.key)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-[0.75rem] transition-all cursor-pointer group text-left",
                  isOn
                    ? "bg-[var(--surface-2)] border border-[var(--border-subtle)] border-l-[3px] border-l-[var(--site-primary)]"
                    : "bg-[var(--surface-1)] border border-[var(--border-subtle)] border-l-[3px] border-l-transparent opacity-50"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isOn ? "bg-[rgba(var(--site-primary-rgb),0.12)]" : "bg-[var(--surface-3)]"
                )}>
                  <SectionIcon
                    size={14}
                    className={cn(
                      "transition-colors",
                      isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]"
                    )}
                  />
                </div>

                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-xs font-medium block transition-colors",
                    isOn ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
                  )}>
                    {t(section.labelKey)}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block truncate">
                    {t(section.descKey)}
                  </span>
                </div>

                {/* Toggle switch */}
                <div className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
                  isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"
                )}>
                  <span className={cn(
                    "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                    isOn ? "translate-x-[18px]" : "translate-x-[3px]"
                  )} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
