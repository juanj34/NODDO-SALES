"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import {
  Settings,
  SlidersHorizontal,
  Boxes,
  TableProperties,
  Eye,
  Calculator,
  Mail,
  Globe,
  Webhook,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

/* ── Lazy-loaded tab components ─────────────────────────────────── */

const GeneralTab = lazy(() => import("@/components/dashboard/config-tabs/GeneralTab"));
const TipologiasTab = lazy(() => import("@/components/dashboard/config-tabs/TipologiasTab"));
const InventarioTab = lazy(() => import("@/components/dashboard/config-tabs/InventarioTab"));
const MicrositeTab = lazy(() => import("@/components/dashboard/config-tabs/MicrositeTab"));
const CotizadorTab = lazy(() => import("@/components/dashboard/config-tabs/CotizadorTab"));
const CorreosTab = lazy(() => import("@/components/dashboard/config-tabs/CorreosTab"));
const DominioTab = lazy(() => import("@/components/dashboard/config-tabs/DominioTab"));
const IntegracionesTab = lazy(() => import("@/components/dashboard/config-tabs/IntegracionesTab"));

/* ── Tab definitions ────────────────────────────────────────────── */

type ConfigTab = "general" | "tipologias" | "inventario" | "micrositio" | "cotizador" | "correos" | "dominio" | "integraciones";

interface TabDef {
  id: ConfigTab;
  labelKey: string;
  icon: LucideIcon;
}

const TABS: TabDef[] = [
  { id: "general", labelKey: "configTabs.general", icon: SlidersHorizontal },
  { id: "tipologias", labelKey: "configTabs.tipologias", icon: Boxes },
  { id: "inventario", labelKey: "configTabs.inventario", icon: TableProperties },
  { id: "micrositio", labelKey: "configTabs.micrositio", icon: Eye },
  { id: "cotizador", labelKey: "configTabs.cotizador", icon: Calculator },
  { id: "correos", labelKey: "configTabs.correos", icon: Mail },
  { id: "dominio", labelKey: "configTabs.dominio", icon: Globe },
  { id: "integraciones", labelKey: "configTabs.integraciones", icon: Webhook },
];

const VALID_TABS = new Set<string>(TABS.map((t) => t.id));

/* ── Loading fallback ───────────────────────────────────────────── */

function TabLoading() {
  return (
    <div className="flex items-center justify-center h-48">
      <Loader2 size={22} className="animate-spin text-[var(--site-primary)]" />
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────── */

export default function ConfigPage() {
  const { t } = useTranslation("editor");
  const searchParams = useSearchParams();

  /* Read ?tab= query param for deep linking */
  const [activeTab, setActiveTab] = useState<ConfigTab>(() => {
    const param = searchParams.get("tab");
    return param && VALID_TABS.has(param) ? (param as ConfigTab) : "general";
  });

  /* Sync if query param changes externally (e.g. redirect) */
  useEffect(() => {
    const param = searchParams.get("tab");
    if (param && VALID_TABS.has(param)) {
      setActiveTab(param as ConfigTab);
    }
  }, [searchParams]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <PageHeader
        icon={Settings}
        title={t("config.title")}
        description={t("config.description")}
      />

      {/* Tab Bar — pill style, horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-2 px-2 scrollbar-hide">
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)] rounded-xl w-fit">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-ui text-xs font-bold uppercase tracking-[0.08em] whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-[var(--site-primary)] text-[var(--surface-0)] shadow-[0_2px_8px_rgba(var(--site-primary-rgb),0.3)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5"
                )}
              >
                <TabIcon size={13} />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <Suspense fallback={<TabLoading />}>
        {activeTab === "general" && <GeneralTab />}
        {activeTab === "tipologias" && <TipologiasTab />}
        {activeTab === "inventario" && <InventarioTab />}
        {activeTab === "micrositio" && <MicrositeTab />}
        {activeTab === "cotizador" && <CotizadorTab />}
        {activeTab === "correos" && <CorreosTab />}
        {activeTab === "dominio" && <DominioTab />}
        {activeTab === "integraciones" && <IntegracionesTab />}
      </Suspense>
    </motion.div>
  );
}
