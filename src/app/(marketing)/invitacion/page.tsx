"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import {
  User,
  Lock,
  AlertCircle,
  Loader2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  administrador: "Administrador",
  director: "Director",
  asesor: "Asesor",
};

interface InviteContext {
  colaborador: boolean;
  rol?: string;
  inviterName?: string;
  nombre?: string;
  apellido?: string;
}

export default function InvitacionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<InviteContext | null>(null);
  const [hasGoogle, setHasGoogle] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login?redirect=/invitacion";
        return;
      }

      const providers = (user.app_metadata?.providers as string[] | undefined) || [];
      if (!cancelled) setHasGoogle(providers.includes("google"));

      const res = await fetch("/api/invitacion");
      if (!res.ok) {
        window.location.href = "/login?redirect=/invitacion";
        return;
      }
      const ctx: InviteContext = await res.json();

      if (!ctx.colaborador) {
        // Regular admin account — nothing to onboard here
        window.location.href = "/dashboard";
        return;
      }

      if (!cancelled) {
        setContext(ctx);
        // Prefill: split single "nombre" coming from the invite if apellido is empty
        const rawNombre = ctx.nombre || "";
        const rawApellido = ctx.apellido || "";
        if (rawNombre && !rawApellido && rawNombre.includes(" ")) {
          const parts = rawNombre.trim().split(/\s+/);
          setNombre(parts[0]);
          setApellido(parts.slice(1).join(" "));
        } else {
          setNombre(rawNombre);
          setApellido(rawApellido);
        }
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("Ingresa tu nombre.");
      return;
    }
    if (!hasGoogle && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password && password !== passwordConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    if (password) {
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) {
        setError(pwError.message);
        setSaving(false);
        return;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: profileError } = await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (profileError) {
        setError("No pudimos guardar tu perfil. Intenta de nuevo.");
        setSaving(false);
        return;
      }
    }

    window.location.href = "/proyectos";
  };

  const roleLabel = ROLE_LABELS[context?.rol || ""] || "Asesor";

  return (
    <div className="min-h-screen bg-[var(--mk-bg)] flex items-center justify-center px-4 pt-24 pb-12 relative overflow-hidden">
      {/* Ambient gold gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[30%] -right-[20%] w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(184,151,58,0.15) 0%, rgba(184,151,58,0.03) 50%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
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
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <NodDoLogo height={22} colorNod="#f4f0e8" colorDo="#b8973a" />
          </Link>
          <p className="text-[var(--mk-text-tertiary)] text-xs mt-4 tracking-wide font-light">
            Completa tu cuenta
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="login-card relative rounded-2xl overflow-hidden"
        >
          <div className="relative p-8 sm:p-10">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={20} className="animate-spin text-[var(--mk-accent)]" />
              </div>
            ) : (
              <>
                <h1 className="font-heading text-2xl font-light text-[var(--mk-text-primary)] mb-3 tracking-wide">
                  Bienvenido al equipo
                </h1>
                <p className="text-xs font-light text-[var(--mk-text-secondary)] leading-relaxed mb-6">
                  <span className="text-[var(--mk-text-primary)]">{context?.inviterName}</span>{" "}
                  te invitó como{" "}
                  <span className="text-[var(--mk-accent)] font-medium">{roleLabel}</span>.
                  Completa tu cuenta para acceder a los proyectos.
                </p>

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
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                    <span className="text-red-300 text-xs font-light leading-relaxed">
                      {error}
                    </span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-ui text-[10px] text-[var(--mk-text-secondary)] mb-2 tracking-[0.15em] uppercase font-bold">
                        Nombre
                      </label>
                      <div className="relative">
                        <User
                          size={14}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mk-text-muted)] pointer-events-none"
                        />
                        <input
                          type="text"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          required
                          className="input-mk w-full pl-10 pr-4 py-3"
                          placeholder="Nombre"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-ui text-[10px] text-[var(--mk-text-secondary)] mb-2 tracking-[0.15em] uppercase font-bold">
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        className="input-mk w-full px-4 py-3"
                        placeholder="Apellido"
                      />
                    </div>
                  </div>

                  {hasGoogle && (
                    <div
                      className="p-3 rounded-xl flex items-start gap-2.5"
                      style={{
                        background: "rgba(184,151,58,0.06)",
                        border: "1px solid rgba(184,151,58,0.15)",
                      }}
                    >
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-[var(--mk-accent)]" />
                      <span className="text-[11px] font-light text-[var(--mk-text-secondary)] leading-relaxed">
                        Tu cuenta está vinculada con Google. La contraseña es
                        opcional — te sirve para entrar también con email.
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block font-ui text-[10px] text-[var(--mk-text-secondary)] mb-2 tracking-[0.15em] uppercase font-bold">
                      Contrasena{hasGoogle ? " (opcional)" : ""}
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mk-text-muted)] pointer-events-none"
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={!hasGoogle}
                        minLength={6}
                        className="input-mk w-full pl-10 pr-4 py-3"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-ui text-[10px] text-[var(--mk-text-secondary)] mb-2 tracking-[0.15em] uppercase font-bold">
                      Confirmar contrasena
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mk-text-muted)] pointer-events-none"
                      />
                      <input
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        required={!hasGoogle || password.length > 0}
                        minLength={6}
                        className="input-mk w-full pl-10 pr-4 py-3"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-mk-primary w-full py-3.5 flex items-center justify-center gap-2.5 mt-2 disabled:opacity-50"
                    style={{ borderRadius: "0.75rem" }}
                  >
                    {saving ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <>
                        Acceder a los proyectos
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 text-[10px] font-light text-[var(--mk-text-muted)]"
        >
          Micrositios premium para inmobiliarias
        </motion.p>
      </motion.div>
    </div>
  );
}
