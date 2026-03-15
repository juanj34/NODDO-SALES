"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/i18n";
import { useAuthRole } from "@/hooks/useAuthContext";
import {
  User,
  Lock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Trash2,
  Shield,
  Mail,
  Clock,
  Calendar,
  Bell,
} from "lucide-react";

function formatDate(iso: string | undefined | null, fallback: string): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CuentaPage() {
  const { t } = useTranslation("dashboard");
  const { role, user } = useAuthRole();
  const router = useRouter();
  const supabase = createClient();

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Delete account state
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError(t("cuenta.passwordMismatch"));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(t("cuenta.passwordTooShort"));
      return;
    }

    setPasswordLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
      setPasswordLoading(false);
      return;
    }

    setPasswordSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordLoading(false);

    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(false);

    if (!newEmail || newEmail === user?.email) return;

    setEmailLoading(true);

    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      setEmailError(error.message);
      setEmailLoading(false);
      return;
    }

    setEmailSuccess(true);
    setNewEmail("");
    setEmailLoading(false);

    setTimeout(() => setEmailSuccess(false), 5000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user?.email) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error deleting account");
      }

      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error eliminando cuenta");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-light text-[var(--text-primary)] tracking-wide">
            {t("cuenta.title")}
          </h1>
          <p className="font-mono text-xs text-[var(--text-tertiary)] mt-1 font-light">
            {t("cuenta.description")}
          </p>
        </div>

        {/* Profile Section */}
        <section className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-[var(--site-primary)]" />
            <h2 className="font-ui text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              {t("cuenta.profileSection")}
            </h2>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {t("cuenta.email")}
              </label>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[0.625rem] bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <Mail size={14} className="text-[var(--text-muted)]" />
                <span className="font-mono text-sm text-[var(--text-primary)] font-light">
                  {user?.email || "—"}
                </span>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {t("cuenta.role")}
              </label>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[0.625rem] bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <Shield size={14} className="text-[var(--site-primary)]" />
                <span className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--site-primary)]">
                  {role === "admin" ? t("cuenta.roleAdmin") : t("cuenta.roleCollaborator")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Session Info */}
        <section className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-[var(--site-primary)]" />
            <h2 className="font-ui text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              {t("cuenta.sessionInfo")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {t("cuenta.lastLogin")}
              </label>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[0.625rem] bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <Clock size={14} className="text-[var(--text-muted)]" />
                <span className="font-mono text-xs text-[var(--text-secondary)] font-light">
                  {formatDate(user?.last_sign_in_at, t("cuenta.never"))}
                </span>
              </div>
            </div>
            <div>
              <label className="block font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {t("cuenta.accountCreated")}
              </label>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[0.625rem] bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <Calendar size={14} className="text-[var(--text-muted)]" />
                <span className="font-mono text-xs text-[var(--text-secondary)] font-light">
                  {formatDate(user?.created_at, "—")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Change Email Section */}
        <section className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={16} className="text-[var(--site-primary)]" />
            <h2 className="font-ui text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              {t("cuenta.emailChangeSection")}
            </h2>
          </div>

          {emailSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl flex items-center gap-2"
              style={{
                background: "rgba(52, 211, 153, 0.08)",
                border: "1px solid rgba(52, 211, 153, 0.2)",
              }}
            >
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="font-mono text-xs text-emerald-300 font-light">
                {t("cuenta.emailChangeSuccess")}
              </span>
            </motion.div>
          )}

          {emailError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl flex items-center gap-2"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <AlertTriangle size={14} className="text-red-400" />
              <span className="font-mono text-xs text-red-300 font-light">
                {emailError}
              </span>
            </motion.div>
          )}

          <form onSubmit={handleEmailChange} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {t("cuenta.newEmail")}
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="input-glass w-full"
                placeholder={t("cuenta.newEmailPlaceholder")}
              />
            </div>

            <button
              type="submit"
              disabled={emailLoading || !newEmail || newEmail === user?.email}
              className="btn-warm px-5 py-2.5 text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {emailLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Mail size={14} />
              )}
              {emailLoading ? t("cuenta.changingEmail") : t("cuenta.changeEmail")}
            </button>
          </form>
        </section>

        {/* Change Password Section */}
        <section className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-[var(--site-primary)]" />
            <h2 className="font-ui text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              {t("cuenta.passwordSection")}
            </h2>
          </div>

          {passwordSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl flex items-center gap-2"
              style={{
                background: "rgba(52, 211, 153, 0.08)",
                border: "1px solid rgba(52, 211, 153, 0.2)",
              }}
            >
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="font-mono text-xs text-emerald-300 font-light">
                {t("cuenta.passwordUpdated")}
              </span>
            </motion.div>
          )}

          {passwordError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl flex items-center gap-2"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <AlertTriangle size={14} className="text-red-400" />
              <span className="font-mono text-xs text-red-300 font-light">
                {passwordError}
              </span>
            </motion.div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {t("cuenta.newPassword")}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="input-glass w-full"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {t("cuenta.confirmPassword")}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="input-glass w-full"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn-warm px-5 py-2.5 text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {passwordLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Lock size={14} />
              )}
              {passwordLoading ? t("cuenta.updating") : t("cuenta.updatePassword")}
            </button>
          </form>
        </section>

        {/* Danger Zone */}
        <section className="rounded-[1.25rem] p-6 border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-400" />
            <h2 className="font-ui text-xs font-bold uppercase tracking-[0.1em] text-red-400">
              {t("cuenta.dangerZone")}
            </h2>
          </div>

          <p className="font-mono text-xs text-[var(--text-tertiary)] font-light mb-4 leading-relaxed">
            {t("cuenta.deleteDescription")}
          </p>

          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="px-5 py-2.5 text-xs font-ui font-bold uppercase tracking-wider text-red-400 border border-red-500/30 rounded-[0.75rem] hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <Trash2 size={14} />
              {t("cuenta.deleteAccount")}
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              <p className="font-mono text-xs text-red-300 font-light">
                {t("cuenta.deleteConfirmDescription")}
              </p>

              {deleteError && (
                <div
                  className="p-3 rounded-xl flex items-center gap-2"
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="font-mono text-xs text-red-300 font-light">
                    {deleteError}
                  </span>
                </div>
              )}

              <input
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                className="input-glass w-full"
                placeholder={user?.email || ""}
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteConfirmEmail !== user?.email}
                  className="px-5 py-2.5 text-xs font-ui font-bold uppercase tracking-wider text-white bg-red-600 rounded-[0.75rem] hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  {deleteLoading ? t("cuenta.deleting") : t("cuenta.deleteButton")}
                </button>
                <button
                  onClick={() => {
                    setShowDelete(false);
                    setDeleteConfirmEmail("");
                    setDeleteError(null);
                  }}
                  className="px-5 py-2.5 text-xs font-mono text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}
        </section>
      </motion.div>
    </div>
  );
}
