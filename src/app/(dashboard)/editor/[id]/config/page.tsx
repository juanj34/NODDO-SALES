"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import {
  inputClass, labelClass, fieldHint,
  pageHeader, pageTitle, pageDescription,
  sectionCard, sectionTitle, sectionDescription,
} from "@/components/dashboard/editor-styles";
import { Settings, MessageCircle, View, Tags } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation, useLanguage } from "@/i18n";

export default function ConfigPage() {
  const { project, saving, save } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();
  const { dictionary } = useLanguage();
  const groupingOptions = ((dictionary.editor as Record<string, Record<string, Record<string, unknown>>>).config.grouping.options) as readonly string[];

  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [tour360Url, setTour360Url] = useState("");
  const [etapaLabel, setEtapaLabel] = useState("");

  useEffect(() => {
    if (!project) return;
    setWhatsappNumero(project.whatsapp_numero || "");
    setTour360Url(project.tour_360_url || "");
    setEtapaLabel(project.etapa_label || "Etapas");
  }, [project]);

  const handleSave = async () => {
    const ok = await save({
      whatsapp_numero: whatsappNumero || null,
      tour_360_url: tour360Url || null,
      etapa_label: etapaLabel || "Etapas",
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

      {/* Tour Virtual Section */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <View size={15} className="text-[var(--site-primary)]" />
          {t("config.tour.title")}
        </div>
        <p className={sectionDescription}>{t("config.tour.description")}</p>

        <div>
          <label className={labelClass}>{t("config.tour.matterportUrl")}</label>
          <input
            type="url"
            value={tour360Url}
            onChange={(e) => { setTour360Url(e.target.value); scheduleAutoSave(); }}
            placeholder={t("config.tour.matterportPlaceholder")}
            className={inputClass}
          />
          <p className={fieldHint}>
            {t("config.tour.matterportHint")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
