"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Loader2,
  X,
  Users,
  Mail,
  MoreHorizontal,
  ShieldCheck,
  Pause,
  Play,
  Trash2,
  Info,
  FolderOpen,
  Check,
  RotateCw,
} from "lucide-react";
import { useAuthRole } from "@/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import type { Colaborador } from "@/types";
import { cn } from "@/lib/utils";

const estadoStyles: Record<string, string> = {
  pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  activo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  suspendido: "bg-red-500/15 text-red-400 border-red-500/20",
};

interface ProjectOption {
  id: string;
  nombre: string;
}

export default function EquipoPage() {
  const { role, loading: authLoading } = useAuthRole();
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const toast = useToast();

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Projects for assignment
  const [adminProjects, setAdminProjects] = useState<ProjectOption[]>([]);
  const [inviteAllProjects, setInviteAllProjects] = useState(true);
  const [inviteSelectedProjects, setInviteSelectedProjects] = useState<Set<string>>(new Set());

  // Per-collaborator assigned projects
  const [collabProjects, setCollabProjects] = useState<Record<string, string[]>>({});

  // Edit projects modal
  const [editProjectsForId, setEditProjectsForId] = useState<string | null>(null);
  const [editSelectedProjects, setEditSelectedProjects] = useState<Set<string>>(new Set());
  const [editAllProjects, setEditAllProjects] = useState(true);
  const [savingProjects, setSavingProjects] = useState(false);

  const fetchColaboradores = useCallback(async () => {
    try {
      const res = await fetch("/api/colaboradores");
      if (res.ok) {
        const data: Colaborador[] = await res.json();
        setColaboradores(data);

        // Fetch project assignments for each collaborator
        const assignments: Record<string, string[]> = {};
        await Promise.all(
          data.map(async (c) => {
            try {
              const projRes = await fetch(`/api/colaboradores/${c.id}/proyectos`);
              if (projRes.ok) {
                assignments[c.id] = await projRes.json();
              }
            } catch {
              // silent
            }
          })
        );
        setCollabProjects(assignments);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch admin's projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/proyectos");
      if (res.ok) {
        const data = await res.json();
        setAdminProjects(
          data.map((p: { id: string; nombre: string }) => ({ id: p.id, nombre: p.nombre }))
        );
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!authLoading && role !== "admin") {
      router.replace("/proyectos");
      return;
    }
    if (!authLoading) {
      fetchColaboradores();
      fetchProjects();
    }
  }, [authLoading, role, router, fetchColaboradores, fetchProjects]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/colaboradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, nombre: inviteName || null }),
      });
      if (res.ok) {
        const newColab = await res.json();

        // Assign projects if specific ones are selected
        if (!inviteAllProjects && inviteSelectedProjects.size > 0) {
          await fetch(`/api/colaboradores/${newColab.id}/proyectos`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ proyecto_ids: Array.from(inviteSelectedProjects) }),
          });
        }

        toast.success("Invitacion enviada");
        setShowInvite(false);
        setInviteEmail("");
        setInviteName("");
        setInviteAllProjects(true);
        setInviteSelectedProjects(new Set());
        fetchColaboradores();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al invitar");
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSending(false);
    }
  };

  const handleToggleEstado = async (id: string, currentEstado: string) => {
    const newEstado = currentEstado === "activo" ? "suspendido" : "activo";
    try {
      const res = await fetch(`/api/colaboradores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newEstado }),
      });
      if (res.ok) {
        fetchColaboradores();
        setMenuOpen(null);
      }
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleResendInvite = async (id: string, email: string) => {
    try {
      const res = await fetch(`/api/colaboradores/${id}/resend`, { method: "POST" });
      if (res.ok) {
        toast.success("Invitación reenviada");
        setMenuOpen(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al reenviar");
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/colaboradores/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchColaboradores();
        setConfirmDeleteId(null);
        setMenuOpen(null);
      }
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const openEditProjects = (colabId: string) => {
    const assigned = collabProjects[colabId] || [];
    if (assigned.length === 0) {
      setEditAllProjects(true);
      setEditSelectedProjects(new Set(adminProjects.map((p) => p.id)));
    } else {
      setEditAllProjects(false);
      setEditSelectedProjects(new Set(assigned));
    }
    setEditProjectsForId(colabId);
    setMenuOpen(null);
  };

  const handleSaveProjects = async () => {
    if (!editProjectsForId) return;
    setSavingProjects(true);
    try {
      const ids = editAllProjects ? [] : Array.from(editSelectedProjects);
      const res = await fetch(`/api/colaboradores/${editProjectsForId}/proyectos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyecto_ids: ids }),
      });
      if (res.ok) {
        toast.success(t("equipo.projectsSaved"));
        setEditProjectsForId(null);
        fetchColaboradores();
      }
    } catch {
      toast.error("Error");
    } finally {
      setSavingProjects(false);
    }
  };

  const toggleInviteProject = (id: string) => {
    setInviteSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEditProject = (id: string) => {
    setEditSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeCount = colaboradores.filter(
    (c) => c.estado === "activo" || c.estado === "pendiente"
  ).length;

  // Project name lookup
  const projectNameMap = new Map(adminProjects.map((p) => [p.id, p.nombre]));

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
            {t("equipo.title")}
          </h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            {t("equipo.description")}
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          disabled={activeCount >= 3}
          className="btn-noddo flex items-center gap-2 px-5 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <UserPlus size={15} />
          {t("equipo.invite")}
        </button>
      </div>

      {/* Counter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-[var(--text-muted)]">
          {t("equipo.count").replace("{{count}}", String(activeCount))}
        </span>
      </div>

      {/* Permission note */}
      <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <Info size={15} className="text-[var(--site-primary)] mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {t("equipo.permissionNote")}
        </p>
      </div>

      {/* Collaborator list */}
      {colaboradores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center mb-5">
            <Users size={28} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-tertiary)] text-lg mb-2">
            {t("equipo.noCollaborators")}
          </p>
          <p className="text-[var(--text-muted)] text-sm">
            {t("equipo.noCollaboratorsDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {colaboradores.map((colab, idx) => {
            const assigned = collabProjects[colab.id] || [];
            const hasSpecificAccess = assigned.length > 0;

            return (
              <motion.div
                key={colab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--border-default)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      background: `linear-gradient(135deg, rgba(var(--site-primary-rgb), 0.3), rgba(var(--site-primary-rgb), 0.1))`,
                      boxShadow: `0 0 0 1.5px rgba(var(--site-primary-rgb), 0.3)`,
                      color: "var(--site-primary)",
                    }}
                  >
                    {(colab.nombre || colab.email).charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {colab.nombre || colab.email}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Mail size={11} className="text-[var(--text-muted)]" />
                      <span className="text-xs text-[var(--text-tertiary)] truncate">
                        {colab.email}
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-ui text-[10px] tracking-wider uppercase font-bold border",
                      estadoStyles[colab.estado]
                    )}
                  >
                    {t(`equipo.status.${colab.estado}`)}
                  </span>

                  {/* Actions menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === colab.id ? null : colab.id)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-all"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    <AnimatePresence>
                      {menuOpen === colab.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.1 }}
                          className="absolute right-0 top-full mt-1 w-48 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-2xl overflow-hidden z-20"
                        >
                          {/* Edit projects */}
                          <button
                            onClick={() => openEditProjects(colab.id)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors"
                          >
                            <FolderOpen size={13} />
                            {t("equipo.editProjects")}
                          </button>

                          {/* Resend invite for pending */}
                          {colab.estado === "pendiente" && (
                            <button
                              onClick={() => handleResendInvite(colab.id, colab.email)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[var(--site-primary)] hover:bg-[var(--surface-3)] transition-colors"
                            >
                              <RotateCw size={13} />
                              Reenviar invitación
                            </button>
                          )}

                          {colab.estado !== "pendiente" && (
                            <button
                              onClick={() => handleToggleEstado(colab.id, colab.estado)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors"
                            >
                              {colab.estado === "activo" ? (
                                <>
                                  <Pause size={13} />
                                  {t("equipo.suspend")}
                                </>
                              ) : (
                                <>
                                  <Play size={13} />
                                  {t("equipo.reactivate")}
                                </>
                              )}
                            </button>
                          )}
                          {confirmDeleteId === colab.id ? (
                            <div className="px-4 py-2.5 space-y-2">
                              <p className="text-[11px] text-red-400">
                                {t("equipo.confirmRemove")}
                              </p>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleDelete(colab.id)}
                                  className="flex-1 text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                                >
                                  {t("equipo.remove")}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="flex-1 text-[10px] px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(colab.id)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={13} />
                              {t("equipo.remove")}
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Project access badges */}
                <div className="mt-2.5 pl-14 flex items-center gap-1.5 flex-wrap">
                  <FolderOpen size={11} className="text-[var(--text-muted)]" />
                  {hasSpecificAccess ? (
                    assigned.map((pid) => (
                      <span
                        key={pid}
                        className="px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-tertiary)]"
                      >
                        {projectNameMap.get(pid) || pid.slice(0, 8)}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {t("equipo.allProjects")}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Invite modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !sending && setShowInvite(false)}
          >
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleInvite}
              className="glass-card p-8 w-full max-w-md space-y-5"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center">
                    <ShieldCheck size={20} className="text-[var(--site-primary)]" />
                  </div>
                  <h2 className="font-heading text-2xl font-light text-[var(--text-primary)]">
                    {t("equipo.invite")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1 rounded-lg hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="block font-ui text-[10px] text-[var(--text-secondary)] mb-2 tracking-wider uppercase font-bold">
                  {t("equipo.emailLabel")}
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder={t("equipo.emailPlaceholder")}
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="block font-ui text-[10px] text-[var(--text-secondary)] mb-2 tracking-wider uppercase font-bold">
                  {t("equipo.nameLabel")}
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder={t("equipo.namePlaceholder")}
                  className="input-glass w-full"
                />
              </div>

              {/* Project access */}
              {adminProjects.length > 0 && (
                <div>
                  <label className="block font-ui text-[10px] text-[var(--text-secondary)] mb-2 tracking-wider uppercase font-bold">
                    {t("equipo.projectAccess")}
                  </label>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                      <span
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
                          inviteAllProjects
                            ? "bg-[var(--site-primary)] border-[var(--site-primary)]"
                            : "border-[var(--border-default)]"
                        )}
                      >
                        {inviteAllProjects && <Check size={10} className="text-black" />}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {t("equipo.allProjects")}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setInviteAllProjects(false);
                        if (inviteSelectedProjects.size === 0) {
                          setInviteSelectedProjects(new Set(adminProjects.map((p) => p.id)));
                        }
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-colors text-xs",
                        !inviteAllProjects
                          ? "bg-[var(--surface-2)] text-[var(--text-secondary)]"
                          : "text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                      )}
                    >
                      {t("equipo.specificProjects")}
                    </button>

                    {!inviteAllProjects && (
                      <div className="ml-3 space-y-1 pt-1">
                        {adminProjects.map((project) => (
                          <label
                            key={project.id}
                            className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                          >
                            <span
                              className={cn(
                                "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0",
                                inviteSelectedProjects.has(project.id)
                                  ? "bg-[var(--site-primary)] border-[var(--site-primary)]"
                                  : "border-[var(--border-default)]"
                              )}
                              onClick={() => toggleInviteProject(project.id)}
                            >
                              {inviteSelectedProjects.has(project.id) && (
                                <Check size={9} className="text-black" />
                              )}
                            </span>
                            <span className="text-[11px] text-[var(--text-tertiary)]">
                              {project.nombre}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="btn-noddo w-full py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t("equipo.sending")}
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    {t("equipo.sendInvite")}
                  </>
                )}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit projects modal */}
      <AnimatePresence>
        {editProjectsForId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !savingProjects && setEditProjectsForId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-light text-[var(--text-primary)]">
                  {t("equipo.editProjects")}
                </h3>
                <button
                  onClick={() => setEditProjectsForId(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1 rounded-lg hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-1.5">
                <label
                  className="flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                  onClick={() => setEditAllProjects(true)}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
                      editAllProjects
                        ? "bg-[var(--site-primary)] border-[var(--site-primary)]"
                        : "border-[var(--border-default)]"
                    )}
                  >
                    {editAllProjects && <Check size={10} className="text-black" />}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {t("equipo.allProjects")}
                  </span>
                </label>

                <button
                  onClick={() => setEditAllProjects(false)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg transition-colors text-xs",
                    !editAllProjects
                      ? "bg-[var(--surface-2)] text-[var(--text-secondary)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                  )}
                >
                  {t("equipo.specificProjects")}
                </button>

                {!editAllProjects && (
                  <div className="ml-3 space-y-1 pt-1">
                    {adminProjects.map((project) => (
                      <label
                        key={project.id}
                        className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                        onClick={() => toggleEditProject(project.id)}
                      >
                        <span
                          className={cn(
                            "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0",
                            editSelectedProjects.has(project.id)
                              ? "bg-[var(--site-primary)] border-[var(--site-primary)]"
                              : "border-[var(--border-default)]"
                          )}
                        >
                          {editSelectedProjects.has(project.id) && (
                            <Check size={9} className="text-black" />
                          )}
                        </span>
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          {project.nombre}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveProjects}
                disabled={savingProjects || (!editAllProjects && editSelectedProjects.size === 0)}
                className="btn-noddo w-full py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {savingProjects && <Loader2 size={14} className="animate-spin" />}
                {savingProjects ? t("equipo.sending") : "Guardar"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
