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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shortcuts.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.35 }}
              className="group"
            >
              <Link
                href={item.href}
                onClick={() => handleShortcutClick(item.trackEvent, item.href)}
                className="
                  p-6
                  bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]
                  rounded-2xl
                  border-2 border-[var(--border-subtle)]
                  hover:border-[rgba(var(--site-primary-rgb),0.4)]
                  hover:shadow-[0_8px_32px_rgba(var(--site-primary-rgb),0.12)]
                  transition-all duration-300
                  flex items-center gap-5
                  cursor-pointer
                "
              >
                {/* Large icon container */}
                <div className="
                  w-16 h-16
                  rounded-2xl
                  bg-[rgba(var(--site-primary-rgb),0.15)]
                  border border-[rgba(var(--site-primary-rgb),0.25)]
                  flex items-center justify-center
                  group-hover:scale-110
                  group-hover:rotate-3
                  transition-all duration-300
                  shrink-0
                ">
                  <Icon size={28} className="text-[var(--site-primary)]" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-white">
                      {item.label}
                    </h3>
                    {item.badge !== undefined && (
                      <span className="
                        inline-flex items-center justify-center
                        min-w-[24px] h-6 px-2
                        bg-[rgba(var(--site-primary-rgb),0.2)]
                        border border-[rgba(var(--site-primary-rgb),0.3)]
                        text-[var(--site-primary)]
                        rounded-full
                        font-mono text-xs font-bold
                      ">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-[var(--text-tertiary)] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <ArrowRight
                  size={20}
                  className="
                    text-[var(--text-muted)]
                    group-hover:text-[var(--site-primary)]
                    group-hover:translate-x-1
                    transition-all duration-300
                    shrink-0
                  "
                />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
