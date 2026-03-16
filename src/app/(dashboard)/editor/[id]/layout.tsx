"use client";

import { use, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useProject, useUpdateProject } from "@/hooks/useProjectsQuery";
import { EditorProjectContext } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import { cn } from "@/lib/utils";
import {
  Eye,
  View,
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
  HardDrive,
  Plus,
  Webhook,
  Binoculars,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ProyectoVersion } from "@/types";
import { useTranslation } from "@/i18n";
import { useAuthRole } from "@/hooks/useAuthContext";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { RouteProgressBar } from "@/components/ui/RouteProgressBar";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

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
  featureKey?: string; // maps to project_features.feature
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
  vistas: number;
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
      { id: "videos", label: "Videos", icon: Film, href: "/videos", badgeKey: "videos", featureKey: "video_hosting" },
      { id: "tour", label: "Tour 360", icon: View, href: "/tour", featureKey: "tour_360" },
      { id: "ubicacion", label: "Ubicacion", icon: MapPin, href: "/ubicacion", badgeKey: "puntos_interes" },
      { id: "vistas", label: "Vistas", icon: Binoculars, href: "/vistas", badgeKey: "vistas" },
      { id: "recursos", label: "Recursos", icon: FileText, href: "/recursos", badgeKey: "recursos" },
      { id: "avances", label: "Avances", icon: HardHat, href: "/avances", badgeKey: "avances" },
    ],
  },
  {
    label: "Ajustes",
    tabs: [
      { id: "config", label: "Configuracion", icon: Settings, href: "/config" },
      { id: "dominio", label: "Dominio", icon: Globe, href: "/dominio", featureKey: "custom_domain" },
      { id: "webhooks", label: "Webhooks", icon: Webhook, href: "/webhooks", featureKey: "webhooks" },
    ],
  },
  {
    label: "Datos",
    tabs: [
      { id: "estadisticas", label: "Estadisticas", icon: BarChart3, href: "/estadisticas", featureKey: "analytics" },
    ],
  },
  {
    label: "Herramientas",
    tabs: [
      { id: "disponibilidad", label: "Disponibilidad", icon: ToggleLeft, href: "/disponibilidad" },
      { id: "cotizador", label: "Cotizador", icon: Calculator, href: "/cotizador", featureKey: "cotizador" },
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
  const { project, loading, updateLocal, refresh } = useProject(id);
  const { mutate: saveProject, isPending: saving } = useUpdateProject(id);

  // Wrapper for save to maintain same API
  const save = useCallback(async (data: Parameters<typeof saveProject>[0]) => {
    return new Promise<boolean>((resolve) => {
      saveProject(data, {
        onSuccess: () => resolve(true),
        onError: () => resolve(false),
      });
    });
  }, [saveProject]);

  // Wrapper for refresh to match context signature
  const wrappedRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const pathname = usePathname();
  const toast = useToast();
  const { t } = useTranslation("editor");
  const { confirm } = useConfirm();

  const { role } = useAuthRole();
  const isCollaborator = role === "colaborador";
  const basePath = `/editor/${id}`;
  const { open: drawerOpen, toggle: toggleDrawer, close: closeDrawer } = useMobileDrawer();

  /* ---- Publish / version state ---- */
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishTargets, setPublishTargets] = useState({ subdomain: true, customDomain: true });
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
        toast.success(t("layout.publishedVersion", { version: data.version_number }));
        await refresh();
        fetchVersions();
      } else {
        const err = await res.json();
        toast.error(err.error || t("layout.publishError"));
      }
    } catch {
      toast.error(t("layout.connectionError"));
    } finally {
      setPublishing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t is stable
  }, [id, refresh, toast, fetchVersions]);

  const handleRestore = useCallback(async (versionId: string, versionNumber: number) => {
    setRestoring(true);
    try {
      const res = await fetch(`/api/proyectos/${id}/versiones/${versionId}/restaurar`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success(t("layout.restoredVersion", { version: versionNumber }));
        setShowVersions(false);
        setConfirmRestoreId(null);
        await refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || t("layout.restoreError"));
      }
    } catch {
      toast.error(t("layout.connectionError"));
    } finally {
      setRestoring(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t is stable
  }, [id, refresh, toast]);

  const [unpublishing, setUnpublishing] = useState(false);

  const handleUnpublish = useCallback(async () => {
    const ok = await confirm({
      title: t("layout.confirmUnpublishTitle"),
      message: t("layout.confirmUnpublishMessage"),
      confirmLabel: t("layout.unpublish"),
      variant: "warning",
    });
    if (!ok) return;
    setUnpublishing(true);
    try {
      const res = await fetch(`/api/proyectos/${id}/despublicar`, { method: "POST" });
      if (res.ok) {
        toast.success(t("layout.unpublished"));
        setShowVersions(false);
        await refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || t("layout.unpublishError"));
      }
    } catch {
      toast.error(t("layout.connectionError"));
    } finally {
      setUnpublishing(false);
    }
  }, [id, refresh, toast, confirm, t]);

  const [archiving, setArchiving] = useState(false);

  const handleArchiveToggle = useCallback(async () => {
    if (!project) return;
    const newEstado = project.estado === "archivado" ? "borrador" : "archivado";
    if (newEstado === "archivado") {
      const ok = await confirm({
        title: t("layout.confirmArchiveTitle"),
        message: t("layout.confirmArchiveMessage"),
        confirmLabel: t("layout.archiveProject"),
        variant: "warning",
      });
      if (!ok) return;
    }
    setArchiving(true);
    try {
      const res = await fetch(`/api/proyectos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newEstado }),
      });
      if (res.ok) {
        toast.success(newEstado === "archivado" ? t("layout.archived") : t("layout.unarchived"));
        setShowVersions(false);
        await refresh();
      } else {
        toast.error(t("layout.stateChangeError"));
      }
    } catch {
      toast.error(t("layout.connectionError"));
    } finally {
      setArchiving(false);
    }
  }, [id, project, refresh, toast, confirm, t]);

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
      vistas: project.vistas_piso?.length || 0,
      planos: project.planos_interactivos?.length ?? 0,
      torres: project.torres?.length || 0,
      avances: project.avances_obra?.length || 0,
    };
  }, [project]);

  const contextValue = useMemo(() => {
    if (!project) return null;
    return { project, loading, saving, save, refresh: wrappedRefresh, updateLocal, projectId: id };
  }, [project, loading, saving, save, wrappedRefresh, updateLocal, id]);

  // Dynamic torres label based on project type
  const torresLabel = useMemo(() => {
    const tipoProyecto = project?.tipo_proyecto ?? "hibrido";

    if (tipoProyecto === "apartamentos") return "Torres";
    if (tipoProyecto === "casas" || tipoProyecto === "lotes") return "Etapas";

    // Híbrido: always show "Etapas"
    return "Etapas";
  }, [project?.tipo_proyecto]);

  const torresIcon = useMemo(() => {
    const tipoProyecto = project?.tipo_proyecto ?? "hibrido";

    if (tipoProyecto === "apartamentos") return Building2;

    // Casas e Híbrido: dynamic based on actual content
    const torres = project?.torres ?? [];
    const allTorre = torres.length > 0 && torres.every((t) => (t.tipo ?? "torre") === "torre");
    return allTorre ? Building2 : Home;
  }, [project?.tipo_proyecto, project?.torres]);

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

  /* ---- Storage usage ---- */
  const [storageData, setStorageData] = useState<{
    total_bytes: number;
    limit_bytes: number;
    pct_used: number;
  } | null>(null);

  useEffect(() => {
    if (!project) return;
    fetch(`/api/proyectos/${id}/storage`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStorageData(d); })
      .catch(() => {});
  }, [id, project]);

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

  /* ---- Loading skeleton ---- */
  if (loading || !project) {
    return (
      <div className="flex h-screen bg-[var(--surface-0)]">
        {/* Skeleton sidebar */}
        <aside className="w-60 bg-[var(--surface-1)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 hidden md:flex">
          <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
            <div className="h-4 w-20 bg-[var(--surface-3)] rounded animate-pulse mb-2" />
            <div className="h-2.5 w-24 bg-[var(--surface-2)] rounded animate-pulse mb-2.5" />
            <div className="h-3.5 w-32 bg-[var(--surface-3)] rounded animate-pulse" />
            <div className="h-2.5 w-28 bg-[var(--surface-2)] rounded animate-pulse mt-1" />
          </div>
          <nav className="flex-1 py-1 px-2.5 space-y-px">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-[6px]">
                <div className="w-3.5 h-3.5 bg-[var(--surface-3)] rounded animate-pulse" />
                <div className="h-3 bg-[var(--surface-2)] rounded animate-pulse" style={{ width: `${65 + (i % 3) * 20}px` }} />
              </div>
            ))}
          </nav>
        </aside>
        {/* Skeleton content */}
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[var(--site-primary)]" />
        </div>
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <EditorProjectContext.Provider value={contextValue!}>
      <RouteProgressBar color="var(--site-primary)" />
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
            "w-60 bg-[var(--surface-1)] border-r border-[var(--border-subtle)] flex flex-col shrink-0",
            "fixed inset-y-0 left-0 z-[40] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            "md:relative md:translate-x-0",
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Back + project name */}
          <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
            <Link href="/proyectos" onClick={closeDrawer} className="inline-block hover:opacity-80 transition-opacity mb-1.5">
              <NodDoLogo height={16} colorNod="var(--text-primary)" colorDo="var(--site-primary)" />
            </Link>
            <Link href="/proyectos" onClick={closeDrawer} className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors mb-2">
              <ArrowLeft size={10} />
              {t("layout.backToProjects")}
            </Link>
            <h2 className="text-[13px] font-semibold text-white truncate leading-tight">
              {project.nombre}
            </h2>
            <p className="text-[var(--text-muted)] text-[10px] mt-0.5 truncate">
              {project.subdomain || project.slug}.noddo.io
            </p>
          </div>

          {/* Grouped navigation */}
          <nav className="flex-1 overflow-y-auto py-1">
            {filteredSections.map((section) => (
              <div key={section.label}>
                <p className="font-ui text-[9px] uppercase tracking-wider text-[var(--text-muted)] px-4 pt-2.5 pb-1 font-bold select-none">
                  {section.label}
                </p>
                <div className="px-2.5 space-y-px">
                  {section.tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const count = tab.badgeKey && badgeCounts ? badgeCounts[tab.badgeKey] : null;
                    const TabIcon = tab.id === "torres" ? torresIcon : tab.icon;
                    const tabLabel = tab.id === "torres" ? torresLabel : tab.label;
                    // Check if feature is locked (feature exists in project_features and is disabled)
                    const features = (project as unknown as Record<string, unknown>).features as Record<string, boolean> | undefined;
                    const isFeatureLocked = tab.featureKey && features ? features[tab.featureKey] === false : false;

                    if (isFeatureLocked) {
                      return (
                        <div
                          key={tab.id}
                          className="flex items-center gap-2 px-2.5 py-[6px] rounded-lg font-ui text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                          title="Feature no habilitada"
                        >
                          <TabIcon size={15} className="shrink-0" />
                          <span className="flex-1 truncate">{tabLabel}</span>
                          <Lock size={10} className="shrink-0" />
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={tab.id}
                        href={`${basePath}${tab.href}`}
                        onClick={closeDrawer}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-[6px] rounded-lg font-ui text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-all duration-150",
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
                        {count !== null && count > 0 && (
                          <span
                            className={cn(
                              "text-[9px] font-medium px-1.5 py-px rounded-full min-w-[18px] text-center",
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

          {/* Storage meter */}
          {storageData && (
            <div className="px-4 pb-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <HardDrive size={11} className="text-[var(--text-muted)]" />
                <span className="text-[9px] text-[var(--text-muted)]">
                  {formatBytes(storageData.total_bytes)} / {formatBytes(storageData.limit_bytes)}
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-[var(--surface-3)] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    storageData.pct_used > 90
                      ? "bg-red-400"
                      : storageData.pct_used > 70
                        ? "bg-yellow-400"
                        : "bg-[var(--site-primary)]"
                  )}
                  style={{ width: `${Math.max(1, Math.min(100, storageData.pct_used))}%` }}
                />
              </div>
            </div>
          )}

          {/* Help link — opens in new tab with contextual hash */}
          <div className="px-2.5 pt-1.5 pb-1 border-t border-[var(--border-subtle)]">
            <a
              href={`/ayuda#${activeTab}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2.5 py-[6px] rounded-lg font-ui text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] hover:text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.06)] transition-all duration-150"
            >
              <HelpCircle size={15} className="shrink-0" />
              <span className="flex-1 truncate">{t("layout.help")}</span>
              <ExternalLink size={10} className="shrink-0 text-[var(--text-muted)]" />
            </a>
          </div>

          {/* Preview link */}
          <div className="px-3 py-2.5 border-t border-[var(--border-subtle)]">
            {(() => {
              const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "noddo.io";
              const isLocal = rootDomain.includes("localhost");
              const previewUrl = isLocal
                ? `/sites/${project.slug}`
                : project.custom_domain && project.domain_verified
                  ? `https://${project.custom_domain}`
                  : `https://${project.subdomain || project.slug}.${rootDomain}`;
              return isLocal ? (
                <Link
                  href={previewUrl}
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-all"
                >
                  <ExternalLink size={13} />
                  {t("layout.viewMicrosite")}
                </Link>
              ) : (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-all"
                >
                  <ExternalLink size={13} />
                  {t("layout.viewMicrosite")}
                </a>
              );
            })()}
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Collaborator banner */}
          {isCollaborator && (
            <div className="shrink-0 flex items-center gap-2 px-6 h-10 border-b border-[var(--border-subtle)] bg-[rgba(var(--site-primary-rgb),0.06)]">
              <Package size={13} className="text-[var(--site-primary)]" />
              <span className="text-[11px] text-[var(--text-secondary)]">
                {t("layout.collaboratorRestriction")}
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
                    onClick={() => setShowPublishModal(true)}
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
                      className="absolute right-0 top-full mt-2 w-96 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-subtle)]">
                        <Clock size={14} className="text-[var(--text-tertiary)]" />
                        <span className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t("layout.versionHistory")}</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {loadingVersions ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 size={18} className="animate-spin text-[var(--text-muted)]" />
                          </div>
                        ) : versions.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <p className="text-xs text-[var(--text-secondary)]">{t("layout.noPublications")}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1.5">
                              {t("layout.publishHint")}
                            </p>
                          </div>
                        ) : (
                          versions.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-3)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-md bg-[var(--surface-3)] flex items-center justify-center text-[11px] font-bold text-[var(--text-tertiary)]">
                                  v{v.version_number}
                                </div>
                                <span className="text-xs text-[var(--text-secondary)]">
                                  {timeAgo(v.published_at)}
                                </span>
                              </div>
                              {confirmRestoreId === v.id ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleRestore(v.id, v.version_number)}
                                    disabled={restoring}
                                    className="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                                  >
                                    {restoring ? "..." : t("layout.confirm")}
                                  </button>
                                  <button
                                    onClick={() => setConfirmRestoreId(null)}
                                    className="text-xs px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                                  >
                                    {t("layout.no")}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmRestoreId(v.id)}
                                  className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                                >
                                  <RotateCcw size={12} />
                                  {t("layout.restore")}
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Unpublish + Archive actions */}
                      <div className="border-t border-[var(--border-subtle)] px-4 py-3 space-y-2.5">
                        {project?.estado === "publicado" && (
                          <button
                            onClick={handleUnpublish}
                            disabled={unpublishing}
                            className="flex items-center gap-2 w-full text-xs text-orange-400 hover:text-orange-300 transition-colors disabled:opacity-50"
                          >
                            {unpublishing ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Eye size={13} />
                            )}
                            {t("layout.unpublish")}
                          </button>
                        )}
                        <button
                          onClick={handleArchiveToggle}
                          disabled={archiving}
                          className="flex items-center gap-2 w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-50"
                        >
                          {archiving ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : project?.estado === "archivado" ? (
                            <ArchiveRestore size={13} />
                          ) : (
                            <Archive size={13} />
                          )}
                          {project?.estado === "archivado" ? t("layout.unarchiveProject") : t("layout.archiveProject")}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Publish modal */}
          <AnimatePresence>
            {showPublishModal && project && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4"
                onClick={() => !publishing && setShowPublishModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: -8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: -8 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-[calc(100vw-2rem)] sm:max-w-sm bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-2xl overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)]">
                    <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-primary)]">
                      {t("layout.publishModal.title")}
                    </span>
                    <button
                      onClick={() => setShowPublishModal(false)}
                      disabled={publishing}
                      className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Domain targets */}
                  <div className="px-5 py-4 space-y-3">
                    {/* Subdomain — always present */}
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--border-default)] transition-colors">
                      <input
                        type="checkbox"
                        checked={publishTargets.subdomain}
                        onChange={(e) => setPublishTargets((prev) => ({ ...prev, subdomain: e.target.checked }))}
                        className="accent-[var(--site-primary)] w-3.5 h-3.5 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Globe size={13} className="text-[var(--site-primary)] shrink-0" />
                          <span className="text-xs text-[var(--text-primary)] truncate">
                            {project.subdomain || project.slug}.noddo.io
                          </span>
                        </div>
                        {lastPublished && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 ml-[21px]">
                            {t("layout.publishModal.lastPublished")} {timeAgo(lastPublished)}
                          </p>
                        )}
                      </div>
                    </label>

                    {/* Custom domain — only if configured */}
                    {project.custom_domain && (
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--border-default)] transition-colors">
                        <input
                          type="checkbox"
                          checked={publishTargets.customDomain}
                          onChange={(e) => setPublishTargets((prev) => ({ ...prev, customDomain: e.target.checked }))}
                          className="accent-[var(--site-primary)] w-3.5 h-3.5 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Globe size={13} className="text-[var(--site-primary)] shrink-0" />
                            <span className="text-xs text-[var(--text-primary)] truncate">
                              {project.custom_domain}
                            </span>
                            {project.domain_verified ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium shrink-0">
                                {t("layout.publishModal.verified")}
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium shrink-0">
                                {t("layout.publishModal.pendingDns")}
                              </span>
                            )}
                          </div>
                          {lastPublished && (
                            <p className="text-[10px] text-[var(--text-muted)] mt-1 ml-[21px]">
                              {t("layout.publishModal.lastPublished")} {timeAgo(lastPublished)}
                            </p>
                          )}
                        </div>
                      </label>
                    )}

                    {/* No custom domain hint */}
                    {!project.custom_domain && (
                      <Link
                        href={`/editor/${id}/dominio`}
                        onClick={() => setShowPublishModal(false)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
                      >
                        <Plus size={13} className="text-[var(--text-muted)]" />
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {t("layout.publishModal.addCustomDomain")}
                        </span>
                      </Link>
                    )}
                  </div>

                  {/* Publish button */}
                  <div className="px-5 pb-4">
                    <button
                      onClick={async () => {
                        await handlePublish();
                        setShowPublishModal(false);
                      }}
                      disabled={publishing || (!publishTargets.subdomain && !publishTargets.customDomain)}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-ui text-[11px] font-bold uppercase tracking-[0.1em] transition-all",
                        "bg-[var(--site-primary)] text-[var(--surface-0)] hover:brightness-110",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {publishing ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Rocket size={13} />
                      )}
                      {publishing ? t("layout.publishing") : t("layout.publishModal.publishButton")}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-14 md:pt-6">
            {children}
          </div>
        </div>
      </div>
    </EditorProjectContext.Provider>
  );
}
