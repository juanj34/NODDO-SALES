"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import type { Tipologia } from "@/types";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
      }
    } catch {
      // Silent fail for MVP - will add error handling later
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
        className="flex flex-col items-center justify-center gap-4 py-12"
      >
        <CheckCircle size={48} className="text-[var(--site-primary)]" />
        <h3 className="text-xl text-white font-light">Gracias por tu interés</h3>
        <p className="text-white/40 text-sm">
          Un asesor se pondrá en contacto contigo pronto.
        </p>
      </motion.div>
    );
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[var(--site-primary)]/50 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo *"
          required
          value={formData.nombre}
          onChange={handleChange}
          className={inputClass}
        />
        <input
          type="email"
          name="email"
          placeholder="Email *"
          required
          value={formData.email}
          onChange={handleChange}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input
          type="tel"
          name="telefono"
          placeholder="Teléfono"
          value={formData.telefono}
          onChange={handleChange}
          className={inputClass}
        />
        <input
          type="text"
          name="pais"
          placeholder="País"
          value={formData.pais}
          onChange={handleChange}
          className={inputClass}
        />
      </div>
      <select
        name="tipologia_interes"
        value={formData.tipologia_interes}
        onChange={handleChange}
        className={inputClass}
      >
        <option value="">Tipología de interés</option>
        {tipologias.map((t) => (
          <option key={t.id} value={t.nombre}>
            {t.nombre} — {t.area_m2} m²
          </option>
        ))}
      </select>
      <textarea
        name="mensaje"
        placeholder="Mensaje (opcional)"
        rows={3}
        value={formData.mensaje}
        onChange={handleChange}
        className={inputClass + " resize-none"}
      />
      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-[var(--site-primary)] text-black font-medium py-3 rounded flex items-center justify-center gap-2 text-sm tracking-wider hover:brightness-110 transition-all disabled:opacity-50"
      >
        <Send size={16} />
        {isSubmitting ? "ENVIANDO..." : "ENVIAR"}
      </motion.button>
    </form>
  );
}
