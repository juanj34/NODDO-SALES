"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, Loader2, Mail, Home, Building } from "lucide-react";
import type { Tipologia } from "@/types";
import { useTranslation } from "@/i18n";
import { trackEvent } from "@/lib/tracking";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { leadFormSchema } from "@/lib/validation/schemas";
import { ZodError } from "zod";
import { TrustBadges, trustBadgePresets } from "@/components/site/TrustBadges";
import { ProcessTimeline, timelinePresets } from "@/components/site/ProcessTimeline";
import { MultiStepForm, useMultiStepForm } from "@/components/site/MultiStepForm";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

interface LeadFormMultiStepProps {
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

export function LeadFormMultiStep({
  proyectoId,
  tipologias,
  preselectedTipologia = "",
  projectName,
  variant = "compact",
  privacyPolicyUrl,
}: LeadFormMultiStepProps) {
  const { t: tCommon } = useTranslation("common");
  const { t: tSite } = useTranslation("site");
  const { executeRecaptcha } = useGoogleReCaptcha();

  const { currentStep, nextStep, prevStep, reset } = useMultiStepForm(3);

  // Track step progression
  const handleNextStep = () => {
    trackEvent(proyectoId, "lead_form_step_completed", undefined, {
      step: currentStep + 1,
      total_steps: 3,
    });
    nextStep();
  };

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate
      leadFormSchema.parse(formData);

      // Get reCAPTCHA token
      let recaptchaToken: string | undefined;
      if (executeRecaptcha) {
        recaptchaToken = await executeRecaptcha("lead_form");
      }

      // Capture UTM parameters
      const searchParams = new URLSearchParams(window.location.search);
      const utm_source = searchParams.get("utm_source");
      const utm_medium = searchParams.get("utm_medium");
      const utm_campaign = searchParams.get("utm_campaign");

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: proyectoId,
          ...formData,
          utm_source,
          utm_medium,
          utm_campaign,
          recaptcha_token: recaptchaToken,
        }),
      });

      if (res.ok) {
        trackEvent(proyectoId, "lead_submit", undefined, {
          tipologia: formData.tipologia_interes || "no especificada",
          source: utm_source || "directo",
        });
        setIsSubmitted(true);
        reset();
      } else {
        setError(tCommon("errors.submitFailed"));
      }
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.issues[0].message);
      } else {
        setError(tCommon("errors.connectionError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPage = variant === "page";

  const steps = [
    {
      id: "interest",
      label: tSite("leadForm.step1.label"),
      title: tSite("leadForm.step1.title"),
      subtitle: tSite("leadForm.step1.subtitle"),
    },
    {
      id: "contact",
      label: tSite("leadForm.step2.label"),
      title: tSite("leadForm.step2.title"),
      subtitle: tSite("leadForm.step2.subtitle"),
    },
    {
      id: "details",
      label: tSite("leadForm.step3.label"),
      title: tSite("leadForm.step3.title"),
      subtitle: tSite("leadForm.step3.subtitle"),
    },
  ];

  // Validation per step
  const canProceedFromStep1 = formData.tipologia_interes !== "";
  const canProceedFromStep2 = formData.nombre !== "" && formData.email !== "";

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
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle size={48} className="text-[var(--site-primary)]" />
        </motion.div>
        <h3 className="text-xl font-medium text-[var(--text-primary)] text-center">
          {tSite("contacto.successTitle")}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] text-center max-w-md">
          {tSite("contacto.successMessage", { project: projectName || "" })}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Mail size={14} className="text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-muted)]">
            {tSite("contacto.successNext")}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={`${
        isPage
          ? "bg-[var(--surface-1)] rounded-[1.25rem] border border-[rgba(var(--site-primary-rgb),0.2)] shadow-[0_0_40px_rgba(var(--site-primary-rgb),0.08)] p-8"
          : "bg-[var(--surface-1)] rounded-[1.25rem] p-8"
      } ${isPage ? "" : "max-w-lg"}`}
    >
      <MultiStepForm
        steps={steps}
        currentStep={currentStep}
        onStepChange={() => {}}
        showNavigation={false}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Interest - Tipología Selector */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tipologias.slice(0, 4).map((tip) => (
                  <button
                    key={tip.id}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        tipologia_interes: tip.nombre,
                      }));
                    }}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      formData.tipologia_interes === tip.nombre
                        ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)]"
                        : "bg-[var(--surface-2)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          formData.tipologia_interes === tip.nombre
                            ? "bg-[rgba(var(--site-primary-rgb),0.15)]"
                            : "bg-[var(--surface-3)]"
                        }`}
                      >
                        {tip.habitaciones && tip.habitaciones > 2 ? (
                          <Building
                            size={20}
                            className={
                              formData.tipologia_interes === tip.nombre
                                ? "text-[var(--site-primary)]"
                                : "text-[var(--text-tertiary)]"
                            }
                          />
                        ) : (
                          <Home
                            size={20}
                            className={
                              formData.tipologia_interes === tip.nombre
                                ? "text-[var(--site-primary)]"
                                : "text-[var(--text-tertiary)]"
                            }
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            formData.tipologia_interes === tip.nombre
                              ? "text-[var(--text-primary)]"
                              : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {tip.nombre}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          {tip.area_m2} m² • {tip.habitaciones} hab •{" "}
                          {tip.banos} baños
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {tipologias.length > 4 && (
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-ui font-bold">
                    {tCommon("form.typeOfInterest")}
                  </label>
                  <NodDoDropdown
                    variant="site"
                    size="md"
                    value={formData.tipologia_interes}
                    onChange={(val) => {
                      setFormData((prev) => ({
                        ...prev,
                        tipologia_interes: val,
                      }));
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
              )}

              <motion.button
                type="button"
                onClick={handleNextStep}
                disabled={!canProceedFromStep1}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-warm w-full py-3.5 flex items-center justify-center gap-2 text-sm tracking-[0.2em] uppercase disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {tSite("leadForm.continue")}
              </motion.button>
            </div>
          )}

          {/* Step 2: Contact Info + Trust Badges */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-ui font-bold">
                    {tCommon("form.fullName")}
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Juan Pérez"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    className="input-glass w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-ui font-bold">
                    {tCommon("form.email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="juan@email.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input-glass w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-ui font-bold">
                  {tCommon("form.phone")}
                </label>
                <input
                  type="tel"
                  name="telefono"
                  placeholder="+57 300 000 0000"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="input-glass w-full"
                />
              </div>

              <TrustBadges
                badges={trustBadgePresets.contactForm(tSite)}
                className="mt-6"
              />

              <div className="flex items-center gap-3 pt-2">
                <motion.button
                  type="button"
                  onClick={prevStep}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-ghost flex-1 py-2.5 text-sm"
                >
                  {tSite("leadForm.back")}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canProceedFromStep2}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-warm flex-1 py-2.5 text-sm tracking-[0.2em] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tSite("leadForm.continue")}
                </motion.button>
              </div>
            </div>
          )}

          {/* Step 3: Details + Timeline + Submit */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-ui font-bold">
                    {tCommon("form.country")}
                  </label>
                  <input
                    type="text"
                    name="pais"
                    placeholder="Colombia"
                    value={formData.pais}
                    onChange={handleChange}
                    className="input-glass w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-ui font-bold">
                    Presupuesto (opcional)
                  </label>
                  <input
                    type="text"
                    name="presupuesto"
                    placeholder="Ej: $500M - $800M"
                    className="input-glass w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-ui font-bold">
                  {tCommon("form.messageOptional")}
                </label>
                <textarea
                  name="mensaje"
                  placeholder="Cuéntanos más sobre lo que buscas..."
                  rows={3}
                  value={formData.mensaje}
                  onChange={handleChange}
                  className="input-glass w-full resize-none"
                />
              </div>

              <ProcessTimeline
                steps={timelinePresets.contactFlow(tSite)}
                className="mt-6 pt-6 border-t border-[var(--border-subtle)]"
              />

              <div className="flex items-center gap-3 pt-2">
                <motion.button
                  type="button"
                  onClick={prevStep}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-ghost flex-1 py-2.5 text-sm"
                >
                  {tSite("leadForm.back")}
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-warm flex-1 py-3.5 flex items-center justify-center gap-2 text-sm tracking-[0.2em] uppercase"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {isSubmitting
                    ? tCommon("buttons.sending")
                    : tSite("leadForm.submit")}
                </motion.button>
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center mt-3">
                  {error}
                </p>
              )}

              {privacyPolicyUrl && (
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  <p className="text-[10px] text-[var(--text-muted)] text-center">
                    Al enviar, aceptas nuestra{" "}
                    <a
                      href={privacyPolicyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--site-primary)] hover:underline"
                    >
                      política de privacidad
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
      </MultiStepForm>
    </div>
  );
}
