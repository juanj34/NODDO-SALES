"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Check, X, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui";

type ImprovementStyle = "expandir" | "resumir" | "tono_premium" | "corregir";
type ToneOption = "profesional" | "casual" | "lujo" | "tecnico" | "persuasivo";

interface DropdownItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  kind: "advanced" | "direct";
  style?: ImprovementStyle;
}

const DROPDOWN_ITEMS: DropdownItem[] = [
  {
    id: "generate",
    label: "Generate with AI",
    description: "Configuración avanzada con tono, idioma y objetivo",
    icon: "✨",
    kind: "advanced",
  },
  {
    id: "expandir",
    label: "Expandir texto",
    description: "Agregar detalles y elaborar el contenido",
    icon: "📝",
    kind: "direct",
    style: "expandir",
  },
  {
    id: "resumir",
    label: "Resumir texto",
    description: "Condensar a los puntos clave",
    icon: "✂️",
    kind: "direct",
    style: "resumir",
  },
  {
    id: "tono_premium",
    label: "Tono premium",
    description: "Elevar el vocabulario para mercado de lujo",
    icon: "💎",
    kind: "direct",
    style: "tono_premium",
  },
  {
    id: "corregir",
    label: "Corregir ortografía",
    description: "Arreglar gramática y ortografía",
    icon: "✓",
    kind: "direct",
    style: "corregir",
  },
];

const TONES: { value: ToneOption; label: string; desc: string }[] = [
  {
    value: "profesional",
    label: "Profesional",
    desc: "Formal, claro, apropiado para negocios",
  },
  {
    value: "casual",
    label: "Casual",
    desc: "Amigable, conversacional, cercano",
  },
  {
    value: "lujo",
    label: "Lujo",
    desc: "Sofisticado, exclusivo, mercado premium",
  },
  {
    value: "tecnico",
    label: "Técnico",
    desc: "Preciso, detallado, lenguaje arquitectónico",
  },
  {
    value: "persuasivo",
    label: "Persuasivo",
    desc: "Convincente, orientado a beneficios",
  },
];

interface AITextImproverProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function AITextImprover({
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength = 5000,
  label,
  className = "",
  disabled = false,
}: AITextImproverProps) {
  /* ── dropdown ── */
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  /* ── advanced modal ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [tone, setTone] = useState<ToneOption>("profesional");
  const [lang, setLang] = useState<"es" | "en">("es");
  const [goal, setGoal] = useState("");
  const [baseStyle, setBaseStyle] = useState<ImprovementStyle>("expandir");

  /* ── shared processing state ── */
  const [loading, setLoading] = useState(false);
  const [improved, setImproved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [actionLabel, setActionLabel] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── close dropdown on outside click ── */
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        if (!disabled && value.trim()) setDropdownOpen((p) => !p);
      }
      if (e.key === "Escape") {
        if (dropdownOpen) setDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disabled, value, dropdownOpen]);

  /* ── API call ── */
  const callAPI = useCallback(
    async (
      text: string,
      style: ImprovementStyle,
      opts?: { tone?: ToneOption; language?: "es" | "en"; goal?: string }
    ): Promise<{ improved: string; cached: boolean } | null> => {
      try {
        const res = await fetch("/api/ai/improve-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            style,
            ...(opts?.tone && { tone: opts.tone }),
            ...(opts?.language && { language: opts.language }),
            ...(opts?.goal && { goal: opts.goal }),
          }),
        });

        const rem = res.headers.get("X-RateLimit-Remaining");
        if (rem) setRemaining(Number(rem));

        if (!res.ok) {
          const data = await res.json();
          if (data.code === "RATE_LIMIT_EXCEEDED") {
            throw new Error(
              "Límite diario alcanzado (50 mejoras/día). Intenta mañana."
            );
          }
          throw new Error(data.error || "Error al mejorar el texto");
        }

        const data = await res.json();
        return { improved: data.improved, cached: data.cached || false };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        setError(msg);
        return null;
      }
    },
    []
  );

  /* ── validate text before processing ── */
  const canProcess = useCallback(() => {
    if (!value.trim()) {
      setError("Escribe algo de texto primero");
      return false;
    }
    if (value.length > maxLength) {
      setError(`Texto demasiado largo. Máximo ${maxLength} caracteres.`);
      return false;
    }
    return true;
  }, [value, maxLength]);

  /* ── direct improvement (from dropdown) ── */
  const handleDirect = useCallback(
    async (style: ImprovementStyle, lbl: string) => {
      if (!canProcess()) return;
      setDropdownOpen(false);
      setLoading(true);
      setError(null);
      setImproved(null);
      setActionLabel(lbl);

      const result = await callAPI(value, style);
      setLoading(false);
      if (result) setImproved(result.improved);
    },
    [value, canProcess, callAPI]
  );

  /* ── advanced generate (from modal) ── */
  const handleGenerate = useCallback(async () => {
    if (!canProcess()) return;
    setLoading(true);
    setError(null);
    setImproved(null);
    setActionLabel("Generate with AI");

    const result = await callAPI(value, baseStyle, {
      tone,
      language: lang,
      goal: goal.trim() || undefined,
    });
    setLoading(false);
    if (result) setImproved(result.improved);
  }, [value, canProcess, callAPI, baseStyle, tone, lang, goal]);

  /* ── apply / discard / close ── */
  const handleApply = useCallback(() => {
    if (!improved) return;
    onChange(improved);
    setImproved(null);
    setModalOpen(false);
  }, [improved, onChange]);

  const handleDiscard = useCallback(() => {
    setImproved(null);
    setError(null);
  }, []);

  const openAdvancedModal = useCallback(() => {
    if (!canProcess()) return;
    setDropdownOpen(false);
    setModalOpen(true);
    setImproved(null);
    setError(null);
  }, [canProcess]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setImproved(null);
    setError(null);
  }, []);

  /* ── input class (reused) ── */
  const inputCls =
    "w-full px-4 py-3 bg-[var(--surface-3)] border border-[var(--border-default)] rounded-[0.625rem] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--site-primary)] focus:ring-2 focus:ring-[rgba(var(--site-primary-rgb),0.15)] transition-colors";

  return (
    <div className="relative">
      {label && (
        <Label>{label}</Label>
      )}

      {/* ── textarea + sparkles trigger ── */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputCls} resize-none ${className}`}
        />

        {/* sparkles button */}
        <div className="absolute top-3 right-3">
          <button
            ref={btnRef}
            type="button"
            onClick={() => setDropdownOpen((p) => !p)}
            disabled={disabled || !value.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.1)] hover:border-[var(--site-primary)] hover:shadow-[var(--glow-sm)] transition-all disabled:opacity-30 disabled:cursor-not-allowed group cursor-pointer"
            title="Mejorar con IA (Ctrl+Shift+I)"
          >
            <Sparkles size={16} className="group-hover:animate-pulse" />
            <ChevronDown
              size={14}
              className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* ── dropdown menu ── */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                ref={dropRef}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                role="menu"
                className="absolute right-0 top-full mt-2 w-72 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[0.75rem] shadow-[var(--shadow-lg)] overflow-hidden z-50"
              >
                {DROPDOWN_ITEMS.map((item, idx) => (
                  <button
                    key={item.id}
                    role="menuitem"
                    onClick={() => {
                      if (item.kind === "direct" && item.style) {
                        handleDirect(item.style, item.label);
                      } else {
                        openAdvancedModal();
                      }
                    }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--surface-3)] transition-colors cursor-pointer ${
                      idx === 0
                        ? "border-b border-[var(--border-subtle)] bg-[rgba(var(--site-primary-rgb),0.05)]"
                        : ""
                    }`}
                  >
                    <span className="text-lg shrink-0 mt-0.5">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--text-primary)] mb-0.5 flex items-center gap-2">
                        {item.label}
                        {idx === 0 && (
                          <span className="text-[9px] font-ui font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--site-primary)] text-black">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] line-clamp-1">
                        {item.description}
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* char count */}
      {maxLength && (
        <div className="mt-1 text-xs font-mono tabular-nums text-[var(--text-tertiary)] text-right">
          {value.length} / {maxLength}
        </div>
      )}

      {/* ── inline loading (direct improvements) ── */}
      {loading && !modalOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        >
          <Loader2
            size={14}
            className="animate-spin text-[var(--site-primary)]"
          />
          <span>Procesando: {actionLabel}...</span>
        </motion.div>
      )}

      {/* ── inline error (direct improvements) ── */}
      {error && !loading && !modalOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between"
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-400/60 hover:text-red-400"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* ── inline result preview (direct improvements) ── */}
      {improved && !modalOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-4 rounded-[0.75rem] bg-[var(--surface-2)] border border-[var(--border-default)]"
        >
          <div className="flex items-start justify-between mb-2">
            <Label variant="card" className="text-[var(--site-primary)]">Texto mejorado</Label>
            {remaining !== null && (
              <p className="text-xs text-[var(--text-tertiary)]">
                {remaining}/50 restantes hoy
              </p>
            )}
          </div>
          <div className="text-sm text-[var(--text-primary)] mb-3 max-h-32 overflow-y-auto leading-relaxed">
            {improved}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleDiscard}
              className="px-4 py-2 text-xs font-medium rounded-[0.625rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              Descartar
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-xs font-semibold rounded-[0.625rem] bg-[var(--site-primary)] hover:bg-[var(--site-secondary)] text-black transition-colors shadow-[var(--glow-sm)] flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              Aplicar
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── ADVANCED MODAL ("Generate with AI") ──         */}
      {/* ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[1.25rem] shadow-[var(--shadow-xl)]"
            >
              <div className="p-6">
                {/* header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-heading font-light text-[var(--text-primary)] flex items-center gap-2">
                      <Sparkles
                        size={20}
                        className="text-[var(--site-primary)]"
                      />
                      Generate with AI
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Configura el tono, idioma y objetivo para un resultado
                      personalizado
                    </p>
                    {remaining !== null && (
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        {remaining}/50 mejoras restantes hoy
                      </p>
                    )}
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* ── form (hidden while loading or showing result) ── */}
                {!loading && !improved && (
                  <div className="space-y-5">
                    {/* tone */}
                    <div>
                      <Label>Tono</Label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value as ToneOption)}
                        className={inputCls}
                      >
                        {TONES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label} — {t.desc}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* language toggle */}
                    <div>
                      <Label>Idioma de salida</Label>
                      <div className="flex gap-2">
                        {(["es", "en"] as const).map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setLang(l)}
                            className={`flex-1 px-4 py-3 rounded-[0.625rem] text-sm font-ui font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              lang === l
                                ? "bg-[var(--site-primary)] text-black shadow-[var(--glow-sm)]"
                                : "bg-[var(--surface-3)] text-[var(--text-tertiary)] border border-[var(--border-default)] hover:border-[var(--site-primary)]"
                            }`}
                          >
                            {l === "es" ? "Español" : "English"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* goal */}
                    <div>
                      <Label>Objetivo (opcional)</Label>
                      <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        rows={2}
                        maxLength={200}
                        placeholder="Describe el mensaje clave o propósito del texto..."
                        className={`${inputCls} resize-none`}
                      />
                      <div className="mt-1 text-xs font-mono tabular-nums text-[var(--text-tertiary)] text-right">
                        {goal.length} / 200
                      </div>
                    </div>

                    {/* base style */}
                    <div>
                      <Label>Estilo base</Label>
                      <select
                        value={baseStyle}
                        onChange={(e) =>
                          setBaseStyle(e.target.value as ImprovementStyle)
                        }
                        className={inputCls}
                      >
                        <option value="expandir">
                          Expandir — Agregar más detalles
                        </option>
                        <option value="resumir">
                          Resumir — Condensar puntos clave
                        </option>
                        <option value="tono_premium">
                          Tono Premium — Vocabulario sofisticado
                        </option>
                        <option value="corregir">
                          Corregir — Solo gramática y ortografía
                        </option>
                      </select>
                    </div>

                    {/* error inside modal */}
                    {error && (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        <p>{error}</p>
                      </div>
                    )}

                    {/* actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                      <button
                        onClick={closeModal}
                        className="px-5 py-2.5 text-sm font-medium rounded-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-[var(--border-subtle)] transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="px-5 py-2.5 text-sm font-semibold rounded-[0.75rem] bg-[var(--site-primary)] hover:bg-[var(--site-secondary)] text-black transition-colors shadow-[var(--glow-sm)] flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles size={16} />
                        Generar
                      </button>
                    </div>
                  </div>
                )}

                {/* ── loading ── */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2
                      size={32}
                      className="text-[var(--site-primary)] animate-spin mb-4"
                    />
                    <p className="text-sm text-[var(--text-secondary)]">
                      Generando con IA...
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      Tono:{" "}
                      {TONES.find((t) => t.value === tone)?.label ?? tone} ·{" "}
                      {lang === "es" ? "Español" : "English"}
                    </p>
                  </div>
                )}

                {/* ── error after generate ── */}
                {error && !loading && improved === null && modalOpen && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    <p className="font-semibold mb-1">Error</p>
                    <p>{error}</p>
                    <button
                      onClick={handleGenerate}
                      className="mt-3 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors text-xs font-semibold cursor-pointer"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {/* ── result comparison ── */}
                {improved && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label variant="section">Original</Label>
                        <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] max-h-48 overflow-y-auto leading-relaxed">
                          {value}
                        </div>
                      </div>
                      <div>
                        <Label variant="section" className="text-[var(--site-primary)]">Mejorado</Label>
                        <div className="p-3 rounded-lg bg-[rgba(var(--site-primary-rgb),0.05)] border border-[var(--site-primary)] text-sm text-[var(--text-primary)] max-h-48 overflow-y-auto leading-relaxed">
                          {improved}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                      <button
                        onClick={handleDiscard}
                        className="px-5 py-2.5 text-sm font-medium rounded-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-[var(--border-subtle)] transition-colors cursor-pointer"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={handleApply}
                        className="px-5 py-2.5 text-sm font-semibold rounded-[0.75rem] bg-[var(--site-primary)] hover:bg-[var(--site-secondary)] text-black transition-colors shadow-[var(--glow-sm)] flex items-center gap-2 cursor-pointer"
                      >
                        <Check size={16} />
                        Aplicar cambios
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
