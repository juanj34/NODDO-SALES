"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Camera,
  Phone,
} from "lucide-react";

const COUNTRY_CODES = [
  { code: "+57", flag: "🇨🇴", label: "CO" },
  { code: "+52", flag: "🇲🇽", label: "MX" },
  { code: "+1", flag: "🇺🇸", label: "US" },
  { code: "+507", flag: "🇵🇦", label: "PA" },
  { code: "+506", flag: "🇨🇷", label: "CR" },
  { code: "+593", flag: "🇪🇨", label: "EC" },
  { code: "+51", flag: "🇵🇪", label: "PE" },
  { code: "+56", flag: "🇨🇱", label: "CL" },
  { code: "+54", flag: "🇦🇷", label: "AR" },
  { code: "+55", flag: "🇧🇷", label: "BR" },
  { code: "+34", flag: "🇪🇸", label: "ES" },
  { code: "+971", flag: "🇦🇪", label: "AE" },
  { code: "+58", flag: "🇻🇪", label: "VE" },
  { code: "+502", flag: "🇬🇹", label: "GT" },
  { code: "+503", flag: "🇸🇻", label: "SV" },
  { code: "+504", flag: "🇭🇳", label: "HN" },
  { code: "+505", flag: "🇳🇮", label: "NI" },
  { code: "+591", flag: "🇧🇴", label: "BO" },
  { code: "+595", flag: "🇵🇾", label: "PY" },
  { code: "+598", flag: "🇺🇾", label: "UY" },
];

function parsePhoneWithCode(fullPhone: string): { code: string; number: string } {
  if (!fullPhone) return { code: "+57", number: "" };
  // Try to match a country code from our list (longest first to avoid partial matches)
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const cc of sorted) {
    if (fullPhone.startsWith(cc.code)) {
      return { code: cc.code, number: fullPhone.slice(cc.code.length) };
    }
  }
  // No country code found — assume it's a local number with default +57
  return { code: "+57", number: fullPhone };
}

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
  const { role, user, profile, refresh } = useAuthRole();
  const router = useRouter();
  const supabase = createClient();

  // Profile state
  const [profileNombre, setProfileNombre] = useState("");
  const [profileApellido, setProfileApellido] = useState("");
  const [profileTelefono, setProfileTelefono] = useState("");
  const [profileCodigoPais, setProfileCodigoPais] = useState("+57");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sync profile data from auth context
  useEffect(() => {
    if (profile) {
      setProfileNombre(profile.nombre || "");
      setProfileApellido(profile.apellido || "");
      const parsed = parsePhoneWithCode(profile.telefono || "");
      setProfileCodigoPais(parsed.code);
      setProfileTelefono(parsed.number);
      setProfileAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: profileNombre,
          apellido: profileApellido,
          telefono: profileTelefono ? `${profileCodigoPais}${profileTelefono}` : null,
        }),
      });
      if (!res.ok) throw new Error("Error");
      setProfileSuccess(true);
      refresh();
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError(t("cuenta.profileError"));
      setTimeout(() => setProfileError(null), 3000);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileError(t("cuenta.profileError"));
      return;
    }

    setAvatarUploading(true);
    setProfileError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/user/profile", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProfileAvatarUrl(data.avatar_url);
      refresh();
    } catch {
      setProfileError(t("cuenta.profileError"));
      setTimeout(() => setProfileError(null), 3000);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

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

  // Notification preferences state
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(true);

  // Fetch notification preferences
  useEffect(() => {
    if (role !== "admin") { setNotifLoading(false); return; }
    fetch("/api/user/email-reports")
      .then((r) => r.json())
      .then((data) => {
        setDailyDigest(data.daily_digest_enabled ?? true);
        setWeeklyReport(data.weekly_enabled ?? true);
        setMonthlyReport(data.monthly_enabled ?? true);
      })
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [role]);

  const saveNotifPref = useCallback(async (field: string, value: boolean) => {
    setNotifSaving(true);
    setNotifError(null);
    setNotifSuccess(false);
    try {
      const res = await fetch("/api/user/email-reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Error");
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 2500);
    } catch {
      setNotifError(t("cuenta.notificationsError"));
      setTimeout(() => setNotifError(null), 3000);
    } finally {
      setNotifSaving(false);
    }
  }, [t]);

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
          <p className="text-xs text-[var(--text-tertiary)] mt-1 font-light">
            {t("cuenta.description")}
          </p>
        </div>

        {/* My Profile Section */}
        <section className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <User size={16} className="text-[var(--site-primary)]" />
            <h2 className="font-ui text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              {t("cuenta.myProfile")}
            </h2>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-light mb-5 ml-6">
            {t("cuenta.myProfileDescription")}
          </p>

          {profileSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl flex items-center gap-2"
              style={{ background: "rgba(52, 211, 153, 0.08)", border: "1px solid rgba(52, 211, 153, 0.2)" }}
            >
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-xs text-emerald-300 font-light">{t("cuenta.profileSaved")}</span>
            </motion.div>
          )}

          {profileError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl flex items-center gap-2"
              style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
            >
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs text-red-300 font-light">{profileError}</span>
            </motion.div>
          )}

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative group">
              {profileAvatarUrl ? (
                <img
                  src={profileAvatarUrl}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border-2"
                  style={{ borderColor: "rgba(var(--site-primary-rgb), 0.3)" }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{
                    background: `linear-gradient(135deg, rgba(var(--site-primary-rgb), 0.3), rgba(var(--site-primary-rgb), 0.1))`,
                    boxShadow: `0 0 0 2px rgba(var(--site-primary-rgb), 0.3)`,
                    color: "var(--site-primary)",
                  }}
                >
                  {profileNombre ? profileNombre.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {avatarUploading ? (
                  <Loader2 size={18} className="text-white animate-spin" />
                ) : (
                  <Camera size={18} className="text-white" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="text-xs text-[var(--site-primary)] hover:underline font-light"
              >
                {avatarUploading ? t("cuenta.savingProfile") : t("cuenta.avatarChange")}
              </button>
              <div className="flex items-center gap-2 mt-1">
                <Shield size={12} className="text-[var(--site-primary)]" />
                <span className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--site-primary)]">
                  {role === "admin" ? t("cuenta.roleAdmin") : t("cuenta.roleCollaborator")}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="block font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {t("cuenta.email")}
              </label>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[0.625rem] bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <Mail size={14} className="text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-primary)] font-light">{user?.email || "\u2014"}</span>
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  {t("cuenta.firstName")}
                </label>
                <input
                  type="text"
                  value={profileNombre}
                  onChange={(e) => setProfileNombre(e.target.value)}
                  className="input-glass w-full"
                  placeholder={t("cuenta.firstNamePlaceholder")}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  {t("cuenta.lastName")}
                </label>
                <input
                  type="text"
                  value={profileApellido}
                  onChange={(e) => setProfileApellido(e.target.value)}
                  className="input-glass w-full"
                  placeholder={t("cuenta.lastNamePlaceholder")}
                  maxLength={100}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {t("cuenta.phone")}
              </label>
              <div className="flex gap-2">
                <select
                  value={profileCodigoPais}
                  onChange={(e) => setProfileCodigoPais(e.target.value)}
                  className="input-glass w-[110px] shrink-0 text-xs font-mono appearance-none cursor-pointer"
                >
                  {COUNTRY_CODES.map((cc) => (
                    <option key={cc.code} value={cc.code}>
                      {cc.flag} {cc.code}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="tel"
                    value={profileTelefono}
                    onChange={(e) => setProfileTelefono(e.target.value.replace(/[^\d]/g, ""))}
                    className="input-glass w-full pl-9"
                    placeholder="3507922786"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="btn-warm px-5 py-2.5 text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {profileLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}
              {profileLoading ? t("cuenta.savingProfile") : t("cuenta.saveProfile")}
            </button>
          </form>
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
              <label className="block font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
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
              <label className="block font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
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

        {/* Notifications Section (admin only) */}
        {role === "admin" && (
          <section className="glass-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} className="text-[var(--site-primary)]" />
              <h2 className="font-ui text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                {t("cuenta.notificationsSection")}
              </h2>
            </div>

            {notifSuccess && (
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
                <span className="text-xs text-emerald-300 font-light">
                  {t("cuenta.notificationsSaved")}
                </span>
              </motion.div>
            )}

            {notifError && (
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
                <span className="text-xs text-red-300 font-light">
                  {notifError}
                </span>
              </motion.div>
            )}

            {notifLoading ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-muted)]">Cargando...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Daily Digest */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={dailyDigest}
                      disabled={notifSaving}
                      onChange={(e) => {
                        setDailyDigest(e.target.checked);
                        saveNotifPref("daily_digest_enabled", e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 rounded-full bg-[var(--surface-3)] border border-[var(--border-default)] peer-checked:bg-[rgba(var(--site-primary-rgb),0.3)] peer-checked:border-[var(--site-primary)] transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-[var(--text-muted)] peer-checked:bg-[var(--site-primary)] peer-checked:translate-x-4 transition-all" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-[var(--text-primary)] font-light block">
                      {t("cuenta.dailyDigest")}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-light">
                      {t("cuenta.dailyDigestDescription")}
                    </span>
                  </div>
                </label>

                {/* Weekly Report */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={weeklyReport}
                      disabled={notifSaving}
                      onChange={(e) => {
                        setWeeklyReport(e.target.checked);
                        saveNotifPref("weekly_enabled", e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 rounded-full bg-[var(--surface-3)] border border-[var(--border-default)] peer-checked:bg-[rgba(var(--site-primary-rgb),0.3)] peer-checked:border-[var(--site-primary)] transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-[var(--text-muted)] peer-checked:bg-[var(--site-primary)] peer-checked:translate-x-4 transition-all" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-[var(--text-primary)] font-light block">
                      {t("cuenta.weeklyReport")}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-light">
                      {t("cuenta.weeklyReportDescription")}
                    </span>
                  </div>
                </label>

                {/* Monthly Report */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={monthlyReport}
                      disabled={notifSaving}
                      onChange={(e) => {
                        setMonthlyReport(e.target.checked);
                        saveNotifPref("monthly_enabled", e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 rounded-full bg-[var(--surface-3)] border border-[var(--border-default)] peer-checked:bg-[rgba(var(--site-primary-rgb),0.3)] peer-checked:border-[var(--site-primary)] transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-[var(--text-muted)] peer-checked:bg-[var(--site-primary)] peer-checked:translate-x-4 transition-all" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-[var(--text-primary)] font-light block">
                      {t("cuenta.monthlyReport")}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-light">
                      {t("cuenta.monthlyReportDescription")}
                    </span>
                  </div>
                </label>
              </div>
            )}
          </section>
        )}

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
              <span className="text-xs text-emerald-300 font-light">
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
              <span className="text-xs text-red-300 font-light">
                {emailError}
              </span>
            </motion.div>
          )}

          <form onSubmit={handleEmailChange} className="space-y-4">
            <div>
              <label className="block font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
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
              <span className="text-xs text-emerald-300 font-light">
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
              <span className="text-xs text-red-300 font-light">
                {passwordError}
              </span>
            </motion.div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
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
              <label className="block font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
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

          <p className="text-xs text-[var(--text-tertiary)] font-light mb-4 leading-relaxed">
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
              <p className="text-xs text-red-300 font-light">
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
                  <span className="text-xs text-red-300 font-light">
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
                  className="px-5 py-2.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
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
