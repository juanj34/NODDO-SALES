"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import {
  inputClass, labelClass, fieldHint,
  pageHeader, pageTitle, pageDescription,
  sectionCard, sectionTitle, sectionDescription,
} from "@/components/dashboard/editor-styles";
import { Settings, MessageCircle, View, Tags, Music, Eye, Trash2, Upload, Loader2, ExternalLink } from "lucide-react";
import { extractTourUrl } from "@/lib/tour-utils";
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
  const [tour360RawInput, setTour360RawInput] = useState("");
  const [etapaLabel, setEtapaLabel] = useState("");
  const [backgroundAudioUrl, setBackgroundAudioUrl] = useState("");
  const [hideNoddoBadge, setHideNoddoBadge] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!project) return;
    setWhatsappNumero(project.whatsapp_numero || "");
    setTour360Url(project.tour_360_url || "");
    setTour360RawInput(project.tour_360_url || "");
    setEtapaLabel(project.etapa_label || "Etapas");
    setBackgroundAudioUrl(project.background_audio_url || "");
    setHideNoddoBadge(project.hide_noddo_badge ?? false);
  }, [project]);

  const handleSave = async () => {
    const ok = await save({
      whatsapp_numero: whatsappNumero || null,
      tour_360_url: tour360Url || null,
      etapa_label: etapaLabel || "Etapas",
      background_audio_url: backgroundAudioUrl || null,
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

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audioInputRef.current) audioInputRef.current.value = "";

    setAudioUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "media");
      formData.append("folder", "audio");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al subir");
      }
      const { url } = await res.json();
      setBackgroundAudioUrl(url);
      scheduleAutoSave();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir audio");
    } finally {
      setAudioUploading(false);
    }
  };

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
          <label className={labelClass}>{t("config.tour.urlLabel")}</label>
          <input
            type="text"
            value={tour360RawInput}
            onChange={(e) => {
              const raw = e.target.value;
              setTour360RawInput(raw);
              setTour360Url(extractTourUrl(raw));
              scheduleAutoSave();
            }}
            placeholder={t("config.tour.urlPlaceholder")}
            className={inputClass}
          />
          <p className={fieldHint}>
            {t("config.tour.urlHint")}
          </p>
        </div>

        {/* Preview */}
        {tour360Url && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-tertiary)]">{t("config.tour.preview")}</span>
              <a
                href={tour360Url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--site-primary)] hover:underline flex items-center gap-1"
              >
                <ExternalLink size={11} />
                {t("config.tour.openInTab")}
              </a>
            </div>
            <div className="w-full h-[220px] rounded-xl overflow-hidden border border-[var(--border-subtle)]">
              <iframe
                src={tour360Url}
                className="w-full h-full border-0"
                allowFullScreen
                title="Tour 360 preview"
              />
            </div>
          </div>
        )}
      </div>

      {/* Audio de fondo Section */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Music size={15} className="text-[var(--site-primary)]" />
          {t("config.audio.title")}
        </div>
        <p className={sectionDescription}>{t("config.audio.description")}</p>

        {backgroundAudioUrl ? (
          <div className="flex items-center gap-3">
            <audio controls src={backgroundAudioUrl} className="flex-1 h-10 rounded-lg" />
            <button
              onClick={() => { setBackgroundAudioUrl(""); scheduleAutoSave(); }}
              className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => audioInputRef.current?.click()}
              disabled={audioUploading}
              className="btn-outline-warm px-4 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
            >
              {audioUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {t("config.audio.upload")}
            </button>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4"
              onChange={handleAudioUpload}
              className="hidden"
            />
          </div>
        )}
        <p className={fieldHint}>{t("config.audio.hint")}</p>
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
