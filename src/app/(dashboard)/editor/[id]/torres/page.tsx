"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  inputClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
  sectionCard,
} from "@/components/dashboard/editor-styles";
import { Label } from "@/components/ui";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Home,
  Plus,
  Trash2,
  Copy,
  Loader2,
  Eye,
  Package,
  ChevronRight,
  Sparkles,
  Layers,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Torre, Fachada, Unidad } from "@/types";
import { getInventoryColumns } from "@/lib/inventory-columns";
import { AITextImprover } from "@/components/dashboard/AITextImprover";
import { AmenidadesEditor } from "@/components/dashboard/AmenidadesEditor";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { fontSize, gap, radius, iconSize } from "@/lib/design-tokens";

/* ── Default values for first torre ──────────────────────────────── */

const DEFAULTS = {
  nombre: "Torre Principal",
  descripcion:
    "Torre residencial de diseño contemporáneo con acabados de alta calidad en todas las áreas comunes. Amplios espacios sociales y vistas panorámicas desde los pisos superiores.",
  amenidades: "Piscina, Gimnasio, Salón social, Zona BBQ, Parque infantil",
  caracteristicas:
    "Fachada ventilada en porcelanato, Lobby con doble altura, Ascensores de alta velocidad, Planta eléctrica de respaldo, Citófono inteligente",
};

/* ── Tab type for multi-torre detail panel ───────────────────────── */

type TorreDetailTab = "info" | "amenidades" | "fachadas" | "unidades";

/* ════════════════════════════════════════════════════════════════════
   TorresPage
   ════════════════════════════════════════════════════════════════════ */

export default function TorresPage() {
  const { t } = useTranslation("editor");
  const { t: tTooltips } = useTranslation("tooltips");
  const { project, projectId, updateLocal } = useEditorProject();
  const toast = useToast();
  const { confirm } = useConfirm();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const torres = project?.torres ?? [];
  const fachadas = project?.fachadas ?? [];
  const unidades = project?.unidades ?? [];

  /* ── Shared state ─────────────────────────────────────────────── */
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEtapaHint, setShowEtapaHint] = useState(true);

  /* ── Multi-torre master-detail state ───────────────────────────── */
  const [selectedTorreId, setSelectedTorreId] = useState<string | null>(null);
  const [torreDetailTab, setTorreDetailTab] = useState<TorreDetailTab>("info");

  /* ── Auto-select first torre / fix invalid selection ───────────── */
  // Use a stable key derived from torre IDs so this only fires on actual data changes
  const torresIdsKey = torres.map((t) => t.id).join(",");
  useEffect(() => {
    if (torres.length === 0) {
      setSelectedTorreId(null);
      setShowAddForm(true);
    } else {
      // Auto-select only if current selection is invalid
      setSelectedTorreId((prev) => {
        if (prev && torres.find((t) => t.id === prev)) return prev;
        return torres[0].id;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [torresIdsKey]);

  const selectedTorre = torres.find((t) => t.id === selectedTorreId) ?? null;

  /* ── Project type (used throughout) ──────────────────────────── */
  const tipoProyecto = project?.tipo_proyecto ?? "hibrido";

  /* ── Add form state ───────────────────────────────────────────── */
  const defaultAddNombre = (tipoProyecto === "casas" || tipoProyecto === "lotes") ? "Urbanismo Principal" : DEFAULTS.nombre;
  const [addNombre, setAddNombre] = useState(torres.length === 0 ? defaultAddNombre : "");
  const [addPrefijo, setAddPrefijo] = useState("");
  const [addTipo, setAddTipo] = useState<"torre" | "urbanismo">(() => {
    if (tipoProyecto === "casas" || tipoProyecto === "lotes") return "urbanismo";
    if (tipoProyecto === "apartamentos") return "torre";
    return "torre"; // Default for hibrido
  });
  const [addNameError, setAddNameError] = useState(false);

  /* ── Column config (for etapa hint) ──────────────────────────── */
  const columns = getInventoryColumns(tipoProyecto, project?.inventory_columns);

  /* ── Dynamic page title based on project type and torre content ── */
  const hasTorre = torres.some((t) => (t.tipo ?? "torre") === "torre");
  const hasUrbanismo = torres.some((t) => t.tipo === "urbanismo");

  const pageLabel = (() => {
    // For non-híbrido, use fixed labels regardless of content
    if (tipoProyecto === "casas" || tipoProyecto === "lotes") return t("torres.titleUrbanismos");
    if (tipoProyecto === "apartamentos") return t("torres.titleTorres");
    // Híbrido: dynamic based on actual content
    if (torres.length === 0) return t("torres.title");
    if (hasTorre && hasUrbanismo) return t("torres.titleAgrupaciones");
    if (hasUrbanismo) return t("torres.titleUrbanismos");
    return t("torres.titleTorres");
  })();

  const pageDesc = (() => {
    if (tipoProyecto === "casas" || tipoProyecto === "lotes") return t("torres.descriptionUrbanismos");
    if (tipoProyecto === "apartamentos") return t("torres.description");
    if (torres.length === 0) return t("torres.description");
    if (hasTorre && hasUrbanismo) return t("torres.descriptionAgrupaciones");
    if (hasUrbanismo) return t("torres.descriptionUrbanismos");
    return t("torres.description");
  })();

  /* ── Count helpers ────────────────────────────────────────────── */
  const fachadasForTorre = (torreId: string) =>
    fachadas.filter((f) => f.torre_id === torreId).length;
  const fachadasCountByTipo = (torreId: string) => {
    const list = fachadas.filter((f) => f.torre_id === torreId);
    return {
      fachadas: list.filter((f) => f.tipo === "fachada").length,
      plantas: list.filter((f) => f.tipo === "planta").length,
    };
  };
  const unidadesForTorre = (torreId: string) =>
    unidades.filter((u) => u.torre_id === torreId).length;

  /* ── List helpers ─────────────────────────────────────────────── */
  const fachadasForTorreList = (torreId: string): Fachada[] =>
    fachadas.filter((f) => f.torre_id === torreId);
  const unidadesForTorreList = (torreId: string): Unidad[] =>
    unidades.filter((u) => u.torre_id === torreId);

  /* ── Add torre ───────────────────────────────────────────────── */
  const resetAddForm = useCallback(() => {
    setAddNombre("");
    setAddPrefijo("");
    setAddTipo("torre");
    setAddNameError(false);
    setShowAddForm(false);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!addNombre.trim()) {
      setAddNameError(true);
      return;
    }
    // Optimistic: create a temporary torre and show it immediately
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticTorre: Torre = {
      id: tempId,
      proyecto_id: projectId,
      nombre: addNombre.trim(),
      prefijo: addPrefijo.trim() || null,
      tipo: addTipo,
      num_pisos: null,
      pisos_sotano: null,
      pisos_planta_baja: null,
      pisos_podio: null,
      pisos_residenciales: null,
      pisos_rooftop: null,
      descripcion: null,
      amenidades: null,
      amenidades_data: null,
      caracteristicas: null,
      imagen_portada: null,
      logo_url: null,
      orden: torres.length,
      created_at: new Date().toISOString(),
    };
    const savedTipo = addTipo;
    resetAddForm();
    setSelectedTorreId(tempId);
    setTorreDetailTab("info");
    updateLocal((prev) => ({
      ...prev,
      torres: [...prev.torres, optimisticTorre],
    }));
    toast.success(savedTipo === "urbanismo" ? t("torres.urbanismCreated") : t("torres.towerCreated"));

    try {
      const res = await fetch("/api/torres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          nombre: optimisticTorre.nombre,
          prefijo: optimisticTorre.prefijo,
          tipo: savedTipo,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        // Replace temp torre with real one from server
        updateLocal((prev) => ({
          ...prev,
          torres: prev.torres.map((t) =>
            t.id === tempId ? { ...optimisticTorre, ...created } : t
          ),
        }));
        setSelectedTorreId(created.id);
      } else {
        // Rollback
        updateLocal((prev) => ({
          ...prev,
          torres: prev.torres.filter((t) => t.id !== tempId),
        }));
        setSelectedTorreId(torres.length > 0 ? torres[0].id : null);
        const err = await res.json().catch(() => ({ error: t("errors.unknown") }));
        toast.error(err.error || `Error ${res.status}`);
      }
    } catch (err) {
      // Rollback
      updateLocal((prev) => ({
        ...prev,
        torres: prev.torres.filter((t) => t.id !== tempId),
      }));
      setSelectedTorreId(torres.length > 0 ? torres[0].id : null);
      toast.error(t("errors.connectionError"));
      console.error("Torre creation error:", err);
    }
  }, [
    projectId,
    addNombre,
    addPrefijo,
    addTipo,
    torres,
    resetAddForm,
    updateLocal,
    toast,
  ]);

  /* ── Update torre (auto-save on blur) ─────────────────────────── */
  const handleUpdate = useCallback(
    async (torreId: string, data: Partial<Torre>) => {
      // Optimistic: update local immediately
      const prevTorre = torres.find((t) => t.id === torreId);
      updateLocal((prev) => ({
        ...prev,
        torres: prev.torres.map((t) =>
          t.id === torreId ? { ...t, ...data } : t
        ),
      }));
      try {
        const res = await fetch(`/api/torres/${torreId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          // Rollback
          if (prevTorre) {
            updateLocal((prev) => ({
              ...prev,
              torres: prev.torres.map((t) =>
                t.id === torreId ? prevTorre : t
              ),
            }));
          }
          const err = await res.json().catch(() => ({ error: t("errors.unknown") }));
          toast.error(err.error || t("errors.saveError"));
          return;
        }
        const updated = await res.json();
        // Reconcile with server response
        updateLocal((prev) => ({
          ...prev,
          torres: prev.torres.map((t) =>
            t.id === torreId ? { ...t, ...updated } : t
          ),
        }));
      } catch (err) {
        // Rollback
        if (prevTorre) {
          updateLocal((prev) => ({
            ...prev,
            torres: prev.torres.map((t) =>
              t.id === torreId ? prevTorre : t
            ),
          }));
        }
        toast.error(t("errors.connectionError"));
        console.error("Torre update error:", err);
      }
    },
    [torres, updateLocal, toast]
  );

  /* ── Delete torre ─────────────────────────────────────────────── */
  const handleDelete = useCallback(
    async (torreId: string) => {
      const torre = torres.find((tr) => tr.id === torreId);
      if (!torre) return;
      const torresFachadas = fachadas.filter((f) => f.torre_id === torreId);
      const torresUnidades = unidades.filter((u) => u.torre_id === torreId);
      const parts: string[] = [];
      if (torresUnidades.length > 0) parts.push(`${torresUnidades.length} unidades`);
      if (torresFachadas.length > 0) parts.push(`${torresFachadas.length} fachadas/plantas`);

      if (
        !(await confirm({
          title: t("torres.deleteTitle"),
          message: t("torres.deleteConfirm"),
          description: torre.nombre,
          details: parts.length > 0 ? t("torres.deleteDetails", { items: parts.join(" y ") }) : undefined,
          typeToConfirm: torre.nombre,
        }))
      )
        return;

      // Optimistic: remove torre and detach related items immediately
      const prevTorres = torres;
      const prevFachadas = fachadas;
      const prevUnidades = unidades;
      updateLocal((prev) => ({
        ...prev,
        torres: prev.torres.filter((t) => t.id !== torreId),
        fachadas: prev.fachadas.map((f) =>
          f.torre_id === torreId ? { ...f, torre_id: null } : f
        ),
        unidades: prev.unidades.map((u) =>
          u.torre_id === torreId ? { ...u, torre_id: null } : u
        ),
      }));
      if (selectedTorreId === torreId) setSelectedTorreId(null);

      try {
        // Detach fachadas
        await Promise.all(
          torresFachadas.map((f) =>
            fetch(`/api/fachadas/${f.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ torre_id: null }),
            })
          )
        );
        // Detach unidades
        await Promise.all(
          torresUnidades.map((u) =>
            fetch(`/api/unidades/${u.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ torre_id: null }),
            })
          )
        );
        await fetch(`/api/torres/${torreId}`, { method: "DELETE" });
      } catch {
        // Rollback on failure
        updateLocal((prev) => ({
          ...prev,
          torres: prevTorres,
          fachadas: prevFachadas,
          unidades: prevUnidades,
        }));
        if (selectedTorreId === null) setSelectedTorreId(torreId);
        toast.error(t("errors.connectionError"));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- confirm and t are stable
    [torres, fachadas, unidades, selectedTorreId, updateLocal, toast]
  );

  /* ── Duplicate torre ───────────────────────────────────────────── */
  const handleDuplicate = useCallback(
    async (torre: Torre) => {
      const label = torre.tipo === "urbanismo" ? "urbanismo" : "torre";
      if (
        !(await confirm({
          title: t("torres.duplicateTitle", { label }),
          message: t("torres.duplicateMessage", { name: torre.nombre }),
          confirmLabel: t("torres.duplicateConfirmLabel"),
          variant: "warning",
        }))
      )
        return;

      // Optimistic: add duplicated torre immediately
      const tempId = `temp-${crypto.randomUUID()}`;
      const optimisticTorre: Torre = {
        ...torre,
        id: tempId,
        nombre: `${torre.nombre} (copia)`,
        prefijo: torre.prefijo ? `${torre.prefijo}-2` : null,
        orden: torres.length,
        created_at: new Date().toISOString(),
      };
      updateLocal((prev) => ({
        ...prev,
        torres: [...prev.torres, optimisticTorre],
      }));
      setSelectedTorreId(tempId);
      setTorreDetailTab("info");
      toast.success(t("torres.duplicated", { label: label.charAt(0).toUpperCase() + label.slice(1) }));

      try {
        const res = await fetch("/api/torres", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proyecto_id: projectId,
            nombre: optimisticTorre.nombre,
            tipo: torre.tipo ?? "torre",
            prefijo: optimisticTorre.prefijo,
            num_pisos: torre.num_pisos,
            pisos_sotano: torre.pisos_sotano,
            pisos_planta_baja: torre.pisos_planta_baja,
            pisos_podio: torre.pisos_podio,
            pisos_residenciales: torre.pisos_residenciales,
            pisos_rooftop: torre.pisos_rooftop,
            descripcion: torre.descripcion,
            amenidades: torre.amenidades,
            amenidades_data: torre.amenidades_data,
            caracteristicas: torre.caracteristicas,
            imagen_portada: torre.imagen_portada,
            logo_url: torre.logo_url,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          // Replace temp with real
          updateLocal((prev) => ({
            ...prev,
            torres: prev.torres.map((t) =>
              t.id === tempId ? { ...optimisticTorre, ...created } : t
            ),
          }));
          setSelectedTorreId(created.id);
        } else {
          // Rollback
          updateLocal((prev) => ({
            ...prev,
            torres: prev.torres.filter((t) => t.id !== tempId),
          }));
          setSelectedTorreId(torre.id);
          const err = await res.json().catch(() => ({ error: t("errors.unknown") }));
          toast.error(err.error || `Error ${res.status}`);
        }
      } catch {
        // Rollback
        updateLocal((prev) => ({
          ...prev,
          torres: prev.torres.filter((t) => t.id !== tempId),
        }));
        setSelectedTorreId(torre.id);
        toast.error(t("errors.connectionError"));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, torres, updateLocal, toast]
  );

  /* ════════════════════════════════════════════════════════════════
     Render — Single unified layout: sidebar always visible
     ════════════════════════════════════════════════════════════════ */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      {/* ── Page Header ─────────────────────────────────────────── */}
      <PageHeader
        icon={Building2}
        title={pageLabel}
        description={<>{pageDesc} <InfoTooltip content={tTooltips("torres.concepto.short")} variant="dashboard" /></>}
      />

      {/* ── Etapa hint for urbanismo projects ─────────────────── */}
      {showEtapaHint && hasUrbanismo && (
        <div className={cn(
          "flex items-start p-4 mb-4 bg-[rgba(var(--site-primary-rgb),0.05)] border border-[rgba(var(--site-primary-rgb),0.15)]",
          gap.relaxed,
          radius.lg
        )}>
          <Layers size={iconSize.md} className="text-[var(--site-primary)] mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className={cn(fontSize.md, "font-medium text-white mb-1")}>
              {t("torres.etapaHintTitle")}
            </p>
            <p className={cn(fontSize.body, "text-[var(--text-tertiary)] leading-relaxed")}>
              {t("torres.etapaHintDescription")}
            </p>
          </div>
          <button
            onClick={() => setShowEtapaHint(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0 mt-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Master-Detail Layout ──────────────────────────────── */}
      <div className={cn("flex", gap.loose, isMobile && "flex-col")} style={isMobile ? undefined : { minHeight: "480px" }}>
        {/* ── Sidebar (left / top on mobile) ──────────────────────── */}
        <div className={cn(
          "shrink-0 flex flex-col",
          gap.normal,
          isMobile ? (selectedTorreId && !showAddForm ? "hidden" : "w-full") : "w-56"
        )}>
          {/* Torre list */}
          {torres.map((torre) => {
            const isSelected = selectedTorreId === torre.id && !showAddForm;
            const counts = fachadasCountByTipo(torre.id);
            const nUnidades = unidadesForTorre(torre.id);
            const hasFloors = torre.tipo !== "urbanismo" && (torre.pisos_residenciales || torre.num_pisos);
            const nTotalFachadas = counts.fachadas + counts.plantas;
            const hasData = !!(hasFloors || nTotalFachadas > 0 || nUnidades > 0);
            const isBusy = false;
            return (
              <div
                key={torre.id}
                className={cn(
                  "group relative w-full text-left p-3 border transition-all cursor-pointer",
                  radius.lg,
                  isSelected
                    ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)]"
                    : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                )}
                onClick={() => {
                  setSelectedTorreId(torre.id);
                  setShowAddForm(false);
                }}
              >
                <div className={cn("flex items-center", gap.relaxed)}>
                  <div className={cn(
                    "w-8 h-8 flex items-center justify-center shrink-0",
                    radius.md,
                    isSelected
                      ? "bg-[rgba(var(--site-primary-rgb),0.15)]"
                      : "bg-[rgba(var(--site-primary-rgb),0.1)]"
                  )}>
                    {isBusy
                      ? <Loader2 size={iconSize.sm} className="text-[var(--site-primary)] animate-spin" />
                      : torre.tipo === "urbanismo"
                        ? <Home size={iconSize.sm} className="text-[var(--site-primary)]" />
                        : <Building2 size={iconSize.sm} className="text-[var(--site-primary)]" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(fontSize.md, "font-medium text-white truncate")}>{torre.nombre}</p>
                    {hasData ? (
                      <div className={cn("flex items-center gap-1.5", fontSize.label, "text-[var(--text-muted)]")}>
                        {hasFloors && <span>{torre.pisos_residenciales || torre.num_pisos}p</span>}
                        {hasFloors && (nUnidades > 0 || nTotalFachadas > 0) && <span>·</span>}
                        {nUnidades > 0 && <span>{nUnidades} ud</span>}
                        {nUnidades > 0 && nTotalFachadas > 0 && <span>·</span>}
                        {counts.fachadas > 0 && <span>{counts.fachadas} fach</span>}
                        {counts.fachadas > 0 && counts.plantas > 0 && <span>·</span>}
                        {counts.plantas > 0 && <span>{counts.plantas} pl</span>}
                      </div>
                    ) : (
                      <p className={cn(fontSize.label, "text-[var(--text-muted)] italic")}>{t("torres.notConfigured")}</p>
                    )}
                  </div>

                  {/* Action icons — visible on hover */}
                  <div className={cn(
                    "flex items-center gap-0.5 shrink-0 transition-opacity",
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(torre);
                      }}
                      disabled={isBusy}
                      className={cn(
                        "p-1.5 text-[var(--text-muted)] hover:text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.1)] transition-colors disabled:opacity-40",
                        radius.md
                      )}
                      title="Duplicar"
                    >
                      <Copy size={iconSize.sm - 1} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(torre.id);
                      }}
                      disabled={isBusy}
                      className={cn(
                        "p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40",
                        radius.md
                      )}
                      title="Eliminar"
                    >
                      <Trash2 size={iconSize.sm - 1} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state hint when no torres */}
          {torres.length === 0 && (
            <div className={cn("p-5 border border-dashed border-[rgba(var(--site-primary-rgb),0.15)] text-center", radius.lg)}>
              <Building2 size={iconSize.lg} className="mx-auto text-[var(--site-primary)] opacity-40 mb-2" />
              <p className={cn("font-heading font-light text-[var(--text-secondary)] mb-1", fontSize.md)}>
                {t("torres.noTowers")}
              </p>
            </div>
          )}

          {/* Add torre button */}
          <button
            onClick={() => {
              setShowAddForm(true);
              setSelectedTorreId(null);
            }}
            className={cn(
              btnSecondary,
              "w-full justify-center",
              showAddForm && "ring-1 ring-[rgba(var(--site-primary-rgb),0.3)]"
            )}
          >
            <Plus size={iconSize.sm} />
            {t("torres.addTower")}
          </button>
        </div>

        {/* ── Right panel (full-width on mobile when torre selected) ── */}
        <div className={cn("flex-1 min-w-0", isMobile && !selectedTorreId && !showAddForm && "hidden")}>
          {/* Mobile back button */}
          {isMobile && (selectedTorreId || showAddForm) && (
            <button
              onClick={() => { setSelectedTorreId(null); setShowAddForm(false); }}
              className={cn("flex items-center mb-3 text-[var(--text-secondary)] hover:text-white transition-colors", gap.normal, fontSize.md)}
            >
              <ChevronRight size={iconSize.sm} className="rotate-180" />
              {t("torres.backToList")}
            </button>
          )}
          <AnimatePresence mode="wait">
            {/* Compact quick-add form */}
            {showAddForm && (
              <motion.div
                key="add-form"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <div className={sectionCard + " border-[rgba(var(--site-primary-rgb),0.3)]"}>
                  <h3 className={cn(fontSize.md, "font-medium text-white mb-3")}>{t("torres.newTower")}</h3>

                  {/* Type selector - only show for hibrido projects */}
                  {project?.tipo_proyecto === "hibrido" && (
                    <div className="mb-4">
                      <Label>{t("torres.typeLabel")}</Label>
                      <div className={cn("grid grid-cols-2 mt-1", gap.normal)}>
                        {(["torre", "urbanismo"] as const).map((tipo) => (
                          <button
                            key={tipo}
                            type="button"
                            onClick={() => {
                              setAddTipo(tipo);
                              if (!addNombre || addNombre === DEFAULTS.nombre || addNombre === "Urbanismo Principal") {
                                setAddNombre(tipo === "urbanismo" ? "Urbanismo Principal" : DEFAULTS.nombre);
                              }
                            }}
                            className={cn(
                              "flex items-center p-3 border transition-all text-left",
                              gap.relaxed,
                              radius.lg,
                              addTipo === tipo
                                ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)]"
                                : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                            )}
                          >
                            {tipo === "torre" ? <Building2 size={iconSize.md} className="text-[var(--site-primary)] shrink-0" /> : <Home size={iconSize.md} className="text-[var(--site-primary)] shrink-0" />}
                            <div>
                              <p className={cn(fontSize.md, "font-medium text-white")}>
                                {t(tipo === "torre" ? "torres.typeTorre" : "torres.typeUrbanismo")}
                              </p>
                              <p className={cn(fontSize.label, "text-[var(--text-muted)]")}>
                                {t(tipo === "torre" ? "torres.typeTorreHint" : "torres.typeUrbanismoHint")}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Helper text for non-hibrido projects */}
                  {project?.tipo_proyecto !== "hibrido" && (
                    <div className={cn("mb-3 p-2.5 bg-[rgba(var(--site-primary-rgb),0.06)] border border-[rgba(var(--site-primary-rgb),0.15)]", radius.md)}>
                      <p className={cn(fontSize.label, "text-[var(--text-secondary)]")}>
                        {project?.tipo_proyecto === "apartamentos"
                          ? t("torres.fixedTypeTorre")
                          : t("torres.fixedTypeUrbanismo")}
                      </p>
                    </div>
                  )}

                  <div
                    className={cn("grid grid-cols-[1fr_100px] items-end", gap.relaxed)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAdd();
                      }
                    }}
                  >
                    <div>
                      <Label>{t("torres.nameRequired")}</Label>
                      <input
                        type="text"
                        value={addNombre}
                        onChange={(e) => {
                          setAddNombre(e.target.value);
                          if (addNameError) setAddNameError(false);
                        }}
                        className={cn(inputClass, addNameError && "!border-red-500/60 !ring-1 !ring-red-500/30")}
                        placeholder={addTipo === "urbanismo" ? t("torres.namePlaceholderUrbanismo") : t("torres.namePlaceholder")}
                        autoFocus
                      />
                      {addNameError && (
                        <p className={cn(fontSize.label, "text-red-400 mt-1")}>{t("torres.nameError")}</p>
                      )}
                    </div>
                    <div>
                      <Label>{t("torres.prefix")}</Label>
                      <input
                        type="text"
                        value={addPrefijo}
                        onChange={(e) => setAddPrefijo(e.target.value)}
                        className={inputClass}
                        placeholder={addTipo === "urbanismo" ? "U1" : "T1"}
                      />
                    </div>
                  </div>
                  <p className={cn(fontSize.label, "text-[var(--text-muted)] mt-2")}>
                    {t("torres.addHint")}
                  </p>
                  <div className={cn("flex mt-3", gap.normal)}>
                    <button onClick={handleAdd} className={btnPrimary}>
                      <Plus size={iconSize.sm} />
                      {t("torres.createTower")}
                    </button>
                    {torres.length > 0 && (
                      <button
                        onClick={() => {
                          resetAddForm();
                          setSelectedTorreId(torres[0].id);
                        }}
                        className={btnSecondary}
                      >
                        {t("torres.cancel")}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Edit selected torre */}
            {!showAddForm && selectedTorre && (
              <motion.div
                key={"edit-" + selectedTorre.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {/* Tab bar */}
                <div className={cn("flex items-center gap-1 p-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] mb-4", radius.lg)}>
                  {([
                    { id: "info" as const, label: t("torres.tabs.info"), icon: Building2 },
                    { id: "amenidades" as const, label: t("torres.tabs.amenidades"), icon: Sparkles },
                    ...((selectedTorre.tipo ?? "torre") !== "urbanismo" ? [{ id: "fachadas" as const, label: t("torres.tabs.fachadas"), icon: Eye }] : []),
                    { id: "unidades" as const, label: t("torres.tabs.units"), icon: Package },
                  ]).map((tab) => {
                    const isActive = torreDetailTab === tab.id;
                    let count: number | null = null;
                    if (tab.id === "amenidades") count = (selectedTorre.amenidades_data ?? []).length;
                    if (tab.id === "fachadas") count = fachadasForTorre(selectedTorre.id);
                    if (tab.id === "unidades") count = unidadesForTorre(selectedTorre.id);

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setTorreDetailTab(tab.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-all",
                          fontSize.md,
                          radius.md,
                          isActive
                            ? "bg-[var(--surface-3)] text-white shadow-sm"
                            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                        )}
                      >
                        <tab.icon size={iconSize.sm - 1} />
                        {tab.label}
                        {count !== null && count > 0 && (
                          <span
                            className={cn(
                              "ml-1 px-1.5 py-0.5",
                              fontSize.label,
                              radius.full,
                              isActive
                                ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)]"
                                : "bg-[var(--surface-3)] text-[var(--text-muted)]"
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  {torreDetailTab === "info" && (
                    <motion.div
                      key={"info-" + selectedTorre.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className={sectionCard}>
                        <TorreEditFormInline
                          torre={selectedTorre}
                          projectId={projectId}
                          tipoProyecto={project?.tipo_proyecto ?? "hibrido"}
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                          deletingId={null}
                        />
                      </div>
                    </motion.div>
                  )}

                  {torreDetailTab === "amenidades" && (
                    <motion.div
                      key={"amenidades-" + selectedTorre.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <AmenidadesEditor
                        entity={selectedTorre}
                        projectId={projectId}
                        onUpdate={handleUpdate}
                      />
                    </motion.div>
                  )}

                  {torreDetailTab === "fachadas" && (
                    <motion.div
                      key={"fachadas-" + selectedTorre.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <FachadasTabContent
                        torre={selectedTorre}
                        fachadas={fachadasForTorreList(selectedTorre.id)}
                        projectId={projectId}
                      />
                    </motion.div>
                  )}

                  {torreDetailTab === "unidades" && (
                    <motion.div
                      key={"unidades-" + selectedTorre.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <UnidadesTabContent
                        torre={selectedTorre}
                        unidades={unidadesForTorreList(selectedTorre.id)}
                        tipologias={project?.tipologias ?? []}
                        projectId={projectId}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Nothing selected and not adding */}
            {!showAddForm && !selectedTorre && torres.length > 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn("flex items-center justify-center h-64 text-[var(--text-muted)]", fontSize.md)}
              >
                {t("torres.selectFromList")}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   FachadasTabContent — Fachadas summary for a selected torre
   ════════════════════════════════════════════════════════════════════ */

interface FachadasTabContentProps {
  torre: Torre;
  fachadas: Fachada[];
  projectId: string;
}

function FachadasTabContent({ torre, fachadas: fachadasList, projectId }: FachadasTabContentProps) {
  const { t } = useTranslation("editor");
  const nFachadas = fachadasList.length;
  return (
    <div className={sectionCard}>
      <h3 className={cn(fontSize.md, "font-medium text-white mb-2")}>
        {t("torres.fachadasOf", { name: torre.nombre })}
      </h3>
      <p className={cn(fontSize.md, "text-[var(--text-tertiary)] mb-4")}>
        {t("torres.fachadasCount", { count: String(nFachadas) })}
      </p>
      {fachadasList.length > 0 ? (
        <div className="space-y-2">
          {fachadasList.map((f) => (
            <div key={f.id} className={cn("flex items-center p-2.5 bg-[var(--surface-2)]", gap.relaxed, radius.md)}>
              {f.imagen_url && (
                <Image src={f.imagen_url} alt="undefined" width={400} height={300} className="w-12 h-8 rounded object-cover" />
              )}
              <span className={cn(fontSize.md, "text-[var(--text-secondary)]")}>{f.nombre}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className={cn("font-heading font-light text-[var(--text-tertiary)]", fontSize.md)}>{t("torres.noFachadas")}</p>
      )}
      <Link
        href={`/editor/${projectId}/fachadas`}
        className={cn("inline-flex items-center gap-1.5 mt-4 text-[var(--site-primary)] hover:underline", fontSize.md)}
      >
        {t("torres.goToNoddoGrid")} <ChevronRight size={iconSize.xs} />
      </Link>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   UnidadesTabContent — Unidades summary for a selected torre
   ════════════════════════════════════════════════════════════════════ */

interface UnidadesTabContentProps {
  torre: Torre;
  unidades: Unidad[];
  tipologias: { id: string; nombre: string }[];
  projectId: string;
}

function UnidadesTabContent({ torre, unidades: unidadesList, tipologias, projectId }: UnidadesTabContentProps) {
  const { t } = useTranslation("editor");
  const nUnidades = unidadesList.length;

  const getTipologiaNombre = (tipologiaId: string | null): string | null => {
    if (!tipologiaId) return null;
    const tip = tipologias.find((t) => t.id === tipologiaId);
    return tip?.nombre ?? null;
  };

  return (
    <div className={sectionCard}>
      <h3 className={cn(fontSize.md, "font-medium text-white mb-2")}>
        {t("torres.unitsOf", { name: torre.nombre })}
      </h3>
      <p className={cn(fontSize.md, "text-[var(--text-tertiary)] mb-4")}>
        {t("torres.unitsCount", { count: String(nUnidades) })}
      </p>
      {unidadesList.length > 0 ? (
        <div className="space-y-2">
          {unidadesList.map((u) => {
            const tipNombre = getTipologiaNombre(u.tipologia_id);
            return (
              <div key={u.id} className={cn("flex items-center p-2.5 bg-[var(--surface-2)]", gap.relaxed, radius.md)}>
                <span className={cn(fontSize.md, "font-medium text-white")}>{u.identificador}</span>
                {tipNombre && (
                  <span className={cn(fontSize.label, "text-[var(--text-muted)]")}>{tipNombre}</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className={cn("font-heading font-light text-[var(--text-tertiary)]", fontSize.md)}>{t("torres.noUnidades")}</p>
      )}
      <Link
        href={`/editor/${projectId}/inventario`}
        className={cn("inline-flex items-center gap-1.5 mt-4 text-[var(--site-primary)] hover:underline", fontSize.md)}
      >
        {t("torres.goToInventory")} <ChevronRight size={iconSize.xs} />
      </Link>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TorreEditFormInline — inline edit inside the Info tab of the
   detail panel, includes delete button
   ════════════════════════════════════════════════════════════════════ */

interface TorreEditFormInlineProps {
  torre: Torre;
  projectId: string;
  tipoProyecto: "apartamentos" | "casas" | "hibrido" | "lotes";
  onUpdate: (torreId: string, data: Partial<Torre>) => Promise<void>;
  onDelete: (torreId: string) => Promise<void>;
  deletingId: string | null;
}

function TorreEditFormInline({
  torre,
  projectId,
  tipoProyecto,
  onUpdate,
  onDelete,
  deletingId,
}: TorreEditFormInlineProps) {
  const { t } = useTranslation("editor");
  const { t: tTooltips } = useTranslation("tooltips");

  // Controlled state synced from torre prop
  const [nombre, setNombre] = useState(torre.nombre);
  const [prefijo, setPrefijo] = useState(torre.prefijo ?? "");
  const [caracteristicas, setCaracteristicas] = useState(torre.caracteristicas ?? "");
  const [descripcion, setDescripcion] = useState(torre.descripcion ?? "");
  const [pisosSotano, setPisosSotano] = useState(torre.pisos_sotano != null ? String(torre.pisos_sotano) : "");
  const [pisosPlantaBaja, setPisosPlantaBaja] = useState(torre.pisos_planta_baja != null ? String(torre.pisos_planta_baja) : "");
  const [pisosPodio, setPisosPodio] = useState(torre.pisos_podio != null ? String(torre.pisos_podio) : "");
  const [pisosResidenciales, setPisosResidenciales] = useState(torre.pisos_residenciales != null ? String(torre.pisos_residenciales) : "");
  const [pisosRooftop, setPisosRooftop] = useState(torre.pisos_rooftop != null ? String(torre.pisos_rooftop) : "");
  const [typeSwitching, setTypeSwitching] = useState(false);

  // Sync from prop only when switching to a different torre
  useEffect(() => {
    setNombre(torre.nombre);
    setPrefijo(torre.prefijo ?? "");
    setCaracteristicas(torre.caracteristicas ?? "");
    setDescripcion(torre.descripcion ?? "");
    setPisosSotano(torre.pisos_sotano != null ? String(torre.pisos_sotano) : "");
    setPisosPlantaBaja(torre.pisos_planta_baja != null ? String(torre.pisos_planta_baja) : "");
    setPisosPodio(torre.pisos_podio != null ? String(torre.pisos_podio) : "");
    setPisosResidenciales(torre.pisos_residenciales != null ? String(torre.pisos_residenciales) : "");
    setPisosRooftop(torre.pisos_rooftop != null ? String(torre.pisos_rooftop) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [torre.id]);

  const compositionFields = [
    { key: "pisos_sotano" as const, label: t("torres.floorTypes.basement"), placeholder: "0", value: pisosSotano, setter: setPisosSotano },
    { key: "pisos_planta_baja" as const, label: t("torres.floorTypes.groundFloor"), placeholder: "1", value: pisosPlantaBaja, setter: setPisosPlantaBaja },
    { key: "pisos_podio" as const, label: t("torres.floorTypes.podium"), placeholder: "0", value: pisosPodio, setter: setPisosPodio },
    { key: "pisos_residenciales" as const, label: t("torres.floorTypes.residential"), placeholder: "0", value: pisosResidenciales, setter: setPisosResidenciales },
    { key: "pisos_rooftop" as const, label: t("torres.floorTypes.rooftop"), placeholder: "0", value: pisosRooftop, setter: setPisosRooftop },
  ];

  return (
    <div className="space-y-4">
      {/* Type badge — only show toggle for hibrido projects */}
      <div className={cn("flex items-center", gap.normal)}>
        {(["torre", "urbanismo"] as const).filter((tipo) => {
          if (tipoProyecto === "apartamentos") return tipo === "torre";
          if (tipoProyecto === "casas" || tipoProyecto === "lotes") return tipo === "urbanismo";
          return true; // hibrido: both
        }).map((tipo) => {
          const isActive = (torre.tipo ?? "torre") === tipo;
          return (
            <button
              key={tipo}
              disabled={typeSwitching}
              onClick={async () => {
                if (!isActive && !typeSwitching) {
                  setTypeSwitching(true);
                  try {
                    await onUpdate(torre.id, { tipo });
                  } finally {
                    setTypeSwitching(false);
                  }
                }
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 font-medium transition-all border",
                fontSize.md,
                radius.md,
                isActive
                  ? "bg-[rgba(var(--site-primary-rgb),0.1)] border-[rgba(var(--site-primary-rgb),0.3)] text-[var(--site-primary)]"
                  : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]",
                typeSwitching && "opacity-60 pointer-events-none"
              )}
            >
              {typeSwitching && !isActive ? (
                <Loader2 size={iconSize.xs} className="animate-spin" />
              ) : (
                tipo === "torre" ? <Building2 size={iconSize.xs} /> : <Home size={iconSize.xs} />
              )}
              {t(tipo === "torre" ? "torres.typeTorre" : "torres.typeUrbanismo")}
            </button>
          );
        })}
      </div>

      {/* Row 1: Nombre */}
      <div>
        <Label>{t("torres.infoForm.name")} <InfoTooltip content={tTooltips("torres.nombre.short")} variant="dashboard" /></Label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={(e) => {
            if (e.target.value !== torre.nombre) {
              onUpdate(torre.id, { nombre: e.target.value });
            }
          }}
          className={inputClass}
        />
      </div>

      {/* Composición del edificio — only for torre type */}
      {(torre.tipo ?? "torre") !== "urbanismo" && <div>
        <Label>{t("torres.infoForm.buildingComposition")}</Label>
        <div className={cn("grid grid-cols-5 mt-1", gap.relaxed)}>
          {compositionFields.map((field) => (
            <div key={field.key} className="text-center">
              <p className={cn(fontSize.label, "text-[var(--text-tertiary)] mb-1")}>{field.label}</p>
              <input
                type="number"
                min={0}
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                onBlur={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                  if (val !== torre[field.key]) {
                    onUpdate(torre.id, { [field.key]: val });
                  }
                }}
                className={inputClass + " text-center"}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        {/* Visual composition bar */}
        {(() => {
          const s = pisosSotano ? parseInt(pisosSotano) || 0 : 0;
          const pb = pisosPlantaBaja ? parseInt(pisosPlantaBaja) || 0 : 0;
          const pod = pisosPodio ? parseInt(pisosPodio) || 0 : 0;
          const res = pisosResidenciales ? parseInt(pisosResidenciales) || 0 : 0;
          const rt = pisosRooftop ? parseInt(pisosRooftop) || 0 : 0;
          const total = s + pb + pod + res + rt;
          if (total === 0) return null;

          const sections = [
            { label: t("torres.floorTypes.rooftop"), count: rt, color: "bg-amber-400/70", text: "text-amber-300" },
            { label: t("torres.floorTypes.residential"), count: res, color: "bg-[rgba(var(--site-primary-rgb),0.5)]", text: "text-[var(--site-primary)]" },
            { label: t("torres.floorTypes.podium"), count: pod, color: "bg-blue-400/30", text: "text-blue-300" },
            { label: t("torres.floorTypes.groundFloorShort"), count: pb, color: "bg-emerald-400/30", text: "text-emerald-300" },
            { label: t("torres.floorTypes.basementSingle"), count: s, color: "bg-white/8", text: "text-[var(--text-muted)]" },
          ].filter((sec) => sec.count > 0);

          return (
            <div className={cn("mt-3 flex items-stretch", gap.relaxed)}>
              {/* Stacked bar */}
              <div className={cn("w-10 flex flex-col-reverse overflow-hidden border border-[var(--border-subtle)]", radius.md)} style={{ height: Math.min(total * 8 + 16, 140) }}>
                {sections.slice().reverse().map((sec) => (
                  <div
                    key={sec.label}
                    className={cn(sec.color, "w-full transition-all")}
                    style={{ flex: sec.count }}
                  />
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-col justify-center gap-1">
                {sections.map((sec) => (
                  <div key={sec.label} className={cn("flex items-center", gap.normal)}>
                    <div className={cn("w-2.5 h-2.5 rounded-sm", sec.color)} />
                    <span className={cn(fontSize.label, "text-[var(--text-tertiary)]")}>{sec.label}</span>
                    <span className={cn(fontSize.label, "font-medium", sec.text)}>{sec.count}</span>
                  </div>
                ))}
                <div className="border-t border-[var(--border-subtle)] mt-1 pt-1">
                  <span className={cn(fontSize.label, "text-[var(--text-secondary)] font-medium")}>{t("torres.floorTypes.total", { count: String(total) })}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>}

      {/* Row: Prefijo */}
      <div>
        <Label>{t("torres.infoForm.prefix")}</Label>
        <input
          type="text"
          value={prefijo}
          onChange={(e) => setPrefijo(e.target.value)}
          onBlur={(e) => {
            const val = e.target.value.trim() || null;
            if (val !== (torre.prefijo ?? null)) {
              onUpdate(torre.id, { prefijo: val });
            }
          }}
          className={inputClass}
          placeholder={t("torres.infoForm.prefixPlaceholder")}
        />
        <p className={cn(fontSize.label, "text-[var(--text-muted)] mt-1")}>{t("torres.infoForm.prefixHint")}</p>
      </div>

      {/* Características */}
      <div>
        <Label>{t("torres.infoForm.features")}</Label>
        <input
          type="text"
          value={caracteristicas}
          onChange={(e) => setCaracteristicas(e.target.value)}
          onBlur={(e) => {
            const val = e.target.value.trim() || null;
            if (val !== torre.caracteristicas) {
              onUpdate(torre.id, { caracteristicas: val });
            }
          }}
          className={inputClass}
          placeholder={t("torres.infoForm.featuresPlaceholder")}
        />
      </div>

      {/* Row 4: Descripción */}
      <div>
        <Label>{t("torres.infoForm.description")} <InfoTooltip content={tTooltips("torres.descripcion.short")} variant="dashboard" /></Label>
        <AITextImprover
          value={descripcion}
          onChange={(newValue) => {
            setDescripcion(newValue);
            const val = newValue.trim() || null;
            if (val !== torre.descripcion) {
              onUpdate(torre.id, { descripcion: val });
            }
          }}
          rows={3}
          placeholder={t((torre.tipo ?? "torre") === "urbanismo" ? "torres.infoForm.descriptionPlaceholderUrbanismo" : "torres.infoForm.descriptionPlaceholder")}
          maxLength={5000}
        />
      </div>

      {/* Row 5: Imagen de portada + Logo */}
      <div className={cn("grid grid-cols-2", gap.loose)}>
        <div>
          <Label>{t("torres.infoForm.coverImage")} <InfoTooltip content={tTooltips("torres.imagenUrl.short")} variant="dashboard" /></Label>
          <FileUploader
            currentUrl={torre.imagen_portada || null}
            onUpload={(url) =>
              onUpdate(torre.id, { imagen_portada: url })
            }
            folder={`proyectos/${projectId}/torres`}
            label={t("torres.infoForm.uploadImage")}
          />
        </div>
        <div>
          <Label>{t("torres.infoForm.logo")}</Label>
          <FileUploader
            currentUrl={torre.logo_url || null}
            onUpload={(url) => onUpdate(torre.id, { logo_url: url })}
            folder={`proyectos/${projectId}/torres`}
            label={t("torres.infoForm.uploadLogo")}
            aspect="logo"
            compact
          />
        </div>
      </div>

      {/* Delete button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => onDelete(torre.id)}
          disabled={deletingId === torre.id}
          className={btnDanger}
        >
          {deletingId === torre.id ? (
            <Loader2 size={iconSize.xs} className="animate-spin" />
          ) : (
            <Trash2 size={iconSize.xs} />
          )}
          {t("torres.infoForm.deleteTower")}
        </button>
      </div>
    </div>
  );
}

