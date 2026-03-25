"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import {
  sectionCard,
  sectionTitle,
  sectionDescription,
  fieldHint,
  badgeGold,
} from "@/components/dashboard/editor-styles";
import {
  Eye,
  RotateCcw,
  Image as ImageIcon,
  Layers,
  Package,
  Building2,
  Map as MapIcon,
  MapPin,
  Film,
  FileText,
  HardHat,
  Globe,
  MessageCircle,
  CreditCard,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import type { SeccionesVisibles, AgentModeConfig } from "@/types";
import {
  SECTION_KEYS,
  getEffectiveVisibility,
  SECTION_DISPLAY,
} from "@/lib/secciones-visibles";

/* ── Icon map for dynamic resolution ─────────────────────────────── */

const ICON_MAP: Record<string, LucideIcon> = {
  ImageIcon, Layers, Package, Building2,
  MapIcon, MapPin, Film, FileText, HardHat, Globe, MessageCircle, CreditCard,
};

/* ── Component ───────────────────────────────────────────────────── */

export default function MicrositeTab() {
  const { project, save } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();

  /* ── Visibility state ── */
  const [visibility, setVisibility] = useState<SeccionesVisibles>(
    getEffectiveVisibility(project.secciones_visibles)
  );

  /* ── Badge state ── */
  const [hideNoddoBadge, setHideNoddoBadge] = useState(project?.hide_noddo_badge ?? false);

  /* ── Agent mode state ── */
  const defaultAgentConfig: AgentModeConfig = {
    enabled: false,
    mostrar_precios: true,
    mostrar_vendidas: true,
    mostrar_precio_vendidas: true,
    mostrar_todas_secciones: true,
    habilitar_cotizador: true,
  };
  const [agentConfig, setAgentConfig] = useState<AgentModeConfig>(
    project.agent_mode_config ?? defaultAgentConfig
  );

  // Sync from project on external change
  useEffect(() => {
    setVisibility(getEffectiveVisibility(project.secciones_visibles));
    setHideNoddoBadge(project?.hide_noddo_badge ?? false);
    setAgentConfig(project.agent_mode_config ?? defaultAgentConfig);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.secciones_visibles, project?.hide_noddo_badge, project.agent_mode_config]);

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
      hide_noddo_badge: hideNoddoBadge,
      agent_mode_config: agentConfig,
    } as any);
    if (!ok) toast.error(t("general.saveError"));
  }, [save, visibility, hideNoddoBadge, agentConfig, toast, t]);

  /* ── Auto-save ── */
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
    <div className="max-w-4xl space-y-8">
      {/* ── Section Visibility ── */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Eye size={15} className="text-[var(--site-primary)]" />
          {t("visibility.title")}
        </div>
        <p className={sectionDescription}>{t("visibility.description")}</p>

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

      {/* ── Agent Mode ── */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Shield size={15} className="text-[var(--site-primary)]" />
          {t("agentMode.title")}
        </div>
        <p className={sectionDescription}>{t("agentMode.description")}</p>

        {/* Master toggle */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            role="switch"
            aria-checked={agentConfig.enabled}
            onClick={() => {
              setAgentConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
              scheduleAutoSave();
            }}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer",
              agentConfig.enabled ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"
            )}
          >
            <span className={cn(
              "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
              agentConfig.enabled ? "translate-x-[18px]" : "translate-x-[3px]"
            )} />
          </button>
          <span className="text-sm text-[var(--text-secondary)]">
            {t("agentMode.enable")}
          </span>
        </div>

        {/* Override toggles — only shown when enabled */}
        {agentConfig.enabled && (
          <div className="space-y-2 pl-1">
            {([
              { key: "mostrar_precios" as const, labelKey: "agentMode.showPrices" },
              { key: "mostrar_vendidas" as const, labelKey: "agentMode.showSold" },
              { key: "mostrar_precio_vendidas" as const, labelKey: "agentMode.showSoldPrices" },
              { key: "mostrar_todas_secciones" as const, labelKey: "agentMode.showAllSections" },
              { key: "habilitar_cotizador" as const, labelKey: "agentMode.enableCotizador" },
            ] as const).map(({ key, labelKey }) => (
              <div key={key} className="flex items-center gap-3 py-1.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={agentConfig[key]}
                  onClick={() => {
                    setAgentConfig((prev) => ({ ...prev, [key]: !prev[key] }));
                    scheduleAutoSave();
                  }}
                  className={cn(
                    "relative inline-flex h-4 w-7 items-center rounded-full transition-colors cursor-pointer",
                    agentConfig[key] ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"
                  )}
                >
                  <span className={cn(
                    "inline-block h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform",
                    agentConfig[key] ? "translate-x-[14px]" : "translate-x-[3px]"
                  )} />
                </button>
                <span className="text-xs text-[var(--text-secondary)]">
                  {t(labelKey)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Badge Powered by Noddo ── */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Eye size={15} className="text-[var(--site-primary)]" />
          {t("config.badge.title")}
        </div>
        <p className={sectionDescription}>{t("config.badge.description")}</p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={hideNoddoBadge}
            onClick={() => { setHideNoddoBadge(!hideNoddoBadge); scheduleAutoSave(); }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
              hideNoddoBadge ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
              hideNoddoBadge ? "translate-x-[18px]" : "translate-x-[3px]"
            }`} />
          </button>
          <span className="text-sm text-[var(--text-secondary)]">{t("config.badge.hide")}</span>
        </div>
        <p className={fieldHint}>{t("config.badge.hideHint")}</p>
      </div>
    </div>
  );
}
