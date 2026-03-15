"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Flag,
  FileQuestion,
} from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";

interface Project {
  id: string;
  nombre: string;
  slug: string;
  estado?: string;
  render_principal_url?: string;
  created_at?: string;
  moderation_notes?: string;
  moderated_at?: string;
  moderation_status?: string;
}

interface ModerationData {
  pending: Project[];
  flagged: Project[];
  rejected: Project[];
  recent_actions: Project[];
}

type FilterType = "pending" | "flagged" | "rejected";

export default function AdminModeracionPage() {
  const [data, setData] = useState<ModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<FilterType>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const toast = useToast();
  const { confirm } = useConfirm();

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/moderation");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleModerate = async (
    projectId: string,
    status: "approved" | "rejected" | "flagged",
    notes?: string,
  ) => {
    setActionLoading(projectId);
    try {
      const res = await fetch(`/api/admin/moderation/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moderation_status: status,
          moderation_notes: notes,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success(
        status === "approved"
          ? "Proyecto aprobado"
          : status === "rejected"
            ? "Proyecto rechazado"
            : "Proyecto flaggeado",
      );
      fetchData();
    } catch {
      toast.error("Error al moderar proyecto");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (project: Project) => {
    const confirmed = await confirm({
      title: "Aprobar proyecto",
      message: `¿Aprobar "${project.nombre}"?`,
    });
    if (confirmed) {
      await handleModerate(project.id, "approved");
    }
  };

  const handleReject = async (project: Project) => {
    const notes = prompt(`Razón del rechazo de "${project.nombre}":`);
    if (notes !== null) {
      await handleModerate(project.id, "rejected", notes);
    }
  };

  const handleFlag = async (project: Project) => {
    const notes = prompt(`Notas para flaggear "${project.nombre}":`);
    if (notes !== null) {
      await handleModerate(project.id, "flagged", notes);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle size={28} className="text-amber-400 mb-3" />
        <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar moderación</p>
        <p className="text-[11px] text-[var(--text-muted)] mb-4">Verifica tu conexión e intenta de nuevo</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
        >
          <RefreshCw size={13} /> Reintentar
        </button>
      </div>
    );
  }

  const currentProjects =
    filter === "pending"
      ? data.pending
      : filter === "flagged"
        ? data.flagged
        : data.rejected;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
              Content Moderation
            </h1>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Queue de moderación de proyectos
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
          >
            <RefreshCw size={13} />
            Actualizar
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="flex items-center gap-3"
      >
        {[
          { key: "pending" as FilterType, label: "Pendientes", count: data.pending.length, icon: FileQuestion },
          { key: "flagged" as FilterType, label: "Flaggeados", count: data.flagged.length, icon: Flag },
          { key: "rejected" as FilterType, label: "Rechazados", count: data.rejected.length, icon: XCircle },
        ].map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-ui text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f.key
                  ? "bg-[var(--surface-2)] text-white border-[var(--site-primary)]"
                  : "bg-[var(--surface-1)] text-[var(--text-tertiary)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
              }`}
            >
              <Icon size={13} />
              {f.label}
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  filter === f.key
                    ? "bg-[rgba(var(--site-primary-rgb),0.2)] text-[var(--site-primary)]"
                    : "bg-[var(--surface-3)] text-[var(--text-muted)]"
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Projects Queue */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5"
      >
        {currentProjects.length === 0 ? (
          <div className="text-center py-12">
            <ShieldAlert size={24} className="mx-auto mb-2 opacity-30 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-muted)]">
              No hay proyectos{" "}
              {filter === "pending" ? "pendientes" : filter === "flagged" ? "flaggeados" : "rechazados"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.02 }}
                className="flex items-start gap-4 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all"
              >
                {/* Preview */}
                {project.render_principal_url && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-[var(--surface-3)] shrink-0">
                    <img
                      src={project.render_principal_url}
                      alt={project.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm text-[var(--text-primary)] font-medium mb-1">
                    {project.nombre}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mb-2">
                    <span>/{project.slug}</span>
                    {project.estado && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{project.estado}</span>
                      </>
                    )}
                    {project.created_at && (
                      <>
                        <span>•</span>
                        <span>
                          {new Date(project.created_at).toLocaleDateString("es-CO", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  {project.moderation_notes && (
                    <div className="text-xs text-[var(--text-tertiary)] bg-[var(--surface-3)] rounded px-2 py-1 mb-2">
                      {project.moderation_notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {filter !== "rejected" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(project)}
                      disabled={actionLoading === project.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/20 text-green-400 text-xs font-ui font-bold uppercase tracking-wider hover:bg-green-500/25 transition-all disabled:opacity-50"
                    >
                      {actionLoading === project.id ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <CheckCircle size={11} />
                      )}
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(project)}
                      disabled={actionLoading === project.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-ui font-bold uppercase tracking-wider hover:bg-red-500/25 transition-all disabled:opacity-50"
                    >
                      <XCircle size={11} />
                      Rechazar
                    </button>
                    {filter === "pending" && (
                      <button
                        onClick={() => handleFlag(project)}
                        disabled={actionLoading === project.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-ui font-bold uppercase tracking-wider hover:bg-amber-500/25 transition-all disabled:opacity-50"
                      >
                        <Flag size={11} />
                        Flaggear
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Actions */}
      {data.recent_actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5"
        >
          <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
            Acciones Recientes
          </h2>
          <div className="space-y-2">
            {data.recent_actions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-b-0"
              >
                <div className="text-xs text-[var(--text-primary)]">{action.nombre}</div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-1 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider border"
                    style={{
                      background:
                        action.moderation_status === "approved"
                          ? "rgba(74, 222, 128, 0.15)"
                          : action.moderation_status === "rejected"
                            ? "rgba(239, 68, 68, 0.15)"
                            : "rgba(251, 191, 36, 0.15)",
                      color:
                        action.moderation_status === "approved"
                          ? "#4ade80"
                          : action.moderation_status === "rejected"
                            ? "#ef4444"
                            : "#fbbf24",
                      borderColor:
                        action.moderation_status === "approved"
                          ? "rgba(74, 222, 128, 0.2)"
                          : action.moderation_status === "rejected"
                            ? "rgba(239, 68, 68, 0.2)"
                            : "rgba(251, 191, 36, 0.2)",
                    }}
                  >
                    {action.moderation_status}
                  </span>
                  {action.moderated_at && (
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(action.moderated_at).toLocaleDateString("es-CO", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
