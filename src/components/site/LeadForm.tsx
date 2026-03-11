"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import type { Tipologia } from "@/types";
import { useTranslation } from "@/i18n";

interface LeadFormProps {
  proyectoId: string;
  tipologias: Tipologia[];
}

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  pais: string;
  tipologia_interes: string;
  mensaje: string;
}

export function LeadForm({ proyectoId, tipologias }: LeadFormProps) {
  const { t } = useTranslation("common");
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    email: "",
    telefono: "",
    pais: "",
    tipologia_interes: "",
    mensaje: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          utm_source: new URLSearchParams(window.location.search).get("utm_source"),
          utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
          utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        setError(t("errors.submitFailed"));
      }
    } catch {
      setError(t("errors.connectionError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-12 flex flex-col items-center justify-center gap-4"
      >
        <CheckCircle size={48} className="text-[var(--site-primary)]" />
        <h3 className="text-xl text-white font-light">{t("success.thankYou")}</h3>
        <p className="text-[var(--text-tertiary)] text-sm">
          {t("success.advisorContact")}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-8 space-y-4 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text"
          name="nombre"
          placeholder={t("form.fullName")}
          required
          value={formData.nombre}
          onChange={handleChange}
          className="input-glass w-full"
        />
        <input
          type="email"
          name="email"
          placeholder={t("form.email")}
          required
          value={formData.email}
          onChange={handleChange}
          className="input-glass w-full"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="tel"
          name="telefono"
          placeholder={t("form.phone")}
          value={formData.telefono}
          onChange={handleChange}
          className="input-glass w-full"
        />
        <input
          type="text"
          name="pais"
          placeholder={t("form.country")}
          value={formData.pais}
          onChange={handleChange}
          className="input-glass w-full"
        />
      </div>
      <select
        name="tipologia_interes"
        value={formData.tipologia_interes}
        onChange={handleChange}
        className="input-glass w-full"
      >
        <option value="">{t("form.typeOfInterest")}</option>
        {tipologias.map((t) => (
          <option key={t.id} value={t.nombre}>
            {t.nombre} — {t.area_m2} m²
          </option>
        ))}
      </select>
      <textarea
        name="mensaje"
        placeholder={t("form.messageOptional")}
        rows={3}
        value={formData.mensaje}
        onChange={handleChange}
        className="input-glass w-full resize-none"
      />
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
        {isSubmitting ? t("buttons.sending") : t("buttons.send")}
      </motion.button>
      {error && (
        <p className="text-red-400 text-sm text-center mt-3" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
