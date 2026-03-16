"use client";

import { useState, useCallback, useEffect, createContext, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { CloseButton } from "@/components/ui/CloseButton";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  /** Entity name shown below title (e.g. "Torre Principal") */
  description?: string;
  /** Impact summary shown as warning pill (e.g. "12 unidades serán desvinculadas") */
  details?: string;
  /** When set, user must type this exact string to enable the confirm button */
  typeToConfirm?: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [closing, setClosing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setClosing(false);
      setInputValue("");
      setOptions(opts);
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
    setClosing(false);
  }, []);

  useEffect(() => {
    if (!options) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [options, handleClose]);

  const isDanger = !options?.variant || options.variant === "danger";
  const needsTypeConfirm = !!options?.typeToConfirm;
  const isConfirmDisabled = closing || (needsTypeConfirm && inputValue !== options?.typeToConfirm);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {options && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="alertdialog"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => handleClose(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative w-full glass-modal p-6",
                needsTypeConfirm ? "max-w-md" : "max-w-sm"
              )}
            >
              {/* Header: Icon + Title + Close */}
              <div className="flex items-start gap-3.5">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    isDanger ? "bg-red-500/15" : "bg-amber-500/12"
                  )}
                >
                  <AlertTriangle
                    size={20}
                    className={isDanger ? "text-red-400" : "text-amber-400"}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    id="confirm-dialog-title"
                    className="text-sm font-medium text-[var(--text-primary)]"
                  >
                    {options.title || "Confirmar"}
                  </h3>
                  {options.description && (
                    <p className="text-[11px] text-[var(--text-tertiary)] font-mono truncate mt-0.5">
                      {options.description}
                    </p>
                  )}
                  <p
                    id="confirm-dialog-description"
                    className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed"
                  >
                    {options.message}
                  </p>
                </div>
                <CloseButton
                  onClick={() => handleClose(false)}
                  variant="subtle"
                  size={16}
                />
              </div>

              {/* Details pill — impact summary */}
              {options.details && (
                <div
                  className={cn(
                    "mt-3 px-3 py-2 rounded-lg border",
                    isDanger
                      ? "bg-red-500/8 border-red-500/15"
                      : "bg-amber-500/8 border-amber-500/15"
                  )}
                >
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {options.details}
                  </p>
                </div>
              )}

              {/* Type-to-confirm input */}
              {needsTypeConfirm && (
                <div className="mt-4">
                  <label
                    htmlFor="confirm-type-input"
                    className="block text-xs text-[var(--text-secondary)] mb-2"
                  >
                    Escribe{" "}
                    <span className="font-medium text-[var(--text-primary)] font-mono">
                      {options.typeToConfirm}
                    </span>{" "}
                    para confirmar:
                  </label>
                  <input
                    id="confirm-type-input"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isConfirmDisabled) {
                        setClosing(true);
                        handleClose(true);
                      }
                    }}
                    placeholder={options.typeToConfirm}
                    className="input-glass w-full"
                    autoFocus
                    aria-label={`Escribe "${options.typeToConfirm}" para confirmar`}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex items-center gap-2.5">
                <button
                  onClick={() => handleClose(false)}
                  className="flex-1 px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] rounded-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-white/5 transition-all"
                >
                  {options.cancelLabel || "Cancelar"}
                </button>
                <button
                  onClick={() => {
                    setClosing(true);
                    handleClose(true);
                  }}
                  disabled={isConfirmDisabled}
                  className={cn(
                    "flex-1 px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] rounded-[0.75rem] flex items-center justify-center gap-2 whitespace-nowrap transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                    isDanger
                      ? "bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 hover:border-red-500/40"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 hover:border-amber-500/40"
                  )}
                >
                  {closing ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  ) : isDanger ? (
                    <Trash2 size={13} aria-hidden="true" />
                  ) : null}
                  {options.confirmLabel || (isDanger ? "Eliminar" : "Confirmar")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
