"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  inputClass,
  btnPrimary,
  btnSecondary,
} from "@/components/dashboard/editor-styles";
import { fontSize, gap, letterSpacing, radius, iconSize, lineHeight } from "@/lib/design-tokens";
import { Label } from "@/components/ui";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { HotspotEditor } from "@/components/dashboard/HotspotEditor";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Loader2,
  Trash2,
  X,
  MousePointerClick,
  Layers,
  Building2,
  Copy,
  Maximize,
  Palmtree,
  LayoutGrid,
  BedDouble,
  Bath,
  Car,
  Archive,
  DollarSign,
  Home,
  MapPin,
  Ruler,
  LandPlot,
  ClipboardCopy,
  ChevronDown,
  FileText,
  Map,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useTranslation } from "@/i18n";
import type { Tipologia, TipologiaHotspot, TipologiaPiso, TipoTipologia, Currency } from "@/types";
import { resolvePisos } from "@/lib/piso-utils";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import { PriceAuditBadge } from "@/components/dashboard/PriceAuditBadge";
import { deriveTipoTipologia, getInventoryColumns, getHybridInventoryColumns } from "@/lib/inventory-columns";
import { AITextImprover } from "@/components/dashboard/AITextImprover";
import { tipologiaSchema } from "@/lib/validation/schemas";
import { InlineError } from "@/components/ui/ErrorBoundary";
import { ZodError } from "zod";
import { useAutoSave } from "@/hooks/useAutoSave";
import { AutoSaveIndicator } from "@/components/dashboard/AutoSaveIndicator";

/* ─── Form types ─── */

interface TipoForm {
  nombre: string;
  descripcion: string;
  area_m2: string;
  area_construida: string;
  area_privada: string;
  area_lote: string;
  habitaciones: string;
  banos: string;
  precio_desde: string;
  plano_url: string;
  renders: string[];
  caracteristicas: string[];
  parqueaderos: string;
  depositos: string;
  area_balcon: string;
  hotspots: TipologiaHotspot[];
  pisos: TipologiaPiso[];
  ubicacion_plano_url: string;
  torre_ids: string[];
  tipo_tipologia: TipoTipologia | "";
}

const emptyTipologia: TipoForm = {
  nombre: "",
  descripcion: "",
  area_m2: "",
  area_construida: "",
  area_privada: "",
  area_lote: "",
  habitaciones: "",
  banos: "",
  precio_desde: "",
  plano_url: "",
  renders: [],
  caracteristicas: [],
  parqueaderos: "",
  depositos: "",
  area_balcon: "",
  hotspots: [],
  pisos: [],
  ubicacion_plano_url: "",
  torre_ids: [],
  tipo_tipologia: "",
};

function tipologiaToForm(t: Tipologia): TipoForm {
  const resolved = resolvePisos(t);
  const pisos = resolved.map((p) => ({
    ...p,
    id: p.id === "legacy-piso-0" ? crypto.randomUUID() : p.id,
  }));
  return {
    nombre: t.nombre,
    descripcion: t.descripcion || "",
    area_m2: t.area_m2 != null ? String(t.area_m2) : "",
    area_construida: t.area_construida != null ? String(t.area_construida) : "",
    area_privada: t.area_privada != null ? String(t.area_privada) : "",
    area_lote: t.area_lote != null ? String(t.area_lote) : "",
    habitaciones: t.habitaciones != null ? String(t.habitaciones) : "",
    banos: t.banos != null ? String(t.banos) : "",
    precio_desde: t.precio_desde != null ? String(t.precio_desde) : "",
    plano_url: t.plano_url || "",
    renders: t.renders || [],
    caracteristicas: t.caracteristicas || [],
    parqueaderos: t.parqueaderos != null ? String(t.parqueaderos) : "",
    depositos: t.depositos != null ? String(t.depositos) : "",
    area_balcon: t.area_balcon != null ? String(t.area_balcon) : "",
    hotspots: t.hotspots || [],
    pisos,
    ubicacion_plano_url: t.ubicacion_plano_url || "",
    torre_ids: t.torre_ids || [],
    tipo_tipologia: t.tipo_tipologia || "",
  };
}

function parseOptionalNumber(val: string): number | null {
  if (!val.trim()) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

/* ─── Copy hotspots dropdown ─── */

function CopyHotspotsDropdown({
  tipologias,
  currentId,
  currentHotspotCount,
  onCopy,
}: {
  tipologias: Tipologia[];
  currentId: string | null;
  currentHotspotCount: number;
  onCopy: (hotspots: TipologiaHotspot[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const { confirm } = useConfirm();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const sources = tipologias.filter(
    (t) => t.id !== currentId && t.hotspots && t.hotspots.length > 0
  );

  if (sources.length === 0) return null;

  const handleSelect = async (source: Tipologia) => {
    setOpen(false);
    if (
      currentHotspotCount > 0 &&
      !(await confirm({
        title: "Copiar hotspots",
        message: `Esto reemplazará los ${currentHotspotCount} hotspots actuales con los ${source.hotspots.length} de "${source.nombre}". ¿Continuar?`,
      }))
    ) {
      return;
    }
    if (
      currentHotspotCount === 0 &&
      !(await confirm({
        title: "Copiar hotspots",
        message: `Se copiarán ${source.hotspots.length} hotspots de "${source.nombre}". ¿Continuar?`,
      }))
    ) {
      return;
    }
    const copied = source.hotspots.map((h) => ({
      ...h,
      id: crypto.randomUUID(),
    }));
    onCopy(copied);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center px-2.5 py-1.5 font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-all border border-[var(--border-subtle)]",
          gap.normal,
          fontSize.body,
          radius.md
        )}
      >
        <ClipboardCopy size={iconSize.xs} />
        Copiar de otra tipología
        <ChevronDown size={10} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute left-0 top-full mt-1 z-30 w-64 bg-[var(--surface-2)] border border-[var(--border-default)] shadow-xl overflow-hidden",
              radius.xl
            )}
          >
            <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
              <p className={cn(
                "text-[var(--text-muted)] uppercase font-bold",
                fontSize.label,
                letterSpacing.wider
              )}>
                Tipologías con hotspots
              </p>
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {sources.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 hover:bg-[var(--surface-3)] transition-colors text-left",
                    gap.relaxed
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 bg-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center text-[var(--site-primary)] font-bold shrink-0",
                    fontSize.caption,
                    radius.full
                  )}>
                    {t.hotspots.length}
                  </span>
                  <span className={cn(
                    "text-[var(--text-secondary)] truncate",
                    fontSize.subtitle
                  )}>
                    {t.nombre}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Tabs ─── */

type TipoTab = "general" | "plano" | "hotspots";

/* ─── Page ─── */

export default function TipologiasPage() {
  const { project, refresh, projectId } = useEditorProject();
  const toast = useToast();
  const { confirm } = useConfirm();
  const { t } = useTranslation("editor");

  const TIPO_TABS: { id: TipoTab; label: string; icon: LucideIcon }[] = [
    { id: "general", label: t("tipologias.tabs.general"), icon: FileText },
    { id: "plano", label: t("tipologias.tabs.floorPlan"), icon: Map },
    { id: "hotspots", label: t("tipologias.tabs.hotspots"), icon: MousePointerClick },
  ];

  const tipologias = useMemo(() => project.tipologias || [], [project.tipologias]);
  const unidades = useMemo(() => project.unidades || [], [project.unidades]);
  const torres = useMemo(() => project.torres || [], [project.torres]);
  const isMultiTorre = torres.length > 1;
  const torresLabel = project.tipo_proyecto === "apartamentos" ? "Torres" : "Etapas";
  const isHibrido = project.tipo_proyecto === "hibrido";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<TipoForm>({ ...emptyTipologia });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [caracInput, setCaracInput] = useState("");
  const [activeTab, setActiveTab] = useState<TipoTab>("general");
  const [activeTorreId, setActiveTorreId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activePisoIndex, setActivePisoIndex] = useState(0);

  /* ─── Build payload helper ─── */
  const buildPayload = useCallback(() => ({
    nombre: form.nombre,
    descripcion: form.descripcion || null,
    area_m2: parseOptionalNumber(form.area_m2),
    area_construida: parseOptionalNumber(form.area_construida),
    area_privada: parseOptionalNumber(form.area_privada),
    area_lote: parseOptionalNumber(form.area_lote),
    habitaciones: parseOptionalNumber(form.habitaciones),
    banos: parseOptionalNumber(form.banos),
    precio_desde: parseOptionalNumber(form.precio_desde),
    plano_url: form.pisos.length > 0 ? (form.pisos[0].plano_url || null) : (form.plano_url || null),
    renders: form.renders.filter((r) => r),
    caracteristicas: form.caracteristicas,
    parqueaderos: parseOptionalNumber(form.parqueaderos),
    depositos: parseOptionalNumber(form.depositos),
    area_balcon: parseOptionalNumber(form.area_balcon),
    hotspots: form.pisos.length > 0 ? form.pisos[0].hotspots : form.hotspots,
    pisos: form.pisos.length > 0 ? form.pisos : null,
    ubicacion_plano_url: form.ubicacion_plano_url || null,
    torre_ids: isMultiTorre ? form.torre_ids : [],
    tipo_tipologia: isHibrido
      ? (form.tipo_tipologia || null)
      : deriveTipoTipologia(project.tipo_proyecto),
  }), [form, isMultiTorre, isHibrido, project.tipo_proyecto]);

  /* ─── Auto-save function ─── */
  const performSave = useCallback(async () => {
    const payload = buildPayload();

    // Validate
    tipologiaSchema.parse(payload);

    if (selectedId && !isCreating) {
      // Update existing
      const res = await fetch(`/api/tipologias/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }

      await refresh();
    } else if (isCreating) {
      // Create new
      const res = await fetch("/api/tipologias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyecto_id: projectId, ...payload }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }

      const created = await res.json();
      await refresh();

      // Select the newly created tipologia
      if (created?.id) {
        setSelectedId(created.id);
        setIsCreating(false);
      }
    }
  }, [buildPayload, selectedId, isCreating, projectId, refresh]);

  /* ─── Auto-save hook ─── */
  const { status: autoSaveStatus } = useAutoSave({
    data: form,
    onSave: performSave,
    delay: 1500,
    shouldSave: (data) => {
      // Only auto-save if we have a valid name
      if (!data.nombre.trim()) return false;
      // Only auto-save if we're editing an existing tipologia or creating a new one
      if (!selectedId && !isCreating) return false;
      return true;
    },
    onSaveError: (error) => {
      if (error instanceof ZodError) {
        setValidationError(error.issues[0]?.message || "Error de validación");
        toast.error(error.issues[0]?.message || "Error de validación");
      } else {
        toast.error("Error al guardar: " + error.message);
      }
    },
  });

  const filteredTipologias = useMemo(() => {
    if (!isMultiTorre || activeTorreId === null) return tipologias;
    if (activeTorreId === "__none__") return tipologias.filter(t => !t.torre_ids || t.torre_ids.length === 0);
    return tipologias.filter(t => t.torre_ids?.includes(activeTorreId));
  }, [tipologias, isMultiTorre, activeTorreId]);

  /* Auto-select first tipologia on mount or when list changes */
  useEffect(() => {
    if (tipologias.length > 0 && !selectedId && !isCreating) {
      selectTipologia(tipologias[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipologias.length]);

  /* Reset selection when torre filter changes */
  useEffect(() => {
    setIsCreating(false);
    if (filteredTipologias.length > 0) {
      selectTipologia(filteredTipologias[0]);
    } else {
      setSelectedId(null);
      setForm({ ...emptyTipologia });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTorreId]);

  const selectTipologia = useCallback((t: Tipologia) => {
    setSelectedId(t.id);
    setIsCreating(false);
    setForm(tipologiaToForm(t));
    setCaracInput("");
    setActiveTab("general");
    setActivePisoIndex(0);
  }, []);

  const startCreating = () => {
    setSelectedId(null);
    setIsCreating(true);
    setForm({ ...emptyTipologia, torre_ids: activeTorreId && activeTorreId !== "__none__" ? [activeTorreId] : [] });
    setCaracInput("");
    setActiveTab("general");
  };

  const updateForm = (field: keyof TipoForm, value: string | string[] | TipologiaHotspot[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCaracKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = caracInput.trim();
      if (val && !form.caracteristicas.includes(val)) {
        updateForm("caracteristicas", [...form.caracteristicas, val]);
      }
      setCaracInput("");
    }
  };

  const removeCaracteristica = (idx: number) => {
    updateForm("caracteristicas", form.caracteristicas.filter((_, i) => i !== idx));
  };

  /* ─── Floor (piso) helpers ─── */

  const addFloor = () => {
    const newPiso: TipologiaPiso = {
      id: crypto.randomUUID(),
      nombre: `Piso ${form.pisos.length + 1}`,
      plano_url: "",
      hotspots: [],
      orden: form.pisos.length,
    };
    setForm((prev) => ({ ...prev, pisos: [...prev.pisos, newPiso] }));
    setActivePisoIndex(form.pisos.length);
  };

  const removeFloor = async (index: number) => {
    if (
      !(await confirm({
        title: t("tipologias.removeFloor"),
        message: t("tipologias.removeFloorConfirm"),
      }))
    )
      return;
    setForm((prev) => ({
      ...prev,
      pisos: prev.pisos.filter((_, i) => i !== index).map((p, i) => ({ ...p, orden: i })),
    }));
    setActivePisoIndex((prev) => Math.max(0, prev >= index ? prev - 1 : prev));
  };

  const updatePiso = (index: number, updates: Partial<TipologiaPiso>) => {
    setForm((prev) => ({
      ...prev,
      pisos: prev.pisos.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    }));
  };

  /* Compute cheapest available unit price for selected tipologia */
  const computedPrecioDesde = useMemo(() => {
    if (!selectedId) return "";
    const tipoUnits = unidades.filter(
      (u) => u.tipologia_id === selectedId && u.estado === "disponible" && u.precio != null
    );
    if (tipoUnits.length === 0) return "";
    const min = Math.min(...tipoUnits.map((u) => u.precio!));
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(min);
  }, [selectedId, unidades]);

  const effectiveColumns = useMemo(() => {
    if (isHibrido && form.tipo_tipologia) {
      return getHybridInventoryColumns(form.tipo_tipologia as "apartamento" | "casa" | "lote", project.inventory_columns_by_type);
    }
    return getInventoryColumns(project.tipo_proyecto ?? "hibrido", project.inventory_columns);
  }, [isHibrido, form.tipo_tipologia, project.tipo_proyecto, project.inventory_columns, project.inventory_columns_by_type]);


  const handleDelete = async (id: string) => {
    const tip = tipologias.find((t) => t.id === id);
    if (!tip) return;
    const nUnits = unidades.filter((u) => u.tipologia_id === id).length;
    if (!(await confirm({
      title: "Eliminar tipología",
      message: "Esta acción no se puede deshacer.",
      description: tip.nombre,
      details: nUnits > 0 ? `${nUnits} unidades perderán su tipología asignada` : undefined,
      typeToConfirm: tip.nombre,
    }))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/tipologias/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Error al eliminar tipología");
        return;
      }
      await refresh();
      // Select next tipologia
      if (selectedId === id) {
        const remaining = filteredTipologias.filter((t) => t.id !== id);
        if (remaining.length > 0) {
          selectTipologia(remaining[0]);
        } else {
          setSelectedId(null);
          setForm({ ...emptyTipologia });
        }
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (tip: Tipologia) => {
    if (!(await confirm({ title: t("tipologias.duplicateTitle"), message: t("tipologias.duplicateConfirm") }))) return;
    setDuplicatingId(tip.id);
    try {
      const payload = {
        proyecto_id: projectId,
        nombre: `${tip.nombre} (copia)`,
        descripcion: tip.descripcion || null,
        area_m2: tip.area_m2,
        area_construida: tip.area_construida,
        area_privada: tip.area_privada,
        area_lote: tip.area_lote,
        habitaciones: tip.habitaciones,
        banos: tip.banos,
        precio_desde: tip.precio_desde,
        plano_url: tip.plano_url || null,
        renders: tip.renders || [],
        caracteristicas: tip.caracteristicas || [],
        parqueaderos: tip.parqueaderos,
        depositos: tip.depositos,
        area_balcon: tip.area_balcon,
        hotspots: tip.hotspots || [],
        pisos: tip.pisos || null,
        ubicacion_plano_url: tip.ubicacion_plano_url || null,
        torre_ids: tip.torre_ids || [],
      };
      const res = await fetch("/api/tipologias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        await refresh();
        if (created?.id) {
          setSelectedId(created.id);
          setIsCreating(false);
          setForm(tipologiaToForm(created));
        }
        toast.success(t("tipologias.duplicated"));
      } else {
        toast.error(t("tipologias.duplicateError"));
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDuplicatingId(null);
    }
  };

  const hasEditor = selectedId || isCreating;

  /* ─── Empty state ─── */
  if (tipologias.length === 0 && !isCreating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <DashboardEmptyState
          variant="tipologias"
          title={t("tipologias.noTypes")}
          description={t("tipologias.createFirst")}
        >
          <button onClick={startCreating} className={btnPrimary}>
            <Plus size={iconSize.sm} />
            {t("tipologias.createFirstButton")}
          </button>
        </DashboardEmptyState>
      </motion.div>
    );
  }

  /* ─── 3-Panel Layout ─── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={isMultiTorre ? "h-[calc(100vh-96px)] min-h-[500px] flex flex-col" : "h-[calc(100vh-96px)] min-h-[500px]"}
    >
      {/* ═══ TORRE TABS ═══ */}
      {isMultiTorre && (
        <div className={cn(
          "flex items-center p-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] mb-4",
          gap.compact,
          radius.xl
        )}>
          <button
            onClick={() => setActiveTorreId(null)}
            className={cn(
              "flex items-center px-3 py-1.5 font-medium transition-all",
              gap.normal,
              fontSize.subtitle,
              radius.md,
              activeTorreId === null
                ? "bg-[var(--surface-3)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            )}
          >
            {t("tipologias.all")}
            <span className={cn(
              "ml-1 px-1.5 py-0.5 bg-[var(--surface-3)] text-[var(--text-muted)]",
              fontSize.label,
              radius.full
            )}>
              {tipologias.length}
            </span>
          </button>
          {torres.map((t) => {
            const count = tipologias.filter(tip => tip.torre_ids?.includes(t.id)).length;
            return (
              <button key={t.id} onClick={() => setActiveTorreId(t.id)}
                className={cn(
                  "flex items-center px-3 py-1.5 font-medium transition-all",
                  gap.normal,
                  fontSize.subtitle,
                  radius.md,
                  activeTorreId === t.id
                    ? "bg-[var(--surface-3)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
              >
                <Building2 size={iconSize.sm} />
                {t.nombre}
                {count > 0 && (
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 bg-[var(--surface-3)] text-[var(--text-muted)]",
                    fontSize.label,
                    radius.full
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          {tipologias.some(t => !t.torre_ids || t.torre_ids.length === 0) && (
            <button onClick={() => setActiveTorreId("__none__")}
              className={cn(
                "flex items-center px-3 py-1.5 font-medium transition-all",
                gap.normal,
                fontSize.subtitle,
                radius.md,
                activeTorreId === "__none__"
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
            >
              {t("tipologias.noTower")}
              <span className={cn(
                "ml-1 px-1.5 py-0.5 bg-[var(--surface-3)] text-[var(--text-muted)]",
                fontSize.label,
                radius.full
              )}>
                {tipologias.filter(t => !t.torre_ids || t.torre_ids.length === 0).length}
              </span>
            </button>
          )}
        </div>
      )}

      <div className={cn("rounded-xl border border-[var(--border-subtle)] overflow-hidden flex", isMultiTorre ? "flex-1 min-h-0" : "h-full")}>
        {/* ═══ LEFT PANEL: Tipologias List ═══ */}
        <div className="w-[220px] shrink-0 bg-[var(--surface-1)] border-r border-[var(--border-subtle)] flex flex-col">
          {/* List header */}
          <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center", gap.normal)}>
                <Layers size={iconSize.sm} className="text-[var(--site-primary)]" />
                <span className={cn(
                  "font-medium text-[var(--text-secondary)]",
                  fontSize.subtitle
                )}>
                  {t("tipologias.listTitle")}
                </span>
              </div>
              <span className={cn(
                "text-[var(--text-muted)]",
                fontSize.label
              )}>
                {filteredTipologias.length}
              </span>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto py-1">
            {filteredTipologias.map((t) => (
              <div
                key={t.id}
                onClick={() => selectTipologia(t)}
                className={cn(
                  "w-full text-left px-3 py-2.5 transition-all group relative cursor-pointer",
                  selectedId === t.id && !isCreating
                    ? "bg-[var(--surface-3)] border-l-2 border-l-[var(--site-primary)]"
                    : "border-l-2 border-l-transparent hover:bg-[var(--surface-2)]"
                )}
              >
                <p
                  className={cn(
                    "font-medium truncate",
                    fontSize.base,
                    selectedId === t.id && !isCreating
                      ? "text-white"
                      : "text-[var(--text-secondary)]"
                  )}
                >
                  {t.nombre}
                </p>
                <div className={cn(
                  "flex items-center mt-0.5 text-[var(--text-muted)]",
                  gap.normal,
                  fontSize.label
                )}>
                  {t.area_m2 != null && <span>{t.area_m2}m²</span>}
                  {t.habitaciones != null && <span>{t.habitaciones} hab</span>}
                  {t.banos != null && <span>{t.banos} baños</span>}
                </div>

                {/* Action buttons — visible on hover */}
                <div className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity",
                  gap.compact
                )}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(t);
                    }}
                    disabled={duplicatingId === t.id}
                    title="Duplicar"
                  >
                    {duplicatingId === t.id ? (
                      <Loader2 size={iconSize.xs} className="animate-spin text-[var(--text-muted)]" />
                    ) : (
                      <Copy size={iconSize.xs} className="text-[var(--text-muted)] hover:text-[var(--site-primary)]" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(t.id);
                    }}
                    disabled={deletingId === t.id}
                  >
                    {deletingId === t.id ? (
                      <Loader2 size={iconSize.xs} className="animate-spin text-[var(--text-muted)]" />
                    ) : (
                      <Trash2 size={iconSize.xs} className="text-[var(--text-muted)] hover:text-red-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}

            {/* "Creating new" item */}
            {isCreating && (
              <div className="px-3 py-2.5 bg-[var(--surface-3)] border-l-2 border-l-[var(--site-primary)]">
                <p className={cn(
                  "font-medium text-[var(--site-primary)]",
                  fontSize.base
                )}>
                  + {t("tipologias.newType")}
                </p>
              </div>
            )}
          </div>

          {/* Add button */}
          <div className="p-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={startCreating}
              className={cn(
                "w-full flex items-center justify-center px-3 py-2 font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-all border border-[var(--border-subtle)]",
                gap.normal,
                fontSize.subtitle,
                radius.md
              )}
            >
              <Plus size={iconSize.xs} />
              {t("tipologias.newType")}
            </button>
          </div>
        </div>

        {/* ═══ CENTER PANEL: Tab Content ═══ */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--surface-0)]">
          {hasEditor ? (
            <>
              {/* Header + Horizontal Tabs */}
              <div className="shrink-0 border-b border-[var(--border-subtle)]">
                {/* Title row */}
                <div className="px-6 pt-3 pb-2 flex items-center justify-between">
                  <h3 className={cn(
                    "font-medium text-[var(--text-secondary)] truncate",
                    fontSize.md
                  )}>
                    {isCreating ? t("tipologias.newType") : form.nombre || "—"}
                  </h3>
                  <div className={cn("flex items-center", gap.normal)}>
                    {/* Auto-save indicator */}
                    {(selectedId || isCreating) && form.nombre.trim() && (
                      <AutoSaveIndicator status={autoSaveStatus} />
                    )}
                    {isCreating && (
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          if (filteredTipologias.length > 0) selectTipologia(filteredTipologias[0]);
                        }}
                        className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                      >
                        <X size={iconSize.md} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tab bar */}
                <div className={cn("px-6 flex", gap.compact)}>
                  {TIPO_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const hasPlano = form.pisos.some((p) => !!p.plano_url);
                    const hotspotCount = form.pisos.reduce((sum, p) => sum + p.hotspots.length, 0);
                    const TabIcon = tab.icon;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "px-4 py-2 font-medium rounded-t-lg transition-all flex items-center",
                          fontSize.subtitle,
                          gap.normal,
                          isActive
                            ? "bg-[var(--site-primary)] text-black"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                        )}
                      >
                        <TabIcon size={iconSize.sm} />
                        {tab.label}
                        {tab.id === "hotspots" && hotspotCount > 0 && (
                          <span
                            className={cn(
                              "px-1.5 py-px leading-tight",
                              fontSize.caption,
                              radius.full,
                              isActive
                                ? "bg-black/20 text-black"
                                : "bg-[rgba(var(--site-primary-rgb),0.2)] text-[var(--site-primary)]"
                            )}
                          >
                            {hotspotCount}
                          </span>
                        )}
                        {tab.id === "plano" && hasPlano && (
                          <span
                            className={cn(
                              "w-1.5 h-1.5",
                              radius.full,
                              isActive ? "bg-black/40" : "bg-[var(--site-primary)]"
                            )}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab content — scrollable (reduced padding for hotspots) */}
              <div className={cn(
                "flex-1 min-h-0",
                activeTab === "hotspots" ? "px-3 py-3" : "px-6 py-5 overflow-y-auto"
              )}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className={activeTab === "hotspots" ? "h-full" : "space-y-4"}
                  >
                    {/* ── TAB: General ── */}
                    {activeTab === "general" && (
                      <>
                        <div>
                          <Label>{t("tipologias.nameRequired")}</Label>
                          <input
                            type="text"
                            value={form.nombre}
                            onChange={(e) => updateForm("nombre", e.target.value)}
                            placeholder={t("tipologias.namePlaceholder")}
                            className={inputClass}
                          />
                        </div>
                        {isHibrido && (
                          <div>
                            <Label>{t("tipologias.tipoTipologia")}</Label>
                            <div className={cn("grid grid-cols-3 mt-1", gap.normal)}>
                              {([
                                { id: "apartamento" as const, icon: Building2, labelKey: "tipologias.tipoApartamento" },
                                { id: "casa" as const, icon: Home, labelKey: "tipologias.tipoCasa" },
                                { id: "lote" as const, icon: MapPin, labelKey: "tipologias.tipoLote" },
                              ] as const).map((tipo) => {
                                const isActive = form.tipo_tipologia === tipo.id;
                                const Icon = tipo.icon;
                                return (
                                  <button
                                    key={tipo.id}
                                    type="button"
                                    onClick={() => updateForm("tipo_tipologia", tipo.id)}
                                    className={cn(
                                      "flex items-center px-3 py-2 border transition-all text-left",
                                      gap.normal,
                                      fontSize.subtitle,
                                      radius.md,
                                      isActive
                                        ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)] text-white"
                                        : "bg-[var(--surface-1)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-default)]"
                                    )}
                                  >
                                    <Icon size={iconSize.sm} className={isActive ? "text-[var(--site-primary)]" : ""} />
                                    {t(tipo.labelKey)}
                                  </button>
                                );
                              })}
                            </div>
                            <p className={cn(
                              "text-[var(--text-muted)] mt-1.5",
                              fontSize.label
                            )}>
                              {t("tipologias.tipoTipologiaHint")}
                            </p>
                          </div>
                        )}
                        {isMultiTorre && (
                          <div>
                            <Label>{torresLabel}</Label>
                            <div className={cn("flex flex-wrap", gap.normal)}>
                              {torres.map((torre) => {
                                const checked = form.torre_ids.includes(torre.id);
                                return (
                                  <label
                                    key={torre.id}
                                    className={cn(
                                      "flex items-center px-3 py-1.5 cursor-pointer transition-all border",
                                      gap.normal,
                                      radius.md,
                                      fontSize.subtitle,
                                      checked
                                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.3)] text-[var(--site-primary)]"
                                        : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        const next = checked
                                          ? form.torre_ids.filter((id) => id !== torre.id)
                                          : [...form.torre_ids, torre.id];
                                        updateForm("torre_ids", next);
                                      }}
                                      className="sr-only"
                                    />
                                    <Building2 size={iconSize.xs} />
                                    {torre.nombre}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div>
                          <AITextImprover
                            value={form.descripcion}
                            onChange={(newValue) => updateForm("descripcion", newValue)}
                            rows={3}
                            placeholder={t("tipologias.descriptionPlaceholder")}
                            label={t("tipologias.description")}
                            maxLength={5000}
                          />
                        </div>

                        {/* ── Precio ── */}
                        <div>
                          <Label>Precio</Label>
                          {project?.precio_source === "tipologia" ? (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[rgba(var(--site-primary-rgb),0.15)] transition-all flex-1 min-w-0">
                                  <div className="w-9 h-9 rounded-lg bg-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center shrink-0">
                                    <DollarSign size={iconSize.md} className="text-[var(--site-primary)]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <CurrencyInput
                                      value={form.precio_desde ? Number(form.precio_desde) : ""}
                                      onChange={(v) => updateForm("precio_desde", v != null ? String(v) : "")}
                                      currency={(project?.moneda_base as Currency) || "COP"}
                                      placeholder="350,000,000"
                                      inputClassName="w-full bg-transparent text-sm font-mono font-medium text-[var(--site-primary)] placeholder:text-[var(--text-muted)] focus:outline-none border-none p-0"
                                    />
                                  </div>
                                </div>
                                {selectedId && (() => {
                                  const currentTipo = tipologias.find(t => t.id === selectedId);
                                  return currentTipo && (
                                    <PriceAuditBadge
                                      tipologiaId={currentTipo.id}
                                      updatedAt={currentTipo.precio_actualizado_en}
                                      updatedBy={currentTipo.precio_actualizado_por}
                                      currency={(project?.moneda_base as Currency) || "COP"}
                                    />
                                  );
                                })()}
                              </div>
                              <p className={cn(
                                "text-[var(--text-muted)] mt-2",
                                fontSize.label,
                                lineHeight.relaxed
                              )}>
                                {t("tipologias.precioTipologiaHint")}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="max-w-md">
                                <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[rgba(var(--site-primary-rgb),0.15)] transition-all">
                                  <div className="w-9 h-9 rounded-lg bg-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center shrink-0">
                                    <DollarSign size={iconSize.md} className="text-[var(--site-primary)]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <Label variant="card">Precio mínimo</Label>
                                    <p className="text-sm font-mono font-medium text-[var(--site-primary)]">
                                      {computedPrecioDesde || "—"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <p className={cn(
                                "text-[var(--text-muted)] mt-2",
                                fontSize.label,
                                lineHeight.relaxed
                              )}>
                                {computedPrecioDesde
                                  ? "Precio calculado desde las unidades disponibles de esta tipología"
                                  : t("tipologias.noUnitsHint")}
                              </p>
                            </>
                          )}
                        </div>

                        <div>
                          <Label>{t("tipologias.features")}</Label>
                          <div className={cn("flex flex-wrap mb-2", gap.normal)}>
                            {form.caracteristicas.map((c, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "flex items-center px-3 py-1 bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] border border-[rgba(var(--site-primary-rgb),0.2)]",
                                  gap.compact,
                                  fontSize.subtitle,
                                  radius.full
                                )}
                              >
                                {c}
                                <button
                                  onClick={() => removeCaracteristica(i)}
                                  className="hover:text-white transition-colors"
                                >
                                  <X size={iconSize.xs} />
                                </button>
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={caracInput}
                            onChange={(e) => setCaracInput(e.target.value)}
                            onKeyDown={handleCaracKeyDown}
                            placeholder={t("tipologias.featuresPlaceholder")}
                            className={inputClass}
                          />
                        </div>

                        {/* ── Especificaciones (Áreas + Espacios unified) ── */}
                        <div>
                          <Label variant="section">{t("tipologias.specsAreas")}</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {effectiveColumns.area_m2 && (
                              <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                                <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                  <Maximize size={iconSize.md} className="text-[var(--text-tertiary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Label variant="card">{t("tipologias.internalArea")}</Label>
                                  <input type="number" value={form.area_m2} onChange={(e) => updateForm("area_m2", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                </div>
                                {form.area_m2 && <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">m²</span>}
                              </div>
                            )}
                            {effectiveColumns.area_m2 && (
                              <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                                <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                  <Palmtree size={iconSize.md} className="text-[var(--text-tertiary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Label variant="card">{t("tipologias.balconyArea")}</Label>
                                  <input type="number" value={form.area_balcon} onChange={(e) => updateForm("area_balcon", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                </div>
                                {form.area_balcon && <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">m²</span>}
                              </div>
                            )}
                            {effectiveColumns.area_m2 && (
                              <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[rgba(var(--site-primary-rgb),0.15)] transition-all">
                                <div className="w-9 h-9 rounded-lg bg-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center shrink-0">
                                  <LayoutGrid size={iconSize.md} className="text-[var(--site-primary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Label variant="card">{t("tipologias.totalArea")}</Label>
                                  <p className="text-sm font-mono font-medium text-[var(--site-primary)]">
                                    {form.area_m2 || form.area_balcon
                                      ? `${((parseFloat(form.area_m2) || 0) + (parseFloat(form.area_balcon) || 0)).toFixed(1)} m²`
                                      : "—"}
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Ruler size={iconSize.md} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label variant="card">{t("inventario.columns.areaConstruida")}</Label>
                                <input type="number" value={form.area_construida} onChange={(e) => updateForm("area_construida", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                              {form.area_construida && <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">m²</span>}
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Home size={iconSize.md} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label variant="card">{t("inventario.columns.areaPrivada")}</Label>
                                <input type="number" value={form.area_privada} onChange={(e) => updateForm("area_privada", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                              {form.area_privada && <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">m²</span>}
                            </div>
                            {effectiveColumns.area_lote && (
                              <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                                <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                  <LandPlot size={iconSize.md} className="text-[var(--text-tertiary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Label variant="card">{t("inventario.columns.areaLote")}</Label>
                                  <input type="number" value={form.area_lote} onChange={(e) => updateForm("area_lote", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                </div>
                                {form.area_lote && <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">m²</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ── Espacios ── */}
                        <div>
                          <Label variant="section">{t("tipologias.specsSpaces")}</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <BedDouble size={iconSize.md} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label variant="card">{t("tipologias.bedrooms")}</Label>
                                <input type="number" value={form.habitaciones} onChange={(e) => updateForm("habitaciones", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Bath size={iconSize.md} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label variant="card">{t("tipologias.bathrooms")}</Label>
                                <input type="number" value={form.banos} onChange={(e) => updateForm("banos", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Car size={iconSize.md} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label variant="card">{t("tipologias.parking")}</Label>
                                <input type="number" value={form.parqueaderos} onChange={(e) => updateForm("parqueaderos", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Archive size={iconSize.md} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label variant="card">Depósitos</Label>
                                <input type="number" value={form.depositos} onChange={(e) => updateForm("depositos", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── TAB: Plano ── */}
                    {activeTab === "plano" && (
                      <div className="space-y-6">
                        {/* Floor tabs */}
                        <div>
                          <Label>{t("tipologias.floors")}</Label>
                          <div className={cn("flex items-center flex-wrap mt-1", gap.compact)}>
                            {form.pisos.map((piso, i) => (
                              <button
                                key={piso.id}
                                onClick={() => setActivePisoIndex(i)}
                                className={cn(
                                  "px-3 py-1.5 font-medium transition-all",
                                  radius.md,
                                  fontSize.subtitle,
                                  activePisoIndex === i
                                    ? "bg-[var(--site-primary)] text-black"
                                    : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                )}
                              >
                                {piso.nombre}
                              </button>
                            ))}
                            <button
                              onClick={addFloor}
                              className={cn(
                                "flex items-center px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-all border border-dashed border-[var(--border-subtle)]",
                                gap.compact,
                                radius.md,
                                fontSize.subtitle
                              )}
                            >
                              <Plus size={iconSize.xs} />
                              {t("tipologias.addFloor")}
                            </button>
                          </div>
                        </div>

                        {/* Active floor form */}
                        {form.pisos.length > 0 && form.pisos[activePisoIndex] && (
                          <>
                            {/* Floor name */}
                            <div>
                              <Label>{t("tipologias.floorName")}</Label>
                              <input
                                type="text"
                                value={form.pisos[activePisoIndex].nombre}
                                onChange={(e) => updatePiso(activePisoIndex, { nombre: e.target.value })}
                                placeholder="Piso 1"
                                className={inputClass + " max-w-[280px]"}
                              />
                            </div>

                            {/* Floor plan image */}
                            <div>
                              <Label>{t("tipologias.floorPlanImage")}</Label>
                              <div className="max-w-[280px]">
                                <FileUploader
                                  currentUrl={form.pisos[activePisoIndex].plano_url || null}
                                  onUpload={(url) => updatePiso(activePisoIndex, { plano_url: url })}
                                  folder={`proyectos/${projectId}/tipologias`}
                                  label={t("tipologias.uploadFloorPlan")}
                                  aspect="square"
                                />
                              </div>
                              {form.pisos[activePisoIndex].plano_url && (
                                <p className="text-[10px] text-[var(--text-muted)] mt-3">
                                  {t("tipologias.floorPlanHotspotsHint")}
                                </p>
                              )}
                            </div>

                            {/* Remove floor */}
                            {form.pisos.length > 1 && (
                              <button
                                onClick={() => removeFloor(activePisoIndex)}
                                className={cn(
                                  "flex items-center text-red-400 hover:text-red-300 transition-colors",
                                  gap.normal,
                                  fontSize.subtitle
                                )}
                              >
                                <Trash2 size={iconSize.xs} />
                                {t("tipologias.removeFloor")}
                              </button>
                            )}
                          </>
                        )}

                        {/* Empty state */}
                        {form.pisos.length === 0 && (
                          <div className="text-center py-10">
                            <p className={cn(
                              "text-[var(--text-tertiary)] mb-3",
                              fontSize.subtitle
                            )}>
                              {t("tipologias.noFloorsYet")}
                            </p>
                            <button onClick={addFloor} className={btnPrimary}>
                              <Plus size={iconSize.sm} />
                              {t("tipologias.addFirstFloor")}
                            </button>
                          </div>
                        )}

                        {/* Location image (global, not per-floor) */}
                        <div>
                          <Label>{t("tipologias.locationInProject")}</Label>
                          <p className="text-[10px] text-[var(--text-muted)] mb-2">{t("tipologias.locationDescription")}</p>
                          <div className="max-w-[280px]">
                            <FileUploader
                              currentUrl={form.ubicacion_plano_url || null}
                              onUpload={(url) => setForm({ ...form, ubicacion_plano_url: url })}
                              folder={`proyectos/${projectId}/tipologias`}
                              label={t("tipologias.uploadLocation")}
                              aspect="square"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── TAB: Hotspots ── */}
                    {activeTab === "hotspots" && (
                      <div className="h-full flex flex-col">
                        {/* Floor selector (only if multiple floors) */}
                        {form.pisos.length > 1 && (
                          <div className={cn("flex items-center mb-2 shrink-0", gap.compact)}>
                            {form.pisos.map((piso, i) => (
                              <button
                                key={piso.id}
                                onClick={() => setActivePisoIndex(i)}
                                className={cn(
                                  "px-3 py-1.5 transition-all",
                                  radius.md,
                                  fontSize.subtitle,
                                  activePisoIndex === i
                                    ? "bg-[var(--site-primary)] text-black font-medium"
                                    : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                )}
                              >
                                {piso.nombre}
                                {piso.hotspots.length > 0 && (
                                  <span className={cn("ml-1.5 opacity-60", fontSize.caption)}>
                                    ({piso.hotspots.length})
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Copy hotspots */}
                        {form.pisos[activePisoIndex]?.plano_url && (
                          <div className="flex items-center justify-end mb-2 shrink-0">
                            <CopyHotspotsDropdown
                              tipologias={tipologias}
                              currentId={selectedId}
                              currentHotspotCount={form.pisos[activePisoIndex]?.hotspots.length ?? 0}
                              onCopy={(hotspots) => updatePiso(activePisoIndex, { hotspots })}
                            />
                          </div>
                        )}

                        {form.pisos[activePisoIndex]?.plano_url ? (
                          <div className="flex-1 min-h-0">
                            <HotspotEditor
                              imageUrl={form.pisos[activePisoIndex].plano_url}
                              hotspots={form.pisos[activePisoIndex].hotspots}
                              onChange={(hotspots) => updatePiso(activePisoIndex, { hotspots })}
                              uploadFolder={`proyectos/${projectId}/tipologias`}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16 text-center">
                            <MousePointerClick size={iconSize.xl} className="text-[var(--text-muted)] mb-3" />
                            <p className={cn(
                              "text-[var(--text-tertiary)] mb-1",
                              fontSize.md
                            )}>
                              {form.pisos.length === 0 ? t("tipologias.noFloorsYet") : t("tipologias.noFloorPlan")}
                            </p>
                            <p className={cn(
                              "text-[var(--text-muted)]",
                              fontSize.subtitle
                            )}>
                              {t("tipologias.uploadFloorPlanFirst")}
                            </p>
                            <button
                              onClick={() => setActiveTab("plano")}
                              className={btnSecondary + " mt-4"}
                            >
                              {t("tipologias.tabs.floorPlan")}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Validation error bar (if any) */}
              {validationError && (
                <div className="px-6 py-3 border-t border-[var(--border-subtle)] shrink-0">
                  <InlineError
                    message={validationError}
                    onRetry={() => setValidationError(null)}
                    variant="compact"
                  />
                </div>
              )}
            </>
          ) : (
            /* No selection placeholder */
            <div className={cn(
              "flex-1 flex items-center justify-center text-[var(--text-muted)]",
              fontSize.subtitle
            )}>
              {t("tipologias.selectOrCreate")}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
