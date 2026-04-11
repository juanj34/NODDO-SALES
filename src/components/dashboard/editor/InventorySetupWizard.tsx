"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TableProperties, Sparkles,
  DollarSign, Maximize, BedDouble, MapPin,
  Ruler, Home, LandPlot, Bath, Car, Package,
  Compass, Eye, Building2, Layers, Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { getDefaultColumns, INVENTORY_COLUMN_KEYS } from "@/lib/inventory-columns";
import type { InventoryColumnConfig, ProyectoCompleto } from "@/types";

const COLUMN_ICON_MAP: Record<string, LucideIcon> = {
  Maximize, DollarSign, BedDouble, Bath, Car, Package,
  Compass, Eye, Building2, MapPin, Layers, Ruler, Home, LandPlot,
};

interface ColumnCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  columns: (keyof InventoryColumnConfig)[];
}

const CATEGORIES: ColumnCategory[] = [
  { id: "financial", label: "Financiero", icon: DollarSign, columns: ["precio"] },
  { id: "dimensions", label: "Dimensiones", icon: Maximize, columns: ["area_m2", "area_construida", "area_privada", "area_lote"] },
  { id: "spaces", label: "Espacios", icon: BedDouble, columns: ["habitaciones", "banos", "parqueaderos", "depositos"] },
  { id: "location", label: "Ubicación", icon: MapPin, columns: ["orientacion", "vista", "piso", "lote", "etapa"] },
];

type TipoProyecto = "apartamentos" | "casas" | "lotes" | "hibrido";

const PRESETS: { key: TipoProyecto; label: string }[] = [
  { key: "apartamentos", label: "Apartamentos" },
  { key: "casas", label: "Casas" },
  { key: "lotes", label: "Lotes" },
  { key: "hibrido", label: "Todo" },
];

interface InventorySetupWizardProps {
  project: ProyectoCompleto;
  onComplete: () => void;
}

export function InventorySetupWizard({ project, onComplete }: InventorySetupWizardProps) {
  const { t } = useTranslation("editor");
  const [saving, setSaving] = useState(false);

  // Start with smart defaults based on project type
  const tipoProyecto = (project.tipo_proyecto ?? "hibrido") as TipoProyecto;
  const [columns, setColumns] = useState<InventoryColumnConfig>(
    () => getDefaultColumns(tipoProyecto)
  );

  const activeCount = useMemo(
    () => Object.values(columns).filter(Boolean).length,
    [columns]
  );

  const toggle = (key: keyof InventoryColumnConfig) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (tipo: TipoProyecto) => {
    setColumns(getDefaultColumns(tipo));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/proyectos/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory_columns: columns }),
      });
      if (res.ok) {
        onComplete();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center min-h-[60vh] p-4 md:p-8"
    >
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[rgba(var(--site-primary-rgb),0.1)] mb-2">
            <TableProperties size={28} className="text-[var(--site-primary)]" />
          </div>
          <h2 className="font-heading text-2xl font-light text-[var(--text-primary)]">
            {t("inventario.setup.title")}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            {t("inventario.setup.description")}
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center justify-center gap-2">
          <Sparkles size={12} className="text-[var(--text-muted)]" />
          <span className="text-[10px] font-ui font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
            {t("inventario.setup.presets")}
          </span>
          <div className="flex gap-1.5 ml-2">
            {PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-ui font-bold uppercase tracking-[0.08em] transition-all",
                  key === tipoProyecto
                    ? "bg-[rgba(var(--site-primary-rgb),0.12)] text-[var(--site-primary)] border border-[rgba(var(--site-primary-rgb),0.25)]"
                    : "bg-[var(--surface-1)] text-[var(--text-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Column toggles by category */}
        <div className="space-y-4">
          {CATEGORIES.map((category) => {
            const CatIcon = category.icon;
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <CatIcon size={12} className="text-[var(--text-muted)]" />
                  <span className="text-[10px] font-ui font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    {category.label}
                  </span>
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {category.columns.map((colKey) => {
                    const colDef = INVENTORY_COLUMN_KEYS.find((c) => c.key === colKey);
                    if (!colDef) return null;
                    const ColIcon = COLUMN_ICON_MAP[colDef.icon];
                    const isOn = columns[colKey];
                    return (
                      <button
                        key={colKey}
                        type="button"
                        onClick={() => toggle(colKey)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer",
                          isOn
                            ? "bg-[rgba(var(--site-primary-rgb),0.06)] border border-[rgba(var(--site-primary-rgb),0.25)]"
                            : "bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                        )}
                      >
                        {ColIcon && (
                          <ColIcon
                            size={14}
                            className={cn(
                              "shrink-0 transition-colors",
                              isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]"
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "flex-1 text-left text-xs transition-colors",
                            isOn ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-tertiary)]"
                          )}
                        >
                          {t(colDef.labelKey)}
                        </span>
                        <div
                          className={cn(
                            "relative inline-flex items-center rounded-full transition-colors shrink-0 h-4 w-7",
                            isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block rounded-full bg-white shadow-sm transition-transform h-3 w-3",
                              isOn ? "translate-x-[14px]" : "translate-x-[2px]"
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {activeCount} / {INVENTORY_COLUMN_KEYS.length} {t("inventario.setup.columnsSelected")}
          </span>
          <button
            onClick={handleSave}
            disabled={saving || activeCount === 0}
            className="btn-warm px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              t("inventario.setup.continue")
            )}
          </button>
        </div>

        {/* Hint */}
        <p className="text-[11px] text-[var(--text-muted)] text-center">
          {t("inventario.setup.hint")}
        </p>
      </div>
    </motion.div>
  );
}
