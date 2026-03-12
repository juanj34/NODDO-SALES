"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, Loader2, ShieldCheck, Mail } from "lucide-react";
import type { Tipologia } from "@/types";
import { useTranslation } from "@/i18n";

interface LeadFormProps {
  proyectoId: string;
  tipologias: Tipologia[];
  preselectedTipologia?: string;
  projectName?: string;
  variant?: "page" | "compact";
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
      } else {
        setError(tCommon("errors.submitFailed"));
      }
    } catch {
      setError(tCommon("errors.connectionError"));
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
            ? "glass-card border border-[rgba(var(--site-primary-rgb),0.2)] shadow-[0_0_40px_rgba(var(--site-primary-rgb),0.08)]"
            : "glass-card"
        } p-12 flex flex-col items-center justify-center gap-4`}
      >
        <div className="animate-success-pop">
          <div className="w-16 h-16 rounded-full bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.2)] flex items-center justify-center">
            <CheckCircle
              size={32}
              className="text-[var(--site-primary)]"
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
          <Mail size={14} className="text-[var(--text-muted)]" />
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
          ? "glass-card border border-[rgba(var(--site-primary-rgb),0.2)] shadow-[0_0_40px_rgba(var(--site-primary-rgb),0.08)] p-8"
          : "glass-card p-8"
      } space-y-4 ${isPage ? "" : "max-w-lg"}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-mono">
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
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-mono">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-mono">
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
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-mono">
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
      </div>
      <div>
        <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-mono">
          {tCommon("form.typeOfInterest")}
        </label>
        <select
          name="tipologia_interes"
          value={formData.tipologia_interes}
          onChange={handleChange}
          className="input-glass w-full"
        >
          <option value="">{tCommon("form.typeOfInterest")}</option>
          {tipologias.map((tip) => (
            <option key={tip.id} value={tip.nombre}>
              {tip.nombre} — {tip.area_m2} m²
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5 font-mono">
          {tCommon("form.messageOptional")}
        </label>
        <textarea
          name="mensaje"
          placeholder="..."
          rows={3}
          value={formData.mensaje}
          onChange={handleChange}
          className="input-glass w-full resize-none"
        />
      </div>
      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn-warm w-full py-3.5 flex items-center justify-center gap-2 text-sm tracking-[0.2em] uppercase"
      >
        {isSubmitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {isSubmitting ? tCommon("buttons.sending") : tCommon("buttons.send")}
      </motion.button>
      {error && (
        <p className="text-red-400 text-sm text-center mt-3" role="alert">
          {error}
        </p>
      )}

      {/* Trust footer */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <ShieldCheck
          size={14}
          className="text-[rgba(var(--site-primary-rgb),0.4)]"
        />
        <p className="text-[10px] text-[var(--text-muted)]">
          {tSite("contacto.trustLine")}
        </p>
      </div>
    </form>
  );
}
