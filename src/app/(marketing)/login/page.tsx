"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, AlertCircle, Loader2, CheckCircle } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[var(--mk-bg)]" />}
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/proyectos";

  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setError(null);
      setSuccessMsg("Revisa tu email para confirmar tu cuenta.");
      setLoading(false);
      return;
    }

    window.location.href = redirect;
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--mk-bg)] flex items-center justify-center px-4 pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Subtitle */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="font-heading text-2xl tracking-[0.2em] text-[var(--mk-text-primary)] font-bold inline-block"
          >
            NODDO
          </Link>
          <p className="text-[var(--mk-text-tertiary)] text-sm mt-2">
            {isLogin ? "Inicia sesion en tu cuenta" : "Crea tu cuenta"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[var(--mk-surface-3)] border border-[var(--mk-border-subtle)] rounded-xl p-8 shadow-[var(--mk-shadow-lg)]">
          {/* Success Message */}
          {successMsg && (
            <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle size={16} className="shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs text-[var(--mk-text-secondary)] mb-1.5 font-medium">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mk-text-muted)]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-mk w-full pl-9 pr-4 py-3"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs text-[var(--mk-text-secondary)] mb-1.5 font-medium">
                Contrasena
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mk-text-muted)]"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input-mk w-full pl-9 pr-4 py-3"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-mk-primary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isLogin ? "Iniciar Sesion" : "Crear Cuenta"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--mk-border-subtle)]" />
            <span className="text-xs text-[var(--mk-text-muted)] uppercase tracking-wider">
              o
            </span>
            <div className="flex-1 h-px bg-[var(--mk-border-subtle)]" />
          </div>

          {/* Google Auth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full bg-[var(--mk-surface-3)] border border-[var(--mk-border-rule)] py-3 rounded-lg text-sm text-[var(--mk-text-secondary)] hover:text-[var(--mk-text-primary)] hover:border-[var(--mk-text-primary)] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>
        </div>

        {/* Toggle Link */}
        <p className="text-center mt-6 text-sm text-[var(--mk-text-tertiary)]">
          {isLogin ? "No tienes cuenta?" : "Ya tienes cuenta?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-[var(--mk-accent)] hover:underline transition-colors cursor-pointer"
          >
            {isLogin ? "Registrate" : "Inicia sesion"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
