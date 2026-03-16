"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import {
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

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
  const redirect = searchParams.get("redirect") || "/dashboard";

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
          <p className="text-[var(--mk-text-tertiary)] text-xs mt-4 tracking-wide font-light">
            {isLogin
              ? "Inicia sesion en tu cuenta"
              : "Crea tu cuenta para comenzar"}
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
            {/* Title */}
            <h1 className="font-heading text-2xl font-light text-[var(--mk-text-primary)] mb-6 tracking-wide">
              {isLogin ? "Bienvenido" : "Crear cuenta"}
            </h1>

            {/* Success Message */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3.5 rounded-xl flex items-start gap-2.5"
                style={{
                  background: "rgba(52, 211, 153, 0.08)",
                  border: "1px solid rgba(52, 211, 153, 0.2)",
                }}
              >
                <CheckCircle
                  size={16}
                  className="shrink-0 mt-0.5 text-emerald-400"
                />
                <span className="text-emerald-300 text-xs font-light leading-relaxed">
                  {successMsg}
                </span>
              </motion.div>
            )}

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
                <span className="text-red-300 text-xs font-light leading-relaxed">
                  {error}
                </span>
              </motion.div>
            )}

            {/* Google Auth Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="login-google-btn w-full py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer group"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--mk-text-secondary)] group-hover:text-[var(--mk-text-primary)] transition-colors">
                Continuar con Google
              </span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[var(--mk-border-subtle)]" />
              <span className="text-[10px] text-[var(--mk-text-muted)] uppercase tracking-[0.2em]">
                o con email
              </span>
              <div className="flex-1 h-px bg-[var(--mk-border-subtle)]" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {/* Email Field */}
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
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block font-ui text-[10px] text-[var(--mk-text-secondary)] mb-2 tracking-[0.15em] uppercase font-bold">
                  {isLogin ? "Contrasena" : "Crea una contrasena"}
                </label>
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mk-text-muted)]"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input-mk w-full pl-10 pr-4 py-3"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-mk-primary w-full py-3.5 flex items-center justify-center gap-2.5 mt-2 disabled:opacity-50"
                style={{ borderRadius: "0.75rem" }}
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Iniciar Sesion" : "Crear Cuenta"}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              {/* Forgot Password Link */}
              {isLogin && (
                <div className="text-center mt-3">
                  <Link
                    href="/recuperar"
                    className="text-[11px] font-light text-[var(--mk-text-muted)] hover:text-[var(--mk-accent)] transition-colors"
                  >
                    Olvidaste tu contrasena?
                  </Link>
                </div>
              )}
            </form>
          </div>
        </motion.div>

        {/* Toggle Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 text-xs font-light text-[var(--mk-text-tertiary)]"
        >
          {isLogin ? "No tienes cuenta?" : "Ya tienes cuenta?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccessMsg(null);
            }}
            className="text-[var(--mk-accent)] hover:text-[var(--mk-accent-light)] transition-colors cursor-pointer font-medium"
          >
            {isLogin ? "Registrate" : "Inicia sesion"}
          </button>
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-4 text-[10px] font-light text-[var(--mk-text-muted)]"
        >
          Micrositios premium para inmobiliarias
        </motion.p>
      </motion.div>
    </div>
  );
}
