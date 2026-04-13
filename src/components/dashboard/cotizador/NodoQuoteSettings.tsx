"use client";

import { useState, useCallback } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { Settings, ChevronDown, Globe, LayoutTemplate, Sparkles, FileText, Zap } from "lucide-react";
import type { CotizadorConfig, ProyectoCompleto } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { PlantillasTab } from "@/components/dashboard/cotizador/PlantillasTab";
import { CotizadorPdfSettings } from "@/components/dashboard/cotizador/CotizadorPdfSettings";
import { PdfSettingsPreview } from "@/components/dashboard/cotizador/PdfSettingsPreview";
import { ComplementosSection } from "@/components/dashboard/ComplementosSection";

type SettingsTab = "plantillas" | "addons" | "pdf" | "quick";

export function NodoQuoteSettings() {
  const { project, save, refresh, updateLocal } = useEditorProject();
  const { t: tTooltips } = useTranslation("tooltips");

  const notConfigured = !project.cotizador_config;
  const [open, setOpen] = useState(notConfigured);
  const [activeTab, setActiveTab] = useState<SettingsTab>("plantillas");
  const [toggling, setToggling] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const micrositeEnabled = project.cotizador_enabled ?? false;

  const handleToggleMicrosite = useCallback(async () => {
    const newValue = !micrositeEnabled;
    updateLocal((prev) => ({ ...prev, cotizador_enabled: newValue }));
    setToggling(true);
    try {
      const ok = await save({ cotizador_enabled: newValue });
      if (!ok) {
        updateLocal((prev) => ({ ...prev, cotizador_enabled: !newValue }));
      }
    } catch {
      updateLocal((prev) => ({ ...prev, cotizador_enabled: !newValue }));
    } finally {
      setToggling(false);
    }
  }, [save, micrositeEnabled, updateLocal]);

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: "plantillas", label: "Plantillas", icon: LayoutTemplate },
    { id: "addons", label: "Addons", icon: Sparkles },
    { id: "pdf", label: "PDF", icon: FileText },
    { id: "quick", label: "Rápido", icon: Zap },
  ];

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden">
      {/* Trigger bar */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <Settings size={16} className="text-[var(--text-tertiary)]" />
        <span className="font-ui text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          Configuraciones
        </span>
        {notConfigured && (
          <span className="ml-1 px-2 py-0.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] rounded-full bg-[var(--site-primary)]/15 text-[var(--site-primary)]">
            Pendiente
          </span>
        )}
        <ChevronDown
          size={14}
          className={cn(
            "ml-auto text-[var(--text-muted)] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 space-y-6 border-t border-[var(--border-subtle)]">
              {/* Microsite toggle */}
              <div className="flex items-center gap-4 pt-5">
                <Globe size={16} className="text-[var(--text-tertiary)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] inline-flex items-center gap-1.5">
                    Habilitar NodDo Quote en micrositio
                    <InfoTooltip content={tTooltips("config.seccionesVisibles.short")} variant="dashboard" />
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Permite que los visitantes del micrositio generen cotizaciones. Los agentes del dashboard siempre tienen acceso.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMicrosite}
                  disabled={toggling}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--site-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)] cursor-pointer disabled:opacity-50",
                    micrositeEnabled ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                      micrositeEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Tab selector */}
              <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)] rounded-xl w-fit">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-ui text-xs font-bold uppercase tracking-[0.08em]",
                        isActive
                          ? "bg-[var(--site-primary)] text-[var(--surface-0)] shadow-[0_2px_8px_rgba(var(--site-primary-rgb),0.3)]"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5"
                      )}
                    >
                      <TabIcon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              {activeTab === "plantillas" && <PlantillasTab />}

              {activeTab === "addons" && (
                <ComplementosSection project={project} onRefresh={refresh} fixedTab="addon" />
              )}

              {activeTab === "pdf" && (
                <div className="space-y-4">
                  <CotizadorPdfSettings />
                  <button
                    type="button"
                    onClick={() => setShowPdfPreview((v) => !v)}
                    className="btn-outline-warm text-xs px-4 py-2"
                  >
                    {showPdfPreview ? "Ocultar vista previa" : "Vista previa PDF"}
                  </button>
                  {showPdfPreview && (
                    <div
                      className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-1)]"
                      style={{ height: "600px" }}
                    >
                      <PdfSettingsPreview />
                    </div>
                  )}
                </div>
              )}

              {activeTab === "quick" && (
                <QuickQuoteDefaults project={project} save={save} updateLocal={updateLocal} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Quick Quote Defaults sub-component ── */

function QuickQuoteDefaults({
  project,
  save,
  updateLocal,
}: {
  project: { cotizador_config: CotizadorConfig | null };
  save: (data: Record<string, unknown>) => Promise<boolean>;
  updateLocal: (updater: (prev: ProyectoCompleto) => ProyectoCompleto) => void;
}) {
  const config = project.cotizador_config;
  const defaults = config?.quick_quote_defaults;
  const enabled = config?.quick_quote_enabled ?? false;

  const [sep, setSep] = useState(defaults?.separacion_pct ?? 10);
  const [fin, setFin] = useState(defaults?.financiacion_pct ?? 50);
  const [freq, setFreq] = useState<"mensual" | "bimestral" | "trimestral">(defaults?.frecuencia ?? "mensual");
  const [cuotas, setCuotas] = useState(defaults?.cuotas ?? 36);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!config) return;
    setSaving(true);
    const newConfig: CotizadorConfig = {
      ...config,
      quick_quote_enabled: !enabled ? true : enabled,
      quick_quote_defaults: {
        separacion_pct: sep,
        financiacion_pct: fin,
        cuotas,
        frecuencia: freq,
      },
    };
    await save({ cotizador_config: newConfig });
    setSaving(false);
  }, [config, enabled, sep, fin, cuotas, freq, save]);

  const handleToggle = useCallback(async () => {
    if (!config) return;
    const newConfig: CotizadorConfig = {
      ...config,
      quick_quote_enabled: !enabled,
    };
    updateLocal((prev: ProyectoCompleto) => ({ ...prev, cotizador_config: newConfig }));
    await save({ cotizador_config: newConfig });
  }, [config, enabled, save, updateLocal]);

  return (
    <div className="space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center gap-4">
        <Zap size={16} className="text-[var(--text-tertiary)] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Habilitar modo rápido en micrositio
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Los visitantes podrán generar cotizaciones con estos valores por defecto.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer",
            enabled ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
              enabled ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Defaults form */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
            Separación %
          </label>
          <input
            type="number"
            value={sep}
            onChange={(e) => setSep(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            className="input-glass w-full text-sm font-mono"
            min={0}
            max={100}
          />
        </div>
        <div>
          <label className="text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
            Financiación %
          </label>
          <input
            type="number"
            value={fin}
            onChange={(e) => setFin(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            className="input-glass w-full text-sm font-mono"
            min={0}
            max={100}
          />
        </div>
        <div>
          <label className="text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
            Cuotas por defecto
          </label>
          <input
            type="number"
            value={cuotas}
            onChange={(e) => setCuotas(Math.max(1, Number(e.target.value) || 1))}
            className="input-glass w-full text-sm font-mono"
            min={1}
          />
        </div>
        <div>
          <label className="text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
            Frecuencia
          </label>
          <select
            value={freq}
            onChange={(e) => setFreq(e.target.value as "mensual" | "bimestral" | "trimestral")}
            className="input-glass w-full text-sm"
          >
            <option value="mensual">Mensual</option>
            <option value="bimestral">Bimestral</option>
            <option value="trimestral">Trimestral</option>
          </select>
        </div>
      </div>

      {sep + fin > 100 && (
        <p className="text-xs text-red-400">Separación + financiación no puede exceder 100%</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || sep + fin > 100}
        className="btn-warm text-xs px-5 py-2 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar defaults"}
      </button>
    </div>
  );
}
