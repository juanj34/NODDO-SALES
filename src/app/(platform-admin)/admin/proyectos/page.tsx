"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FolderOpen,
  Search,
  Loader2,
  ExternalLink,
  Edit2,
  Package,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Archive,
  Trash2,
  Download,
  ChevronRight,
  Mail,
  HardDrive,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { ALL_FEATURES, FEATURE_LABELS, type ProjectFeature } from "@/lib/feature-flags";

interface ProjectRow {
  id: string;
  nombre: string;
  slug: string;
  subdomain: string | null;
  estado: string;
  user_id: string;
  render_principal_url: string | null;
  constructora_nombre: string | null;
  created_at: string;
  ownerEmail: string;
  unitCount: number;
  leadCount: number;
  storage_tours_bytes: number | null;
  storage_videos_bytes: number | null;
  storage_media_bytes: number | null;
  storage_limit_bytes: number | null;
  features: Record<string, boolean>;
}

const estadoColors: Record<string, string> = {
  publicado: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20",
  borrador: "text-amber-400 bg-amber-500/15 border-amber-500/20",
  archivado: "text-neutral-400 bg-neutral-500/15 border-neutral-500/20",
};

export default function AdminProyectosPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [savingFeatures, setSavingFeatures] = useState<string | null>(null);
  const toast = useToast();
  const { confirm } = useConfirm();

  const fetchProjects = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/proyectos");
      if (!res.ok) throw new Error();
      setProjects(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleArchive = async (projectId: string) => {
    const ok = await confirm({
      title: "Archivar proyecto",
      message: "El proyecto será archivado y dejará de estar visible. Se puede reactivar después.",
      confirmLabel: "Archivar",
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/proyectos/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "archivado" }),
    });
    if (res.ok) {
      toast.success("Proyecto archivado");
      await fetchProjects();
    } else {
      toast.error("Error al archivar");
    }
  };

  const handleDelete = async (projectId: string) => {
    const ok = await confirm({
      title: "Eliminar proyecto",
      message: "Se eliminará el proyecto y todos sus datos (tipologías, galería, leads, unidades). Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/proyectos/${projectId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Proyecto eliminado");
      await fetchProjects();
    } else {
      toast.error("Error al eliminar");
    }
  };

  const handleToggleFeature = async (projectId: string, feature: ProjectFeature, enabled: boolean) => {
    // Optimistic update
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, features: { ...p.features, [feature]: enabled } }
          : p
      )
    );
    setSavingFeatures(projectId);

    try {
      const res = await fetch(`/api/admin/proyectos/${projectId}/features`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: { [feature]: enabled } }),
      });
      if (!res.ok) {
        // Revert on failure
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, features: { ...p.features, [feature]: !enabled } }
              : p
          )
        );
        toast.error("Error al actualizar feature");
      }
    } catch {
      // Revert
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, features: { ...p.features, [feature]: !enabled } }
            : p
        )
      );
      toast.error("Error al actualizar feature");
    } finally {
      setSavingFeatures(null);
    }
  };

  const handleExpandProject = (projectId: string) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  const filtered = projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.ownerEmail.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatStorageMB = (bytes: number | null) => {
    if (!bytes) return "0";
    return (bytes / 1024 / 1024).toFixed(1);
  };

  const handleExportCSV = () => {
    const headers = ["Nombre", "Slug", "Owner", "Constructora", "Estado", "Unidades", "Leads", "Storage (MB)", "Fecha"];
    const rows = filtered.map((p) => {
      const totalStorage = (p.storage_tours_bytes || 0) + (p.storage_videos_bytes || 0) + (p.storage_media_bytes || 0);
      return [
        p.nombre,
        p.slug,
        p.ownerEmail,
        p.constructora_nombre || "",
        p.estado,
        p.unitCount,
        p.leadCount,
        formatStorageMB(totalStorage),
        p.created_at,
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proyectos-noddo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} proyectos exportados`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
            Proyectos
          </h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            {projects.length} proyectos en la plataforma
          </p>
        </div>
        {projects.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
          >
            <Download size={13} />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o slug..."
            className="input-glass w-full pl-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-1 p-0.5 bg-[var(--surface-2)] rounded-lg border border-[var(--border-subtle)]">
          {["all", "publicado", "borrador", "archivado"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-ui font-bold uppercase tracking-wider transition-all ${
                statusFilter === s
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {s === "all" ? "Todos" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle size={28} className="text-amber-400 mb-3" />
          <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar proyectos</p>
          <p className="text-[11px] text-[var(--text-muted)] mb-4">Verifica tu conexión e intenta de nuevo</p>
          <button
            onClick={fetchProjects}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
          >
            <RefreshCw size={13} /> Reintentar
          </button>
        </div>
      ) : (
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
                  <th className="w-8" />
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Proyecto
                  </th>
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Owner
                  </th>
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Estado
                  </th>
                  <th className="text-center px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <Package size={12} className="inline mr-1" />
                    Uds
                  </th>
                  <th className="text-center px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <MessageSquare size={12} className="inline mr-1" />
                    Leads
                  </th>
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Fecha
                  </th>
                  <th className="text-right px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <>
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors cursor-pointer ${expandedProject === p.id ? "bg-[var(--surface-2)]" : ""}`}
                      onClick={() => handleExpandProject(p.id)}
                    >
                      <td className="pl-3 py-3">
                        <ChevronRight
                          size={14}
                          className={`text-[var(--text-muted)] transition-transform ${expandedProject === p.id ? "rotate-90" : ""}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.render_principal_url ? (
                            <div className="w-10 h-7 rounded overflow-hidden bg-[var(--surface-3)] shrink-0">
                              <Image src={p.render_principal_url} alt="undefined" fill className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-7 rounded bg-[var(--surface-3)] flex items-center justify-center shrink-0">
                              <FolderOpen size={12} className="text-[var(--text-muted)]" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-[var(--text-primary)] font-medium">{p.nombre}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {p.subdomain || p.slug}.noddo.io
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--text-tertiary)]">{p.ownerEmail}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-md font-ui text-[10px] font-bold uppercase tracking-wider border ${estadoColors[p.estado] || estadoColors.borrador}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-[var(--text-secondary)]">{p.unitCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-[var(--text-secondary)]">{p.leadCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--text-tertiary)]">{formatDate(p.created_at)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/editor/${p.id}`}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-[var(--site-primary)] hover:bg-[var(--surface-3)] transition-all"
                          >
                            <Edit2 size={11} />
                            Editor
                          </Link>
                          {p.estado === "publicado" && (
                            <Link
                              href={`/sites/${p.slug}`}
                              target="_blank"
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-emerald-400 hover:bg-[var(--surface-3)] transition-all"
                            >
                              <ExternalLink size={11} />
                              Ver
                            </Link>
                          )}
                          {p.estado !== "archivado" && (
                            <button
                              onClick={() => handleArchive(p.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-amber-400 hover:bg-[var(--surface-3)] transition-all"
                            >
                              <Archive size={11} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-red-400 hover:bg-[var(--surface-3)] transition-all"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>

                    {/* Expanded detail row */}
                    <AnimatePresence>
                      {expandedProject === p.id && (
                        <motion.tr
                          key={`${p.id}-detail`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-b border-[var(--border-subtle)]"
                        >
                          <td colSpan={8} className="p-0">
                            <div className="px-6 py-5 bg-[var(--surface-2)]/50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Project Info */}
                                <div className="space-y-3">
                                  <h4 className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                    Información
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs">
                                      <Mail size={12} className="text-[var(--text-muted)]" />
                                      <span className="text-[var(--text-secondary)]">{p.ownerEmail}</span>
                                    </div>
                                    {p.constructora_nombre && (
                                      <div className="flex items-center gap-2 text-xs">
                                        <FolderOpen size={12} className="text-[var(--text-muted)]" />
                                        <span className="text-[var(--text-tertiary)]">{p.constructora_nombre}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs">
                                      <HardDrive size={12} className="text-[var(--text-muted)]" />
                                      <span className="text-[var(--text-tertiary)]">
                                        Storage: {formatStorageMB((p.storage_tours_bytes || 0) + (p.storage_videos_bytes || 0) + (p.storage_media_bytes || 0))} MB
                                        {p.storage_limit_bytes && ` / ${formatStorageMB(p.storage_limit_bytes)} MB`}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Feature Toggles */}
                                <div className="space-y-3">
                                  <h4 className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                    Features
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {ALL_FEATURES.map((feature) => {
                                      const isEnabled = p.features?.[feature] ?? false;
                                      const isSaving = savingFeatures === p.id;
                                      return (
                                        <button
                                          key={feature}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleFeature(p.id, feature, !isEnabled);
                                          }}
                                          disabled={isSaving}
                                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                                            isEnabled
                                              ? "bg-[rgba(184,151,58,0.08)] border-[rgba(184,151,58,0.25)] text-[var(--site-primary)]"
                                              : "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                                          } disabled:opacity-50`}
                                        >
                                          {isEnabled ? (
                                            <ToggleRight size={16} className="text-[var(--site-primary)] shrink-0" />
                                          ) : (
                                            <ToggleLeft size={16} className="shrink-0" />
                                          )}
                                          <span className="text-[11px] font-ui font-bold uppercase tracking-wider truncate">
                                            {FEATURE_LABELS[feature].es}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen size={24} className="text-[var(--text-muted)] mb-3" />
              <p className="text-sm text-[var(--text-tertiary)]">
                {search || statusFilter !== "all" ? "No se encontraron proyectos" : "No hay proyectos"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
