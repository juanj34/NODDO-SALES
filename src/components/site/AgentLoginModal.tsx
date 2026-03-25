"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAgentMode } from "@/hooks/useAgentMode";

interface AgentLoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function AgentLoginModal({ open, onClose }: AgentLoginModalProps) {
  const { login } = useAgentMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#111113]/95 backdrop-blur-xl shadow-2xl"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-white/40 hover:text-white/80 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="px-6 pt-6 pb-2 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center mb-3">
                <Lock size={18} className="text-[var(--site-primary)]" />
              </div>
              <h3 className="font-heading text-xl text-white/90">
                Modo Agente
              </h3>
              <p className="text-xs text-white/40 mt-1 font-mono">
                Ingresa con tu cuenta de agente
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 mt-2">
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-mono">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-[var(--site-primary)] focus:ring-1 focus:ring-[var(--site-primary)] transition-colors"
                  placeholder="agente@ejemplo.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-mono">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-[var(--site-primary)] focus:ring-1 focus:ring-[var(--site-primary)] transition-colors"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--site-primary)] text-[#0A0A0B] font-ui text-xs font-bold uppercase tracking-[0.08em] py-2.5 hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Ingresar"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
