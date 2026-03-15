"use client";

import { useState, useCallback } from "react";
import {
  Loader2,
  Check,
  Send,
  X,
} from "lucide-react";
import { COUNTRY_CODES } from "@/lib/booking-constants";
import { GHL_TAGS, GHL_CUSTOM_FIELDS, GHL_STAGES } from "@/lib/ghl-config";
import { trackMarketingEvent, sendCAPIEvent } from "@/lib/marketing-tracking";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";

interface ContactFormProps {
  onClose?: () => void;
  /** Pre-select a plan interest */
  defaultPlan?: string;
  /** Source identifier for attribution */
  source?: string;
}

const PLAN_OPTIONS = [
  { value: "", label: "Selecciona un plan" },
  { value: "proyecto", label: "Proyecto — $149/mes" },
  { value: "studio", label: "Studio — $399/mes" },
  { value: "enterprise", label: "Enterprise — A medida" },
  { value: "no_se", label: "No estoy seguro aún" },
];

type Step = "form" | "sending" | "success";

export function ContactForm({ onClose, defaultPlan, source }: ContactFormProps) {
  const [step, setStep] = useState<Step>("form");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState(defaultPlan || "");
  const [message, setMessage] = useState("");
  const [whatsappOptin] = useState(true);
  const [error, setError] = useState("");

  const fullPhone = phone ? `${countryCode}${phone.replace(/\D/g, "")}` : undefined;

  const canSubmit = name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setStep("sending");
    setError("");

    // Build tags based on plan interest
    const tags: string[] = [GHL_TAGS.contact_form];
    if (plan === "proyecto") tags.push(GHL_TAGS.plan_proyecto);
    else if (plan === "studio") tags.push(GHL_TAGS.plan_studio);
    else if (plan === "enterprise") tags.push(GHL_TAGS.plan_enterprise);

    // Get UTM from URL
    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get("utm_source") || undefined,
      medium: params.get("utm_medium") || undefined,
      campaign: params.get("utm_campaign") || undefined,
    };

    // Build note from message
    const noteLines = [];
    if (message.trim()) noteLines.push(message.trim());
    if (plan) {
      const planLabel = PLAN_OPTIONS.find((p) => p.value === plan)?.label || plan;
      noteLines.push(`Plan de interés: ${planLabel}`);
    }
    noteLines.push(`Origen: ${source || window.location.pathname}`);

    try {
      const res = await fetch("/api/marketing/ghl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          phone: fullPhone,
          company: company.trim() || undefined,
          tags,
          customFields: {
            [GHL_CUSTOM_FIELDS.plan_interes]: plan || "sin_definir",
            [GHL_CUSTOM_FIELDS.pagina_origen]: window.location.pathname,
          },
          pipeline: GHL_STAGES.nuevo_prospecto ? {
            stageId: GHL_STAGES.nuevo_prospecto,
            name: company.trim() || name.trim(),
            monetaryValue: plan === "studio" ? 399 : plan === "enterprise" ? 1000 : 149,
          } : undefined,
          source: source || "contact-form",
          utm,
          note: noteLines.join("\n"),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar");
      }

      // Save contact in localStorage for future tracking
      if (data.contactId) {
        localStorage.setItem(
          "noddo_ghl_contact",
          JSON.stringify({ email: email.trim().toLowerCase(), contactId: data.contactId })
        );
      }

      // Track conversion
      trackMarketingEvent("cta_clicked", { cta_name: "contact_form_submitted" });

      const eventId = `cf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nameParts = name.trim().split(/\s+/);
      sendCAPIEvent({
        eventName: "Lead",
        eventId,
        email: email.trim().toLowerCase(),
        phone: fullPhone,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" ") || undefined,
        value: 50,
        currency: "USD",
      });

      setStep("success");
    } catch (err) {
      console.error("[ContactForm] Submit failed:", err);
      setError(err instanceof Error ? err.message : "Error al enviar. Intenta de nuevo.");
      setStep("form");
    }
  }, [canSubmit, name, email, company, fullPhone, plan, message, source]);

  // ─── Success state ──────────────────────────────────────────────────────

  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-10 text-center min-h-[400px]">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[rgba(244,240,232,0.3)] hover:text-[rgba(244,240,232,0.7)] transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(184,151,58,0.3), rgba(184,151,58,0.1))",
            boxShadow: "0 0 30px rgba(184,151,58,0.15)",
          }}
        >
          <Check size={24} className="text-[#b8973a]" />
        </div>

        <h3
          className="font-heading text-2xl font-light mb-4"
          style={{ color: "rgba(244,240,232,0.92)" }}
        >
          ✓ Mensaje enviado
        </h3>

        <div className="max-w-md mb-6 space-y-4">
          <div className="text-left">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-xl">📧</div>
              <div>
                <p className="text-[12px] font-ui font-bold tracking-[0.1em] uppercase mb-1" style={{ color: "#b8973a" }}>
                  Revisa tu correo en los próximos 5 minutos
                </p>
                <p className="text-[13px]" style={{ color: "rgba(244,240,232,0.5)" }}>
                  Te enviamos confirmación + link a demo grabada (2 min)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 mb-3">
              <div className="text-xl">📞</div>
              <div>
                <p className="text-[12px] font-ui font-bold tracking-[0.1em] uppercase mb-1" style={{ color: "#b8973a" }}>
                  Te llamamos en &lt; 24 horas
                </p>
                <p className="text-[13px]" style={{ color: "rgba(244,240,232,0.5)" }}>
                  Un especialista te contactará para agendar tu demo personalizada
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-xl">✓</div>
              <div>
                <p className="text-[12px] font-ui font-bold tracking-[0.1em] uppercase mb-1" style={{ color: "#b8973a" }}>
                  Gracias
                </p>
                <p className="text-[13px]" style={{ color: "rgba(244,240,232,0.7)" }}>
                  Te contactaremos pronto para mostrarte NODDO en acción
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form state ─────────────────────────────────────────────────────────

  return (
    <div className="relative p-6 sm:p-8">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[rgba(244,240,232,0.3)] hover:text-[rgba(244,240,232,0.7)] transition-colors z-10"
        >
          <X size={20} />
        </button>
      )}

      {/* Header */}
      <div className="mb-6">
        <div
          className="font-ui text-[9px] font-bold tracking-[0.2em] uppercase mb-2"
          style={{ color: "#b8973a" }}
        >
          Contacto
        </div>
        <h3
          className="font-heading text-xl sm:text-2xl font-light"
          style={{ color: "rgba(244,240,232,0.92)" }}
        >
          Cuéntanos sobre tu proyecto
        </h3>
        <p
          className="text-[12px] mt-2"
          style={{ color: "rgba(244,240,232,0.4)" }}
        >
          Te contactaremos en menos de 24 horas.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Name + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              className="block text-[10px] font-ui font-bold tracking-[0.12em] uppercase mb-1.5"
              style={{ color: "rgba(244,240,232,0.4)" }}
            >
              Nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-3.5 py-2.5 rounded-[0.625rem] text-[13px] outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(244,240,232,0.9)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(184,151,58,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>
          <div>
            <label
              className="block text-[10px] font-ui font-bold tracking-[0.12em] uppercase mb-1.5"
              style={{ color: "rgba(244,240,232,0.4)" }}
            >
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              className="w-full px-3.5 py-2.5 rounded-[0.625rem] text-[13px] outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(244,240,232,0.9)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(184,151,58,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>
        </div>

        {/* Company */}
        <div>
          <label
            className="block text-[10px] font-ui font-bold tracking-[0.12em] uppercase mb-1.5"
            style={{ color: "rgba(244,240,232,0.4)" }}
          >
            Empresa / Constructora
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Nombre de tu empresa"
            className="w-full px-3.5 py-2.5 rounded-[0.625rem] text-[13px] outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(244,240,232,0.9)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(184,151,58,0.4)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
        </div>

        {/* Phone + Plan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Phone */}
          <div>
            <label
              className="block text-[10px] font-ui font-bold tracking-[0.12em] uppercase mb-1.5"
              style={{ color: "rgba(244,240,232,0.4)" }}
            >
              Teléfono
            </label>
            <div className="flex gap-1.5">
              <div style={{ width: 85 }}>
                <NodDoDropdown
                  variant="marketing"
                  size="md"
                  value={countryCode}
                  onChange={setCountryCode}
                  options={COUNTRY_CODES.map((c) => ({
                    value: c.code,
                    label: c.code,
                    metadata: { flag: c.flag },
                  }))}
                  renderOption={(opt) => (
                    <span>{opt.metadata?.flag} {opt.label}</span>
                  )}
                  renderSelected={(opt) => (
                    <span>{opt.metadata?.flag} {opt.label}</span>
                  )}
                />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="300 123 4567"
                className="flex-1 px-3.5 py-2.5 rounded-[0.625rem] text-[13px] outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(244,240,232,0.9)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(184,151,58,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
          </div>

          {/* Plan selector */}
          <div>
            <label
              className="block text-[10px] font-ui font-bold tracking-[0.12em] uppercase mb-1.5"
              style={{ color: "rgba(244,240,232,0.4)" }}
            >
              Plan de interés
            </label>
            <NodDoDropdown
              variant="marketing"
              size="md"
              value={plan}
              onChange={setPlan}
              options={PLAN_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
              placeholder="Selecciona un plan"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label
            className="block text-[10px] font-ui font-bold tracking-[0.12em] uppercase mb-1.5"
            style={{ color: "rgba(244,240,232,0.4)" }}
          >
            Mensaje (opcional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuéntanos sobre tus proyectos, cuántas unidades manejas, o cualquier pregunta..."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-[0.625rem] text-[13px] outline-none transition-all resize-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(244,240,232,0.9)",
              lineHeight: 1.7,
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(184,151,58,0.4)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
        </div>

        {/* WhatsApp opt-in */}
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <div
            className="w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all"
            style={{
              borderColor: whatsappOptin ? "#b8973a" : "rgba(255,255,255,0.15)",
              background: whatsappOptin ? "rgba(184,151,58,0.15)" : "transparent",
            }}
          >
            {whatsappOptin && <Check size={10} className="text-[#b8973a]" />}
          </div>
          <span
            className="text-[11px] leading-relaxed"
            style={{ color: "rgba(244,240,232,0.5)" }}
          >
            Acepto recibir información por WhatsApp
          </span>
        </label>

        {/* Error */}
        {error && (
          <p className="text-[12px] text-red-400">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || step === "sending"}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[0.75rem] font-ui text-[10px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canSubmit
              ? "linear-gradient(135deg, #b8973a, #d4b05a)"
              : "rgba(255,255,255,0.06)",
            color: canSubmit ? "#141414" : "rgba(244,240,232,0.3)",
            boxShadow: canSubmit ? "0 0 20px rgba(184,151,58,0.2)" : "none",
          }}
        >
          {step === "sending" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <Send size={12} />
              Enviar mensaje
            </>
          )}
        </button>

        {/* Privacy note */}
        <p
          className="text-[10px] text-center leading-relaxed"
          style={{ color: "rgba(244,240,232,0.2)" }}
        >
          Al enviar, aceptas nuestra{" "}
          <a
            href="/privacidad"
            className="underline hover:text-[rgba(244,240,232,0.4)] transition-colors"
          >
            política de privacidad
          </a>
          .
        </p>
      </div>
    </div>
  );
}
