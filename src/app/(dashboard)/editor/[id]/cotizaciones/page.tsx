"use client";

import { useState, useCallback } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { Calculator, LayoutTemplate, Sparkles, FileText, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { PlantillasTab } from "@/components/dashboard/cotizador/PlantillasTab";
import { CotizadorPdfSettings } from "@/components/dashboard/cotizador/CotizadorPdfSettings";
import { PdfSettingsPreview } from "@/components/dashboard/cotizador/PdfSettingsPreview";
import { ComplementosSection } from "@/components/dashboard/ComplementosSection";

type SettingsTab = "plantillas" | "addons" | "pdf";

export default function CotizacionesPage() {
  const { project, save, refresh, updateLocal } = useEditorProject();
  const { t } = useTranslation("editor");
  const [activeTab, setActiveTab] = useState<SettingsTab>("plantillas");
  const [toggling, setToggling] = useState(false);

  const micrositeEnabled = project.cotizador_enabled ?? false;

  const handleToggleMicrosite = useCallback(async () => {
    const newValue = !micrositeEnabled;
    // Optimistic toggle
    updateLocal((prev) => ({ ...prev, cotizador_enabled: newValue }));
    setToggling(true);
    try {
      const ok = await save({ cotizador_enabled: newValue });
      if (!ok) {
        // Rollback
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
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <PageHeader
        icon={Calculator}
        title={t("layout.sidebar.cotizaciones")}
        description={
          t("layout.sidebar.cotizaciones") === "Cotizaciones"
            ? "Configura plantillas de pago, addons y PDF de cotización"
            : "Configure payment templates, add-ons and quotation PDF"
        }
      />

      {/* Microsite toggle */}
      <div className="flex items-center gap-4 p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
        <Globe size={18} className="text-[var(--text-tertiary)] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {t("layout.sidebar.cotizaciones") === "Cotizaciones"
              ? "Habilitar cotizador en micrositio"
              : "Enable quotation tool on microsite"}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {t("layout.sidebar.cotizaciones") === "Cotizaciones"
              ? "Permite que los visitantes del micrositio generen cotizaciones. Los agentes del dashboard siempre tienen acceso."
              : "Allow microsite visitors to generate quotations. Dashboard agents always have access."}
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

      {/* Sub-tab Selector */}
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

      {/* Sub-tab Content */}
      {activeTab === "plantillas" && (
        <PlantillasTab />
      )}

      {activeTab === "addons" && (
        <ComplementosSection
          project={project}
          onRefresh={refresh}
          fixedTab="addon"
        />
      )}

      {activeTab === "pdf" && (
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <CotizadorPdfSettings />
          </div>
          <div
            className="w-[480px] shrink-0 sticky top-4 self-start rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-1)]"
            style={{ height: "calc(100vh - 180px)" }}
          >
            <PdfSettingsPreview />
          </div>
        </div>
      )}
    </motion.div>
  );
}
