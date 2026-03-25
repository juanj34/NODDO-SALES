"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import {
  inputClass,
  labelClass,
  fieldHint,
  sectionCard,
  sectionTitle,
  sectionDescription,
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
  Share2,
  Scale,
  Fingerprint,
  Globe,
  Music,
  Upload,
  Loader2,
  Sun,
  Moon,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/i18n";
import { proyectoGeneralSchema } from "@/lib/validation/schemas";
import { InlineError } from "@/components/ui/ErrorBoundary";
import { ZodError } from "zod";
import { AITextImprover } from "@/components/dashboard/AITextImprover";

type GeneralTab = "proyecto" | "inicio" | "constructora" | "diseno" | "avanzado";

const tabDefs: { id: GeneralTab; labelKey: string; icon: typeof Building2 }[] = [
  { id: "proyecto", labelKey: "general.tabs.project", icon: Building2 },
  { id: "inicio", labelKey: "general.tabs.landing", icon: Home },
  { id: "constructora", labelKey: "general.tabs.developer", icon: Briefcase },
  { id: "diseno", labelKey: "general.tabs.design", icon: Palette },
  { id: "avanzado", labelKey: "general.tabs.advanced", icon: Settings2 },
];

export default function EditorGeneralPage() {
  const { project, save, projectId } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<GeneralTab>("proyecto");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [constructoraNombre, setConstructoraNombre] = useState("");
  const [colorPrimario, setColorPrimario] = useState("#b8973a");
  const [colorSecundario, setColorSecundario] = useState("#ffffff");
  const [colorFondo, setColorFondo] = useState("#0a0a0a");
  const [temaModo, setTemaModo] = useState<"oscuro" | "claro">("oscuro");
  const [disclaimer, setDisclaimer] = useState("");
  const [politicaPrivacidadUrl, setPoliticaPrivacidadUrl] = useState("");
  const [renderPrincipalUrl, setRenderPrincipalUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [constructoraLogoUrl, setConstructoraLogoUrl] = useState("");
  const [constructoraWebsite, setConstructoraWebsite] = useState("");
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [backgroundAudioUrl, setBackgroundAudioUrl] = useState("");
  const [brochureUrl, setBrochureUrl] = useState("");
  const [audioUploading, setAudioUploading] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [idioma, setIdioma] = useState<"es" | "en">("es");
  const [logoHeight, setLogoHeight] = useState(96);

  // Only populate state from project data ONCE on initial mount.
  // Re-running on every React Query cache update would overwrite unsaved local edits.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!project || initializedRef.current) return;
    initializedRef.current = true;
    setNombre(project.nombre || "");
    setDescripcion(project.descripcion || "");
    setConstructoraNombre(project.constructora_nombre || "");
    setColorPrimario(project.color_primario || "#b8973a");
    setColorSecundario(project.color_secundario || "#ffffff");
    setColorFondo(project.color_fondo || "#0a0a0a");
    setTemaModo((project.tema_modo as "oscuro" | "claro") || "oscuro");
    setDisclaimer(project.disclaimer || "");
    setPoliticaPrivacidadUrl(project.politica_privacidad_url || "");
    setRenderPrincipalUrl(project.render_principal_url || "");
    setLogoUrl(project.logo_url || "");
    setLogoHeight(project.logo_height ?? 96);
    setConstructoraLogoUrl(project.constructora_logo_url || "");
    setConstructoraWebsite(project.constructora_website || "");
    setHeroVideoUrl(project.hero_video_url || "");
    setFaviconUrl(project.favicon_url || "");
    setOgImageUrl(project.og_image_url || "");
    setBackgroundAudioUrl(project.background_audio_url || "");
    setBrochureUrl(project.brochure_url || "");
    setIdioma(project.idioma || "es");
  }, [project]);

  const handleSave = async () => {
    if (!initializedRef.current) return; // Don't save before project data is loaded
    setValidationError(null);

    const payload = {
      nombre,
      descripcion: descripcion || null,
      constructora_nombre: constructoraNombre || null,
      color_primario: colorPrimario,
      color_secundario: colorSecundario,
      color_fondo: colorFondo,
      tema_modo: temaModo,
      disclaimer,
      politica_privacidad_url: politicaPrivacidadUrl || null,
      render_principal_url: renderPrincipalUrl || null,
      hero_video_url: heroVideoUrl || null,
      logo_url: logoUrl || null,
      logo_height: logoHeight,
      constructora_logo_url: constructoraLogoUrl || null,
      constructora_website: constructoraWebsite || null,
      favicon_url: faviconUrl || null,
      og_image_url: ogImageUrl || null,
      background_audio_url: backgroundAudioUrl || null,
      brochure_url: brochureUrl || null,
      idioma,
    };

    try {
      // Validate fields managed by this page (slug/tipo_proyecto are now in Config)
      proyectoGeneralSchema.partial().parse(payload);

      const ok = await save(payload);
      if (!ok) toast.error(t("general.saveError"));
    } catch (err) {
      if (err instanceof ZodError) {
        const zodError = err as ZodError;
        if (zodError.issues?.length > 0) {
          setValidationError(zodError.issues[0].message);
          toast.error(zodError.issues[0].message);
        }
      }
    }
  };

  /* ── Auto-save ── */
  const handleSaveRef = useRef(handleSave);
  useEffect(() => { handleSaveRef.current = handleSave; });
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
        throw new Error(data.error || t("errors.saveError"));
      }
      const { url } = await res.json();
      setBackgroundAudioUrl(url);
      scheduleAutoSave();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.saveError"));
    } finally {
      setAudioUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Page Header */}
      <PageHeader
        icon={Building2}
        title={t("general.title")}
        description={t("general.description")}
      />

      {/* Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] mb-6 overflow-x-auto scrollbar-hide">
        {tabDefs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.08em] transition-all shrink-0 whitespace-nowrap ${
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

      {/* Validation Error */}
      {validationError && (
        <InlineError
          message={validationError}
          onRetry={() => setValidationError(null)}
          variant="compact"
        />
      )}

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
            <div className="space-y-6">
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
                </div>
              </div>

              {/* Site Identity */}
              <div className={sectionCard}>
                <h3 className={sectionTitle}>
                  <Fingerprint size={15} className="text-[var(--site-primary)]" />
                  {t("general.landing.identity.title")}
                </h3>
                <p className={sectionDescription}>
                  {t("general.landing.identity.description")}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-6 items-start">
                  {/* Favicon / Site Icon */}
                  <div>
                    <label className={labelClass}>
                      <Globe size={14} className="inline mr-1.5 -mt-0.5" />
                      {t("general.landing.identity.favicon")}
                    </label>
                    <FileUploader currentUrl={faviconUrl || null} onUpload={(url) => { setFaviconUrl(url); scheduleAutoSave(); }} folder={`proyectos/${projectId}`} label={t("general.landing.identity.uploadFavicon")} cropAspect={1} aspect="square" />
                    <p className={fieldHint}>{t("general.landing.identity.faviconHint")}</p>
                  </div>

                  {/* OG Image */}
                  <div>
                    <label className={labelClass}>
                      <Share2 size={14} className="inline mr-1.5 -mt-0.5" />
                      {t("general.landing.identity.ogImage")}
                    </label>
                    <FileUploader currentUrl={ogImageUrl || null} onUpload={(url) => { setOgImageUrl(url); scheduleAutoSave(); }} folder={`proyectos/${projectId}`} label={t("general.landing.identity.uploadOgImage")} cropAspect={1200 / 630} />
                    <p className={fieldHint}>{t("general.landing.identity.ogImageHint")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Página de Inicio ═══ */}
          {activeTab === "inicio" && (
            <div className="space-y-6">
              {/* Landing Page Content */}
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

                      {/* Logo Size Control */}
                      {logoUrl && (
                        <div className="mt-4 space-y-2">
                          <label className={labelClass + " flex items-center justify-between"}>
                            <span>{t("general.landing.logoSize")}</span>
                            <span className="text-[var(--text-tertiary)] font-mono text-xs">{logoHeight}px</span>
                          </label>
                          <input
                            type="range"
                            min={40}
                            max={240}
                            value={logoHeight}
                            onChange={(e) => { setLogoHeight(Number(e.target.value)); scheduleAutoSave(); }}
                            className="w-full h-1.5 bg-[var(--surface-3)] rounded-lg appearance-none cursor-pointer accent-[var(--site-primary)] hover:accent-[#d4b05a] transition-colors"
                            style={{
                              background: `linear-gradient(to right, var(--site-primary) 0%, var(--site-primary) ${((logoHeight - 40) / (240 - 40)) * 100}%, var(--surface-3) ${((logoHeight - 40) / (240 - 40)) * 100}%, var(--surface-3) 100%)`
                            }}
                          />
                          <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-mono">
                            <span>40px</span>
                            <span>{t("general.landing.logoSizeDefault")}</span>
                            <span>240px</span>
                          </div>
                        </div>
                      )}

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
                    <AITextImprover
                      value={descripcion}
                      onChange={(newValue) => {
                        setDescripcion(newValue);
                        scheduleAutoSave();
                      }}
                      rows={3}
                      placeholder={t("general.landing.descriptionPlaceholder")}
                      label={t("general.landing.descriptionLabel")}
                      maxLength={5000}
                    />
                    <p className={fieldHint}>{t("general.landing.descriptionHint")}</p>
                  </div>

                  {/* Audio de fondo */}
                  <div>
                    <label className={labelClass}>
                      <Music size={14} className="inline mr-1.5 -mt-0.5" />
                      {t("config.audio.title")}
                    </label>
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

                  {/* Brochure PDF */}
                  <div>
                    <label className={labelClass}>
                      <BookOpen size={14} className="inline mr-1.5 -mt-0.5" />
                      {t("general.landing.brochureLabel")}
                    </label>
                    {brochureUrl ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)]">
                        <div className="w-10 h-10 rounded-lg bg-[rgba(var(--noddo-primary-rgb),0.10)] border border-[rgba(var(--noddo-primary-rgb),0.20)] flex items-center justify-center shrink-0">
                          <BookOpen size={18} className="text-[var(--site-primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)] truncate">{t("general.landing.brochureLoaded")}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)] truncate font-mono">{brochureUrl.split("/").pop()}</p>
                        </div>
                        <button
                          onClick={() => { setBrochureUrl(""); scheduleAutoSave(); }}
                          className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <FileUploader
                        currentUrl={null}
                        onUpload={(url) => { setBrochureUrl(url); scheduleAutoSave(); }}
                        folder={`proyectos/${projectId}/recursos`}
                        label={t("general.landing.uploadBrochure")}
                        accept="application/pdf"
                        enablePaste={false}
                      />
                    )}
                    <p className={fieldHint}>{t("general.landing.brochureHint")}</p>
                  </div>
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

              {/* Theme mode toggle */}
              <div className="mb-6">
                <label className={labelClass}>{t("general.design.themeMode")}</label>
                <div className="flex gap-2 mt-1.5">
                  {([
                    { value: "oscuro" as const, label: t("general.design.dark"), Icon: Moon, bg: "#141414", text: "#f4f0e8" },
                    { value: "claro" as const, label: t("general.design.light"), Icon: Sun, bg: "#faf9f7", text: "#141412" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setTemaModo(opt.value);
                        if (opt.value === "claro" && colorFondo === "#0a0a0a") {
                          setColorFondo("#faf9f7");
                        } else if (opt.value === "oscuro" && colorFondo === "#faf9f7") {
                          setColorFondo("#0a0a0a");
                        }
                        scheduleAutoSave();
                      }}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                        temaModo === opt.value
                          ? "border-[var(--site-primary)] bg-[rgba(var(--noddo-primary-rgb),0.08)]"
                          : "border-[var(--border-default)] hover:border-[var(--border-strong)] bg-transparent"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: opt.bg, color: opt.text, border: "1px solid rgba(128,128,128,0.2)" }}
                      >
                        <opt.Icon size={16} />
                      </div>
                      <span className={`font-ui text-xs uppercase tracking-wider font-semibold ${
                        temaModo === opt.value ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
                      }`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className={fieldHint}>{t("general.design.themeModeHint")}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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

          {/* ═══ Avanzado (Legal) ═══ */}
          {activeTab === "avanzado" && (
            <>
            <div className={sectionCard}>
              <h3 className={sectionTitle}>
                <Globe size={15} className="text-[var(--site-primary)]" />
                {t("general.advanced.languageTitle")}
              </h3>
              <p className={sectionDescription}>
                {t("general.advanced.languageDescription")}
              </p>

              <div>
                <label className={labelClass}>{t("general.advanced.micrositeLanguage")}</label>
                <select value={idioma} onChange={(e) => { setIdioma(e.target.value as "es" | "en"); scheduleAutoSave(); }} className={inputClass}>
                  <option value="es">{t("general.advanced.spanish")}</option>
                  <option value="en">{t("general.advanced.english")}</option>
                </select>
                <p className={fieldHint}>{t("general.advanced.micrositeLanguageHint")}</p>
              </div>
            </div>

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
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
