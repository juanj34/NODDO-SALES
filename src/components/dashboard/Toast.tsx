"use client";

import { useState, useCallback, useMemo, createContext, useContext } from "react";
import { Check, X, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const iconMap: Record<ToastType, typeof Check> = {
  success: Check,
  error: X,
  info: Info,
};

const colorMap: Record<ToastType, string> = {
  success: "border-green-500/30 bg-green-500/10",
  error: "border-red-500/30 bg-red-500/10",
  info: "border-[rgba(var(--site-primary-rgb),0.3)] bg-[rgba(var(--site-primary-rgb),0.1)]",
};

const iconColorMap: Record<ToastType, string> = {
  success: "text-green-400",
  error: "text-red-400",
  info: "text-[var(--site-primary)]",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = useMemo<ToastContextValue>(() => ({
    toast: addToast,
    success: (msg: string) => addToast("success", msg),
    error: (msg: string) => addToast("error", msg),
    info: (msg: string) => addToast("info", msg),
  }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = iconMap[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 100, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-xl min-w-[280px] ${colorMap[t.type]}`}
              >
                <Icon size={16} className={iconColorMap[t.type]} />
                <span className="text-sm text-white flex-1">{t.message}</span>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-[var(--text-tertiary)] hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
