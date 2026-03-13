"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import {
  inputClass, labelClass, fieldHint,
  pageHeader, pageTitle, pageDescription,
  sectionCard, sectionTitle, sectionDescription,
} from "@/components/dashboard/editor-styles";
import { Settings, MessageCircle, Tags, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation, useLanguage } from "@/i18n";

export default function ConfigPage() {
  const { project, save } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();
  const { dictionary } = useLanguage();
  const groupingOptions = ((dictionary.editor as Record<string, Record<string, Record<string, unknown>>>).config.grouping.options) as readonly string[];

  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [etapaLabel, setEtapaLabel] = useState("");
  const [hideNoddoBadge, setHideNoddoBadge] = useState(false);

  useEffect(() => {
    if (!project) return;
    setWhatsappNumero(project.whatsapp_numero || "");
    setEtapaLabel(project.etapa_label || "Etapas");
    setHideNoddoBadge(project.hide_noddo_badge ?? false);
  }, [project]);

  const handleSave = async () => {
    const ok = await save({
      whatsapp_numero: whatsappNumero || null,
      etapa_label: etapaLabel || "Etapas",
      hide_noddo_badge: hideNoddoBadge,
    });
    if (!ok) toast.error(t("general.saveError"));
  };

  /* ── Auto-save ── */
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      <div className={pageHeader}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Settings size={18} className="text-[var(--site-primary)]" />
          </div>
          <div>
            <h2 className={pageTitle}>{t("config.title")}</h2>
            <p className={pageDescription}>
              {t("config.description")}
            </p>
          </div>
        </div>
      </div>

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
    </motion.div>
  );
}
