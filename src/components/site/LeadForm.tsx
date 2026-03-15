"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, Loader2, ShieldCheck, Mail } from "lucide-react";
import type { Tipologia } from "@/types";
import { useTranslation } from "@/i18n";
import { trackEvent } from "@/lib/tracking";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { leadFormSchema } from "@/lib/validation/schemas";
import { ZodError } from "zod";
import { TrustBadges, trustBadgePresets } from "@/components/site/TrustBadges";
import { ProcessTimeline, timelinePresets } from "@/components/site/ProcessTimeline";

interface LeadFormProps {
  proyectoId: string;
  tipologias: Tipologia[];
  preselectedTipologia?: string;
  projectName?: string;
  variant?: "page" | "compact";
  privacyPolicyUrl?: string | null;
}

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  pais: string;
  tipologia_interes: string;
  mensaje: string;
}

export function LeadForm({
  proyectoId,
  tipologias,
  preselectedTipologia = "",
  projectName,
  variant = "compact",
  privacyPolicyUrl,
}: LeadFormProps) {
  const { t: tCommon } = useTranslation("common");
  const { t: tSite } = useTranslation("site");
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    email: "",
    telefono: "",
    pais: "",
    tipologia_interes: preselectedTipologia,
    mensaje: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync external preselection
  useEffect(() => {
    if (preselectedTipologia) {
      setFormData((prev) => ({
        ...prev,
        tipologia_interes: preselectedTipologia,
      }));
    }
  }, [preselectedTipologia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form data
      leadFormSchema.parse(formData);

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          proyecto_id: proyectoId,
          utm_source: new URLSearchParams(window.location.search).get(
            "utm_source"
          ),
          utm_medium: new URLSearchParams(window.location.search).get(
            "utm_medium"
          ),
          utm_campaign: new URLSearchParams(window.location.search).get(
            "utm_campaign"
          ),
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
        trackEvent(proyectoId, "lead_submit", undefined, {
          tipologia: formData.tipologia_interes || null,
        });
      } else {
        setError(tCommon("errors.submitFailed"));
      }
    } catch (err) {
      if (err instanceof ZodError) {
        if (err.issues?.length > 0) {
          setError(err.issues[0].message);
        }
      } else {
        setError(tCommon("errors.connectionError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isPage = variant === "page";

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${
          isPage
            ? "bg-[var(--surface-1)] rounded-[1.25rem] border border-[rgba(var(--site-primary-rgb),0.2)] shadow-[0_0_40px_rgba(var(--site-primary-rgb),0.08)]"
            : "bg-[var(--surface-1)] rounded-[1.25rem]"
        } p-12 flex flex-col items-center justify-center gap-4`}
        role="status"
        aria-live="polite"
      >
        <div className="animate-success-pop">
          <div className="w-16 h-16 rounded-full bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.2)] flex items-center justify-center">
            <CheckCircle
              size={32}
              className="text-[var(--site-primary)]"
              aria-hidden="true"
            />
          </div>
        </div>
        <h3 className="text-xl text-white font-light">
          {tSite("contacto.successHeading")}
        </h3>
        <p className="text-[var(--text-tertiary)] text-sm text-center max-w-xs">
          {tSite("contacto.successDescription", {
            name: projectName || "",
          })}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Mail size={14} className="text-[var(--text-muted)]" aria-hidden="true" />
          <p className="text-xs text-[var(--text-muted)]">
            {tSite("contacto.successNext")}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${
        isPage
          ? "bg-[var(--surface-1)] rounded-[1.25rem] border border-[rgba(var(--site-primary-rgb),0.2)] shadow-[0_0_40px_rgba(var(--site-primary-rgb),0.08)] p-8"
          : "bg-[var(--surface-1)] rounded-[1.25rem] p-8"
      } space-y-4 ${isPage ? "" : "max-w-lg"}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="lead-nombre" className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-mono">
            {tCommon("form.fullName")}
          </label>
          <input
            id="lead-nombre"
            type="text"
            name="nombre"
            placeholder="Juan Pérez"
            required
            autoComplete="name"
            value={formData.nombre}
            onChange={handleChange}
            className="input-glass w-full"
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="lead-email" className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-mono">
            {tCommon("form.email")}
          </label>
          <input
            id="lead-email"
            type="email"
            name="email"
            placeholder="juan@email.com"
            required
            autoComplete="email"
            inputMode="email"
            value={formData.email}
            onChange={handleChange}
            className="input-glass w-full"
            aria-required="true"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="lead-telefono" className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-mono">
            {tCommon("form.phone")}
          </label>
          <input
            id="lead-telefono"
            type="tel"
            name="telefono"
            placeholder="+57 300 000 0000"
            autoComplete="tel"
            inputMode="tel"
            value={formData.telefono}
            onChange={handleChange}
            className="input-glass w-full"
          />
        </div>
        <div>
          <label htmlFor="lead-pais" className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-mono">
            {tCommon("form.country")}
          </label>
          <input
            id="lead-pais"
            type="text"
            name="pais"
            placeholder="Colombia"
            autoComplete="country-name"
            value={formData.pais}
            onChange={handleChange}
            className="input-glass w-full"
          />
        </div>
      </div>
      <div>
        <label htmlFor="lead-tipologia" className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-mono">
          {tCommon("form.typeOfInterest")}
        </label>
        <NodDoDropdown
          variant="site"
          size="md"
          value={formData.tipologia_interes}
          onChange={(val) => {
            const e = {
              target: { name: "tipologia_interes", value: val },
            } as React.ChangeEvent<HTMLInputElement>;
            handleChange(e);
          }}
          options={[
            { value: "", label: tCommon("form.typeOfInterest") },
            ...tipologias.map((tip) => ({
              value: tip.nombre,
              label: `${tip.nombre} — ${tip.area_m2} m²`,
            })),
          ]}
          placeholder={tCommon("form.typeOfInterest")}
        />
      </div>
      <div>
        <label htmlFor="lead-mensaje" className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-mono">
          {tCommon("form.messageOptional")}
        </label>
        <textarea
          id="lead-mensaje"
          name="mensaje"
          placeholder="..."
          rows={3}
          value={formData.mensaje}
          onChange={handleChange}
          className="input-glass w-full resize-none"
        />
      </div>

      {/* Trust Badges */}
      <TrustBadges badges={trustBadgePresets.contactForm(tSite)} className="mt-6" />

      {/* Process Timeline */}
      <ProcessTimeline
        steps={timelinePresets.contactFlow(tSite)}
        className="mt-6 pt-6 border-t border-[var(--border-subtle)]"
      />

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn-warm w-full py-3.5 flex items-center justify-center gap-2 text-sm tracking-[0.2em] uppercase"
        aria-label={isSubmitting ? tCommon("buttons.sending") : tCommon("buttons.send")}
      >
        {isSubmitting ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Send size={16} aria-hidden="true" />
        )}
        {isSubmitting ? tCommon("buttons.sending") : tCommon("buttons.send")}
      </motion.button>
      {error && (
        <p className="text-red-400 text-sm text-center mt-3" role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      {/* Trust footer */}
      <div className="flex flex-col items-center gap-1.5 pt-2">
        <div className="flex items-center gap-2">
          <ShieldCheck
            size={14}
            className="text-[rgba(var(--site-primary-rgb),0.4)]"
          />
          <p className="text-[10px] text-[var(--text-muted)]">
            {tSite("contacto.trustLine")}
          </p>
        </div>
        {privacyPolicyUrl && (
          <p className="text-[10px] text-[var(--text-muted)]">
            {tSite("contacto.consentPrefix")}{" "}
            <a
              href={privacyPolicyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[var(--site-primary)] transition-colors"
            >
              {tSite("contacto.consentLink")}
            </a>
          </p>
        )}
      </div>
    </form>
  );
}
