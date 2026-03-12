"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import {
  Mail,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirect=/nueva-contrasena`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--mk-bg)] flex items-center justify-center px-4 pt-24 pb-12 relative overflow-hidden">
      {/* Ambient gold gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[30%] -right-[20%] w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(184,151,58,0.15) 0%, rgba(184,151,58,0.03) 50%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.06, 0.12, 0.06],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -bottom-[20%] -left-[15%] w-[500px] h-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(184,151,58,0.12) 0%, rgba(184,151,58,0.02) 50%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-10"
        >
          <Link
            href="/"
            className="inline-block hover:opacity-80 transition-opacity"
          >
            <NodDoLogo
              height={22}
              colorNod="#f4f0e8"
              colorDo="#b8973a"
            />
          </Link>
          <p className="font-mono text-[var(--mk-text-tertiary)] text-xs mt-4 tracking-wide font-light">
            Recupera el acceso a tu cuenta
          </p>
        </motion.div>

        {/* Glassmorphism Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="login-card relative rounded-2xl overflow-hidden"
        >
          <div className="relative p-8 sm:p-10">
            <h1 className="font-heading text-2xl font-light text-[var(--mk-text-primary)] mb-2 tracking-wide">
              Recuperar contrasena
            </h1>
            <p className="font-mono text-xs text-[var(--mk-text-tertiary)] font-light mb-6 leading-relaxed">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contrasena.
            </p>

            {/* Success State */}
            {sent ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="p-4 rounded-xl flex items-start gap-3 mb-6"
                  style={{
                    background: "rgba(52, 211, 153, 0.08)",
                    border: "1px solid rgba(52, 211, 153, 0.2)",
                  }}
                >
                  <CheckCircle
                    size={16}
                    className="shrink-0 mt-0.5 text-emerald-400"
                  />
                  <div>
                    <span className="text-emerald-300 font-mono text-xs font-light leading-relaxed block">
                      Email enviado correctamente
                    </span>
                    <span className="text-emerald-300/60 font-mono text-[11px] font-light leading-relaxed block mt-1">
                      Revisa tu bandeja de entrada en <strong className="font-medium">{email}</strong> y haz clic en el enlace para restablecer tu contrasena.
                    </span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="btn-mk-primary w-full py-3.5 flex items-center justify-center gap-2.5"
                  style={{ borderRadius: "0.75rem" }}
                >
                  <ArrowLeft size={14} />
                  Volver a iniciar sesion
                </Link>
              </motion.div>
            ) : (
              <>
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-3.5 rounded-xl flex items-start gap-2.5"
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <AlertCircle
                      size={16}
                      className="shrink-0 mt-0.5 text-red-400"
                    />
                    <span className="text-red-300 font-mono text-xs font-light leading-relaxed">
                      {error}
                    </span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block font-ui text-[10px] text-[var(--mk-text-secondary)] mb-2 tracking-[0.15em] uppercase font-bold">
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mk-text-muted)]"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="input-mk w-full pl-10 pr-4 py-3"
                        placeholder="tu@email.com"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-mk-primary w-full py-3.5 flex items-center justify-center gap-2.5 mt-2 disabled:opacity-50"
                    style={{ borderRadius: "0.75rem" }}
                  >
                    {loading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      "Enviar enlace de recuperacion"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>

        {/* Back to login */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 text-xs font-mono font-light text-[var(--mk-text-tertiary)]"
        >
          <Link
            href="/login"
            className="text-[var(--mk-accent)] hover:text-[var(--mk-accent-light)] transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={12} />
            Volver a iniciar sesion
          </Link>
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-4 text-[10px] font-mono font-light text-[var(--mk-text-muted)]"
        >
          Micrositios premium para inmobiliarias
        </motion.p>
      </motion.div>
    </div>
  );
}
