"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import {
  inputClass, labelClass, fieldHint,
  sectionCard, sectionTitle, sectionDescription,
} from "@/components/dashboard/editor-styles";
import {
  MessageCircle, Tags,
  Link2, Building2, Home, MapPin, Layers,
  DollarSign,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation, useLanguage } from "@/i18n";
import { cn } from "@/lib/utils";

export default function GeneralTab() {
  const { project, save } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();
  const { confirm } = useConfirm();
  const { dictionary } = useLanguage();
  const groupingOptions = ((dictionary.editor as Record<string, Record<string, Record<string, unknown>>>).config.grouping.options) as readonly string[];

  /* ── State ── */
  const [slug, setSlug] = useState("");
  const [tipoProyecto, setTipoProyecto] = useState<"apartamentos" | "casas" | "hibrido" | "lotes">("hibrido");
  const [tipologiaMode, setTipologiaMode] = useState<"fija" | "multiple">("fija");
  const [precioSource, setPrecioSource] = useState<"unidad" | "tipologia">("unidad");
  const [etapaLabel, setEtapaLabel] = useState("Grid");
  const [unitPrefix, setUnitPrefix] = useState("");
  const [whatsappNumero, setWhatsappNumero] = useState("");

  const hasPendingSave = useRef(false);

  /* ── Sync from project (skip if local edits are pending) ── */
  useEffect(() => {
    if (!project) return;
    if (hasPendingSave.current) return;
    setSlug(project.slug || "");
    setTipoProyecto(project.tipo_proyecto || "hibrido");
    setTipologiaMode(project.tipologia_mode || "fija");
    setPrecioSource((project.precio_source ?? "unidad") as "unidad" | "tipologia");
    setEtapaLabel(project.etapa_label || "Grid");
    setUnitPrefix(project.unidad_display_prefix || "");
    setWhatsappNumero(project.whatsapp_numero || "");
  }, [project]);

  /* ── Save handler ── */
  const handleSave = useCallback(async () => {
    const ok = await save({
      slug,
      tipo_proyecto: tipoProyecto,
      tipologia_mode: tipologiaMode,
      precio_source: precioSource,
      etapa_label: etapaLabel || "Grid",
      unidad_display_prefix: unitPrefix || null,
      whatsapp_numero: whatsappNumero || null,
    } as any);
    hasPendingSave.current = false;
    if (!ok) toast.error(t("general.saveError"));
  }, [save, slug, tipoProyecto, tipologiaMode, precioSource, etapaLabel, unitPrefix, whatsappNumero, toast, t]);

  /* ── Auto-save ── */
  const handleSaveRef = useRef(handleSave);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const scheduleAutoSave = useCallback(() => {
    hasPendingSave.current = true;
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

  /* ── Tipo de proyecto change with confirmation ── */
  const handleTipoProyectoChange = useCallback(async (newTipo: typeof tipoProyecto) => {
    if (newTipo === tipoProyecto) return;

    const hasData = (project?.unidades?.length ?? 0) > 0 || (project?.torres?.length ?? 0) > 0;

    if (hasData) {
      const ok = await confirm({
        title: t("config.projectType.changeTitle"),
        message: t("config.projectType.changeMessage"),
        confirmLabel: t("config.projectType.changeConfirm"),
        cancelLabel: t("config.projectType.changeCancel"),
        variant: "warning",
      });
      if (!ok) return;
    }

    setTipoProyecto(newTipo);
    // Reset inventory columns when project type changes (saved to DB so InventarioTab picks up defaults)
    save({
      tipo_proyecto: newTipo,
      inventory_columns: null,
      inventory_columns_by_type: null,
      inventory_columns_microsite: null,
      inventory_columns_microsite_by_type: null,
    } as any);
  }, [tipoProyecto, project?.unidades?.length, project?.torres?.length, confirm, t, save]);

  return (
    <div className="max-w-4xl space-y-8">
      {/* ═══ URL del Micrositio (Slug) ═══ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Link2 size={15} className="text-[var(--site-primary)]" />
          {t("config.slug.title")}
        </div>
        <p className={sectionDescription}>{t("config.slug.description")}</p>

        <div>
          <label className={labelClass}>{t("config.slug.label")}</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); scheduleAutoSave(); }}
            placeholder={t("config.slug.placeholder")}
            className={inputClass}
          />
          <p className={fieldHint}>
            {t("config.slug.hint", { slug: slug || "tu-proyecto" })}
          </p>
        </div>
      </div>

      {/* ═══ Tipo de Proyecto ═══ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Building2 size={15} className="text-[var(--site-primary)]" />
          {t("config.projectType.title")}
        </div>
        <p className={sectionDescription}>{t("config.projectType.description")}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { id: "apartamentos" as const, icon: Building2, labelKey: "config.projectType.apartamentos", descKey: "config.projectType.apartamentosDesc" },
            { id: "casas" as const, icon: Home, labelKey: "config.projectType.casas", descKey: "config.projectType.casasDesc" },
            { id: "lotes" as const, icon: MapPin, labelKey: "config.projectType.lotes", descKey: "config.projectType.lotesDesc" },
            { id: "hibrido" as const, icon: Layers, labelKey: "config.projectType.hibrido", descKey: "config.projectType.hibridoDesc" },
          ]).map((tipo) => {
            const isActive = tipoProyecto === tipo.id;
            const Icon = tipo.icon;
            return (
              <button
                key={tipo.id}
                type="button"
                onClick={() => handleTipoProyectoChange(tipo.id)}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-xl border transition-all text-left",
                  isActive
                    ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)]"
                    : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                )}
              >
                <Icon size={18} className={cn("shrink-0", isActive ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} />
                <div>
                  <p className={cn("text-xs font-medium", isActive ? "text-white" : "text-[var(--text-secondary)]")}>
                    {t(tipo.labelKey)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {t(tipo.descKey)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <p className={fieldHint}>{t("config.projectType.hint")}</p>
      </div>

      {/* ═══ Modo de Tipología (conditional) ═══ */}
      <AnimatePresence mode="wait">
        {(tipoProyecto === "casas" || tipoProyecto === "hibrido" || tipoProyecto === "lotes") && (
          <motion.div
            key="tipologia-mode"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={sectionCard}>
              <div className={sectionTitle}>
                <Layers size={15} className="text-[var(--site-primary)]" />
                {t("config.tipologiaMode.title")}
              </div>
              <p className={sectionDescription}>{t("config.tipologiaMode.description")}</p>

              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: "fija" as const, labelKey: "config.tipologiaMode.fija", descKey: "config.tipologiaMode.fijaDesc" },
                  { id: "multiple" as const, labelKey: "config.tipologiaMode.multiple", descKey: "config.tipologiaMode.multipleDesc" },
                ]).map((mode) => {
                  const isActive = tipologiaMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => { setTipologiaMode(mode.id); scheduleAutoSave(); }}
                      className={cn(
                        "flex flex-col gap-1.5 p-3 rounded-xl border transition-all text-left",
                        isActive
                          ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)]"
                          : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                      )}
                    >
                      <p className={cn("text-xs font-medium", isActive ? "text-white" : "text-[var(--text-secondary)]")}>
                        {t(mode.labelKey)}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        {t(mode.descKey)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Fuente de Precios ═══ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <DollarSign size={15} className="text-[var(--site-primary)]" />
          {t("config.precioSource.title")}
        </div>
        <p className={sectionDescription}>{t("config.precioSource.description")}</p>

        <div className="grid grid-cols-2 gap-2">
          {([
            { id: "unidad" as const, labelKey: "config.precioSource.unidad", descKey: "config.precioSource.unidadDesc" },
            { id: "tipologia" as const, labelKey: "config.precioSource.tipologia", descKey: "config.precioSource.tipologiaDesc" },
          ]).map((mode) => {
            const isActive = precioSource === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => { setPrecioSource(mode.id); scheduleAutoSave(); }}
                className={cn(
                  "flex flex-col gap-1.5 p-3 rounded-xl border transition-all text-left",
                  isActive
                    ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)]"
                    : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                )}
              >
                <p className={cn("text-xs font-medium", isActive ? "text-white" : "text-[var(--text-secondary)]")}>
                  {t(mode.labelKey)}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {t(mode.descKey)}
                </p>
              </button>
            );
          })}
        </div>
        <p className={fieldHint}>{t("config.precioSource.hint")}</p>
      </div>

      {/* ═══ Etiqueta de agrupación ═══ */}
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

        <div>
          <label className={labelClass}>Prefijo de unidades</label>
          <input
            type="text"
            list="unit-prefix-options"
            value={unitPrefix}
            onChange={(e) => { setUnitPrefix(e.target.value); scheduleAutoSave(); }}
            placeholder="Ej: Casa, Apto, Lote"
            className={inputClass}
          />
          <datalist id="unit-prefix-options">
            {["Casa", "Villa", "Apartamento", "Lote", "Unidad", "Local", "Oficina", "Bodega"].map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
          <p className={fieldHint}>
            Se muestra antes del identificador en el micrositio. Ej: &quot;Casa 19&quot;
          </p>
        </div>
      </div>

      {/* ═══ Contacto ═══ */}
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
    </div>
  );
}
