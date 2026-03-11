"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import { FileUploader } from "@/components/dashboard/FileUploader";
import {
  inputClass,
  labelClass,
  fieldHint,
  sectionCard,
  sectionTitle,
  sectionDescription,
  pageHeader,
  pageTitle,
  pageDescription,
} from "@/components/dashboard/editor-styles";
import {
  Building2,
  Briefcase,
  Palette,
  Home,
  Settings2,
  Film,
  Trash2,
  Link2,
  Globe,
  Share2,
  Scale,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/i18n";

type GeneralTab = "proyecto" | "inicio" | "constructora" | "diseno" | "avanzado";

const tabDefs: { id: GeneralTab; labelKey: string; icon: typeof Building2 }[] = [
  { id: "proyecto", labelKey: "general.tabs.project", icon: Building2 },
  { id: "inicio", labelKey: "general.tabs.landing", icon: Home },
  { id: "constructora", labelKey: "general.tabs.developer", icon: Briefcase },
  { id: "diseno", labelKey: "general.tabs.design", icon: Palette },
  { id: "avanzado", labelKey: "general.tabs.advanced", icon: Settings2 },
];

export default function EditorGeneralPage() {
  const { project, saving, save, projectId } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<GeneralTab>("proyecto");
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [constructoraNombre, setConstructoraNombre] = useState("");
  const [colorPrimario, setColorPrimario] = useState("#D4A574");
  const [colorSecundario, setColorSecundario] = useState("#ffffff");
  const [colorFondo, setColorFondo] = useState("#0a0a0a");
  const [estado, setEstado] = useState<"borrador" | "publicado" | "archivado">("borrador");
  const [disclaimer, setDisclaimer] = useState("");
  const [politicaPrivacidadUrl, setPoliticaPrivacidadUrl] = useState("");
  const [renderPrincipalUrl, setRenderPrincipalUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [constructoraLogoUrl, setConstructoraLogoUrl] = useState("");
  const [constructoraWebsite, setConstructoraWebsite] = useState("");
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");

  useEffect(() => {
    if (!project) return;
    setNombre(project.nombre || "");
    setSlug(project.slug || "");
    setDescripcion(project.descripcion || "");
    setConstructoraNombre(project.constructora_nombre || "");
    setColorPrimario(project.color_primario || "#D4A574");
    setColorSecundario(project.color_secundario || "#ffffff");
    setColorFondo(project.color_fondo || "#0a0a0a");
    setEstado(project.estado || "borrador");
    setDisclaimer(project.disclaimer || "");
    setPoliticaPrivacidadUrl(project.politica_privacidad_url || "");
    setRenderPrincipalUrl(project.render_principal_url || "");
    setLogoUrl(project.logo_url || "");
    setConstructoraLogoUrl(project.constructora_logo_url || "");
    setConstructoraWebsite(project.constructora_website || "");
    setHeroVideoUrl(project.hero_video_url || "");
    setFaviconUrl(project.favicon_url || "");
    setOgImageUrl(project.og_image_url || "");
  }, [project]);

  const handleSave = async () => {
    const ok = await save({
      nombre,
      slug,
      descripcion: descripcion || null,
      constructora_nombre: constructoraNombre || null,
      color_primario: colorPrimario,
      color_secundario: colorSecundario,
      color_fondo: colorFondo,
      estado,
      disclaimer,
      politica_privacidad_url: politicaPrivacidadUrl || null,
      render_principal_url: renderPrincipalUrl || null,
      hero_video_url: heroVideoUrl || null,
      logo_url: logoUrl || null,
      constructora_logo_url: constructoraLogoUrl || null,
      constructora_website: constructoraWebsite || null,
      favicon_url: faviconUrl || null,
      og_image_url: ogImageUrl || null,
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

  // Save pending changes on unmount
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
      className="max-w-4xl mx-auto"
    >
      {/* Page Header */}
      <div className={pageHeader}>
        <div>
          <h2 className={pageTitle}>{t("general.title")}</h2>
          <p className={pageDescription}>
            {t("general.description")}
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] mb-6">
        {tabDefs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <Icon size={14} />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {/* ═══ Proyecto ═══ */}
          {activeTab === "proyecto" && (
            <div className={sectionCard}>
              <h3 className={sectionTitle}>
                <Building2 size={15} className="text-[var(--site-primary)]" />
                {t("general.project.title")}
              </h3>
              <p className={sectionDescription}>
                {t("general.project.description")}
              </p>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>{t("general.project.name")}</label>
                  <input type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); scheduleAutoSave(); }} className={inputClass} placeholder={t("general.project.namePlaceholder")} />
                </div>

                <div>
                  <label className={labelClass}>{t("general.project.slug")}</label>
                  <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); scheduleAutoSave(); }} className={inputClass} placeholder={t("general.project.slugPlaceholder")} />
                  <p className={fieldHint}>{t("general.project.slugHint", { slug: slug || "your-project" })}</p>
                </div>

                <div>
                  <label className={labelClass}>{t("general.project.stateLabel")}</label>
                  <select value={estado} onChange={(e) => { setEstado(e.target.value as typeof estado); scheduleAutoSave(); }} className={inputClass}>
                    <option value="borrador">{t("general.project.stateDraft")}</option>
                    <option value="publicado">{t("general.project.statePublished")}</option>
                    <option value="archivado">{t("general.project.stateArchived")}</option>
                  </select>
                  <p className={fieldHint}>{t("general.project.stateHint")}</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Página de Inicio ═══ */}
          {activeTab === "inicio" && (
            <div className={sectionCard}>
              <h3 className={sectionTitle}>
                <Home size={15} className="text-[var(--site-primary)]" />
                {t("general.landing.title")}
              </h3>
              <p className={sectionDescription}>
                {t("general.landing.description")}
              </p>

              <div className="space-y-5">
                {/* Hero render */}
                <div>
                  <label className={labelClass}>{t("general.landing.heroRender")}</label>
                  <FileUploader currentUrl={renderPrincipalUrl || null} onUpload={(url) => { setRenderPrincipalUrl(url); scheduleAutoSave(); }} folder={`proyectos/${projectId}`} label={t("general.landing.uploadHero")} cropAspect={16 / 9} />
                  <p className={fieldHint}>{t("general.landing.heroHint")}</p>
                </div>

                {/* Logo + Video side by side */}
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>{t("general.landing.logo")}</label>
                    <FileUploader currentUrl={logoUrl || null} onUpload={(url) => { setLogoUrl(url); scheduleAutoSave(); }} folder={`proyectos/${projectId}`} label={t("general.landing.uploadLogo")} aspect="logo" />
                    <p className={fieldHint}>{t("general.landing.logoHint")}</p>
                  </div>

                  <div>
                    <label className={labelClass}>
                      <Film size={14} className="inline mr-1.5 -mt-0.5" />
                      {t("general.landing.heroVideo")}
                    </label>
                    {heroVideoUrl ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-[var(--border-default)]">
                        <video
                          src={heroVideoUrl}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          autoPlay
                        />
                        <button
                          onClick={() => { setHeroVideoUrl(""); scheduleAutoSave(); }}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <FileUploader
                        currentUrl={null}
                        onUpload={(url) => { setHeroVideoUrl(url); scheduleAutoSave(); }}
                        folder={`proyectos/${projectId}`}
                        label={t("general.landing.uploadHeroVideo")}
                        accept="video/mp4,video/webm"
                        enablePaste={false}
                      />
                    )}
                    <p className={fieldHint}>{t("general.landing.heroVideoHint")}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={labelClass}>{t("general.landing.descriptionLabel")}</label>
                  <textarea value={descripcion} onChange={(e) => { setDescripcion(e.target.value); scheduleAutoSave(); }} rows={3} className={inputClass + " resize-none"} placeholder={t("general.landing.descriptionPlaceholder")} />
                  <p className={fieldHint}>{t("general.landing.descriptionHint")}</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Constructora ═══ */}
          {activeTab === "constructora" && (
            <div className={sectionCard}>
              <h3 className={sectionTitle}>
                <Briefcase size={15} className="text-[var(--site-primary)]" />
                {t("general.developer.title")}
              </h3>
              <p className={sectionDescription}>
                {t("general.developer.description")}
              </p>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>{t("general.developer.name")}</label>
                  <input type="text" value={constructoraNombre} onChange={(e) => { setConstructoraNombre(e.target.value); scheduleAutoSave(); }} className={inputClass} placeholder={t("general.developer.namePlaceholder")} />
                </div>

                <div>
                  <label className={labelClass}>{t("general.developer.logo")}</label>
                  <div className="max-w-sm">
                    <FileUploader currentUrl={constructoraLogoUrl || null} onUpload={(url) => { setConstructoraLogoUrl(url); scheduleAutoSave(); }} folder={`proyectos/${projectId}`} label={t("general.developer.uploadLogo")} aspect="logo" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    <Link2 size={14} className="inline mr-1.5 -mt-0.5" />
                    {t("general.developer.website")}
                  </label>
                  <input type="url" value={constructoraWebsite} onChange={(e) => { setConstructoraWebsite(e.target.value); scheduleAutoSave(); }} className={inputClass} placeholder={t("general.developer.websitePlaceholder")} />
                  <p className={fieldHint}>{t("general.developer.websiteHint")}</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Diseño ═══ */}
          {activeTab === "diseno" && (
            <div className={sectionCard}>
              <h3 className={sectionTitle}>
                <Palette size={15} className="text-[var(--site-primary)]" />
                {t("general.design.title")}
              </h3>
              <p className={sectionDescription}>
                {t("general.design.description")}
              </p>

              <div className="grid grid-cols-3 gap-5">
                {[
                  { label: t("general.design.primary"), value: colorPrimario, set: setColorPrimario, hint: t("general.design.primaryHint") },
                  { label: t("general.design.secondary"), value: colorSecundario, set: setColorSecundario, hint: t("general.design.secondaryHint") },
                  { label: t("general.design.background"), value: colorFondo, set: setColorFondo, hint: t("general.design.backgroundHint") },
                ].map((c) => (
                  <div key={c.label}>
                    <label className={labelClass}>{c.label}</label>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-lg border border-[var(--border-default)] cursor-pointer shrink-0 relative overflow-hidden"
                        style={{ backgroundColor: c.value }}
                      >
                        <input
                          type="color"
                          value={c.value}
                          onChange={(e) => { c.set(e.target.value); scheduleAutoSave(); }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                      <input type="text" value={c.value} onChange={(e) => c.set(e.target.value)} className={inputClass} />
                    </div>
                    <p className={fieldHint}>{c.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Avanzado (SEO + Legal) ═══ */}
          {activeTab === "avanzado" && (
            <div className="space-y-6">
              {/* SEO & Social */}
              <div className={sectionCard}>
                <h3 className={sectionTitle}>
                  <Globe size={15} className="text-[var(--site-primary)]" />
                  {t("general.advanced.seoTitle")}
                </h3>
                <p className={sectionDescription}>
                  {t("general.advanced.seoDescription")}
                </p>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>
                      <Globe size={14} className="inline mr-1.5 -mt-0.5" />
                      {t("general.advanced.favicon")}
                    </label>
                    <FileUploader currentUrl={faviconUrl || null} onUpload={(url) => { setFaviconUrl(url); scheduleAutoSave(); }} folder={`proyectos/${projectId}`} label={t("general.advanced.uploadFavicon")} cropAspect={1} />
                    <p className={fieldHint}>{t("general.advanced.faviconHint")}</p>
                  </div>

                  <div>
                    <label className={labelClass}>
                      <Share2 size={14} className="inline mr-1.5 -mt-0.5" />
                      {t("general.advanced.ogImage")}
                    </label>
                    <FileUploader currentUrl={ogImageUrl || null} onUpload={(url) => { setOgImageUrl(url); scheduleAutoSave(); }} folder={`proyectos/${projectId}`} label={t("general.advanced.uploadOgImage")} cropAspect={1200 / 630} />
                    <p className={fieldHint}>{t("general.advanced.ogImageHint")}</p>
                  </div>
                </div>
              </div>

              {/* Legal */}
              <div className={sectionCard}>
                <h3 className={sectionTitle}>
                  <Scale size={15} className="text-[var(--site-primary)]" />
                  {t("general.advanced.legalTitle")}
                </h3>
                <p className={sectionDescription}>
                  {t("general.advanced.legalDescription")}
                </p>

                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>{t("general.advanced.disclaimer")}</label>
                    <textarea value={disclaimer} onChange={(e) => { setDisclaimer(e.target.value); scheduleAutoSave(); }} rows={3} className={inputClass + " resize-none"} placeholder={t("general.advanced.disclaimerPlaceholder")} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      <Link2 size={14} className="inline mr-1.5 -mt-0.5" />
                      {t("general.advanced.privacyPolicy")}
                    </label>
                    <input type="url" value={politicaPrivacidadUrl} onChange={(e) => { setPoliticaPrivacidadUrl(e.target.value); scheduleAutoSave(); }} className={inputClass} placeholder={t("general.advanced.privacyPolicyPlaceholder")} />
                    <p className={fieldHint}>{t("general.advanced.privacyPolicyHint")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
