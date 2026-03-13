"use client";

import { use, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useProject } from "@/hooks/useProject";
import { EditorProjectContext } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import { cn } from "@/lib/utils";
import {
  Eye,
  Loader2,
  LayoutDashboard,
  Building2,
  Home,
  Layers,
  Package,
  Image as ImageIcon,
  Film,
  MapPin,
  Map as MapIcon,
  FileText,
  Settings,
  Globe,
  ArrowLeft,
  ExternalLink,
  Rocket,
  Clock,
  ChevronDown,
  RotateCcw,
  Check,
  HardHat,
  HelpCircle,
  Menu,
  X,
  BarChart3,
  ToggleLeft,
  Calculator,
  Lock,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ProyectoVersion } from "@/types";
import { useTranslation } from "@/i18n";
import { useAuthRole } from "@/hooks/useAuthContext";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { RouteProgressBar } from "@/components/ui/RouteProgressBar";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es");
}

/* ------------------------------------------------------------------ */
/*  Tab config                                                         */
/* ------------------------------------------------------------------ */

interface TabItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  badgeKey?: keyof BadgeCounts;
}

interface TabSection {
  label: string;
  tabs: TabItem[];
}

interface BadgeCounts {
  tipologias: number;
  inventario: number;
  galeria: number;
  videos: number;
  recursos: number;
  puntos_interes: number;
  planos: number;
  torres: number;
  avances: number;
}

const editorSections: TabSection[] = [
  {
    label: "Proyecto",
    tabs: [
      { id: "general", label: "General", icon: LayoutDashboard, href: "" },
      { id: "torres", label: "Torres", icon: Building2, href: "/torres", badgeKey: "torres" },
    ],
  },
  {
    label: "Contenido",
    tabs: [
      { id: "tipologias", label: "Tipologias", icon: Layers, href: "/tipologias", badgeKey: "tipologias" },
      { id: "inventario", label: "Inventario", icon: Package, href: "/inventario", badgeKey: "inventario" },
      { id: "fachadas", label: "Noddo Grid", icon: Eye, href: "/fachadas" },
      { id: "planos", label: "Implantaciones", icon: MapIcon, href: "/planos", badgeKey: "planos" },
      { id: "galeria", label: "Galeria", icon: ImageIcon, href: "/galeria", badgeKey: "galeria" },
      { id: "videos", label: "Videos", icon: Film, href: "/videos", badgeKey: "videos" },
      { id: "ubicacion", label: "Ubicacion", icon: MapPin, href: "/ubicacion", badgeKey: "puntos_interes" },
      { id: "recursos", label: "Recursos", icon: FileText, href: "/recursos", badgeKey: "recursos" },
      { id: "avances", label: "Avances", icon: HardHat, href: "/avances", badgeKey: "avances" },
    ],
  },
  {
    label: "Ajustes",
    tabs: [
      { id: "config", label: "Configuracion", icon: Settings, href: "/config" },
      { id: "dominio", label: "Dominio", icon: Globe, href: "/dominio" },
    ],
  },
  {
    label: "Datos",
    tabs: [
      { id: "estadisticas", label: "Estadisticas", icon: BarChart3, href: "/estadisticas" },
    ],
  },
  {
    label: "Herramientas",
    tabs: [
      { id: "disponibilidad", label: "Disponibilidad", icon: ToggleLeft, href: "/disponibilidad" },
      { id: "cotizador", label: "Cotizador", icon: Calculator, href: "/cotizador" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function EditorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { project, loading, saving, save, refresh, updateLocal } = useProject(id);
  const pathname = usePathname();
  const toast = useToast();
  const { t } = useTranslation("editor");

  const { role } = useAuthRole();
  const isCollaborator = role === "colaborador";
  const basePath = `/editor/${id}`;
  const { isMobile, open: drawerOpen, toggle: toggleDrawer, close: closeDrawer } = useMobileDrawer();

  /* ---- Publish / version state ---- */
  const [publishing, setPublishing] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<ProyectoVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const versionDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showVersions) return;
    const handler = (e: MouseEvent) => {
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(e.target as Node)) {
        setShowVersions(false);
        setConfirmRestoreId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showVersions]);

  const fetchVersions = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/proyectos/${id}/versiones`);
      if (res.ok) setVersions(await res.json());
    } finally {
      setLoadingVersions(false);
    }
  }, [id]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/proyectos/${id}/publicar`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Publicado v${data.version_number}`);
        await refresh();
        fetchVersions();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al publicar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setPublishing(false);
    }
  }, [id, refresh, toast, fetchVersions]);

  const handleRestore = useCallback(async (versionId: string, versionNumber: number) => {
    setRestoring(true);
    try {
      const res = await fetch(`/api/proyectos/${id}/versiones/${versionId}/restaurar`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success(`Restaurado a v${versionNumber}`);
        setShowVersions(false);
        setConfirmRestoreId(null);
        await refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al restaurar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setRestoring(false);
    }
  }, [id, refresh, toast]);

  const [archiving, setArchiving] = useState(false);

  const handleArchiveToggle = useCallback(async () => {
    if (!project) return;
    const newEstado = project.estado === "archivado" ? "borrador" : "archivado";
    setArchiving(true);
    try {
      const res = await fetch(`/api/proyectos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newEstado }),
      });
      if (res.ok) {
        toast.success(newEstado === "archivado" ? "Proyecto archivado" : "Proyecto desarchivado");
        setShowVersions(false);
        await refresh();
      } else {
        toast.error("Error al cambiar estado");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setArchiving(false);
    }
  }, [id, project, refresh, toast]);

  const toggleVersions = useCallback(() => {
    setShowVersions((prev) => {
      if (!prev) {
        fetchVersions();
        setConfirmRestoreId(null);
      }
      return !prev;
    });
  }, [fetchVersions]);

  /* ---- Tab navigation ---- */
  const activeTab = useMemo(() => {
    const suffix = pathname.replace(basePath, "");
    if (!suffix || suffix === "/") return "general";
    const segment = suffix.split("/")[1];
    return segment || "general";
  }, [pathname, basePath]);

  const badgeCounts = useMemo<BadgeCounts | null>(() => {
    if (!project) return null;
    const totalImages = project.galeria_categorias?.reduce(
      (sum, cat) => sum + (cat.imagenes?.length || 0),
      0
    ) || 0;
    return {
      tipologias: project.tipologias?.length || 0,
      inventario: project.unidades?.length || 0,
      galeria: totalImages,
      videos: project.videos?.length || 0,
      recursos: project.recursos?.length || 0,
      puntos_interes: project.puntos_interes?.length || 0,
      planos: project.planos_interactivos?.length ?? 0,
      torres: project.torres?.length || 0,
      avances: project.avances_obra?.length || 0,
    };
  }, [project]);

  const contextValue = useMemo(() => {
    if (!project) return null;
    return { project, loading, saving, save, refresh, updateLocal, projectId: id };
  }, [project, loading, saving, save, refresh, updateLocal, id]);

  // Dynamic torres label based on torre types
  const torresLabel = useMemo(() => {
    const torres = project?.torres ?? [];
    if (torres.length === 0) return "Torres";
    const hasTorre = torres.some((t) => (t.tipo ?? "torre") === "torre");
    const hasUrbanismo = torres.some((t) => t.tipo === "urbanismo");
    if (hasTorre && hasUrbanismo) return "Agrupaciones";
    if (hasUrbanismo) return "Urbanismos";
    return "Torres";
  }, [project?.torres]);

  const torresIcon = useMemo(() => {
    const torres = project?.torres ?? [];
    const allUrbanismo = torres.length > 0 && torres.every((t) => t.tipo === "urbanismo");
    return allUrbanismo ? Home : Building2;
  }, [project?.torres]);

  // Collaborators see Inventario + Disponibilidad (both allow estado changes)
  const filteredSections = useMemo(() => {
    if (!isCollaborator) return editorSections;
    const allowedTabs = ["inventario", "disponibilidad"];
    return editorSections
      .map((section) => ({
        ...section,
        tabs: section.tabs.filter((tab) => allowedTabs.includes(tab.id)),
      }))
      .filter((section) => section.tabs.length > 0);
  }, [isCollaborator]);

  const lastPublished = useMemo(() => {
    if (versions.length > 0) return versions[0].published_at;
    return null;
  }, [versions]);

  // Determine publish status: "borrador" | "publicado" | "cambios"
  const publishStatus = useMemo(() => {
    if (project?.estado !== "publicado" || !lastPublished) return "borrador";
    // If project updated_at is after last publish, there are unpublished changes
    if (new Date(project.updated_at) > new Date(lastPublished)) return "cambios";
    return "publicado";
  }, [project?.estado, project?.updated_at, lastPublished]);

  // Fetch versions on mount to show "last published" info
  useEffect(() => {
    if (project) fetchVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  /* ---- "Saved" indicator ---- */
  const [showSaved, setShowSaved] = useState(false);
  const prevSavingRef = useRef(false);

  useEffect(() => {
    if (prevSavingRef.current && !saving) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
    prevSavingRef.current = saving;
  }, [saving]);

  /* ---- Loading ---- */
  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--surface-0)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={28} className="animate-spin text-[var(--site-primary)]" />
          <p className="text-[var(--text-tertiary)] text-sm">{t("layout.loading")}</p>
        </div>
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <EditorProjectContext.Provider value={contextValue!}>
      <RouteProgressBar color="#b8973a" />
      <div className="flex h-screen bg-[var(--surface-0)]">
        {/* Mobile hamburger button */}
        <button
          onClick={toggleDrawer}
          className="fixed top-3 left-3 z-50 md:hidden w-10 h-10 flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl transition-colors hover:bg-[var(--surface-3)]"
          aria-label="Toggle editor menu"
        >
          {drawerOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Mobile overlay */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDrawer}
              className="fixed inset-0 z-[39] bg-black/60 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Editor Sidebar */}
        <aside
          className={cn(
            "w-56 bg-[var(--surface-1)] border-r border-[var(--border-subtle)] flex flex-col shrink-0",
            "fixed inset-y-0 left-0 z-[40] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            "md:relative md:translate-x-0",
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Back + project name */}
          <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
            <Link href="/proyectos" onClick={closeDrawer} className="inline-block hover:opacity-80 transition-opacity mb-3">
              <NodDoLogo height={14} colorNod="var(--text-primary)" colorDo="var(--site-primary)" />
            </Link>
            <h2 className="text-[14px] font-semibold text-white truncate">
              {project.nombre}
            </h2>
            <p className="text-[var(--text-muted)] text-[11px] mt-0.5 truncate">
              {project.slug}.noddo.co
            </p>
          </div>

          {/* Grouped navigation */}
          <nav className="flex-1 overflow-y-auto py-2">
            {filteredSections.map((section) => (
              <div key={section.label}>
                <p className="font-ui text-[10px] uppercase tracking-wider text-[var(--text-muted)] px-5 pt-4 pb-1.5 font-bold select-none">
                  {section.label}
                </p>
                <div className="px-3 space-y-0.5">
                  {section.tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const count = tab.badgeKey && badgeCounts ? badgeCounts[tab.badgeKey] : null;
                    const TabIcon = tab.id === "torres" ? torresIcon : tab.icon;
                    const tabLabel = tab.id === "torres" ? torresLabel : tab.label;
                    return (
                      <Link
                        key={tab.id}
                        href={`${basePath}${tab.href}`}
                        onClick={closeDrawer}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-[7px] rounded-lg font-ui text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-150",
                          isActive
                            ? "bg-[var(--surface-2)] text-white"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]/50"
                        )}
                      >
                        <TabIcon
                          size={15}
                          className={cn(
                            "shrink-0",
                            isActive ? "text-[var(--site-primary)]" : ""
                          )}
                        />
                        <span className="flex-1 truncate">{tabLabel}</span>
                        {tab.id === "cotizador" && !project.cotizador_enabled && (
                          <Lock size={11} className="shrink-0 text-[var(--text-muted)]" />
                        )}
                        {count !== null && count > 0 && (
                          <span
                            className={cn(
                              "text-[10px] font-medium px-1.5 py-px rounded-full min-w-[20px] text-center",
                              isActive
                                ? "bg-[rgba(var(--site-primary-rgb),0.2)] text-[var(--site-primary)]"
                                : "bg-[var(--surface-3)] text-[var(--text-muted)]"
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Help link */}
          <div className="px-3 pb-1">
            <Link
              href="/ayuda"
              onClick={closeDrawer}
              className="flex items-center gap-2.5 px-3 py-[7px] rounded-lg font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]/50 transition-all duration-150"
            >
              <HelpCircle size={15} className="shrink-0" />
              <span className="truncate">{t("layout.help")}</span>
            </Link>
          </div>

          {/* Preview link */}
          <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
            <Link
              href={`/sites/${project.slug}`}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-all"
            >
              <ExternalLink size={13} />
              {t("layout.viewMicrosite")}
            </Link>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Collaborator banner */}
          {isCollaborator && (
            <div className="shrink-0 flex items-center gap-2 px-6 h-10 border-b border-[var(--border-subtle)] bg-[rgba(var(--site-primary-rgb),0.06)]">
              <Package size={13} className="text-[var(--site-primary)]" />
              <span className="text-[11px] text-[var(--text-secondary)]">
                Solo puedes actualizar el estado de las unidades
              </span>
            </div>
          )}
          {/* ── Publish header strip ── */}
          {!isCollaborator && (
            <div className="shrink-0 flex items-center justify-between px-3 md:px-6 h-12 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/60 backdrop-blur-sm">
              {/* Left: auto-save indicator */}
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                  {saving && (
                    <motion.div
                      key="saving"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-[11px] text-[var(--site-primary)]"
                    >
                      <Loader2 size={11} className="animate-spin" />
                      {t("layout.saving")}
                    </motion.div>
                  )}
                  {!saving && showSaved && (
                    <motion.div
                      key="saved"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-[11px] text-green-400"
                    >
                      <Check size={11} />
                      {t("layout.saved")}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right: unified publish bar */}
              <div className="relative" ref={versionDropdownRef}>
                <div className="flex items-center bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg overflow-hidden">
                  {/* Status section */}
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        publishStatus === "publicado" && "bg-green-400",
                        publishStatus === "cambios" && "bg-orange-400",
                        publishStatus === "borrador" && "bg-amber-400",
                      )}
                    />
                    <span
                      className={cn(
                        "font-ui text-[10px] font-bold uppercase tracking-wider",
                        publishStatus === "publicado" && "text-green-400",
                        publishStatus === "cambios" && "text-orange-400",
                        publishStatus === "borrador" && "text-amber-400",
                      )}
                    >
                      {publishStatus === "publicado" && t("layout.published")}
                      {publishStatus === "cambios" && t("layout.unpublishedChanges")}
                      {publishStatus === "borrador" && t("layout.draft")}
                    </span>
                    {lastPublished && publishStatus === "publicado" && (
                      <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">
                        {timeAgo(lastPublished)}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="w-px h-5 bg-[var(--border-default)]" />

                  {/* Publish button */}
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 font-ui text-[11px] font-bold uppercase tracking-[0.1em] transition-all",
                      "bg-[var(--site-primary)] text-[var(--surface-0)] hover:brightness-110",
                      "disabled:opacity-60 disabled:cursor-not-allowed"
                    )}
                  >
                    {publishing ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Rocket size={13} />
                    )}
                    <span className="hidden sm:inline">{publishing ? t("layout.publishing") : t("layout.publish")}</span>
                  </button>

                  {/* Divider */}
                  <div className="w-px h-5 bg-[rgba(0,0,0,0.15)]" />

                  {/* Dropdown toggle */}
                  <button
                    onClick={toggleVersions}
                    className={cn(
                      "flex items-center px-2 py-1.5 transition-all",
                      "bg-[var(--site-primary)] text-[var(--surface-0)] hover:brightness-110",
                      showVersions && "brightness-90"
                    )}
                  >
                    <ChevronDown size={13} className={cn("transition-transform", showVersions && "rotate-180")} />
                  </button>
                </div>

                {/* Version history + archive dropdown */}
                <AnimatePresence>
                  {showVersions && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)]">
                        <Clock size={13} className="text-[var(--text-tertiary)]" />
                        <span className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t("layout.versionHistory")}</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {loadingVersions ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
                          </div>
                        ) : versions.length === 0 ? (
                          <div className="px-4 py-6 text-center">
                            <p className="text-xs text-[var(--text-muted)]">{t("layout.noPublications")}</p>
                            <p className="text-[11px] text-[var(--text-muted)] mt-1">
                              {t("layout.publishHint")}
                            </p>
                          </div>
                        ) : (
                          versions.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--surface-3)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-md bg-[var(--surface-3)] flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)]">
                                  v{v.version_number}
                                </div>
                                <span className="text-[11px] text-[var(--text-secondary)]">
                                  {timeAgo(v.published_at)}
                                </span>
                              </div>
                              {confirmRestoreId === v.id ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleRestore(v.id, v.version_number)}
                                    disabled={restoring}
                                    className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                                  >
                                    {restoring ? "..." : t("layout.confirm")}
                                  </button>
                                  <button
                                    onClick={() => setConfirmRestoreId(null)}
                                    className="text-[10px] px-1.5 py-0.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                                  >
                                    {t("layout.no")}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmRestoreId(v.id)}
                                  className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                                >
                                  <RotateCcw size={11} />
                                  {t("layout.restore")}
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Archive action */}
                      <div className="border-t border-[var(--border-subtle)] px-4 py-2.5">
                        <button
                          onClick={handleArchiveToggle}
                          disabled={archiving}
                          className="flex items-center gap-2 w-full text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-50"
                        >
                          {archiving ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : project?.estado === "archivado" ? (
                            <ArchiveRestore size={12} />
                          ) : (
                            <Archive size={12} />
                          )}
                          {project?.estado === "archivado" ? "Desarchivar proyecto" : "Archivar proyecto"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-14 md:pt-6">
            {children}
          </div>
        </div>
      </div>
    </EditorProjectContext.Provider>
  );
}
