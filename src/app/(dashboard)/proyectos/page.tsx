"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProject";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import {
  Plus,
  Loader2,
  X,
  AlertTriangle,
  Trash2,
  ArrowRight,
  HelpCircle,
  Users,
} from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import { useAuthRole } from "@/hooks/useAuthContext";

import { DashboardGreeting } from "@/components/dashboard/home/DashboardGreeting";
import { DashboardKPIStrip } from "@/components/dashboard/home/DashboardKPIStrip";
import { RecentLeadsFeed } from "@/components/dashboard/home/RecentLeadsFeed";
import { EnhancedProjectCard } from "@/components/dashboard/home/EnhancedProjectCard";
import { DashboardSkeleton, KPIStripSkeleton } from "@/components/dashboard/home/DashboardSkeleton";

export default function ProyectosPage() {
  const { projects, loading, refresh } = useProjects();
  const { data: summary, loading: summaryLoading } = useDashboardSummary();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [kpiProjectFilter, setKpiProjectFilter] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const toast = useToast();
  const { user, role } = useAuthRole();
  const isAdmin = role === "admin";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const res = await fetch("/api/proyectos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, slug }),
    });

    if (res.ok) {
      const proyecto = await res.json();
      router.push(`/editor/${proyecto.id}`);
    } else {
      const data = await res.json();
      toast.error(data.error || "Error al crear proyecto");
    }
    setCreating(false);
  };

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setDeleteConfirmText("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proyectos/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        refresh();
      }
    } finally {
      setDeleting(false);
    }
  };

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // Debounced slug availability check
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null);
      return;
    }
    setCheckingSlug(true);
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/domains/check?subdomain=${encodeURIComponent(slug)}`);
        const data = await res.json();
        setSlugAvailable(data.available);
      } catch {
        setSlugAvailable(null);
      }
      setCheckingSlug(false);
    }, 400);
    return () => {
      if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    };
  }, [slug]);

  // Full-page skeleton while projects are loading
  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Greeting */}
      <DashboardGreeting
        userEmail={user?.email || ""}
        isAdmin={isAdmin}
        onCreateClick={() => setShowCreate(true)}
      />

      {/* KPI Strip — admin only, with projects */}
      {isAdmin && projects.length > 0 && (
        summaryLoading ? (
          <KPIStripSkeleton />
        ) : summary ? (
          <DashboardKPIStrip
            data={summary}
            projects={projects.map((p) => ({ id: p.id, nombre: p.nombre }))}
            selectedProjectId={kpiProjectFilter}
            onSelectProject={setKpiProjectFilter}
          />
        ) : null
      )}

      {/* Activity row — admin only, with projects */}
      {isAdmin && projects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <RecentLeadsFeed
              leads={summary?.recent_leads || []}
              loading={summaryLoading}
            />
          </div>

          {/* Quick actions */}
          <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-5 flex flex-col gap-3">
            <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1">
              {t("home.quickActions")}
            </span>

            <button
              onClick={() => setShowCreate(true)}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[rgba(184,151,58,0.08)] border border-[rgba(184,151,58,0.12)] flex items-center justify-center text-[var(--site-primary)] group-hover:bg-[rgba(184,151,58,0.15)] transition-colors">
                <Plus size={14} />
              </div>
              <span className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                {t("proyectos.newProject")}
              </span>
            </button>

            <Link
              href="/leads"
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                <Users size={14} />
              </div>
              <span className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                {t("home.viewAllLeads")}
              </span>
            </Link>

            <Link
              href="/ayuda"
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                <HelpCircle size={14} />
              </div>
              <span className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                {t("sidebar.help")}
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Projects section */}
      {projects.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
              style={{
                background: "linear-gradient(135deg, rgba(184,151,58,0.15), rgba(184,151,58,0.05))",
                border: "1px solid rgba(184,151,58,0.15)",
                boxShadow: "0 0 40px rgba(184,151,58,0.08)",
              }}
            >
              <NodDoLogo height={14} colorNod="var(--text-secondary)" colorDo="var(--site-primary)" />
            </div>
            <h2 className="font-heading text-3xl font-light text-[var(--text-primary)] mb-3 tracking-wide">
              {t("proyectos.noProjects")}
            </h2>
            <p className="text-[var(--text-tertiary)] text-sm max-w-md mx-auto leading-relaxed">
              {t("proyectos.noProjectsDescription")}
            </p>
          </motion.div>

          {isAdmin && (
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              onClick={() => setShowCreate(true)}
              className="group glass-card p-6 text-left hover:border-[var(--border-default)] transition-all duration-300 cursor-pointer w-full max-w-sm"
              style={{ borderRadius: "1.25rem" }}
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-3)] border border-[var(--border-subtle)] flex items-center justify-center mb-4 group-hover:border-[rgba(var(--site-primary-rgb),0.25)] group-hover:bg-[rgba(var(--site-primary-rgb),0.08)] transition-all">
                <Plus size={18} className="text-[var(--text-muted)] group-hover:text-[var(--site-primary)] transition-colors" />
              </div>
              <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1.5">
                {t("proyectos.newProject")}
              </h3>
              <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed mb-4">
                Configura cada detalle manualmente desde cero.
              </p>
              <span className="inline-flex items-center gap-1.5 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--site-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                Crear <ArrowRight size={10} />
              </span>
            </motion.button>
          )}

          {!isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="glass-card p-8 text-center max-w-sm"
            >
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Tu administrador aun no ha creado proyectos. Los veras aqui cuando esten disponibles.
              </p>
            </motion.div>
          )}
        </div>
      ) : (
        <>
          {/* Section label */}
          <div className="flex items-center gap-3">
            <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {t("home.yourProjects")}
            </span>
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>

          {/* Project grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((proyecto, idx) => (
              <EnhancedProjectCard
                key={proyecto.id}
                proyecto={proyecto}
                stats={summary?.project_stats[proyecto.id]}
                index={idx}
                isAdmin={isAdmin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreate}
              className="glass-modal p-8 w-full max-w-md space-y-5"
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-heading text-2xl font-light text-[var(--text-primary)]">
                  {t("proyectos.newProject")}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1 rounded-lg hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="block font-ui text-[10px] text-[var(--text-secondary)] mb-2 tracking-wider uppercase font-bold">
                  {t("proyectos.nameLabel")}
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setSlug(generateSlug(e.target.value));
                  }}
                  required
                  placeholder="Alto de Yeguas"
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="block font-ui text-[10px] text-[var(--text-secondary)] mb-2 tracking-wider uppercase font-bold">
                  {t("proyectos.slugLabel")}
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  required
                  placeholder="alto-de-yeguas"
                  className="input-glass w-full"
                />
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-[var(--text-muted)]">
                    {slug || "tu-proyecto"}.noddo.io
                  </p>
                  {slug.length >= 2 && (
                    checkingSlug ? (
                      <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />
                    ) : slugAvailable === true ? (
                      <span className="text-[10px] text-emerald-400 font-medium">Disponible</span>
                    ) : slugAvailable === false ? (
                      <span className="text-[10px] text-red-400 font-medium">No disponible</span>
                    ) : null
                  )}
                </div>
              </div>

              <MagneticButton>
                <button
                  type="submit"
                  disabled={creating || slugAvailable === false || checkingSlug}
                  className="btn-noddo w-full py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {t("proyectos.createProject")}
                </button>
              </MagneticButton>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-modal p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">
                    {t("proyectos.deleteTitle")}
                  </h3>
                  <p className="text-[11px] text-[var(--text-tertiary)]">
                    {deleteTarget.name}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1 rounded-lg hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {t("proyectos.deleteDescription")}
              </p>

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-2">
                  {t("proyectos.deleteTypeToConfirm")}{" "}
                  <span className="font-medium text-[var(--text-primary)] font-mono">
                    {deleteTarget.name}
                  </span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={deleteTarget.name}
                  className="input-glass w-full"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] border border-[var(--border-default)] rounded-[0.75rem] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting || deleteConfirmText !== deleteTarget.name}
                  className="flex-1 px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] rounded-[0.75rem] flex items-center justify-center gap-2 whitespace-nowrap bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 hover:border-red-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  {deleting ? t("proyectos.deleting") : t("proyectos.deleteButton")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
