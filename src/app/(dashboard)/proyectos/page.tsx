"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProjects, useCreateProject, useDeleteProject } from "@/hooks/useProjectsQuery";
import {
  Plus,
  Loader2,
  X,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  XCircle,
  Globe,
} from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import { useAuthRole } from "@/hooks/useAuthContext";
import { trackDashboardEvent } from "@/lib/dashboard-tracking";

import { ProjectsFilters } from "@/components/dashboard/projects/ProjectsFilters";
import { ProjectsTable } from "@/components/dashboard/projects/ProjectsTable";

export default function ProyectosPage() {
  const { data: projects = [], isLoading: loading, refetch: refresh } = useProjects();
  const { mutate: createProject, isPending: creating } = useCreateProject();
  const { mutate: deleteProject, isPending: deleting } = useDeleteProject();

  const [showCreate, setShowCreate] = useState(false);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<string>("reciente");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [, setCloning] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const toast = useToast();
  const { user, role } = useAuthRole();
  const isAdmin = role === "admin";

  // Track page view
  useEffect(() => {
    if (!loading) {
      trackDashboardEvent("projects_view", {
        projects_count: projects.length,
      }, user?.id, role || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      // Track search if query is not empty
      if (searchQuery) {
        trackDashboardEvent("projects_search", {
          query: searchQuery,
        }, user?.id, role || undefined);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.id, role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    createProject({ nombre, slug }, {
      onSuccess: (proyecto) => {
        setShowCreate(false);
        trackDashboardEvent("project_create", {
          project_id: proyecto.id,
          project_name: nombre,
        }, user?.id, role || undefined);
        router.push(`/editor/${proyecto.id}`);
      },
      onError: (error) => {
        toast.error(error.message || "Error al crear proyecto");
      }
    });
  };

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setDeleteConfirmText("");
    trackDashboardEvent("project_table_delete_click", {
      project_id: id,
      project_name: name,
    }, user?.id, role || undefined);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    deleteProject(deleteTarget.id, {
      onSuccess: () => {
        trackDashboardEvent("project_delete", {
          project_id: deleteTarget.id,
          project_name: deleteTarget.name,
        }, user?.id, role || undefined);
        setDeleteTarget(null);
        setDeleteConfirmText("");
        toast.success("Proyecto eliminado");
      },
      onError: (error) => {
        toast.error(error.message || "Error al eliminar");
      }
    });
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

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p: typeof projects[number]) => {
        // Search filter
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase();
          if (!p.nombre.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) {
            return false;
          }
        }
        // Status filter
        if (statusFilter !== "todos" && p.estado !== statusFilter) {
          return false;
        }
        return true;
      })
      .sort((a: typeof projects[number], b: typeof projects[number]) => {
        switch (sortBy) {
          case "nombre":
            return a.nombre.localeCompare(b.nombre);
          case "nombre-desc":
            return b.nombre.localeCompare(a.nombre);
          case "antiguo":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "leads": {
            const bStats = (b as unknown as { stats?: { leads_7d?: number } }).stats;
            const aStats = (a as unknown as { stats?: { leads_7d?: number } }).stats;
            return (bStats?.leads_7d || 0) - (aStats?.leads_7d || 0);
          }
          case "visitas": {
            const bStats = (b as unknown as { stats?: { views_7d?: number } }).stats;
            const aStats = (a as unknown as { stats?: { views_7d?: number } }).stats;
            return (bStats?.views_7d || 0) - (aStats?.views_7d || 0);
          }
          default: // "reciente"
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [projects, debouncedSearch, statusFilter, sortBy]);

  const handleClone = async (id: string) => {
    setCloning(id);
    trackDashboardEvent("project_table_clone_click", {
      project_id: id,
    }, user?.id, role || undefined);
    try {
      const res = await fetch(`/api/proyectos/${id}/clonar`, { method: "POST" });
      if (res.ok) {
        const clonedProject = await res.json();
        trackDashboardEvent("project_clone", {
          original_id: id,
          cloned_id: clonedProject.id,
        }, user?.id, role || undefined);
        toast.success("Proyecto clonado");
        refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al clonar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setCloning(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-3xl font-light text-[var(--text-primary)] mb-2">
          Proyectos
        </h1>
        <p className="font-mono text-sm text-[var(--text-tertiary)]">
          Gestiona todos tus proyectos inmobiliarios
        </p>
      </div>

      {/* Content */}
      {projects.length === 0 && !loading ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="
            flex flex-col items-center justify-center
            py-20 px-6
            bg-[var(--surface-1)]
            border-2 border-dashed border-[var(--border-subtle)]
            rounded-2xl
          "
        >
          <div className="
            w-16 h-16 mb-4
            rounded-2xl
            bg-[rgba(var(--site-primary-rgb),0.08)]
            border border-[rgba(var(--site-primary-rgb),0.15)]
            flex items-center justify-center
          ">
            <NodDoLogo height={14} colorNod="var(--text-secondary)" colorDo="var(--site-primary)" />
          </div>

          <h3 className="font-heading text-xl font-light text-white mb-2">
            {isAdmin ? "Aún no tienes proyectos" : "No hay proyectos disponibles"}
          </h3>

          <p className="font-mono text-sm text-[var(--text-tertiary)] text-center max-w-md mb-6">
            {isAdmin
              ? "Crea tu primer proyecto para empezar a gestionar tus desarrollos inmobiliarios"
              : "El administrador aún no ha creado proyectos"}
          </p>

          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="
                flex items-center gap-2
                px-6 py-3
                bg-[var(--site-primary)]
                text-[#141414]
                rounded-[0.75rem]
                font-ui text-xs font-bold uppercase tracking-[0.1em]
                hover:brightness-110
                transition-all
                shadow-[0_4px_16px_rgba(var(--site-primary-rgb),0.2)]
              "
            >
              <Plus size={16} />
              Crear Proyecto
            </button>
          )}
        </motion.div>
      ) : (
        <>
          {/* Filters */}
          <ProjectsFilters
            search={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onCreateClick={() => setShowCreate(true)}
            isAdmin={isAdmin}
            total={filteredProjects.length}
          />

          {/* Table */}
          <ProjectsTable
            projects={filteredProjects}
            loading={loading}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onEdit={(id) => router.push(`/editor/${id}`)}
            onDelete={handleDelete}
            onClone={handleClone}
            isAdmin={isAdmin}
          />
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
            onKeyDown={(e) => e.key === "Escape" && setShowCreate(false)}
          >
            <motion.form
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreate}
              className="glass-modal p-0 w-full max-w-[26rem] overflow-hidden"
            >
              {/* Header */}
              <div className="relative px-7 pt-7 pb-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(var(--noddo-primary-rgb),0.1)] border border-[rgba(var(--noddo-primary-rgb),0.15)] flex items-center justify-center shrink-0">
                      <Plus size={18} className="text-[var(--noddo-primary)]" />
                    </div>
                    <div>
                      <h2 className="font-heading text-xl font-light text-[var(--text-primary)]">
                        {t("proyectos.newProject")}
                      </h2>
                      <p className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5">
                        Configura nombre y URL
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1.5 -mr-1.5 -mt-0.5 rounded-lg hover:bg-white/5"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-[var(--border-subtle)]" />

              {/* Fields */}
              <div className="px-7 py-6 space-y-5">
                {/* Nombre */}
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
                    autoFocus
                    placeholder="Ciudadela Los Pinos"
                    className="input-glass w-full"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block font-ui text-[10px] text-[var(--text-secondary)] mb-2 tracking-wider uppercase font-bold">
                    {t("proyectos.slugLabel")}
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    required
                    placeholder="mi-proyecto"
                    className="input-glass w-full"
                  />

                  {/* URL preview bar */}
                  <div className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                    <Globe size={12} className="text-[var(--text-muted)] shrink-0" />
                    <span className="font-mono text-[11px] text-[var(--text-tertiary)] truncate">
                      <span className="text-[var(--text-secondary)]">{slug || "tu-proyecto"}</span>
                      .noddo.io
                    </span>

                    {slug.length >= 2 && (
                      <span className="ml-auto shrink-0 flex items-center gap-1">
                        {checkingSlug ? (
                          <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />
                        ) : slugAvailable === true ? (
                          <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 font-medium font-mono">Disponible</span>
                          </motion.span>
                        ) : slugAvailable === false ? (
                          <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-1"
                          >
                            <XCircle size={12} className="text-red-400" />
                            <span className="text-[10px] text-red-400 font-medium font-mono">No disponible</span>
                          </motion.span>
                        ) : null}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-[var(--border-subtle)]" />

              {/* Footer */}
              <div className="px-7 py-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] border border-[var(--border-default)] rounded-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all"
                >
                  Cancelar
                </button>
                <MagneticButton className="flex-1">
                  <button
                    type="submit"
                    disabled={creating || slugAvailable === false || checkingSlug || !slug}
                    className="btn-noddo w-full py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2"
                  >
                    {creating && <Loader2 size={14} className="animate-spin" />}
                    {t("proyectos.createProject")}
                  </button>
                </MagneticButton>
              </div>
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
            role="alertdialog"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
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
                  <AlertTriangle size={20} className="text-red-400" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="delete-dialog-title" className="text-sm font-medium text-[var(--text-primary)]">
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
                  aria-label="Cerrar diálogo"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <p id="delete-dialog-description" className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {t("proyectos.deleteDescription")}
              </p>

              <div>
                <label htmlFor="delete-confirm-input" className="block text-xs text-[var(--text-secondary)] mb-2">
                  {t("proyectos.deleteTypeToConfirm")}{" "}
                  <span className="font-medium text-[var(--text-primary)] font-mono">
                    {deleteTarget.name}
                  </span>
                </label>
                <input
                  id="delete-confirm-input"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={deleteTarget.name}
                  className="input-glass w-full"
                  autoFocus
                  aria-label={`Escribe "${deleteTarget.name}" para confirmar eliminación`}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] border border-[var(--border-default)] rounded-[0.75rem] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] transition-all"
                  aria-label="Cancelar eliminación"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting || deleteConfirmText !== deleteTarget.name}
                  className="flex-1 px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] rounded-[0.75rem] flex items-center justify-center gap-2 whitespace-nowrap bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 hover:border-red-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={`Confirmar eliminación del proyecto ${deleteTarget.name}`}
                >
                  {deleting ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Trash2 size={13} aria-hidden="true" />}
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
