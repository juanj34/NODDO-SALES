"use client";

import { useState, useCallback, createContext, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
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
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  }, []);

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
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => handleClose(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-sm rounded-[1.25rem] border border-[var(--border-default)] bg-[var(--surface-2)] shadow-xl"
            >
              <div className="p-6">
                {/* Icon + Title */}
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      options.variant === "warning"
                        ? "bg-amber-500/10"
                        : "bg-red-500/10"
                    }`}
                  >
                    <AlertTriangle
                      size={20}
                      className={
                        options.variant === "warning"
                          ? "text-amber-400"
                          : "text-red-400"
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[var(--text-primary)] font-semibold text-base">
                      {options.title || "Confirmar"}
                    </h3>
                    <p className="mt-1.5 text-sm text-[var(--text-secondary)] leading-relaxed">
                      {options.message}
                    </p>
                  </div>
                  <button
                    onClick={() => handleClose(false)}
                    className="shrink-0 rounded-lg p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleClose(false)}
                    className="px-4 py-2 text-sm font-medium rounded-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-[var(--border-subtle)] transition-colors"
                  >
                    {options.cancelLabel || "Cancelar"}
                  </button>
                  <button
                    onClick={() => handleClose(true)}
                    className={`px-4 py-2 text-sm font-semibold rounded-[0.75rem] transition-colors ${
                      options.variant === "warning"
                        ? "bg-amber-500 hover:bg-amber-400 text-black"
                        : "bg-red-500 hover:bg-red-400 text-white"
                    }`}
                  >
                    {options.confirmLabel || "Eliminar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
