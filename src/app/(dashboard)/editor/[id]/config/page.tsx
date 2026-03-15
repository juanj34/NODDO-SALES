"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import {
  inputClass, labelClass, fieldHint,
  sectionCard, sectionTitle, sectionDescription,
} from "@/components/dashboard/editor-styles";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { Settings, MessageCircle, Tags, Eye, Car, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation, useLanguage } from "@/i18n";
import type { ComplementoMode } from "@/types";

export default function ConfigPage() {
  const { project, save } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();
  const { dictionary } = useLanguage();
  const groupingOptions = ((dictionary.editor as Record<string, Record<string, Record<string, unknown>>>).config.grouping.options) as readonly string[];

  // Initialize state from project using memo to avoid re-renders
  const initialWhatsapp = useMemo(() => project?.whatsapp_numero || "", [project?.whatsapp_numero]);
  const initialEtapa = useMemo(() => project?.etapa_label || "Etapas", [project?.etapa_label]);
  const initialBadge = useMemo(() => project?.hide_noddo_badge ?? false, [project?.hide_noddo_badge]);
  const initialParqMode = useMemo(() => (project?.parqueaderos_mode ?? "sin_inventario") as ComplementoMode, [project?.parqueaderos_mode]);
  const initialDepoMode = useMemo(() => (project?.depositos_mode ?? "sin_inventario") as ComplementoMode, [project?.depositos_mode]);

  const [whatsappNumero, setWhatsappNumero] = useState(initialWhatsapp);
  const [etapaLabel, setEtapaLabel] = useState(initialEtapa);
  const [hideNoddoBadge, setHideNoddoBadge] = useState(initialBadge);
  const [parqueaderosMode, setParqueaderosMode] = useState<ComplementoMode>(initialParqMode);
  const [depositosMode, setDepositosMode] = useState<ComplementoMode>(initialDepoMode);

  // Sync state when project ID changes (not in effect to avoid warning)
  if (whatsappNumero === "" && initialWhatsapp !== whatsappNumero && project) {
    setWhatsappNumero(initialWhatsapp);
    setEtapaLabel(initialEtapa);
    setHideNoddoBadge(initialBadge);
    setParqueaderosMode(initialParqMode);
    setDepositosMode(initialDepoMode);
  }

  const handleSave = useCallback(async () => {
    const ok = await save({
      whatsapp_numero: whatsappNumero || null,
      etapa_label: etapaLabel || "Etapas",
      hide_noddo_badge: hideNoddoBadge,
      parqueaderos_mode: parqueaderosMode,
      depositos_mode: depositosMode,
    });
    if (!ok) toast.error(t("general.saveError"));
  }, [save, whatsappNumero, etapaLabel, hideNoddoBadge, parqueaderosMode, depositosMode, toast, t]);

  /* ── Auto-save ── */
  const handleSaveRef = useRef(handleSave);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update ref in effect to avoid updating during render
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Page Header */}
      <PageHeader
        icon={Settings}
        title={t("config.title")}
        description={t("config.description")}
      />

      {/* Etiqueta de agrupacion Section */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Tags size={15} className="text-[var(--site-primary)]" />
          {t("config.grouping.title")}
        </div>
        <p className={sectionDescription}>{t("config.grouping.description")}</p>

        <div>
          <label className={labelClass}>{t("config.grouping.label")}</label>
          <input
            type="text"
            list="etapa-label-options"
            value={etapaLabel}
            onChange={(e) => { setEtapaLabel(e.target.value); scheduleAutoSave(); }}
            placeholder={groupingOptions[0]}
            className={inputClass}
          />
          <datalist id="etapa-label-options">
            {groupingOptions.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
          <p className={fieldHint}>
            {t("config.grouping.hint")}
          </p>
        </div>
      </div>

      {/* Contacto Section */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <MessageCircle size={15} className="text-[var(--site-primary)]" />
          {t("config.contact.title")}
        </div>
        <p className={sectionDescription}>{t("config.contact.description")}</p>

        <div>
          <label className={labelClass}>{t("config.contact.whatsapp")}</label>
          <input
            type="text"
            value={whatsappNumero}
            onChange={(e) => { setWhatsappNumero(e.target.value); scheduleAutoSave(); }}
            placeholder={t("config.contact.whatsappPlaceholder")}
            className={inputClass}
          />
          <p className={fieldHint}>
            {t("config.contact.whatsappHint")}
          </p>
        </div>
      </div>

      {/* Badge Powered by Noddo Section */}
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

      {/* Complementos: Parqueaderos & Depósitos Modes */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Car size={15} className="text-[var(--site-primary)]" />
          Parqueaderos
        </div>
        <p className={sectionDescription}>
          Define cómo se manejan los parqueaderos en este proyecto.
        </p>
        <div className="grid gap-3">
          {([
            { value: "sin_inventario" as ComplementoMode, label: "Sin inventario", desc: "Cantidad por unidad, incluido en el precio" },
            { value: "inventario_incluido" as ComplementoMode, label: "Inventario incluido", desc: "Items individuales asignables, precio incluido en la unidad" },
            { value: "inventario_separado" as ComplementoMode, label: "Inventario separado", desc: "Items individuales con precio propio que suma al total" },
          ]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setParqueaderosMode(opt.value); scheduleAutoSave(); }}
              className={`text-left p-3 rounded-[0.75rem] border transition-all cursor-pointer ${
                parqueaderosMode === opt.value
                  ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.08)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                  parqueaderosMode === opt.value
                    ? "border-[var(--site-primary)]"
                    : "border-[var(--border-default)]"
                }`}>
                  {parqueaderosMode === opt.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--site-primary)]" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  parqueaderosMode === opt.value ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                }`}>{opt.label}</span>
              </div>
              <p className="mt-1 ml-5.5 text-xs text-[var(--text-tertiary)]">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Package size={15} className="text-[var(--site-primary)]" />
          Depósitos
        </div>
        <p className={sectionDescription}>
          Define cómo se manejan los depósitos / útiles en este proyecto.
        </p>
        <div className="grid gap-3">
          {([
            { value: "sin_inventario" as ComplementoMode, label: "Sin inventario", desc: "Cantidad por unidad, incluido en el precio" },
            { value: "inventario_incluido" as ComplementoMode, label: "Inventario incluido", desc: "Items individuales asignables, precio incluido en la unidad" },
            { value: "inventario_separado" as ComplementoMode, label: "Inventario separado", desc: "Items individuales con precio propio que suma al total" },
          ]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setDepositosMode(opt.value); scheduleAutoSave(); }}
              className={`text-left p-3 rounded-[0.75rem] border transition-all cursor-pointer ${
                depositosMode === opt.value
                  ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.08)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                  depositosMode === opt.value
                    ? "border-[var(--site-primary)]"
                    : "border-[var(--border-default)]"
                }`}>
                  {depositosMode === opt.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--site-primary)]" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  depositosMode === opt.value ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                }`}>{opt.label}</span>
              </div>
              <p className="mt-1 ml-5.5 text-xs text-[var(--text-tertiary)]">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
