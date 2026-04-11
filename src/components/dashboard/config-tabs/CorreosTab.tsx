"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useAuthRole } from "@/hooks/useAuthContext";
import { useToast } from "@/components/dashboard/Toast";
import {
  inputClass,
  labelClass,
  fieldHint,
  sectionCard,
  sectionTitle,
  sectionDescription,
} from "@/components/dashboard/editor-styles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import {
  Mail,
  Sparkles,
  Loader2,
  Paperclip,
  MousePointerClick,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { FileUploader } from "@/components/dashboard/FileUploader";
import type { EmailConfig, CotizadorConfig, Currency } from "@/types";
import { buildBrandedCotizacionEmail } from "@/lib/email-branded";
import { formatCurrency } from "@/lib/currency";

/* ── Defaults ──────────────────────────────────────────────────────── */

const DEFAULT_CONFIG: EmailConfig = {
  reply_to: null,
  show_project_logo: false,
  show_constructora_logo: false,
  email_tema: "oscuro",
  email_project_logo_url: null,
  email_constructora_logo_url: null,
  saludo: null,
  cuerpo: null,
  despedida: null,
  adjuntar_cotizacion_pdf: true,
  adjuntar_brochure: false,
  adjuntos_recurso_ids: [],
  boton_whatsapp: false,
  boton_tour_360: false,
  boton_brochure_link: false,
  boton_micrositio: false,
};

/* ── Toggle Component ──────────────────────────────────────────────── */

function Toggle({
  checked,
  onChange,
  disabled,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3 py-2.5",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <div className="flex-1 min-w-0">
        <span className="text-[13px] text-[var(--text-secondary)] font-medium">
          {label}
        </span>
        {hint && <p className={fieldHint}>{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200",
          checked
            ? "bg-[var(--site-primary)]"
            : "bg-[var(--surface-3)] border border-[var(--border-default)]",
          disabled && "pointer-events-none"
        )}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          )}
        />
      </button>
    </label>
  );
}

/* ── Segmented theme picker ───────────────────────────────────────── */

function ThemePicker({
  value,
  onChange,
  darkLabel,
  lightLabel,
}: {
  value: "oscuro" | "claro";
  onChange: (v: "oscuro" | "claro") => void;
  darkLabel: string;
  lightLabel: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-[var(--surface-2)] p-0.5">
      <button
        type="button"
        onClick={() => onChange("oscuro")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-ui font-bold uppercase tracking-wider transition-all",
          value === "oscuro"
            ? "bg-[var(--surface-4)] text-[var(--text-primary)] shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        )}
      >
        <Moon size={12} />
        {darkLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("claro")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-ui font-bold uppercase tracking-wider transition-all",
          value === "claro"
            ? "bg-[var(--surface-4)] text-[var(--text-primary)] shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        )}
      >
        <Sun size={12} />
        {lightLabel}
      </button>
    </div>
  );
}

/* ── Textarea with AI Improve Button ─────────────────────────────── */

function TextFieldWithAI({
  label,
  value,
  onChange,
  placeholder,
  onAIImprove,
  aiLoading,
  aiLabel,
  aiLoadingLabel,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onAIImprove: () => void;
  aiLoading: boolean;
  aiLabel: string;
  aiLoadingLabel: string;
  rows?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[13px] text-[var(--text-secondary)] font-medium">
          {label}
        </label>
        <button
          type="button"
          onClick={onAIImprove}
          disabled={aiLoading || !value.trim()}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider transition-all",
            aiLoading
              ? "text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.1)]"
              : "text-[var(--text-muted)] hover:text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.06)]",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {aiLoading ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <Sparkles size={11} />
          )}
          {aiLoading ? aiLoadingLabel : aiLabel}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(inputClass, "resize-none")}
      />
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */

export default function CorreosTab() {
  const { project, save } = useEditorProject();
  const { user, profile } = useAuthRole();
  const toast = useToast();
  const { t } = useTranslation("editor");

  // State
  const [config, setConfig] = useState<EmailConfig>(DEFAULT_CONFIG);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Auto-save debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  // Initialize from project + default reply_to to user's email
  useEffect(() => {
    if (project && !initialized) {
      const saved = project.email_config
        ? { ...DEFAULT_CONFIG, ...project.email_config }
        : { ...DEFAULT_CONFIG };
      if (!saved.reply_to && user?.email) {
        saved.reply_to = user.email;
      }
      setConfig(saved);
      setInitialized(true);
    }
  }, [project, initialized, user]);

  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await save({ email_config: configRef.current });
    }, 1500);
  }, [save]);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        save({ email_config: configRef.current });
      }
    };
  }, [save]);

  const updateConfig = useCallback(
    <K extends keyof EmailConfig>(key: K, value: EmailConfig[K]) => {
      setConfig((prev) => {
        const next = { ...prev, [key]: value };
        return next;
      });
      setTimeout(() => scheduleAutoSave(), 0);
    },
    [scheduleAutoSave]
  );

  // AI text improvement
  const handleAIImprove = useCallback(
    async (field: "saludo" | "cuerpo" | "despedida") => {
      const text = config[field];
      if (!text?.trim()) {
        toast.error(t("correos.noTextForAI"));
        return;
      }

      setAiLoading(field);
      try {
        const res = await fetch("/api/ai/improve-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text.trim(),
            style: "tono_premium",
            tone: "lujo",
            language: project?.idioma || "es",
            goal: "Mejorar el texto de un correo de cotización inmobiliaria premium",
          }),
        });
        if (res.ok) {
          const { improved } = await res.json();
          updateConfig(field, improved);
        } else {
          const err = await res.json().catch(() => null);
          toast.error(err?.error || t("correos.aiImproveError"));
        }
      } catch {
        toast.error("Error de conexión");
      } finally {
        setAiLoading(null);
      }
    },
    [config, project?.idioma, updateConfig, toast, t]
  );

  // Toggle recurso in attachments
  const toggleRecurso = useCallback(
    (id: string) => {
      setConfig((prev) => {
        const ids = prev.adjuntos_recurso_ids || [];
        const next = ids.includes(id)
          ? ids.filter((r) => r !== id)
          : [...ids, id];
        return { ...prev, adjuntos_recurso_ids: next };
      });
      setTimeout(() => scheduleAutoSave(), 0);
    },
    [scheduleAutoSave]
  );

  // Build preview HTML
  const previewHtml = useMemo(() => {
    if (!project) return "";
    const rootDomain = "noddo.io";
    const micrositeUrl = project.custom_domain && project.domain_verified
      ? `https://${project.custom_domain}`
      : `https://${project.subdomain || project.slug}.${rootDomain}`;

    const firstTipo = project.tipologias?.[0] ?? null;
    const firstUnidad = project.unidades?.[0] ?? null;
    const moneda = ((project.cotizador_config as CotizadorConfig | null)?.moneda || "COP") as Currency;

    const agentName = profile
      ? [profile.nombre, profile.apellido].filter(Boolean).join(" ") || null
      : null;

    return buildBrandedCotizacionEmail({
      locale: (project.idioma as "es" | "en") || "es",
      emailConfig: config,
      projectName: project.nombre,
      projectSlug: project.slug,
      projectLogoUrl: project.logo_url,
      constructoraLogoUrl: project.constructora_logo_url,
      constructoraNombre: project.constructora_nombre,
      colorPrimario: project.color_primario || "#b8973a",
      buyerName: "María López",
      unidadId: firstUnidad?.identificador || "Apto 301",
      totalFormatted: firstUnidad?.precio
        ? formatCurrency(firstUnidad.precio, moneda)
        : "$450,000,000",
      tipologiaName: firstTipo?.nombre ?? null,
      areaM2: firstTipo?.area_m2 ?? firstUnidad?.area_m2 ?? null,
      habitaciones: firstTipo?.habitaciones ?? firstUnidad?.habitaciones ?? null,
      banos: firstTipo?.banos ?? firstUnidad?.banos ?? null,
      whatsappNumero: project.whatsapp_numero,
      tour360Url: project.tour_360_url,
      brochureUrl: project.brochure_url,
      micrositeUrl,
      agentName,
      agentPhone: profile?.telefono ?? null,
      agentEmail: user?.email ?? null,
      agentAvatarUrl: profile?.avatar_url ?? null,
    });
  }, [project, config, profile, user]);

  if (!project) return null;

  const recursos = project.recursos || [];
  const ts = t as unknown as (key: string) => string;
  const tema = config.email_tema || "oscuro";

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left column: Configuration ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Reply-To */}
          <div className={sectionCard}>
            <h3 className={sectionTitle}>
              <MessageSquare size={14} />
              {ts("correos.replyTo.label")}
            </h3>
            <p className={sectionDescription}>
              {ts("correos.replyTo.hint")}
            </p>
            <input
              type="email"
              value={config.reply_to || ""}
              onChange={(e) => updateConfig("reply_to", e.target.value || null)}
              placeholder={ts("correos.replyTo.placeholder")}
              className={inputClass}
            />
          </div>

          {/* Branding */}
          <div className={sectionCard}>
            <h3 className={sectionTitle}>
              <ImageIcon size={14} />
              {ts("correos.branding.title")}
            </h3>
            <div className="space-y-3">
              {/* Theme picker */}
              <div className="flex items-center justify-between py-1">
                <span className="text-[13px] text-[var(--text-secondary)] font-medium">
                  {ts("correos.branding.tema")}
                </span>
                <ThemePicker
                  value={tema}
                  onChange={(v) => updateConfig("email_tema", v)}
                  darkLabel={ts("correos.branding.temaDark")}
                  lightLabel={ts("correos.branding.temaLight")}
                />
              </div>

              <div className="border-t border-[var(--border-subtle)] pt-2 space-y-3">
                {/* Project Logo */}
                <div>
                  <div className="flex items-center gap-3">
                    {project.logo_url ? (
                      <img
                        src={config.email_project_logo_url || project.logo_url}
                        alt=""
                        className="h-8 max-w-[120px] object-contain rounded bg-[var(--surface-3)] p-1"
                      />
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)] italic">
                        {ts("correos.branding.noLogo")}
                      </span>
                    )}
                    <Toggle
                      checked={config.show_project_logo}
                      onChange={(v) => updateConfig("show_project_logo", v)}
                      disabled={!project.logo_url}
                      label={ts("correos.branding.projectLogo")}
                    />
                  </div>
                  {config.show_project_logo && project.logo_url && (
                    <div className="mt-2 ml-0">
                      {config.email_project_logo_url ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={config.email_project_logo_url}
                            alt=""
                            className="h-7 max-w-[100px] object-contain rounded bg-[var(--surface-3)] p-1"
                          />
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {ts("correos.branding.customLogo")}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateConfig("email_project_logo_url", null)}
                            className="p-0.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="max-w-[240px]">
                          <p className={cn(fieldHint, "mb-1.5")}>
                            {ts("correos.branding.customLogoHint")}
                          </p>
                          <FileUploader
                            currentUrl={null}
                            onUpload={(url) => updateConfig("email_project_logo_url", url)}
                            folder={`proyectos/${project.id}`}
                            label={ts("correos.branding.uploadCustom")}
                            aspect="logo"
                            compact
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Constructora Logo */}
                <div>
                  <div className="flex items-center gap-3">
                    {project.constructora_logo_url ? (
                      <img
                        src={config.email_constructora_logo_url || project.constructora_logo_url}
                        alt=""
                        className="h-8 max-w-[120px] object-contain rounded bg-[var(--surface-3)] p-1"
                      />
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)] italic">
                        {ts("correos.branding.noLogo")}
                      </span>
                    )}
                    <Toggle
                      checked={config.show_constructora_logo}
                      onChange={(v) => updateConfig("show_constructora_logo", v)}
                      disabled={!project.constructora_logo_url}
                      label={ts("correos.branding.constructoraLogo")}
                    />
                  </div>
                  {config.show_constructora_logo && project.constructora_logo_url && (
                    <div className="mt-2 ml-0">
                      {config.email_constructora_logo_url ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={config.email_constructora_logo_url}
                            alt=""
                            className="h-7 max-w-[100px] object-contain rounded bg-[var(--surface-3)] p-1"
                          />
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {ts("correos.branding.customLogo")}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateConfig("email_constructora_logo_url", null)}
                            className="p-0.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="max-w-[240px]">
                          <p className={cn(fieldHint, "mb-1.5")}>
                            {ts("correos.branding.customLogoHint")}
                          </p>
                          <FileUploader
                            currentUrl={null}
                            onUpload={(url) => updateConfig("email_constructora_logo_url", url)}
                            folder={`proyectos/${project.id}`}
                            label={ts("correos.branding.uploadCustom")}
                            aspect="logo"
                            compact
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Text fields */}
          <div className={sectionCard}>
            <h3 className={sectionTitle}>
              <FileText size={14} />
              {ts("correos.texts.title")}
            </h3>
            <p className={sectionDescription}>
              {ts("correos.texts.variablesHint")}
            </p>
            <div className="space-y-4">
              <TextFieldWithAI
                label={ts("correos.texts.saludo")}
                value={config.saludo || ""}
                onChange={(v) => updateConfig("saludo", v || null)}
                placeholder={ts("correos.texts.saludoPlaceholder")}
                onAIImprove={() => handleAIImprove("saludo")}
                aiLoading={aiLoading === "saludo"}
                aiLabel={ts("correos.aiImprove")}
                aiLoadingLabel={ts("correos.aiImproving")}
                rows={2}
              />
              <TextFieldWithAI
                label={ts("correos.texts.cuerpo")}
                value={config.cuerpo || ""}
                onChange={(v) => updateConfig("cuerpo", v || null)}
                placeholder={ts("correos.texts.cuerpoPlaceholder")}
                onAIImprove={() => handleAIImprove("cuerpo")}
                aiLoading={aiLoading === "cuerpo"}
                aiLabel={ts("correos.aiImprove")}
                aiLoadingLabel={ts("correos.aiImproving")}
                rows={4}
              />
              <TextFieldWithAI
                label={ts("correos.texts.despedida")}
                value={config.despedida || ""}
                onChange={(v) => updateConfig("despedida", v || null)}
                placeholder={ts("correos.texts.despedidaPlaceholder")}
                onAIImprove={() => handleAIImprove("despedida")}
                aiLoading={aiLoading === "despedida"}
                aiLabel={ts("correos.aiImprove")}
                aiLoadingLabel={ts("correos.aiImproving")}
                rows={2}
              />
            </div>
          </div>

          {/* Attachments */}
          <div className={sectionCard}>
            <h3 className={sectionTitle}>
              <Paperclip size={14} />
              {ts("correos.attachments.title")}
            </h3>
            <div className="space-y-1">
              <Toggle
                checked={config.adjuntar_cotizacion_pdf}
                onChange={(v) => updateConfig("adjuntar_cotizacion_pdf", v)}
                label={ts("correos.attachments.cotizacionPdf")}
                hint={ts("correos.attachments.cotizacionPdfHint")}
              />
              {project.brochure_url && (
                <Toggle
                  checked={config.adjuntar_brochure}
                  onChange={(v) => updateConfig("adjuntar_brochure", v)}
                  label={ts("correos.attachments.brochure")}
                  hint={ts("correos.attachments.brochureHint")}
                />
              )}

              {/* Recursos */}
              {recursos.length > 0 ? (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                  <p className={cn(labelClass, "mb-2")}>
                    {ts("correos.attachments.recursos")}
                  </p>
                  <p className={cn(fieldHint, "mb-1")}>
                    {ts("correos.attachments.recursosHint")}
                  </p>
                  <div className="space-y-0">
                    {recursos.map((r) => (
                      <div key={r.id} className="flex items-center gap-2">
                        <span className="text-[9px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-3)] px-1.5 py-0.5 rounded shrink-0">
                          {r.tipo}
                        </span>
                        <Toggle
                          checked={config.adjuntos_recurso_ids?.includes(r.id) || false}
                          onChange={() => toggleRecurso(r.id)}
                          label={r.nombre}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className={cn(fieldHint, "mt-2 italic")}>
                  {ts("correos.attachments.recursosEmpty")}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={sectionCard}>
            <h3 className={sectionTitle}>
              <MousePointerClick size={14} />
              {ts("correos.buttons.title")}
            </h3>
            <p className={sectionDescription}>
              {ts("correos.buttons.hint")}
            </p>
            <div className="space-y-1">
              <Toggle
                checked={config.boton_whatsapp}
                onChange={(v) => updateConfig("boton_whatsapp", v)}
                disabled={!project.whatsapp_numero}
                label={ts("correos.buttons.whatsapp")}
                hint={!project.whatsapp_numero ? ts("correos.buttons.notConfigured") : undefined}
              />
              <Toggle
                checked={config.boton_tour_360}
                onChange={(v) => updateConfig("boton_tour_360", v)}
                disabled={!project.tour_360_url}
                label={ts("correos.buttons.tour360")}
                hint={!project.tour_360_url ? ts("correos.buttons.notConfigured") : undefined}
              />
              <Toggle
                checked={config.boton_brochure_link}
                onChange={(v) => updateConfig("boton_brochure_link", v)}
                disabled={!project.brochure_url}
                label={ts("correos.buttons.brochure")}
                hint={!project.brochure_url ? ts("correos.buttons.notConfigured") : undefined}
              />
              <Toggle
                checked={config.boton_micrositio}
                onChange={(v) => updateConfig("boton_micrositio", v)}
                label={ts("correos.buttons.micrositio")}
              />
            </div>
          </div>
        </div>

        {/* ── Right column: Live Preview ── */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            <div className={sectionCard}>
              <h3 className={sectionTitle}>
                <Mail size={14} />
                {ts("correos.preview")}
              </h3>
              <p className={sectionDescription}>
                {ts("correos.previewNote")}
              </p>
              <div className={cn(
                "rounded-lg overflow-hidden border border-[var(--border-default)]",
                tema === "claro" ? "bg-[#f5f5f0]" : "bg-[#0a0a0a]"
              )}>
                <iframe
                  srcDoc={previewHtml}
                  title="Email preview"
                  className="w-full border-0"
                  style={{ height: 700, pointerEvents: "none" }}
                  sandbox=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
