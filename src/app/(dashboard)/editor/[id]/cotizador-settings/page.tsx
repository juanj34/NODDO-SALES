"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { Calculator, CreditCard, Sparkles, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CotizadorSandbox } from "@/components/dashboard/cotizador/CotizadorSandbox";
import { CotizadorPdfSettings } from "@/components/dashboard/cotizador/CotizadorPdfSettings";
import { ComplementosSection } from "@/components/dashboard/ComplementosSection";

type SettingsTab = "plan" | "addons" | "pdf";

export default function CotizadorSettingsPage() {
  const { project, refresh } = useEditorProject();
  const [activeTab, setActiveTab] = useState<SettingsTab>("plan");

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: "plan", label: "Plan de pagos", icon: CreditCard },
    { id: "addons", label: "Addons", icon: Sparkles },
    { id: "pdf", label: "PDF", icon: FileText },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <PageHeader
        icon={Calculator}
        title="Cotizador"
        description="Configura el plan de pagos, descuentos, addons y opciones del PDF"
      />

      {/* Tab Selector */}
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

      {/* Tab Content */}
      {activeTab === "plan" && (
        <CotizadorSandbox hidePdfOptions />
      )}

      {activeTab === "addons" && (
        <ComplementosSection
          project={project}
          onRefresh={refresh}
          fixedTab="addon"
        />
      )}

      {activeTab === "pdf" && (
        <CotizadorPdfSettings />
      )}
    </motion.div>
  );
}
