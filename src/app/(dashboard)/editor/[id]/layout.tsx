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
  Archive,
  ArchiveRestore,
  HardDrive,
  Plus,
  Binoculars,
  Monitor,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ProyectoVersion } from "@/types";
import { useTranslation } from "@/i18n";
import { useAuthRole } from "@/hooks/useAuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { RouteProgressBar } from "@/components/ui/RouteProgressBar";
import { TourUploadProvider, useTourUploadContext } from "@/contexts/TourUploadContext";
import { SetupGuidePill } from "@/components/dashboard/onboarding/SetupGuidePill";
import { PlanGateBadge } from "@/components/dashboard/PlanGateBadge";
import { EDITOR_TAB_FEATURE_MAP } from "@/lib/plan-feature-map";
import { isFeatureAvailable, type ProjectPlan } from "@/lib/plan-config";

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

function timeAgo(dateStr: string, t: (key: string, vars?: Record<string, string | number>) => string, locale: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return t("layout.timeAgo.justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("layout.timeAgo.minutesAgo", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("layout.timeAgo.hoursAgo", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t("layout.timeAgo.daysAgo", { n: days });
  return new Date(dateStr).toLocaleDateString(locale === "en" ? "en" : "es");
}

/* ------------------------------------------------------------------ */
/*  SafeBackLink — intercepts navigation when tour upload is active    */
/* ------------------------------------------------------------------ */

function SafeBackLink({
  href,
  onClick,
  className,
  children,
}: {
  href: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const { isActive, cancel } = useTourUploadContext();
  const { confirm } = useConfirm();
  const { t } = useTranslation("editor");
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    if (!isActive) {
      onClick?.();
      return; // let Link navigate normally
    }

    e.preventDefault();
    const ok = await confirm({
      title: t("config.tour.leaveWhileUploading"),
      message: t("config.tour.leaveWhileUploadingMsg"),
      confirmLabel: t("config.tour.leaveConfirm"),
      cancelLabel: t("config.tour.stayContinue"),
      variant: "warning",
    });

    if (ok) {
      cancel();
      onClick?.();
      router.push(href);
    }
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab config                                                         */
/* ------------------------------------------------------------------ */

interface TabItem {
  id: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  href: string;
  badgeKey?: keyof BadgeCounts;
}

interface TabSection {
  labelKey: string;
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
    labelKey: "layout.sidebar.estructura",
    tabs: [
      { id: "torres", labelKey: "layout.sidebar.torres", icon: Building2, href: "/torres", badgeKey: "torres" },
      { id: "tipologias", labelKey: "layout.sidebar.tipologias", icon: Layers, href: "/tipologias", badgeKey: "tipologias" },
      { id: "inventario", labelKey: "layout.sidebar.inventario", icon: Package, href: "/inventario", badgeKey: "inventario" },
    ],
  },
  {
    labelKey: "layout.sidebar.contenidoVisual",
    tabs: [
      { id: "galeria", labelKey: "layout.sidebar.galeria", icon: ImageIcon, href: "/galeria", badgeKey: "galeria" },
      { id: "videos", labelKey: "layout.sidebar.videos", icon: Film, href: "/videos", badgeKey: "videos" },
      { id: "tour", labelKey: "layout.sidebar.tour360", icon: View, href: "/tour" },
      { id: "fachadas", labelKey: "layout.sidebar.noddoGrid", icon: Eye, href: "/fachadas" },
      { id: "planos", labelKey: "layout.sidebar.implantaciones", icon: MapIcon, href: "/planos", badgeKey: "planos" },
      { id: "ubicacion", labelKey: "layout.sidebar.ubicacion", icon: MapPin, href: "/ubicacion", badgeKey: "puntos_interes" },
      { id: "vistas", labelKey: "layout.sidebar.vistas", icon: Binoculars, href: "/vistas", badgeKey: "vistas" },
    ],
  },
  {
    labelKey: "layout.sidebar.informacion",
    tabs: [
      { id: "general", labelKey: "layout.sidebar.general", icon: LayoutDashboard, href: "" },
      { id: "recursos", labelKey: "layout.sidebar.recursos", icon: FileText, href: "/recursos", badgeKey: "recursos" },
      { id: "avances", labelKey: "layout.sidebar.avances", icon: HardHat, href: "/avances", badgeKey: "avances" },
    ],
  },
  {
    labelKey: "layout.sidebar.ajustes",
    tabs: [
      { id: "config", labelKey: "layout.sidebar.configuracion", icon: Settings, href: "/config" },
      { id: "cotizaciones", labelKey: "layout.sidebar.cotizaciones", icon: Calculator, href: "/cotizaciones" },
    ],
  },
  {
    labelKey: "layout.sidebar.herramientas",
    tabs: [
      { id: "disponibilidad", labelKey: "layout.sidebar.disponibilidad", icon: ToggleLeft, href: "/disponibilidad" },
      { id: "cotizador", labelKey: "layout.sidebar.cotizador", icon: Calculator, href: "/cotizador" },
      { id: "estadisticas", labelKey: "layout.sidebar.estadisticas", icon: BarChart3, href: "/estadisticas" },
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
  const { t, locale } = useTranslation("editor");
  const { confirm } = useConfirm();

  const { role } = useAuthRole();
  const { can, isAdmin, isCollaborator } = usePermissions();
  const basePath = `/editor/${id}`;
  const { open: drawerOpen, toggle: toggleDrawer, close: closeDrawer } = useMobileDrawer();

  /* ---- Publish / version state ---- */
  const [publishing, setPublishing] = useState(false);
  const [showPublishDropdown, setShowPublishDropdown] = useState(false);
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

  // Close publish dropdown on outside click
  useEffect(() => {
    if (!showPublishDropdown) return;
    const handler = (e: MouseEvent) => {
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(e.target as Node)) {
        setShowPublishDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPublishDropdown]);

  const fetchVersions = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/proyectos/${id}/versiones`);
      if (res.ok) setVersions(await res.json());
    } catch {
      // Route may not exist yet — silently ignore
    } finally {
      setLoadingVersions(false);
    }
  }, [id]);

  const handlePublish = useCallback(() => {
    setPublishing(true);
    // Close dropdown after a brief delay so spinner is visible
    setTimeout(() => setShowPublishDropdown(false), 300);
    // Fire and forget — non-blocking so user can keep working
    fetch(`/api/proyectos/${id}/publicar`, { method: "POST" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();

          // Show localhost URL in development mode
          const isDev = process.env.NODE_ENV === "development";
          const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "noddo.io";
          const isLocalhost = isDev || rootDomain.includes("localhost");

          if (isLocalhost && project) {
            const localhostUrl = `/sites/${project.slug}`;
            toast.success(`✓ Publicado (v${data.version_number}). Preview: localhost:3000${localhostUrl}`);
          } else {
            toast.success(t("layout.publishedVersion", { version: data.version_number }));
          }

          await refresh();
          fetchVersions();
        } else {
          const err = await res.json();
          toast.error(err.error || t("layout.publishError"));
        }
      })
      .catch(() => {
        toast.error(t("layout.connectionError"));
      })
      .finally(() => {
        setPublishing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t is stable, project is stable
  }, [id, refresh, toast, fetchVersions, project]);

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
    setShowPublishDropdown(false);
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

  // Dynamic torres label based on project type and actual torre content
  const torresLabel = useMemo(() => {
    const tipoProyecto = project?.tipo_proyecto ?? "hibrido";
    const torres = project?.torres ?? [];
    const hasTorre = torres.some((tr) => (tr.tipo ?? "torre") === "torre");
    const hasUrbanismo = torres.some((tr) => tr.tipo === "urbanismo");

    // When there IS content, derive from actual content
    if (hasTorre && hasUrbanismo) return t("torres.titleAgrupaciones");
    if (hasUrbanismo && !hasTorre) return t("torres.titleUrbanismos");
    if (hasTorre) return t("layout.sidebar.torres");

    // Empty state: derive from project type
    if (tipoProyecto === "apartamentos") return t("layout.sidebar.torres");
    if (tipoProyecto === "casas" || tipoProyecto === "lotes") return t("torres.titleUrbanismos");
    return t("torres.titleAgrupaciones"); // hibrido
  }, [project?.tipo_proyecto, project?.torres, t]);

  const torresIcon = useMemo(() => {
    const tipoProyecto = project?.tipo_proyecto ?? "hibrido";
    if (tipoProyecto === "apartamentos") return Building2;
    if (tipoProyecto === "casas" || tipoProyecto === "lotes") return Home;

    // Híbrido: dynamic based on actual content
    const torres = project?.torres ?? [];
    const allTorre = torres.length > 0 && torres.every((tr) => (tr.tipo ?? "torre") === "torre");
    return allTorre ? Building2 : Home;
  }, [project?.tipo_proyecto, project?.torres]);

  // Role-based tab filtering:
  // Admin: all tabs
  // Director: all except config (can view General/Torres read-only)
  // Asesor: inventario (read-only), disponibilidad, cotizador, tipologias (read-only)
  const filteredSections = useMemo(() => {
    if (isAdmin || role === "administrador") return editorSections;
    if (role === "director") {
      const hiddenTabs = ["config"];
      return editorSections
        .map((section) => ({
          ...section,
          tabs: section.tabs.filter((tab) => !hiddenTabs.includes(tab.id)),
        }))
        .filter((section) => section.tabs.length > 0);
    }
    // Asesor: limited tabs
    const allowedTabs = ["tipologias", "inventario", "disponibilidad", "cotizador"];
    return editorSections
      .map((section) => ({
        ...section,
        tabs: section.tabs.filter((tab) => allowedTabs.includes(tab.id)),
      }))
      .filter((section) => section.tabs.length > 0);
  }, [isAdmin, role]);

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
    fetch(`/api/proyectos/${id}/storage`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStorageData(d); })
      .catch(() => {});
  }, [id]);

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
      <TourUploadProvider>
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
          {/* Home link */}
          <div className="px-4 py-3">
            <SafeBackLink href="/dashboard" onClick={closeDrawer} className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity group">
              <Home size={14} className="text-[var(--text-muted)] group-hover:text-[var(--site-primary)] transition-colors" />
              <NodDoLogo height={15} colorNod="var(--text-primary)" colorDo="var(--site-primary)" />
            </SafeBackLink>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-[var(--border-subtle)]" />

          {/* Project info */}
          <div className="px-4 py-3">
            <h2 className="text-[13px] font-semibold text-white truncate leading-tight">
              {project.nombre}
            </h2>
            <p className="text-[var(--text-muted)] text-[10px] mt-1 truncate">
              {project.subdomain || project.slug}.noddo.io
            </p>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-[var(--border-subtle)]" />

          {/* Grouped navigation */}
          <nav className="flex-1 py-1">
            {filteredSections.map((section) => (
              <div key={section.labelKey}>
                <p className="font-ui text-[9px] uppercase tracking-wider text-[var(--text-muted)] px-4 pt-2.5 pb-1 font-bold select-none">
                  {t(section.labelKey)}
                </p>
                <div className="px-2.5 space-y-px">
                  {section.tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const count = tab.badgeKey && badgeCounts ? badgeCounts[tab.badgeKey] : null;
                    const TabIcon = tab.id === "torres" ? torresIcon : tab.icon;
                    const tabLabel = tab.id === "torres" ? torresLabel : t(tab.labelKey);
                    const gatedFeature = EDITOR_TAB_FEATURE_MAP[tab.id];
                    const projectPlan = (project.plan ?? "basico") as ProjectPlan;
                    const isLocked = gatedFeature ? !isFeatureAvailable(projectPlan, gatedFeature) : false;

                    return (
                      <Link
                        key={tab.id}
                        href={`${basePath}${tab.href}`}
                        onClick={closeDrawer}
                        className={cn(
                          "group flex items-center gap-2 px-2.5 py-[6px] rounded-lg font-ui text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-all duration-150",
                          isLocked
                            ? "text-[var(--text-muted)] hover:text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]/30"
                            : isActive
                              ? "bg-[var(--surface-2)] text-white"
                              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]/50"
                        )}
                      >
                        <TabIcon
                          size={15}
                          className={cn(
                            "shrink-0",
                            isLocked
                              ? "opacity-40"
                              : isActive ? "text-[var(--site-primary)]" : ""
                          )}
                        />
                        <span className={cn("flex-1 truncate", isLocked && "opacity-60")}>{tabLabel}</span>
                        {isLocked ? (
                          <PlanGateBadge />
                        ) : count !== null && count > 0 ? (
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
                        ) : null}
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

          {/* Language toggle */}
          <div className="px-4 py-1.5 flex items-center justify-center border-t border-[var(--border-subtle)]">
            <LanguageToggle />
          </div>

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
              // In development mode, always use localhost
              const isDev = process.env.NODE_ENV === "development";
              const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "noddo.io";
              const isLocal = isDev || rootDomain.includes("localhost");
              const previewUrl = isLocal
                ? `/sites/${project.slug}`
                : project.custom_domain && project.domain_verified
                  ? `https://${project.custom_domain}`
                  : `https://${project.subdomain || project.slug}.${rootDomain}`;
              return isLocal ? (
                <Link
                  href={previewUrl}
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-blue-400 hover:text-blue-300 hover:border-blue-500/50 hover:bg-blue-500/20 transition-all"
                >
                  <Monitor size={13} />
                  {t("layout.viewLocalhost")}
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
          {/* Role banner for collaborators */}
          {isCollaborator && role && (
            <div className="shrink-0 flex items-center gap-2 px-6 h-10 border-b border-[var(--border-subtle)] bg-[rgba(var(--site-primary-rgb),0.06)]">
              <Package size={13} className="text-[var(--site-primary)]" />
              <span className="text-[11px] text-[var(--text-secondary)]">
                {role === "director"
                  ? (locale === "es"
                    ? "Estás editando como Director — algunos ajustes requieren acceso de Administrador"
                    : "Editing as Director — some settings require Administrator access")
                  : (locale === "es"
                    ? "Estás en modo Asesor — acceso limitado a disponibilidad, cotizador y leads asignados"
                    : "Advisor mode — limited to availability, quotation tool, and assigned leads")}
              </span>
            </div>
          )}
          {/* ── Publish header strip ── */}
          {!isCollaborator && (
            <div className="relative z-10 shrink-0 flex items-center justify-between px-3 md:px-6 h-12 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/60 backdrop-blur-sm">
              {/* Left: setup guide pill (fixed position) + auto-save indicator */}
              <div className="flex items-center gap-3">
                {/* Setup guide pill — always first so it doesn't shift */}
                {badgeCounts && (
                  <SetupGuidePill
                    projectId={id}
                    basePath={basePath}
                    locale={locale}
                    badges={{
                      torres: badgeCounts.torres,
                      tipologias: badgeCounts.tipologias,
                      inventario: badgeCounts.inventario,
                      galeria: badgeCounts.galeria,
                    }}
                    hasUbicacion={!!(project?.ubicacion_lat && project?.ubicacion_lng)}
                  />
                )}

                {/* Auto-save indicator — appears/disappears without shifting the pill */}
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
                        {timeAgo(lastPublished, t, locale)}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="w-px h-5 bg-[var(--border-default)]" />

                  {/* Publish button */}
                  <button
                    onClick={() => { if (!publishing) { setShowPublishDropdown((p) => !p); setShowVersions(false); } }}
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
                      "flex items-center self-stretch px-2 transition-all",
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
                      className="absolute right-0 top-full mt-2 w-96 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-2xl overflow-hidden z-[200]"
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
                                  {timeAgo(v.published_at, t, locale)}
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

                {/* Publish dropdown */}
                <AnimatePresence>
                  {showPublishDropdown && project && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-2xl overflow-hidden z-[200]"
                    >
                      {/* Header */}
                      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-subtle)]">
                        <Rocket size={14} className="text-[var(--site-primary)]" />
                        <span className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          {t("layout.publishModal.title")}
                        </span>
                      </div>

                      {/* Domain targets */}
                      <div className="px-4 py-3 space-y-2.5">
                        {/* Subdomain — always present */}
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors">
                          <input
                            type="checkbox"
                            checked={publishTargets.subdomain}
                            onChange={(e) => setPublishTargets((prev) => ({ ...prev, subdomain: e.target.checked }))}
                            className="accent-[var(--site-primary)] w-3.5 h-3.5 rounded cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <a
                              href={`https://${project.subdomain || project.slug}.noddo.io`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 hover:underline"
                            >
                              <Globe size={12} className="text-[var(--site-primary)] shrink-0" />
                              <span className="text-[11px] text-[var(--text-primary)] truncate">
                                {project.subdomain || project.slug}.noddo.io
                              </span>
                              <ExternalLink size={10} className="text-[var(--text-muted)] shrink-0" />
                            </a>
                          </div>
                        </div>

                        {/* Custom domain — only if configured */}
                        {project.custom_domain && (
                          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors">
                            <input
                              type="checkbox"
                              checked={publishTargets.customDomain}
                              onChange={(e) => setPublishTargets((prev) => ({ ...prev, customDomain: e.target.checked }))}
                              className="accent-[var(--site-primary)] w-3.5 h-3.5 rounded cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <a
                                  href={`https://${project.custom_domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 hover:underline"
                                >
                                  <Globe size={12} className="text-[var(--site-primary)] shrink-0" />
                                  <span className="text-[11px] text-[var(--text-primary)] truncate">
                                    {project.custom_domain}
                                  </span>
                                  <ExternalLink size={10} className="text-[var(--text-muted)] shrink-0" />
                                </a>
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
                            </div>
                          </div>
                        )}

                        {/* No custom domain hint */}
                        {!project.custom_domain && (
                          <Link
                            href={`/editor/${id}/config?tab=dominio`}
                            onClick={() => setShowPublishDropdown(false)}
                            className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
                          >
                            <Plus size={12} className="text-[var(--text-muted)]" />
                            <span className="text-[11px] text-[var(--text-muted)]">
                              {t("layout.publishModal.addCustomDomain")}
                            </span>
                          </Link>
                        )}
                      </div>

                      {/* Publish action */}
                      <div className="px-4 pb-3 flex justify-end">
                        <button
                          onClick={handlePublish}
                          disabled={publishing || (!publishTargets.subdomain && !publishTargets.customDomain)}
                          className={cn(
                            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-ui text-[11px] font-bold uppercase tracking-[0.1em] transition-all",
                            "bg-[var(--site-primary)] text-[var(--surface-0)] hover:brightness-110",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          {publishing ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
                          {publishing ? t("layout.publishing") : "Publish Now"}
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
      </TourUploadProvider>
    </EditorProjectContext.Provider>
  );
}
