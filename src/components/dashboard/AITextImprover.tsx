"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Check, X } from "lucide-react";

type ImprovementStyle = "expandir" | "resumir" | "tono_premium" | "corregir";

interface StyleOption {
  id: ImprovementStyle;
  label: string;
  description: string;
  icon: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "expandir",
    label: "Expandir",
    description: "Agregar detalles y elaborar el contenido",
    icon: "📝",
  },
  {
    id: "resumir",
    label: "Resumir",
    description: "Condensar a los puntos clave",
    icon: "✂️",
  },
  {
    id: "tono_premium",
    label: "Tono Premium",
    description: "Elevar el vocabulario para mercado de lujo",
    icon: "✨",
  },
  {
    id: "corregir",
    label: "Corregir",
    description: "Arreglar gramática y ortografía",
    icon: "✓",
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<ImprovementStyle | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [improvedText, setImprovedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcut: Cmd+Shift+I
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        if (!disabled && value.trim()) {
          setIsModalOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, value]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    // Simple toast notification (you can replace with your toast system)
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);

  const handleOpenModal = useCallback(() => {
    if (!value.trim()) {
      showToast("Escribe algo de texto primero", "error");
      return;
    }
    if (value.length > maxLength) {
      showToast(`Texto demasiado largo. Máximo ${maxLength} caracteres.`, "error");
      return;
    }
    setIsModalOpen(true);
    setImprovedText(null);
    setError(null);
    setSelectedStyle(null);
  }, [value, maxLength, showToast]);

  const handleSelectStyle = useCallback(
    async (style: ImprovementStyle) => {
      setSelectedStyle(style);
      setIsLoading(true);
      setError(null);
      setImprovedText(null);

      try {
        const res = await fetch("/api/ai/improve-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: value, style }),
        });

        // Extract rate limit headers
        const remaining = res.headers.get("X-RateLimit-Remaining");
        if (remaining) setRemainingRequests(Number(remaining));

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
        setImprovedText(data.improved);

        if (data.cached) {
          showToast("Resultado desde caché (mejora anterior idéntica)", "info");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error desconocido";
        setError(message);
        showToast(message, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [value, showToast]
  );

  const handleApply = useCallback(() => {
    if (improvedText) {
      onChange(improvedText);
      setIsModalOpen(false);
      showToast("Texto mejorado aplicado", "success");
    }
  }, [improvedText, onChange, showToast]);

  const handleDiscard = useCallback(() => {
    setImprovedText(null);
    setSelectedStyle(null);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setImprovedText(null);
    setSelectedStyle(null);
    setError(null);
  }, []);

  return (
    <div className="relative">
      {label && (
        <label className="block mb-2 text-xs font-ui font-bold text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 bg-[var(--surface-3)] border border-[var(--border-default)] rounded-[0.625rem] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--noddo-primary)] focus:ring-2 focus:ring-[rgba(var(--noddo-primary-rgb),0.15)] transition-colors resize-none ${className}`}
        />

        {/* Floating Sparkles Button */}
        <button
          type="button"
          onClick={handleOpenModal}
          disabled={disabled || !value.trim()}
          className="absolute top-3 right-3 p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--noddo-primary)] hover:bg-[rgba(var(--noddo-primary-rgb),0.1)] hover:border-[var(--noddo-primary)] hover:shadow-[var(--glow-sm)] transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
          title="Mejorar con IA (Cmd+Shift+I)"
        >
          <Sparkles size={16} className="group-hover:animate-pulse" />
        </button>
      </div>

      {/* Character Count */}
      {maxLength && (
        <div className="mt-1 text-xs text-[var(--text-tertiary)] text-right">
          {value.length} / {maxLength}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[1.25rem] shadow-[var(--shadow-xl)]"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      <Sparkles
                        size={20}
                        className="text-[var(--noddo-primary)]"
                      />
                      Mejorar texto con IA
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Elige un estilo de mejora para tu texto
                    </p>
                    {remainingRequests !== null && (
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        {remainingRequests} mejoras restantes hoy
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Style Selection (if no result yet) */}
                {!improvedText && !isLoading && (
                  <div className="grid grid-cols-2 gap-3">
                    {STYLE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleSelectStyle(option.id)}
                        className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)] text-left hover:bg-[var(--surface-3)] hover:border-[var(--noddo-primary)] hover:shadow-[var(--glow-sm)] transition-all group"
                      >
                        <div className="text-2xl mb-2">{option.icon}</div>
                        <div className="text-sm font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--noddo-primary)] transition-colors">
                          {option.label}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2
                      size={32}
                      className="text-[var(--noddo-primary)] animate-spin mb-4"
                    />
                    <p className="text-sm text-[var(--text-secondary)]">
                      Mejorando con estilo:{" "}
                      <span className="text-[var(--noddo-primary)] font-semibold">
                        {STYLE_OPTIONS.find((s) => s.id === selectedStyle)
                          ?.label}
                      </span>
                    </p>
                  </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
                    <p className="font-semibold mb-1">Error</p>
                    <p>{error}</p>
                    <button
                      onClick={() =>
                        selectedStyle && handleSelectStyle(selectedStyle)
                      }
                      className="mt-3 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors text-xs font-semibold"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {/* Result Preview */}
                {improvedText && (
                  <div className="space-y-4">
                    {/* Before/After Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-ui font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                          Original
                        </p>
                        <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] max-h-48 overflow-y-auto">
                          {value}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-ui font-bold text-[var(--noddo-primary)] uppercase tracking-wider mb-2">
                          Mejorado
                        </p>
                        <div className="p-3 rounded-lg bg-[rgba(var(--noddo-primary-rgb),0.05)] border border-[var(--noddo-primary)] text-sm text-[var(--text-primary)] max-h-48 overflow-y-auto">
                          {improvedText}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                      <button
                        onClick={handleDiscard}
                        className="px-5 py-2.5 text-sm font-medium rounded-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-[var(--border-subtle)] transition-colors"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={handleApply}
                        className="px-5 py-2.5 text-sm font-semibold rounded-[0.75rem] bg-[var(--noddo-primary)] hover:bg-[var(--noddo-secondary)] text-black transition-colors shadow-[var(--glow-sm)] flex items-center gap-2"
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
