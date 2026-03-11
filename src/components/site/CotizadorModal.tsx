"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle, Loader2, Maximize, BedDouble, Bath, MapPin, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Unidad, Tipologia } from "@/types";
import { useTranslation, getEstadoConfig } from "@/i18n";

interface CotizadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidad: Unidad;
  tipologia: Tipologia | undefined;
  proyectoId: string;
}

function formatPrecio(precio: number, locale: string): string {
  return new Intl.NumberFormat(locale === "es" ? "es-CO" : "en-US", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(precio);
}

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  pais: string;
  mensaje: string;
}

export function CotizadorModal({ isOpen, onClose, unidad, tipologia, proyectoId }: CotizadorModalProps) {
  const { t: tCommon, locale } = useTranslation("common");
  const { t: tSite } = useTranslation("site");
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    email: "",
    telefono: "",
    pais: "",
    mensaje: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estadoConfigMap = useMemo(() => getEstadoConfig(tCommon), [tCommon]);
  const estado = estadoConfigMap[unidad.estado];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const unitDetails = [
      `Unidad: ${unidad.identificador}`,
      tipologia ? `Tipología: ${tipologia.nombre}` : null,
      unidad.area_m2 ? `Área: ${unidad.area_m2} m²` : null,
      unidad.piso ? `Piso: ${unidad.piso}` : null,
      unidad.vista ? `Vista: ${unidad.vista}` : null,
      unidad.precio ? `Precio: ${formatPrecio(unidad.precio, locale)}` : null,
    ].filter(Boolean).join(" · ");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono || null,
          pais: formData.pais || null,
          tipologia_interes: tipologia
            ? `${tipologia.nombre} - ${unidad.identificador}`
            : unidad.identificador,
          mensaje: formData.mensaje
            ? `${formData.mensaje}\n\n--- Detalle unidad ---\n${unitDetails}`
            : `Solicitud de cotización\n\n--- Detalle unidad ---\n${unitDetails}`,
          proyecto_id: proyectoId,
          utm_source: new URLSearchParams(window.location.search).get("utm_source"),
          utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
          utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClose = useCallback(() => {
    onClose();
    // Reset form after animation
    setTimeout(() => {
      setFormData({ nombre: "", email: "", telefono: "", pais: "", mensaje: "" });
      setIsSubmitted(false);
      setError(null);
    }, 300);
  }, [onClose]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg glass-card rounded-3xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              aria-label={tCommon("accessibility.close")}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X size={16} className="text-[var(--text-secondary)]" />
            </button>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 flex flex-col items-center justify-center gap-4"
              >
                <CheckCircle size={48} className="text-[var(--site-primary)]" />
                <h3 className="text-xl text-white font-light">{tCommon("success.requestSent")}</h3>
                <p className="text-[var(--text-tertiary)] text-sm text-center">
                  {tCommon("success.advisorContactUnit", { unit: unidad.identificador })}
                </p>
                <button
                  onClick={handleClose}
                  className="mt-4 btn-outline-warm px-6 py-2 text-sm tracking-wider cursor-pointer"
                >
                  {tCommon("buttons.close")}
                </button>
              </motion.div>
            ) : (
              <div className="p-6 sm:p-8">
                {/* Header */}
                <h2 className="text-lg font-semibold text-white mb-1">
                  {tSite("cotizador.heading")}
                </h2>
                <p className="text-xs text-[var(--text-tertiary)] mb-5">
                  {tSite("cotizador.subtitle")}
                </p>

                {/* Unit Summary Card */}
                <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/8">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {unidad.identificador}
                      </h3>
                      {tipologia && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {tipologia.nombre}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", estado.dot)} />
                      <span className={cn("text-xs font-medium", estado.color)}>
                        {estado.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--text-secondary)]">
                    {unidad.area_m2 && (
                      <span className="flex items-center gap-1">
                        <Maximize size={12} className="text-[var(--text-tertiary)]" />
                        {unidad.area_m2} m²
                      </span>
                    )}
                    {unidad.habitaciones !== null && (
                      <span className="flex items-center gap-1">
                        <BedDouble size={12} className="text-[var(--text-tertiary)]" />
                        {unidad.habitaciones} {tSite("cotizador.hab")}
                      </span>
                    )}
                    {unidad.banos !== null && (
                      <span className="flex items-center gap-1">
                        <Bath size={12} className="text-[var(--text-tertiary)]" />
                        {unidad.banos} {tSite("cotizador.banos")}
                      </span>
                    )}
                    {unidad.piso && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-[var(--text-tertiary)]" />
                        {tSite("cotizador.floor")} {unidad.piso}
                      </span>
                    )}
                    {unidad.vista && (
                      <span className="flex items-center gap-1">
                        <Eye size={12} className="text-[var(--text-tertiary)]" />
                        {unidad.vista}
                      </span>
                    )}
                  </div>

                  {unidad.precio && (
                    <p className="mt-3 text-lg font-semibold text-[var(--site-primary)]">
                      {formatPrecio(unidad.precio, locale)}
                    </p>
                  )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="nombre"
                      placeholder={tCommon("form.fullName")}
                      required
                      value={formData.nombre}
                      onChange={handleChange}
                      className="input-glass w-full"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder={tCommon("form.email")}
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="input-glass w-full"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="tel"
                      name="telefono"
                      placeholder={tCommon("form.phone")}
                      value={formData.telefono}
                      onChange={handleChange}
                      className="input-glass w-full"
                    />
                    <input
                      type="text"
                      name="pais"
                      placeholder={tCommon("form.country")}
                      value={formData.pais}
                      onChange={handleChange}
                      className="input-glass w-full"
                    />
                  </div>
                  <textarea
                    name="mensaje"
                    placeholder={tCommon("form.messageOptional")}
                    rows={2}
                    value={formData.mensaje}
                    onChange={handleChange}
                    className="input-glass w-full resize-none"
                  />
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-warm w-full py-3 flex items-center justify-center gap-2 text-sm tracking-[0.2em] uppercase"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {isSubmitting ? tCommon("buttons.sending") : tCommon("buttons.requestQuote")}
                  </motion.button>
                  {error && (
                    <p className="text-red-400 text-sm text-center mt-3" role="alert">
                      {error}
                    </p>
                  )}
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
