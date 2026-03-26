"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import {
  sectionCard, sectionTitle, sectionDescription,
  badgeGold,
} from "@/components/dashboard/editor-styles";
import {
  Maximize, Ruler, Home, LandPlot, Palmtree,
  BedDouble, Bath, Car, Package, DollarSign,
  RotateCcw,
  Waves, UtensilsCrossed, Sun, TreePine, DoorClosed,
  BookOpen, Flame, MoveVertical, CloudSun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  getTipologiaFields,
  getDefaultTipologiaFields,
  TIPOLOGIA_FIELD_KEYS,
} from "@/lib/tipologia-fields";
import type { TipologiaFieldsConfig } from "@/types";

/* ── Icon map ──────────────────────────────────────────────────── */

const FIELD_ICON_MAP: Record<string, LucideIcon> = {
  Maximize, Ruler, Home, LandPlot, Palmtree,
  BedDouble, Bath, Car, Package, DollarSign,
};

/* ── Field category groups ─────────────────────────────────────── */

interface FieldCategory {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  fields: (keyof TipologiaFieldsConfig)[];
}

const FIELD_CATEGORIES: FieldCategory[] = [
  { id: "dimensions", labelKey: "config.tipologiaFields.categoryDimensions", icon: Maximize, fields: ["area_m2", "area_construida", "area_privada", "area_lote", "area_balcon"] },
  { id: "spaces", labelKey: "config.tipologiaFields.categorySpaces", icon: BedDouble, fields: ["habitaciones", "banos", "parqueaderos", "depositos"] },
  { id: "financial", labelKey: "config.tipologiaFields.categoryFinancial", icon: DollarSign, fields: ["precio"] },
];

/* ── Extras config ─────────────────────────────────────────────── */

interface ExtraConfig {
  key: string;
  icon: LucideIcon;
  projectField: string;
  labelKey: string;
  hintKey: string;
}

const EXTRAS_CONFIG: ExtraConfig[] = [
  { key: "jacuzzi", icon: Bath, projectField: "habilitar_extra_jacuzzi", labelKey: "config.extras.jacuzzi", hintKey: "config.extras.jacuzziHint" },
  { key: "piscina", icon: Waves, projectField: "habilitar_extra_piscina", labelKey: "config.extras.piscina", hintKey: "config.extras.piscinaHint" },
  { key: "bbq", icon: UtensilsCrossed, projectField: "habilitar_extra_bbq", labelKey: "config.extras.bbq", hintKey: "config.extras.bbqHint" },
  { key: "terraza", icon: Sun, projectField: "habilitar_extra_terraza", labelKey: "config.extras.terraza", hintKey: "config.extras.terrazaHint" },
  { key: "jardin", icon: TreePine, projectField: "habilitar_extra_jardin", labelKey: "config.extras.jardin", hintKey: "config.extras.jardinHint" },
  { key: "cuarto_servicio", icon: DoorClosed, projectField: "habilitar_extra_cuarto_servicio", labelKey: "config.extras.cuartoServicio", hintKey: "config.extras.cuartoServicioHint" },
  { key: "estudio", icon: BookOpen, projectField: "habilitar_extra_estudio", labelKey: "config.extras.estudio", hintKey: "config.extras.estudioHint" },
  { key: "chimenea", icon: Flame, projectField: "habilitar_extra_chimenea", labelKey: "config.extras.chimenea", hintKey: "config.extras.chimeneaHint" },
  { key: "doble_altura", icon: MoveVertical, projectField: "habilitar_extra_doble_altura", labelKey: "config.extras.dobleAltura", hintKey: "config.extras.dobleAlturaHint" },
  { key: "rooftop", icon: CloudSun, projectField: "habilitar_extra_rooftop", labelKey: "config.extras.rooftop", hintKey: "config.extras.rooftopHint" },
];

/* ── Component ─────────────────────────────────────────────────── */

export default function TipologiasTab() {
  const { project, save } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();

  /* ── State ── */
  const [tipologiaFields, setTipologiaFields] = useState<TipologiaFieldsConfig | null>(null);
  const [extrasEnabled, setExtrasEnabled] = useState<Record<string, boolean>>({});
  const hasPendingSave = useRef(false);

  /* ── Sync from project (skip if local edits are pending) ── */
  useEffect(() => {
    if (!project) return;
    if (hasPendingSave.current) return; // don't overwrite unsaved local changes
    setTipologiaFields(project.tipologia_fields ?? null);
    const extrasState: Record<string, boolean> = {};
    for (const extra of EXTRAS_CONFIG) {
      extrasState[extra.key] = (project as unknown as Record<string, unknown>)[extra.projectField] as boolean ?? false;
    }
    setExtrasEnabled(extrasState);
  }, [project]);

  /* ── Computed ── */
  const tipoProyecto = project?.tipo_proyecto || "hibrido";
  const effectiveFields = useMemo(
    () => getTipologiaFields(tipoProyecto, tipologiaFields),
    [tipoProyecto, tipologiaFields]
  );
  const isCustomFields = tipologiaFields !== null;
  const activeFieldCount = useMemo(
    () => Object.values(effectiveFields).filter(Boolean).length,
    [effectiveFields]
  );

  /* ── Save handler ── */
  const handleSave = useCallback(async () => {
    const ok = await save({
      tipologia_fields: tipologiaFields,
      ...Object.fromEntries(EXTRAS_CONFIG.map(e => [e.projectField, extrasEnabled[e.key] ?? false])),
    } as Record<string, unknown>);
    hasPendingSave.current = false; // allow project sync again after save completes
    if (!ok) toast.error(t("general.saveError"));
  }, [save, tipologiaFields, extrasEnabled, toast, t]);

  /* ── Auto-save ── */
  const handleSaveRef = useRef(handleSave);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const scheduleAutoSave = useCallback(() => {
    hasPendingSave.current = true; // mark as dirty — block project sync
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

  /* ── Toggle handlers ── */
  const handleFieldToggle = useCallback((key: keyof TipologiaFieldsConfig) => {
    const current = getTipologiaFields(tipoProyecto, tipologiaFields);
    const updated = { ...current, [key]: !current[key] };
    setTipologiaFields(updated);
    scheduleAutoSave();
  }, [tipoProyecto, tipologiaFields, scheduleAutoSave]);

  const handleResetFields = useCallback(() => {
    setTipologiaFields(null);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleExtraToggle = useCallback((key: string) => {
    setExtrasEnabled(prev => ({ ...prev, [key]: !prev[key] }));
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  /* ── Render ── */
  return (
    <div className="space-y-6">
      {/* ── Tipología Fields Section ── */}
      <div className={sectionCard}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className={sectionTitle}>{t("config.tipologiaFields.title")}</h3>
            <p className={sectionDescription}>{t("config.tipologiaFields.description")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={badgeGold}>{activeFieldCount}/{TIPOLOGIA_FIELD_KEYS.length}</span>
            {isCustomFields && (
              <button
                type="button"
                onClick={handleResetFields}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-ui font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-all cursor-pointer"
              >
                <RotateCcw size={10} />
                {t("config.tipologiaFields.resetDefaults")}
              </button>
            )}
          </div>
        </div>

        {!isCustomFields && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-[rgba(var(--site-primary-rgb),0.06)] border border-[rgba(var(--site-primary-rgb),0.15)]">
            <span className="text-[10px] font-ui font-bold uppercase tracking-[0.12em] text-[var(--site-primary)]">
              {t("config.tipologiaFields.usingDefaults")}
            </span>
          </div>
        )}

        <div className="space-y-5">
          {FIELD_CATEGORIES.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <div key={category.id}>
                <div className="flex items-center gap-2.5 mb-2">
                  <CategoryIcon size={13} className="shrink-0 text-[var(--text-tertiary)]" />
                  <span className="text-[10px] tracking-[0.12em] font-ui font-bold uppercase text-[var(--text-tertiary)]">
                    {category.id === "dimensions" ? "Dimensiones" : category.id === "spaces" ? "Espacios" : "Financiero"}
                  </span>
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {category.fields.map((fieldKey) => {
                    const fieldDef = TIPOLOGIA_FIELD_KEYS.find(f => f.key === fieldKey);
                    if (!fieldDef) return null;
                    const FieldIcon = FIELD_ICON_MAP[fieldDef.icon];
                    const isOn = effectiveFields[fieldKey];
                    return (
                      <button
                        key={fieldKey}
                        type="button"
                        onClick={() => handleFieldToggle(fieldKey)}
                        className={cn(
                          "flex items-center gap-3 px-3.5 py-2.5 rounded-[0.75rem] transition-all cursor-pointer group",
                          isOn
                            ? "bg-[var(--surface-2)] border-l-[3px] border-l-[var(--site-primary)] border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)]"
                            : "bg-[var(--surface-1)] border-l-[3px] border-l-transparent border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)] hover:border-t-[var(--border-default)] hover:border-r-[var(--border-default)] hover:border-b-[var(--border-default)]"
                        )}
                      >
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors", isOn ? "bg-[rgba(var(--site-primary-rgb),0.12)]" : "bg-[var(--surface-3)]")}>
                          {FieldIcon && <FieldIcon size={14} className={cn("transition-colors", isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]")} />}
                        </div>
                        <span className={cn("flex-1 text-xs font-medium text-left transition-colors", isOn ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                          {t(fieldDef.labelKey)}
                        </span>
                        <div className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0", isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]")}>
                          <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform", isOn ? "translate-x-[18px]" : "translate-x-[3px]")} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Extras Section ── */}
      <div className={sectionCard}>
        <div className="mb-5">
          <h3 className={sectionTitle}>{t("config.extras.title")}</h3>
          <p className={sectionDescription}>{t("config.extras.description")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXTRAS_CONFIG.map((extra) => {
            const isOn = extrasEnabled[extra.key] ?? false;
            const ExtraIcon = extra.icon;
            return (
              <button
                key={extra.key}
                type="button"
                onClick={() => handleExtraToggle(extra.key)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-[0.75rem] transition-all cursor-pointer group",
                  isOn
                    ? "bg-[var(--surface-2)] border-l-[3px] border-l-[var(--site-primary)] border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)]"
                    : "bg-[var(--surface-1)] border-l-[3px] border-l-transparent border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)] hover:border-t-[var(--border-default)] hover:border-r-[var(--border-default)] hover:border-b-[var(--border-default)]"
                )}
              >
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors", isOn ? "bg-[rgba(var(--site-primary-rgb),0.12)]" : "bg-[var(--surface-3)]")}>
                  <ExtraIcon size={14} className={cn("transition-colors", isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]")} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className={cn("text-xs font-medium transition-colors block", isOn ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                    {t(extra.labelKey)}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] leading-tight block truncate">
                    {t(extra.hintKey)}
                  </span>
                </div>
                <div className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0", isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]")}>
                  <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform", isOn ? "translate-x-[18px]" : "translate-x-[3px]")} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
