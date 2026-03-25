"use client";

import { useState } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { CreditCard, Sparkles, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CotizadorSandbox } from "@/components/dashboard/cotizador/CotizadorSandbox";
import { CotizadorPdfSettings } from "@/components/dashboard/cotizador/CotizadorPdfSettings";
import { ComplementosSection } from "@/components/dashboard/ComplementosSection";

type SettingsTab = "plan" | "addons" | "pdf";

export default function CotizadorTab() {
  const { project, refresh } = useEditorProject();
  const [activeTab, setActiveTab] = useState<SettingsTab>("plan");

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: "plan", label: "Plan de pagos", icon: CreditCard },
    { id: "addons", label: "Addons", icon: Sparkles },
    { id: "pdf", label: "PDF", icon: FileText },
  ];

  return (
    <div className="space-y-8">
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
    </div>
  );
}
