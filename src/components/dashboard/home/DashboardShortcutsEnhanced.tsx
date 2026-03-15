"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, BarChart3, ToggleLeft, Calculator, FileText, ArrowRight } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useAuthRole } from "@/hooks/useAuthContext";
import { trackDashboardEvent, type DashboardEventType } from "@/lib/dashboard-tracking";

interface Props {
  leadCount?: number;
}

export function DashboardShortcutsEnhanced({ leadCount }: Props) {
  const { t } = useTranslation("dashboard");
  const { user, role } = useAuthRole();

  const shortcuts = [
    {
      label: t("home.kpiLeads"),
      description: "Gestiona tus contactos y leads",
      icon: Users,
      href: "/leads",
      badge: leadCount && leadCount > 0 ? leadCount : undefined,
      trackEvent: "shortcut_leads_click" as DashboardEventType,
    },
    {
      label: t("home.analytics"),
      description: "Métricas y estadísticas detalladas",
      icon: BarChart3,
      href: "/analytics",
      trackEvent: "shortcut_analytics_click" as DashboardEventType,
    },
    {
      label: t("disponibilidad.title"),
      description: "Estado de unidades por proyecto",
      icon: ToggleLeft,
      href: "/disponibilidad",
      trackEvent: "shortcut_disponibilidad_click" as DashboardEventType,
    },
    {
      label: t("cotizador.title"),
      description: "Calculadora de financiamiento",
      icon: Calculator,
      href: "/cotizador",
      trackEvent: "shortcut_cotizador_click" as DashboardEventType,
    },
    {
      label: "Cotizaciones",
      description: "Historial de cotizaciones generadas",
      icon: FileText,
      href: "/cotizaciones",
      trackEvent: "shortcut_cotizaciones_click" as DashboardEventType,
    },
  ];

  const handleShortcutClick = (trackEvent: DashboardEventType, href: string) => {
    trackDashboardEvent(trackEvent, {
      destination: href,
    }, user?.id, role || undefined);
  };

  return (
    <div className="space-y-3">
      <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {t("home.shortcuts")}
      </span>
      <div className="flex flex-wrap gap-2">
        {shortcuts.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
            >
              <Link
                href={item.href}
                onClick={() => handleShortcutClick(item.trackEvent, item.href)}
                className="
                  group flex items-center gap-2.5
                  px-4 py-2.5
                  bg-[var(--surface-1)]
                  rounded-xl
                  border border-[var(--border-subtle)]
                  hover:border-[rgba(var(--site-primary-rgb),0.4)]
                  hover:bg-[var(--surface-2)]
                  transition-all duration-200
                "
              >
                <Icon
                  size={16}
                  className="text-[var(--site-primary)] shrink-0"
                />
                <span className="font-ui text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-white transition-colors duration-200">
                  {item.label}
                </span>
                {item.badge !== undefined && (
                  <span className="
                    inline-flex items-center justify-center
                    min-w-[20px] h-5 px-1.5
                    bg-[rgba(var(--site-primary-rgb),0.2)]
                    text-[var(--site-primary)]
                    rounded-full
                    font-mono text-[10px] font-bold
                  ">
                    {item.badge}
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
