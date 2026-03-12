"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Tilt from "react-parallax-tilt";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProject";
import {
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Loader2,
  X,
  FolderOpen,
  Sparkles,
  Bot,
  AlertTriangle,
} from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import { useAuthRole } from "@/hooks/useAuthContext";

const estadoColors: Record<string, string> = {
  publicado: "bg-emerald-500/15 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]",
  borrador: "bg-amber-500/15 text-amber-400",
  archivado: "bg-neutral-500/15 text-neutral-400",
};

export default function ProyectosPage() {
  const { projects, loading, refresh } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [creatingDemo, setCreatingDemo] = useState(false);
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const toast = useToast();
  const { role } = useAuthRole();
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

  const handleCreateDemo = async () => {
    setCreatingDemo(true);
    try {
      const res = await fetch("/api/proyectos/demo", { method: "POST" });
      if (res.ok) {
        const { id } = await res.json();
        router.push(`/editor/${id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al crear demo");
      }
    } catch {
      toast.error("Error al crear demo");
    } finally {
      setCreatingDemo(false);
    }
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
            {t("proyectos.title")}
          </h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            {t("proyectos.description")}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <MagneticButton>
              <button
                onClick={handleCreateDemo}
                disabled={creatingDemo}
                className="flex items-center gap-2 px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] border border-[var(--border-default)] rounded-xl text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] transition-all disabled:opacity-50"
              >
                {creatingDemo ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {creatingDemo ? t("proyectos.loading") : t("proyectos.createDemo")}
              </button>
            </MagneticButton>
            <MagneticButton>
              <Link
                href="/crear"
                className="flex items-center gap-2 px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] border border-[rgba(var(--site-primary-rgb),0.30)] rounded-xl text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.10)] transition-all"
              >
                <Bot size={14} />
                {t("proyectos.createWithAI")}
              </Link>
            </MagneticButton>
            <MagneticButton>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-noddo flex items-center gap-2 px-5 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em]"
              >
                <Plus size={16} />
                {t("proyectos.newProject")}
              </button>
            </MagneticButton>
          </div>
        )}
      </div>

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
              className="glass-card p-8 w-full max-w-md space-y-5"
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
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  {slug || "tu-proyecto"}.noddo.co
                </p>
              </div>

              <MagneticButton>
                <button
                  type="submit"
                  disabled={creating}
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
              className="glass-card p-6 w-full max-w-sm space-y-4"
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
                  className="flex-1 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] border border-[var(--border-default)] rounded-[0.75rem] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting || deleteConfirmText !== deleteTarget.name}
                  className="flex-1 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] rounded-[0.75rem] flex items-center justify-center gap-2 bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 hover:border-red-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  {deleting ? t("proyectos.deleting") : t("proyectos.deleteButton")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center mb-5">
            <FolderOpen size={28} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-tertiary)] text-lg mb-2">
            {t("proyectos.noProjects")}
          </p>
          <p className="text-[var(--text-muted)] text-sm mb-6">
            {t("proyectos.noProjectsDescription")}
          </p>
          <MagneticButton>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-outline-warm px-5 py-2.5 text-sm"
            >
              {t("proyectos.createProject")}
            </button>
          </MagneticButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proyecto, idx) => (
            <motion.div
              key={proyecto.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.4 }}
            >
              <Tilt
                glareEnable={true}
                glareMaxOpacity={0.15}
                glareColor="#ffffff"
                glarePosition="all"
                glareBorderRadius="12px"
                tiltMaxAngleX={4}
                tiltMaxAngleY={4}
                scale={1.02}
                transitionSpeed={2000}
                className="group bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl overflow-hidden hover:border-[var(--border-default)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 h-full flex flex-col"
              >
                <div className="aspect-video relative overflow-hidden">
                  {proyecto.render_principal_url ? (
                    <img
                      src={proyecto.render_principal_url}
                      alt={proyecto.nombre}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] text-sm">
                      {t("proyectos.noImage")}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-1)] via-transparent to-transparent opacity-60" />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-ui text-[10px] tracking-wider uppercase font-bold backdrop-blur-sm ${estadoColors[proyecto.estado] || estadoColors.borrador
                        }`}
                    >
                      {proyecto.estado}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-base font-medium tracking-wide mb-1 text-[var(--text-primary)]">
                    {proyecto.nombre}
                  </h3>
                  <p className="text-[var(--text-muted)] text-xs mb-4">
                    {proyecto.constructora_nombre || t("proyectos.noDeveloper")} &bull;{" "}
                    {proyecto.subdomain || proyecto.slug}.noddo.co
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/editor/${proyecto.id}`}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[0.625rem] font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-all"
                    >
                      <Edit2 size={12} />
                      {t("proyectos.edit")}
                    </Link>
                    {proyecto.estado === "publicado" && (
                      <Link
                        href={`/sites/${proyecto.slug}`}
                        target="_blank"
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[0.625rem] font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-all"
                      >
                        <ExternalLink size={12} />
                        {t("proyectos.viewSite")}
                      </Link>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() =>
                          handleDelete(proyecto.id, proyecto.nombre)
                        }
                        className="ml-auto p-2 rounded-[0.625rem] text-red-400/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </Tilt>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
