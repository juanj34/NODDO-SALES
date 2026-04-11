"use client";

import { useState, useCallback } from "react";
import {
  Loader2,
  Check,
  Send,
  X,
  ArrowRight,
  ArrowLeft,
  Building2,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRY_CODES } from "@/lib/booking-constants";
import { GHL_TAGS, GHL_CUSTOM_FIELDS, GHL_STAGES, PLAN_VALUES } from "@/lib/ghl-config";
import { trackMarketingEvent, sendCAPIEvent } from "@/lib/marketing-tracking";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";

interface ContactFormProps {
  onClose?: () => void;
  defaultPlan?: string;
  source?: string;
}

const PLAN_OPTIONS = [
  { value: "", label: "Selecciona un plan" },
  { value: "basico", label: "Básico — $199/mes por proyecto" },
  { value: "pro", label: "Pro — $249/mes por proyecto" },
  { value: "personalizado", label: "Personalizado — A medida" },
  { value: "no_se", label: "No estoy seguro aún" },
];

const PROJECT_COUNT_OPTIONS = [
  { value: "1", label: "1 proyecto" },
  { value: "2-3", label: "2–3 proyectos" },
  { value: "4-5", label: "4–5 proyectos" },
  { value: "5+", label: "Más de 5" },
];

type WizardStep = 1 | 2 | 3;
type FormStatus = "idle" | "sending" | "success";

// ─── Insight cards shown between steps ─────────────────────────────────

const INSIGHTS = [
  {
    icon: TrendingUp,
    stat: "47%",
    text: "Los equipos con showroom digital cierran ventas un 47% más rápido",
  },
  {
    icon: Users,
    stat: "2.4×",
    text: "Los asesores que usan NODDO generan 2.4 veces más leads cualificados",
  },
  {
    icon: Sparkles,
    stat: "24h",
    text: "Tiempo promedio para publicar tu primer proyecto con NODDO",
  },
];

function InsightCard({ stepIndex }: { stepIndex: number }) {
  const insight = INSIGHTS[stepIndex % INSIGHTS.length];
  const Icon = insight.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex items-start gap-3 rounded-xl px-4 py-3 mt-5"
      style={{
        background: "rgba(184,151,58,0.06)",
        border: "1px solid rgba(184,151,58,0.12)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "rgba(184,151,58,0.12)" }}
      >
        <Icon size={16} className="text-[#b8973a]" />
      </div>
      <div className="min-w-0">
        <span
          className="font-heading text-lg font-light"
          style={{ color: "#b8973a" }}
        >
          {insight.stat}
        </span>
        <p
          className="text-[11px] leading-relaxed mt-0.5"
          style={{ color: "rgba(244,240,232,0.45)" }}
        >
          {insight.text}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Step indicator ────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 24 : 6,
            height: 6,
            background:
              i === current
                ? "#b8973a"
                : i < current
                ? "rgba(184,151,58,0.4)"
                : "rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Shared input style helper ─────────────────────────────────────────

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(244,240,232,0.9)",
};

function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full px-3.5 py-2.5 rounded-[0.625rem] text-[13px] outline-none transition-all ${className}`}
      style={inputStyle}
      onFocus={(e) => (e.target.style.borderColor = "rgba(184,151,58,0.4)")}
      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
    />
  );
}

// ─── Main component ────────────────────────────────────────────────────

export function ContactForm({ onClose, defaultPlan, source }: ContactFormProps) {
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [status, setStatus] = useState<FormStatus>("idle");

  // Step 1: Basic info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Step 2: Project info
  const [company, setCompany] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [phone, setPhone] = useState("");
  const [projectCount, setProjectCount] = useState("");

  // Step 3: Plan & message
  const [plan, setPlan] = useState(defaultPlan || "");
  const [message, setMessage] = useState("");
  const [whatsappOptin] = useState(true);

  const [error, setError] = useState("");

  const fullPhone = phone ? `${countryCode}${phone.replace(/\D/g, "")}` : undefined;

  const isStep1Valid = name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isStep2Valid = true; // All optional
  const canSubmit = isStep1Valid;

  const goNext = () => {
    if (wizardStep < 3) setWizardStep((s) => (s + 1) as WizardStep);
  };
  const goBack = () => {
    if (wizardStep > 1) setWizardStep((s) => (s - 1) as WizardStep);
  };

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setStatus("sending");
    setError("");

    const tags: string[] = [GHL_TAGS.contact_form];
    if (plan === "basico") tags.push(GHL_TAGS.plan_basico);
    else if (plan === "pro") tags.push(GHL_TAGS.plan_pro);
    else if (plan === "personalizado") tags.push(GHL_TAGS.plan_personalizado);

    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get("utm_source") || undefined,
      medium: params.get("utm_medium") || undefined,
      campaign: params.get("utm_campaign") || undefined,
    };

    const noteLines = [];
    if (message.trim()) noteLines.push(message.trim());
    if (plan) {
      const planLabel = PLAN_OPTIONS.find((p) => p.value === plan)?.label || plan;
      noteLines.push(`Plan de interés: ${planLabel}`);
    }
    if (projectCount) noteLines.push(`Número de proyectos: ${projectCount}`);
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
            ...(projectCount ? { [GHL_CUSTOM_FIELDS.num_proyectos]: projectCount } : {}),
          },
          pipeline: GHL_STAGES.nuevo_prospecto
            ? {
                stageId: GHL_STAGES.nuevo_prospecto,
                name: company.trim() || name.trim(),
                monetaryValue: PLAN_VALUES[plan] || 199,
              }
            : undefined,
          source: source || "contact-form",
          utm,
          note: noteLines.join("\n"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");

      if (data.contactId) {
        localStorage.setItem(
          "noddo_ghl_contact",
          JSON.stringify({ email: email.trim().toLowerCase(), contactId: data.contactId })
        );
      }

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

      setStatus("success");
    } catch (err) {
      console.error("[ContactForm] Submit failed:", err);
      setError(err instanceof Error ? err.message : "Error al enviar. Intenta de nuevo.");
      setStatus("idle");
    }
  }, [canSubmit, name, email, company, fullPhone, plan, message, projectCount, source]);

  // ─── Success ──────────────────────────────────────────────────────────

  if (status === "success") {
    return (
      <div className="relative flex flex-col items-center justify-center p-8 sm:p-10 text-center min-h-[400px]">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[rgba(244,240,232,0.3)] hover:text-[rgba(244,240,232,0.7)] transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto"
            style={{
              background: "linear-gradient(135deg, rgba(184,151,58,0.3), rgba(184,151,58,0.1))",
              boxShadow: "0 0 40px rgba(184,151,58,0.15)",
            }}
          >
            <Check size={28} className="text-[#b8973a]" />
          </div>

          <h3
            className="font-heading text-2xl font-light mb-3"
            style={{ color: "rgba(244,240,232,0.92)" }}
          >
            ¡Listo, {name.split(" ")[0]}!
          </h3>

          <p className="text-[13px] mb-8" style={{ color: "rgba(244,240,232,0.5)" }}>
            Te contactaremos en menos de 24 horas.
          </p>
        </motion.div>

        <div className="max-w-sm w-full space-y-3 text-left">
          {[
            {
              emoji: "📧",
              title: "Revisa tu correo",
              desc: "Te enviamos confirmación + un link a una demo grabada de 2 min",
            },
            {
              emoji: "📞",
              title: "Te llamamos pronto",
              desc: "Un especialista te contactará para mostrarte NODDO con tu proyecto",
            },
            {
              emoji: "🚀",
              title: "Tu showroom en 24h",
              desc: "Después de la demo, podemos tener tu proyecto en vivo el mismo día",
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-start gap-3 rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <span className="text-lg shrink-0">{item.emoji}</span>
              <div>
                <p
                  className="text-[11px] font-ui font-bold tracking-[0.08em] uppercase"
                  style={{ color: "#b8973a" }}
                >
                  {item.title}
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "rgba(244,240,232,0.45)" }}>
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Wizard steps ─────────────────────────────────────────────────────

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const direction = 1; // always forward animation feel

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

      {/* Step dots */}
      <StepDots current={wizardStep - 1} total={3} />

      <AnimatePresence mode="wait" custom={direction}>
        {/* ── STEP 1: Name + Email ── */}
        {wizardStep === 1 && (
          <motion.div
            key="step1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="mb-5">
              <h3
                className="font-heading text-xl sm:text-2xl font-light"
                style={{ color: "rgba(244,240,232,0.92)" }}
              >
                Empecemos contigo
              </h3>
              <p className="text-[12px] mt-1.5" style={{ color: "rgba(244,240,232,0.4)" }}>
                Solo necesitamos tu nombre y correo para comenzar.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  className="block text-[10px] font-ui font-bold tracking-[0.12em] uppercase mb-1.5"
                  style={{ color: "rgba(244,240,232,0.4)" }}
                >
                  Nombre
                </label>
                <FocusInput
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  autoFocus
                />
              </div>
              <div>
                <label
                  className="block text-[10px] font-ui font-bold tracking-[0.12em] uppercase mb-1.5"
                  style={{ color: "rgba(244,240,232,0.4)" }}
                >
                  Email
                </label>
                <FocusInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                />
              </div>
            </div>

            <InsightCard stepIndex={0} />

            {/* Next */}
            <button
              onClick={goNext}
              disabled={!isStep1Valid}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[0.75rem] font-ui text-[10px] font-bold tracking-[0.15em] uppercase transition-all mt-6 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: isStep1Valid
                  ? "linear-gradient(135deg, #b8973a, #d4b05a)"
                  : "rgba(255,255,255,0.06)",
                color: isStep1Valid ? "#141414" : "rgba(244,240,232,0.3)",
                boxShadow: isStep1Valid ? "0 0 20px rgba(184,151,58,0.2)" : "none",
              }}
            >
              Continuar <ArrowRight size={14} />
            </button>
          </motion.div>
        )}

        {/* ── STEP 2: Project details ── */}
        {wizardStep === 2 && (
          <motion.div
            key="step2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="mb-5">
              <h3
                className="font-heading text-xl sm:text-2xl font-light"
                style={{ color: "rgba(244,240,232,0.92)" }}
              >
                Cuéntanos de tu proyecto
              </h3>
              <p className="text-[12px] mt-1.5" style={{ color: "rgba(244,240,232,0.4)" }}>
                Esto nos ayuda a preparar una demo personalizada para ti.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  className="block text-[10px] font-ui font-bold tracking-[0.12em] uppercase mb-1.5"
                  style={{ color: "rgba(244,240,232,0.4)" }}
                >
                  Empresa / Constructora
                </label>
                <FocusInput
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Nombre de tu empresa"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          <span>{String(opt.metadata?.flag ?? "")} {opt.label}</span>
                        )}
                        renderSelected={(opt) => (
                          <span>{String(opt.metadata?.flag ?? "")} {opt.label}</span>
                        )}
                      />
                    </div>
                    <FocusInput
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="300 123 4567"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-[10px] font-ui font-bold tracking-[0.12em] uppercase mb-1.5"
                    style={{ color: "rgba(244,240,232,0.4)" }}
                  >
                    ¿Cuántos proyectos manejas?
                  </label>
                  <NodDoDropdown
                    variant="marketing"
                    size="md"
                    value={projectCount}
                    onChange={setProjectCount}
                    options={PROJECT_COUNT_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    placeholder="Selecciona"
                  />
                </div>
              </div>
            </div>

            <InsightCard stepIndex={1} />

            {/* Nav */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={goBack}
                className="flex items-center justify-center gap-1.5 py-3 px-5 rounded-[0.75rem] font-ui text-[10px] font-bold tracking-[0.12em] uppercase transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(244,240,232,0.5)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <ArrowLeft size={12} /> Atrás
              </button>
              <button
                onClick={goNext}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[0.75rem] font-ui text-[10px] font-bold tracking-[0.15em] uppercase transition-all"
                style={{
                  background: "linear-gradient(135deg, #b8973a, #d4b05a)",
                  color: "#141414",
                  boxShadow: "0 0 20px rgba(184,151,58,0.2)",
                }}
              >
                Continuar <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Plan + Message ── */}
        {wizardStep === 3 && (
          <motion.div
            key="step3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="mb-5">
              <h3
                className="font-heading text-xl sm:text-2xl font-light"
                style={{ color: "rgba(244,240,232,0.92)" }}
              >
                Casi listo, {name.split(" ")[0]}
              </h3>
              <p className="text-[12px] mt-1.5" style={{ color: "rgba(244,240,232,0.4)" }}>
                Elige el plan que más te interesa y déjanos cualquier pregunta.
              </p>
            </div>

            <div className="space-y-3">
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

              <div>
                <label
                  className="block text-[10px] font-ui font-bold tracking-[0.12em] uppercase mb-1.5"
                  style={{ color: "rgba(244,240,232,0.4)" }}
                >
                  ¿Algo más que debamos saber?
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ej: Tenemos un proyecto de 200 unidades en preventa..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-[0.625rem] text-[13px] outline-none transition-all resize-none"
                  style={{
                    ...inputStyle,
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
                <span className="text-[11px] leading-relaxed" style={{ color: "rgba(244,240,232,0.5)" }}>
                  Acepto recibir información por WhatsApp
                </span>
              </label>
            </div>

            {error && <p className="text-[12px] text-red-400 mt-3">{error}</p>}

            <InsightCard stepIndex={2} />

            {/* Nav */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={goBack}
                className="flex items-center justify-center gap-1.5 py-3 px-5 rounded-[0.75rem] font-ui text-[10px] font-bold tracking-[0.12em] uppercase transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(244,240,232,0.5)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <ArrowLeft size={12} /> Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || status === "sending"}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[0.75rem] font-ui text-[10px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: canSubmit
                    ? "linear-gradient(135deg, #b8973a, #d4b05a)"
                    : "rgba(255,255,255,0.06)",
                  color: canSubmit ? "#141414" : "rgba(244,240,232,0.3)",
                  boxShadow: canSubmit ? "0 0 20px rgba(184,151,58,0.2)" : "none",
                }}
              >
                {status === "sending" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Send size={12} />
                    Enviar solicitud
                  </>
                )}
              </button>
            </div>

            {/* Privacy */}
            <p
              className="text-[10px] text-center leading-relaxed mt-4"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
