"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "@/i18n";
import { useEditorProject } from "@/hooks/useEditorProject";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
  pageHeader,
  pageTitle,
  pageDescription,
  emptyState,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
} from "@/components/dashboard/editor-styles";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { FacadeHotspotEditor } from "@/components/dashboard/FacadeHotspotEditor";
import { PlanoHotspotEditor } from "@/components/dashboard/PlanoHotspotEditor";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  Eye,
  Save,
  X,
  Map as MapIcon,
  Image as ImageIcon,
  Package,
  Building2,
  Layers,
  Copy,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react";
import Link from "next/link";
import type { Fachada, Unidad, Torre, PlanoInteractivo, PlanoPunto } from "@/types";

/* ------------------------------------------------------------------
   Page
   ------------------------------------------------------------------ */
export default function NoddoGridPage() {
  const { project, projectId, refresh } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();
  const { confirm } = useConfirm();

  /* ---- Local state ---- */
  const [fachadas, setFachadas] = useState<Fachada[]>([]);
  const [selectedFachadaId, setSelectedFachadaId] = useState<string | null>(null);
  const [unidades, setUnidades] = useState<Unidad[]>([]);

  // Modal "add grid" form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newImagenUrl, setNewImagenUrl] = useState("");
  const [newNumPisos, setNewNumPisos] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [newAmenidades, setNewAmenidades] = useState("");
  const [newImagenPortada, setNewImagenPortada] = useState("");
  const [addingFachada, setAddingFachada] = useState(false);

  // Implantación
  const [implantacionNombre, setImplantacionNombre] = useState(t("fachadas.implantacionDefaultName"));
  const [implantacionImagenUrl, setImplantacionImagenUrl] = useState("");
  const [creatingImplantacion, setCreatingImplantacion] = useState(false);
  const [deletingImplantacion, setDeletingImplantacion] = useState(false);

  // Torre form modal
  const [showAddTorreForm, setShowAddTorreForm] = useState(false);
  const [torreNombre, setTorreNombre] = useState("");
  const [torreNumPisos, setTorreNumPisos] = useState("");
  const [torreDescripcion, setTorreDescripcion] = useState("");
  const [torreAmenidades, setTorreAmenidades] = useState("");
  const [torreCaracteristicas, setTorreCaracteristicas] = useState("");
  const [torreImagenPortada, setTorreImagenPortada] = useState("");
  const [torreLogoUrl, setTorreLogoUrl] = useState("");
  const [savingTorre, setSavingTorre] = useState(false);

  // Multi-torre tab
  const [activeTab, setActiveTab] = useState<string>("implantacion");
  const [enablingMultiTorre, setEnablingMultiTorre] = useState(false);

  // Plantas view
  const [viewMode, setViewMode] = useState<"fachada" | "planta">("fachada");
  const [showPlantaTipoForm, setShowPlantaTipoForm] = useState(false);
  const [plantaTipoNombre, setPlantaTipoNombre] = useState("");
  const [plantaTipoImagenUrl, setPlantaTipoImagenUrl] = useState("");
  const [plantaTipoPisos, setPlantaTipoPisos] = useState("");
  const [creatingPlantas, setCreatingPlantas] = useState(false);
  const [expandedPlantaTipos, setExpandedPlantaTipos] = useState<Set<string>>(new Set());
  const [plantaTipoSelectedPisos, setPlantaTipoSelectedPisos] = useState<Set<number>>(new Set());

  // Duplicate hotspots
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateTargetFloors, setDuplicateTargetFloors] = useState<Set<string>>(new Set());
  const [duplicatingHotspots, setDuplicatingHotspots] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<string | null>(null);

  // Busy / saving indicators
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTorreId, setDeletingTorreId] = useState<string | null>(null);

  /* ---- Sync from context ---- */
  useEffect(() => {
    if (!project) return;
    setFachadas(project.fachadas ?? []);
    setUnidades(project.unidades ?? []);
  }, [project]);

  /* ---- Derived data ---- */
  const torres = useMemo<Torre[]>(() => project?.torres ?? [], [project]);
  const isMultiTorre = torres.length > 1;

  // Tipología lookup for enriching unit display
  const tipologiaMap = useMemo(() => {
    const map = new Map<string, { nombre: string; habitaciones: number | null }>();
    for (const t of project?.tipologias ?? []) {
      map.set(t.id, { nombre: t.nombre, habitaciones: t.habitaciones });
    }
    return map;
  }, [project]);

  const implantacionPlano = useMemo<PlanoInteractivo | null>(
    () => (project?.planos_interactivos ?? []).find((p) => p.tipo === "implantacion") ?? null,
    [project]
  );

  const implantacionPuntos = useMemo<PlanoPunto[]>(
    () =>
      implantacionPlano
        ? (project?.plano_puntos ?? []).filter((p) => p.plano_id === implantacionPlano.id)
        : [],
    [project, implantacionPlano]
  );

  const activeTorre = useMemo<Torre | null>(
    () => (isMultiTorre && activeTab !== "implantacion") ? torres.find((t) => t.id === activeTab) ?? null : null,
    [isMultiTorre, activeTab, torres]
  );

  // Fachadas filtered by active torre (or all in simple mode) AND by viewMode
  const visibleFachadas = useMemo<Fachada[]>(() => {
    const byTorre = activeTorre
      ? fachadas.filter((f) => f.torre_id === activeTorre.id)
      : isMultiTorre ? [] : fachadas;
    return byTorre.filter((f) => (f.tipo || "fachada") === viewMode);
  }, [fachadas, activeTorre, isMultiTorre, viewMode]);

  // Plantas grouped by planta_tipo_nombre (only when viewMode === "planta")
  const plantaTipos = useMemo(() => {
    if (viewMode !== "planta") return new Map<string, Fachada[]>();
    const map = new Map<string, Fachada[]>();
    for (const f of visibleFachadas) {
      const key = f.planta_tipo_nombre || "Sin tipo";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    // Sort floors within each group
    for (const [, floors] of map) {
      floors.sort((a, b) => (a.piso_numero ?? 0) - (b.piso_numero ?? 0));
    }
    return map;
  }, [visibleFachadas, viewMode]);

  // Generate available floors from torre building composition
  const torreFloors = useMemo(() => {
    const torre = activeTorre ?? (torres.length === 1 ? torres[0] : null);
    if (!torre || (torre.tipo ?? "torre") === "urbanismo") return [];

    const s = torre.pisos_sotano ?? 0;
    const pb = torre.pisos_planta_baja ?? 0;
    const pod = torre.pisos_podio ?? 0;
    const res = torre.pisos_residenciales ?? 0;
    const rt = torre.pisos_rooftop ?? 0;
    if (s + pb + pod + res + rt === 0) return [];

    const floors: { piso_numero: number; label: string; section: string }[] = [];
    for (let i = s; i >= 1; i--) floors.push({ piso_numero: -i, label: `S${i}`, section: "Sótano" });
    if (pb > 0) floors.push({ piso_numero: 0, label: "PB", section: "Planta Baja" });
    let n = 1;
    for (let i = 0; i < pod; i++) { floors.push({ piso_numero: n, label: String(n), section: "Podio" }); n++; }
    for (let i = 0; i < res; i++) { floors.push({ piso_numero: n, label: String(n), section: "Residencial" }); n++; }
    for (let i = 0; i < rt; i++) { floors.push({ piso_numero: n, label: String(n), section: "Rooftop" }); n++; }
    return floors;
  }, [activeTorre, torres]);

  // Piso numbers already assigned to any planta tipo for the active torre
  const assignedPisos = useMemo(() => {
    const torreId = activeTorre?.id ?? (torres.length === 1 ? torres[0]?.id : null);
    return new Set(
      fachadas
        .filter((f) => f.tipo === "planta" && (torreId ? f.torre_id === torreId : true))
        .map((f) => f.piso_numero)
        .filter((n): n is number => n !== null)
    );
  }, [fachadas, activeTorre, torres]);

  /* ---- Auto-select first facade for current context ---- */
  useEffect(() => {
    const pool = visibleFachadas;
    if (pool.length === 0) {
      setSelectedFachadaId(null);
      return;
    }
    if (!selectedFachadaId || !pool.find((f) => f.id === selectedFachadaId)) {
      setSelectedFachadaId(pool[0].id);
    }
  }, [visibleFachadas, selectedFachadaId]);

  /* ---- Ensure tab validity ---- */
  useEffect(() => {
    if (!isMultiTorre) return;
    if (activeTab === "implantacion") return;
    if (!torres.find((t) => t.id === activeTab)) {
      setActiveTab(torres.length > 0 ? torres[0].id : "implantacion");
    }
  }, [torres, activeTab, isMultiTorre]);

  /* ---- Reset viewMode for urbanismo (etapas don't have fachadas/plantas) ---- */
  useEffect(() => {
    if (activeTorre?.tipo === "urbanismo" && viewMode !== "fachada") {
      setViewMode("fachada");
    }
  }, [activeTorre, viewMode]);

  /* ------------------------------------------------------------------
     CRUD: Fachada
     ------------------------------------------------------------------ */
  const resetAddForm = () => {
    setNewNombre("");
    setNewImagenUrl("");
    setNewNumPisos("");
    setNewDescripcion("");
    setNewAmenidades("");
    setNewImagenPortada("");
    setShowAddForm(false);
  };

  const handleAddFachada = () => {
    if (!newNombre.trim() || !newImagenUrl) return;
    const body: Record<string, unknown> = {
      proyecto_id: projectId,
      nombre: newNombre.trim(),
      imagen_url: newImagenUrl,
      num_pisos: newNumPisos ? parseInt(newNumPisos) : null,
      descripcion: newDescripcion.trim() || null,
      amenidades: newAmenidades.trim() || null,
      imagen_portada: newImagenPortada || null,
    };
    if (isMultiTorre && activeTorre) {
      body.torre_id = activeTorre.id;
    }
    // Close form immediately
    resetAddForm();
    // Save in background
    fetch("/api/fachadas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (res) => {
      if (res.ok) {
        const created: Fachada = await res.json();
        setSelectedFachadaId(created.id);
        toast.success("Fachada creada");
        await refresh();
      } else {
        toast.error("Error al crear fachada");
      }
    }).catch(() => {
      toast.error("Error de conexión");
    });
  };

  const handleDeleteFachada = async (id: string) => {
    const target = fachadas.find((f) => f.id === id);
    const label = target?.tipo === "planta" ? "planta" : "fachada";
    if (!(await confirm({
      title: `Eliminar ${label}`,
      message: `¿Estás seguro de eliminar "${target?.nombre || label}"? Las unidades asignadas serán desvinculadas.`,
    }))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/fachadas/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFachadas((prev) => prev.filter((f) => f.id !== id));
        setUnidades((prev) =>
          prev.map((u) => {
            let updated = u;
            if (u.fachada_id === id) updated = { ...updated, fachada_id: null, fachada_x: null, fachada_y: null };
            if (u.planta_id === id) updated = { ...updated, planta_id: null, planta_x: null, planta_y: null };
            return updated;
          })
        );
        await refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  /* ------------------------------------------------------------------
     CRUD: Hotspot positions on units
     ------------------------------------------------------------------ */
  const handleUpdateUnit = useCallback(
    async (
      unitId: string,
      data: { fachada_id: string; fachada_x: number; fachada_y: number }
    ) => {
      // In planta mode, write to planta_id/x/y instead of fachada_id/x/y
      const isPlantaMode = viewMode === "planta";
      const payload = isPlantaMode
        ? { planta_id: data.fachada_id, planta_x: data.fachada_x, planta_y: data.fachada_y }
        : data;
      const optimistic = isPlantaMode
        ? { planta_id: data.fachada_id, planta_x: data.fachada_x, planta_y: data.fachada_y }
        : { fachada_id: data.fachada_id, fachada_x: data.fachada_x, fachada_y: data.fachada_y };

      setUnidades((prev) =>
        prev.map((u) => (u.id === unitId ? { ...u, ...optimistic } : u))
      );
      try {
        const res = await fetch(`/api/unidades/${unitId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) toast.error("Error al guardar posición");
        await refresh();
      } catch {
        toast.error("Error de conexión");
        await refresh();
      }
    },
    [refresh, toast, viewMode]
  );

  const handleRemoveUnit = useCallback(
    async (unitId: string) => {
      const isPlantaMode = viewMode === "planta";
      const clearFields = isPlantaMode
        ? { planta_id: null, planta_x: null, planta_y: null }
        : { fachada_x: null, fachada_y: null };

      setUnidades((prev) =>
        prev.map((u) => (u.id === unitId ? { ...u, ...clearFields } : u))
      );
      try {
        const res = await fetch(`/api/unidades/${unitId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clearFields),
        });
        if (!res.ok) toast.error("Error al remover unidad");
        await refresh();
      } catch {
        toast.error("Error de conexión");
        await refresh();
      }
    },
    [refresh, toast, viewMode]
  );

  const handleClearAll = useCallback(
    async (fachadaId: string) => {
      const isPlantaMode = viewMode === "planta";
      const idField = isPlantaMode ? "planta_id" : "fachada_id";
      const xField = isPlantaMode ? "planta_x" : "fachada_x";
      const yField = isPlantaMode ? "planta_y" : "fachada_y";
      const clearFields = isPlantaMode
        ? { planta_id: null, planta_x: null, planta_y: null }
        : { fachada_x: null, fachada_y: null };

      const assigned = unidades.filter(
        (u) => u[idField] === fachadaId && u[xField] !== null && u[yField] !== null
      );
      setUnidades((prev) =>
        prev.map((u) =>
          u[idField] === fachadaId && u[xField] !== null && u[yField] !== null
            ? { ...u, ...clearFields }
            : u
        )
      );
      try {
        const results = await Promise.all(
          assigned.map((u) =>
            fetch(`/api/unidades/${u.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(clearFields),
            })
          )
        );
        if (results.some((r) => !r.ok)) toast.error("Error al limpiar algunas unidades");
        await refresh();
      } catch {
        toast.error("Error de conexión");
        await refresh();
      }
    },
    [unidades, refresh, toast, viewMode]
  );

  /* ------------------------------------------------------------------
     CRUD: Implantación
     ------------------------------------------------------------------ */
  const handleCreateImplantacion = async () => {
    if (!implantacionNombre.trim() || !implantacionImagenUrl) return;
    setCreatingImplantacion(true);
    try {
      const res = await fetch("/api/planos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          nombre: implantacionNombre.trim(),
          imagen_url: implantacionImagenUrl,
          tipo: "implantacion",
        }),
      });
      if (res.ok) {
        setImplantacionImagenUrl("");
        setImplantacionNombre(t("fachadas.implantationPlaceholder"));
        await refresh();
      }
    } finally {
      setCreatingImplantacion(false);
    }
  };

  const handleDeleteImplantacion = async () => {
    if (!implantacionPlano) return;
    setDeletingImplantacion(true);
    try {
      const res = await fetch(`/api/planos/${implantacionPlano.id}`, { method: "DELETE" });
      if (res.ok) await refresh();
    } finally {
      setDeletingImplantacion(false);
    }
  };

  const handleAddImplantacionPunto = async (data: {
    titulo: string;
    descripcion: string | null;
    imagen_url: string | null;
    fachada_id: string | null;
    torre_id: string | null;
    x: number;
    y: number;
  }) => {
    if (!implantacionPlano) return;
    await fetch("/api/plano-puntos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plano_id: implantacionPlano.id, ...data }),
    });
    await refresh();
  };

  const handleUpdateImplantacionPunto = async (id: string, data: Partial<PlanoPunto>) => {
    await fetch(`/api/plano-puntos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await refresh();
  };

  const handleDeleteImplantacionPunto = async (id: string) => {
    await fetch(`/api/plano-puntos/${id}`, { method: "DELETE" });
    await refresh();
  };

  /* ------------------------------------------------------------------
     CRUD: Torres
     ------------------------------------------------------------------ */
  const resetTorreForm = () => {
    setTorreNombre("");
    setTorreNumPisos("");
    setTorreDescripcion("");
    setTorreAmenidades("");
    setTorreCaracteristicas("");
    setTorreImagenPortada("");
    setTorreLogoUrl("");
    setShowAddTorreForm(false);
  };

  const handleAddTorre = async () => {
    if (!torreNombre.trim()) return;
    setSavingTorre(true);
    try {
      const res = await fetch("/api/torres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          nombre: torreNombre.trim(),
          num_pisos: torreNumPisos ? parseInt(torreNumPisos) : null,
          descripcion: torreDescripcion.trim() || null,
          amenidades: torreAmenidades.trim() || null,
          caracteristicas: torreCaracteristicas.trim() || null,
          imagen_portada: torreImagenPortada || null,
          logo_url: torreLogoUrl || null,
        }),
      });
      if (res.ok) {
        const created: Torre = await res.json();
        resetTorreForm();
        await refresh();
        setActiveTab(created.id);
      }
    } finally {
      setSavingTorre(false);
    }
  };

  const handleUpdateTorre = async (torreId: string, data: Partial<Torre>) => {
    await fetch(`/api/torres/${torreId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await refresh();
  };

  const handleDeleteTorre = async (torreId: string) => {
    setDeletingTorreId(torreId);
    try {
      // Delete fachadas belonging to this torre first
      const torreFachadas = fachadas.filter((f) => f.torre_id === torreId);
      await Promise.all(
        torreFachadas.map((f) => fetch(`/api/fachadas/${f.id}`, { method: "DELETE" }))
      );
      // Delete the torre
      const res = await fetch(`/api/torres/${torreId}`, { method: "DELETE" });
      if (res.ok) {
        const remaining = torres.filter((t) => t.id !== torreId);
        setActiveTab(remaining.length > 0 ? remaining[0].id : "implantacion");
        await refresh();
      }
    } finally {
      setDeletingTorreId(null);
    }
  };

  /* ------------------------------------------------------------------
     Mode toggle: Simple ↔ Multi-torre
     ------------------------------------------------------------------ */
  const handleEnableMultiTorre = async () => {
    setEnablingMultiTorre(true);
    try {
      // Create default torre
      const res = await fetch("/api/torres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          nombre: "Torre 1",
        }),
      });
      if (!res.ok) return;
      const created: Torre = await res.json();

      // Assign existing fachadas to the new torre
      await Promise.all(
        fachadas.map((f) =>
          fetch(`/api/fachadas/${f.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ torre_id: created.id }),
          })
        )
      );

      await refresh();
      setActiveTab(created.id);
    } finally {
      setEnablingMultiTorre(false);
    }
  };

  const handleDisableMultiTorre = async () => {
    setEnablingMultiTorre(true);
    try {
      // Detach fachadas from torres
      await Promise.all(
        fachadas.map((f) =>
          f.torre_id
            ? fetch(`/api/fachadas/${f.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ torre_id: null }),
              })
            : Promise.resolve()
        )
      );
      // Delete all torres
      await Promise.all(
        torres.map((t) => fetch(`/api/torres/${t.id}`, { method: "DELETE" }))
      );
      await refresh();
    } finally {
      setEnablingMultiTorre(false);
    }
  };

  /* ------------------------------------------------------------------
     CRUD: Plantas (floor plans)
     ------------------------------------------------------------------ */
  const parseFloorRange = (input: string): number[] => {
    const floors: number[] = [];
    for (const part of input.split(",").map((s) => s.trim())) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) floors.push(i);
        }
      } else {
        const n = parseInt(part);
        if (!isNaN(n)) floors.push(n);
      }
    }
    return [...new Set(floors)].sort((a, b) => a - b);
  };

  const resetPlantaTipoForm = () => {
    setPlantaTipoNombre("");
    setPlantaTipoImagenUrl("");
    setPlantaTipoPisos("");
    setPlantaTipoSelectedPisos(new Set());
    setShowPlantaTipoForm(false);
  };

  const handleAddPlantaTipo = async () => {
    const pisos = torreFloors.length > 0
      ? Array.from(plantaTipoSelectedPisos).sort((a, b) => a - b)
      : parseFloorRange(plantaTipoPisos);
    if (!plantaTipoNombre.trim() || !plantaTipoImagenUrl || pisos.length === 0) return;

    setCreatingPlantas(true);
    try {
      for (const piso of pisos) {
        const pisoLabel = piso < 0 ? `S${Math.abs(piso)}` : piso === 0 ? "PB" : `P${piso}`;
        const body: Record<string, unknown> = {
          proyecto_id: projectId,
          nombre: `${plantaTipoNombre.trim()} - ${pisoLabel}`,
          imagen_url: plantaTipoImagenUrl,
          tipo: "planta",
          piso_numero: piso,
          planta_tipo_nombre: plantaTipoNombre.trim(),
        };
        if (isMultiTorre && activeTorre) body.torre_id = activeTorre.id;
        await fetch("/api/fachadas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      resetPlantaTipoForm();
      // Auto-expand newly created type
      setExpandedPlantaTipos((prev) => new Set(prev).add(plantaTipoNombre.trim()));
      await refresh();
    } finally {
      setCreatingPlantas(false);
    }
  };

  const handleDeletePlantaTipo = async (tipoNombre: string) => {
    const toDelete = visibleFachadas.filter((f) => f.planta_tipo_nombre === tipoNombre);
    if (toDelete.length === 0) return;
    if (!(await confirm({
      title: "Eliminar tipo de planta",
      message: `¿Eliminar todas las plantas "${tipoNombre}" (${toDelete.length} piso${toDelete.length > 1 ? "s" : ""})? Las unidades asignadas serán desvinculadas.`,
    }))) return;
    try {
      await Promise.all(
        toDelete.map((f) => fetch(`/api/fachadas/${f.id}`, { method: "DELETE" }))
      );
      await refresh();
    } catch {
      // silent
    }
  };

  const handleDuplicateHotspots = async () => {
    if (!selectedFachada || duplicateTargetFloors.size === 0) return;
    setDuplicatingHotspots(true);
    setDuplicateResult(null);
    try {
      let totalMatched = 0;
      let totalUnmatched = 0;
      for (const targetId of duplicateTargetFloors) {
        const res = await fetch(`/api/fachadas/${selectedFachada.id}/duplicar-hotspots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_fachada_id: targetId }),
        });
        if (res.ok) {
          const data = await res.json();
          totalMatched += data.matched_count || 0;
          totalUnmatched += data.unmatched_count || 0;
        }
      }
      setDuplicateResult(
        t("fachadas.plantas.duplicateSuccess", { matched: totalMatched, unmatched: totalUnmatched })
      );
      setShowDuplicateModal(false);
      setDuplicateTargetFloors(new Set());
      await refresh();
    } finally {
      setDuplicatingHotspots(false);
    }
  };

  /* ------------------------------------------------------------------
     Derived data for the editor
     ------------------------------------------------------------------ */
  const selectedFachada = visibleFachadas.find((f) => f.id === selectedFachadaId) ?? null;

  const isPlantaView = viewMode === "planta";

  const assignedUnits = selectedFachada
    ? unidades
        .filter((u) =>
          isPlantaView
            ? u.planta_id === selectedFachada.id && u.planta_x !== null && u.planta_y !== null
            : u.fachada_id === selectedFachada.id && u.fachada_x !== null && u.fachada_y !== null
        )
        .map((u) => {
          const tipo = u.tipologia_id ? tipologiaMap.get(u.tipologia_id) : null;
          return {
            id: u.id,
            identificador: u.identificador,
            estado: u.estado,
            fachada_x: isPlantaView ? u.planta_x! : u.fachada_x!,
            fachada_y: isPlantaView ? u.planta_y! : u.fachada_y!,
            tipologiaNombre: tipo?.nombre ?? null,
            habitaciones: u.habitaciones ?? tipo?.habitaciones ?? null,
          };
        })
    : [];

  const unassignedUnits = unidades
    .filter((u) => {
      if (isPlantaView) {
        // In planta mode, check planta fields for "already placed"
        if (u.planta_x !== null && u.planta_y !== null) return false;
        // Only show units for the selected floor
        if (selectedFachada?.piso_numero != null) {
          const matchesFloor = u.piso === selectedFachada.piso_numero;
          const matchesTorre = !selectedFachada.torre_id || u.torre_id === selectedFachada.torre_id;
          return matchesFloor && matchesTorre;
        }
        return false;
      }
      // Fachada mode — filter by torre + fachada assignment
      if (u.fachada_x !== null && u.fachada_y !== null) return false;
      // Only show units from the active torre (or all if single-torre project)
      const torreId = activeTorre?.id ?? (torres.length === 1 ? torres[0]?.id : null);
      if (torreId && u.torre_id !== torreId) return false;
      if (!u.fachada_id) return true;
      return selectedFachada ? u.fachada_id === selectedFachada.id : false;
    })
    .map((u) => {
      const tipo = u.tipologia_id ? tipologiaMap.get(u.tipologia_id) : null;
      return {
        id: u.id,
        identificador: u.identificador,
        estado: u.estado,
        tipologiaNombre: tipo?.nombre ?? null,
        habitaciones: u.habitaciones ?? tipo?.habitaciones ?? null,
      };
    });

  const STATUS_COLORS: Record<string, string> = {
    disponible: "#22c55e",
    separado: "#eab308",
    reservada: "#f97316",
    vendida: "#ef4444",
  };

  // Show the three-panel grid editor
  const showGridEditor = isMultiTorre
    ? (activeTorre !== null && visibleFachadas.length > 0)
    : fachadas.filter((f) => (f.tipo || "fachada") === viewMode).length > 0;

  // For the "Duplicar Hotspots" feature: floors of the same planta_tipo that have hotspots already placed
  const sourceFloorHasHotspots = selectedFachada && viewMode === "planta"
    ? unidades.some((u) => u.fachada_id === selectedFachada.id && u.fachada_x !== null && u.fachada_y !== null)
    : false;

  // Other floors of the same planta_tipo that don't have hotspots yet
  const duplicateTargetCandidates = useMemo<Fachada[]>(() => {
    if (!selectedFachada || viewMode !== "planta" || !sourceFloorHasHotspots) return [];
    const tipoNombre = selectedFachada.planta_tipo_nombre;
    if (!tipoNombre) return [];
    return visibleFachadas.filter((f) => {
      if (f.id === selectedFachada.id) return false;
      if (f.planta_tipo_nombre !== tipoNombre) return false;
      // Check if this floor already has hotspots
      const hasHotspots = unidades.some(
        (u) => u.fachada_id === f.id && u.fachada_x !== null && u.fachada_y !== null
      );
      return !hasHotspots;
    });
  }, [selectedFachada, viewMode, sourceFloorHasHotspots, visibleFachadas, unidades]);

  /* ------------------------------------------------------------------
     Reusable: Thumbnail strip + editor + panel
     ------------------------------------------------------------------ */

  const renderFachadaThumbnails = (fachadasList: Fachada[]) => (
    <div className="flex flex-col gap-2 w-20 shrink-0 overflow-y-auto max-h-[70vh] scrollbar-thin">
      {fachadasList.map((f) => {
        const count = unidades.filter((u) => u.fachada_id === f.id).length;
        return (
          <div
            key={f.id}
            onClick={() => setSelectedFachadaId(f.id)}
            className={`relative rounded-lg overflow-hidden border-2 transition-all group cursor-pointer ${
              selectedFachadaId === f.id
                ? "border-[var(--site-primary)] shadow-lg shadow-[rgba(var(--site-primary-rgb),0.15)]"
                : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
            }`}
          >
            <div className="aspect-square bg-black/40">
              {f.imagen_url ? (
                <img src={f.imagen_url} alt={f.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                  <ImageIcon size={14} />
                </div>
              )}
            </div>
            <div className="px-1 py-1 bg-[var(--surface-2)] text-center">
              <span className="text-[9px] text-[var(--text-secondary)] truncate block">{f.nombre}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteFachada(f.id); }}
              disabled={deletingId === f.id}
              className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded-full bg-black/60 text-red-400/70 hover:text-red-400 transition-all"
            >
              {deletingId === f.id ? <Loader2 size={8} className="animate-spin" /> : <Trash2 size={8} />}
            </button>
            {count > 0 && (
              <div className="absolute top-0.5 left-0.5 min-w-[16px] h-[16px] flex items-center justify-center px-0.5 bg-[var(--site-primary)] text-black text-[8px] font-bold rounded-full">
                {count}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderPlantasPanel = () => (
    <div className="flex flex-col gap-1 w-44 shrink-0 overflow-y-auto max-h-[70vh] scrollbar-thin rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-2)] flex items-center justify-between">
        <span className="font-ui text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t("fachadas.plantas.label")}</span>
        <button
          onClick={() => setShowPlantaTipoForm(true)}
          className="w-5 h-5 flex items-center justify-center rounded bg-[var(--surface-3)] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors"
        >
          <Plus size={11} />
        </button>
      </div>

      {plantaTipos.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 px-3 text-center">
          <Layers size={18} className="text-[var(--text-muted)] mb-2" />
          <p className="text-[10px] text-[var(--text-muted)]">{t("fachadas.plantas.noPlantas")}</p>
          <button onClick={() => setShowPlantaTipoForm(true)} className="mt-2 text-[10px] text-[var(--site-primary)] hover:underline">
            {t("fachadas.plantas.addPlantaTipo")}
          </button>
        </div>
      ) : (
        <div className="py-1">
          {Array.from(plantaTipos.entries()).map(([tipoNombre, floors]) => {
            const isExpanded = expandedPlantaTipos.has(tipoNombre);
            return (
              <div key={tipoNombre}>
                {/* Type header */}
                <button
                  onClick={() => {
                    setExpandedPlantaTipos((prev) => {
                      const next = new Set(prev);
                      if (next.has(tipoNombre)) next.delete(tipoNombre); else next.add(tipoNombre);
                      return next;
                    });
                  }}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left hover:bg-[var(--surface-2)] transition-colors group"
                >
                  {isExpanded ? <ChevronDown size={10} className="text-[var(--text-muted)] shrink-0" /> : <ChevronRight size={10} className="text-[var(--text-muted)] shrink-0" />}
                  <span className="text-[10px] font-medium text-[var(--text-secondary)] truncate flex-1">{tipoNombre}</span>
                  <span className="text-[9px] text-[var(--text-muted)]">{floors.length}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletePlantaTipo(tipoNombre); }}
                    className="opacity-0 group-hover:opacity-100 shrink-0 text-[var(--text-muted)] hover:text-red-400 transition-all"
                  >
                    <Trash2 size={9} />
                  </button>
                </button>

                {/* Floor list */}
                {isExpanded && (
                  <div className="ml-3 border-l border-[var(--border-subtle)]">
                    {floors.map((f) => {
                      const assignedCount = unidades.filter(
                        (u) => u.fachada_id === f.id && u.fachada_x !== null && u.fachada_y !== null
                      ).length;
                      const isSelected = selectedFachadaId === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setSelectedFachadaId(f.id)}
                          className={cn(
                            "w-full flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-left transition-colors",
                            isSelected
                              ? "bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)]"
                              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                          )}
                        >
                          <span className="text-[10px] font-mono">{t("fachadas.plantas.floorShort", { n: f.piso_numero ?? 0 })}</span>
                          {assignedCount > 0 && (
                            <Check size={8} className="text-green-400 shrink-0" />
                          )}
                          <span className="flex-1" />
                          {assignedCount > 0 && (
                            <span className="text-[8px] text-[var(--text-muted)]">{assignedCount}</span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteFachada(f.id); }}
                            className="opacity-0 group-hover:opacity-100 shrink-0 text-[var(--text-muted)] hover:text-red-400 transition-all"
                          >
                            <Trash2 size={8} />
                          </button>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderGridEditor = (fachadasList: Fachada[]) => (
    <div className="flex gap-3">
      {/* Left: Thumbnail strip (fachadas) or Plantas panel */}
      {viewMode === "planta" ? renderPlantasPanel() : renderFachadaThumbnails(fachadasList)}

      {/* Center: Hotspot editor */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {selectedFachada && (
            <motion.div
              key={selectedFachada.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FacadeHotspotEditor
                fachada={selectedFachada}
                assignedUnits={assignedUnits}
                unassignedUnits={unassignedUnits}
                onUpdateUnit={handleUpdateUnit}
                onRemoveUnit={handleRemoveUnit}
                onClearAll={handleClearAll}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Unassigned units panel */}
      <div className="w-52 shrink-0 flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden max-h-[70vh]">
        <div className="px-3 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
          <h3 className="font-ui text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t("fachadas.unassigned")}</h3>
          <p className="text-[10px] text-[var(--text-muted)]">{t("fachadas.unitCount", { count: unassignedUnits.length })}</p>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {unassignedUnits.length > 0 ? (
            <div className="py-1">
              {unassignedUnits.map((u) => (
                <div
                  key={u.id}
                  className="flex items-start gap-2 px-3 py-1.5 hover:bg-[var(--surface-2)] transition-colors"
                >
                  <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: STATUS_COLORS[u.estado] }} />
                  <div className="min-w-0">
                    <span className="block text-xs text-[var(--text-secondary)] truncate">{u.identificador}</span>
                    {u.tipologiaNombre && (
                      <span className="block text-[10px] text-[var(--text-muted)] truncate">
                        {u.tipologiaNombre}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package size={18} className="text-[var(--text-muted)] mb-2" />
              <p className="text-[10px] text-[var(--text-muted)] px-4">
                {assignedUnits.length > 0 ? t("fachadas.allUnitsAssigned") : t("fachadas.noUnitsInInventory")}
              </p>
            </div>
          )}
        </div>
        {assignedUnits.length > 0 && (
          <>
            <div className="px-3 py-2 border-t border-[var(--border-subtle)] bg-[var(--surface-2)]">
              <h3 className="font-ui text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t("fachadas.assigned")}</h3>
              <p className="text-[10px] text-[var(--text-muted)]">{t("fachadas.unitCount", { count: assignedUnits.length })}</p>
            </div>
            <div className="overflow-y-auto scrollbar-thin max-h-40">
              <div className="py-1">
                {assignedUnits.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-start justify-between gap-1 px-3 py-1.5 hover:bg-[var(--surface-2)] transition-colors group"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: STATUS_COLORS[u.estado] }} />
                      <div className="min-w-0">
                        <span className="block text-xs text-[var(--text-secondary)] truncate">{u.identificador}</span>
                        {u.tipologiaNombre && (
                          <span className="block text-[10px] text-[var(--text-muted)] truncate">
                            {u.tipologiaNombre}{u.habitaciones ? ` · ${u.habitaciones} hab` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUnit(u.id)}
                      className="opacity-0 group-hover:opacity-100 shrink-0 mt-0.5 transition-opacity"
                    >
                      <X size={12} className="text-[var(--text-tertiary)] hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  /* ------------------------------------------------------------------
     Reusable: ViewMode toggle + Duplicate button
     ------------------------------------------------------------------ */
  const renderViewModeToggle = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1 p-0.5 bg-[var(--surface-2)] rounded-lg border border-[var(--border-subtle)]">
        <button
          onClick={() => setViewMode("fachada")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
            viewMode === "fachada"
              ? "bg-[var(--surface-3)] text-white shadow-sm"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
        >
          <Building2 size={12} />
          {t("fachadas.viewFachadas")}
        </button>
        <button
          onClick={() => setViewMode("planta")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
            viewMode === "planta"
              ? "bg-[var(--surface-3)] text-white shadow-sm"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
        >
          <Layers size={12} />
          {t("fachadas.viewPlantas")}
        </button>
      </div>

      {/* Duplicate button: shown when editing a plantas floor with hotspots */}
      {viewMode === "planta" && sourceFloorHasHotspots && duplicateTargetCandidates.length > 0 && (
        <button
          onClick={() => { setDuplicateTargetFloors(new Set()); setShowDuplicateModal(true); }}
          className={btnSecondary}
        >
          <Copy size={12} />
          {t("fachadas.plantas.duplicateHotspots")}
        </button>
      )}
    </div>
  );

  /* ------------------------------------------------------------------
     Render
     ------------------------------------------------------------------ */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Page Header */}
      <div className={pageHeader}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Eye size={18} className="text-[var(--site-primary)]" />
          </div>
          <div>
            <h2 className={pageTitle}>{t("fachadas.title")}</h2>
            <p className={pageDescription}>
              {t("fachadas.description")}
              {selectedFachada && !isMultiTorre && (
                <span className="ml-2 text-[var(--text-tertiary)]">
                  {t("fachadas.descriptionDetail", { name: selectedFachada.nombre, assigned: assignedUnits.length, unassigned: unassignedUnits.length })}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(!isMultiTorre || activeTorre) && (viewMode === "fachada" || activeTorre?.tipo === "urbanismo") && (
            <button onClick={() => setShowAddForm(true)} className={btnPrimary}>
              <Plus size={14} />
              {t("fachadas.addGrid")}
            </button>
          )}
          {(!isMultiTorre || activeTorre) && viewMode === "planta" && activeTorre?.tipo !== "urbanismo" && (
            <button onClick={() => setShowPlantaTipoForm(true)} className={btnPrimary}>
              <Plus size={14} />
              {t("fachadas.plantas.addPlantaTipo")}
            </button>
          )}
        </div>
      </div>

      {/* ============================================================
          MULTI-TORRE MODE
          ============================================================ */}
      {isMultiTorre && (
        <>
          {/* Tab bar */}
          <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-x-auto scrollbar-thin">
            {/* Implantación tab */}
            <button
              onClick={() => setActiveTab("implantacion")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                activeTab === "implantacion"
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
            >
              <MapIcon size={14} />
              {t("fachadas.implantacion")}
              {implantacionPlano && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--site-primary)]" />
              )}
            </button>

            {/* Torre tabs */}
            {torres.map((torre) => {
              const count = fachadas.filter((f) => f.torre_id === torre.id).length;
              return (
                <button
                  key={torre.id}
                  onClick={() => setActiveTab(torre.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                    activeTab === torre.id
                      ? "bg-[var(--surface-3)] text-white shadow-sm"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                  )}
                >
                  <Building2 size={13} />
                  {torre.nombre}
                  {count > 0 && (
                    <span className="text-[10px] text-[var(--text-muted)]">{count}</span>
                  )}
                </button>
              );
            })}

            {/* Manage torres link */}
            <Link
              href={`/editor/${projectId}/torres`}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--site-primary)] hover:bg-[var(--surface-2)] transition-all whitespace-nowrap shrink-0"
            >
              <Plus size={12} />
              {t("fachadas.manageTowers")}
            </Link>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === "implantacion" ? (
              /* ── Implantación tab ── */
              <motion.div
                key="implantacion"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {!implantacionPlano ? (
                  <div className="p-5 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] space-y-4 max-w-lg">
                    <div className="flex items-center gap-3">
                      <MapIcon size={18} className="text-[var(--site-primary)]" />
                      <div>
                        <h3 className="text-sm font-medium text-[var(--text-primary)]">{t("fachadas.createImplantation")}</h3>
                        <p className="text-[11px] text-[var(--text-tertiary)]">{t("fachadas.createImplantationDescription")}</p>
                      </div>
                    </div>
                    {torres.length === 0 && (
                      <p className="text-xs text-amber-400/70 bg-amber-500/8 border border-amber-500/15 rounded-lg px-3 py-2">
                        {t("fachadas.createTowerFirst")}
                      </p>
                    )}
                    <div>
                      <label className={labelClass}>{t("fachadas.name")}</label>
                      <input
                        type="text"
                        value={implantacionNombre}
                        onChange={(e) => setImplantacionNombre(e.target.value)}
                        placeholder={t("fachadas.implantationPlaceholder")}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("fachadas.aerialView")}</label>
                      <FileUploader
                        currentUrl={implantacionImagenUrl || null}
                        onUpload={(url) => setImplantacionImagenUrl(url)}
                        folder={`proyectos/${projectId}/implantacion`}
                        label={t("fachadas.uploadAerialImage")}
                      />
                    </div>
                    <button
                      onClick={handleCreateImplantacion}
                      disabled={creatingImplantacion || !implantacionNombre.trim() || !implantacionImagenUrl}
                      className={btnPrimary}
                    >
                      {creatingImplantacion ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      {creatingImplantacion ? t("fachadas.creating") : t("fachadas.createImplantationButton")}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="min-h-[420px]">
                      <PlanoHotspotEditor
                        imagenUrl={implantacionPlano.imagen_url}
                        puntos={implantacionPuntos}
                        tipo="implantacion"
                        fachadas={fachadas}
                        torres={torres}
                        isMultiTorre={true}
                        onAddPunto={handleAddImplantacionPunto}
                        onUpdatePunto={handleUpdateImplantacionPunto}
                        onDeletePunto={handleDeleteImplantacionPunto}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button onClick={handleDeleteImplantacion} disabled={deletingImplantacion} className={btnDanger}>
                        {deletingImplantacion ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        {t("fachadas.deleteImplantation")}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : activeTorre ? (
              /* ── Torre tab ── */
              <motion.div
                key={activeTorre.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                {/* Fachadas | Plantas toggle (hide for urbanismo/etapas — they only mark casas) */}
                {activeTorre.tipo !== "urbanismo" && renderViewModeToggle()}

                {/* Duplicate result toast */}
                {duplicateResult && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400">
                    <Check size={14} />
                    {duplicateResult}
                    <button onClick={() => setDuplicateResult(null)} className="ml-auto text-green-400/60 hover:text-green-400">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Instructions */}
                {selectedFachada && (
                  <p className="text-[11px] text-[var(--text-muted)]">
                    <strong>{t("fachadas.interactionHints.click")}</strong> = {t("fachadas.interactionHints.createPoint")} · <strong>{t("fachadas.interactionHints.clickOnPoint")}</strong> = {t("fachadas.interactionHints.assignUnit")} · <strong>{t("fachadas.interactionHints.drag")}</strong> = {t("fachadas.interactionHints.move")} · <strong>Arrastrar</strong> = {t("fachadas.interactionHints.rectSelection")}
                  </p>
                )}

                {/* No units warning */}
                {selectedFachada && unassignedUnits.length === 0 && assignedUnits.length === 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/15 text-xs text-amber-400/70">
                    <Package size={14} className="shrink-0" />
                    <span>
                      {t("fachadas.noUnitsWarning")}{" "}
                      <Link href={`/editor/${projectId}/inventario`} className="text-[var(--site-primary)] hover:underline">{t("fachadas.goToInventory")}</Link>{" "}
                      {t("fachadas.createUnitsFirst")}
                    </span>
                  </div>
                )}

                {/* Grid editor or empty state */}
                {visibleFachadas.length > 0 ? (
                  renderGridEditor(visibleFachadas)
                ) : viewMode === "planta" ? (
                  <div className={emptyState}>
                    <div className={emptyStateIcon}>
                      <Layers size={24} className="text-[var(--text-muted)]" />
                    </div>
                    <p className={emptyStateTitle}>{t("fachadas.plantas.noPlantas")}</p>
                    <p className={emptyStateDescription}>{t("fachadas.plantas.noPlantasDescription")}</p>
                    <button onClick={() => setShowPlantaTipoForm(true)} className={btnPrimary}>
                      <Plus size={14} />
                      {t("fachadas.plantas.addPlantaTipo")}
                    </button>
                  </div>
                ) : (
                  <div className={emptyState}>
                    <div className={emptyStateIcon}>
                      <ImageIcon size={24} className="text-[var(--text-muted)]" />
                    </div>
                    <p className={emptyStateTitle}>{t("fachadas.noGridsInTower")}</p>
                    <p className={emptyStateDescription}>{t("fachadas.noGridsInTowerDescription")}</p>
                    <button onClick={() => setShowAddForm(true)} className={btnPrimary}>
                      <Plus size={14} />
                      {t("fachadas.addGrid")}
                    </button>
                  </div>
                )}

                {/* Add grid/planta button (when grids exist) */}
                {visibleFachadas.length > 0 && viewMode === "fachada" && (
                  <div className="flex justify-center">
                    <button onClick={() => setShowAddForm(true)} className={btnSecondary}>
                      <Plus size={14} />
                      {t("fachadas.addGridToTower", { name: activeTorre.nombre })}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      )}

      {/* ============================================================
          SIMPLE MODE
          ============================================================ */}
      {!isMultiTorre && (
        <>
          {/* Fachadas | Plantas toggle */}
          {renderViewModeToggle()}

          {/* Duplicate result toast */}
          {duplicateResult && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400">
              <Check size={14} />
              {duplicateResult}
              <button onClick={() => setDuplicateResult(null)} className="ml-auto text-green-400/60 hover:text-green-400">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Compact instructions */}
          {selectedFachada && (
            <p className="text-[11px] text-[var(--text-muted)]">
              <strong>{t("fachadas.interactionHints.click")}</strong> = {t("fachadas.interactionHints.createPoint")} · <strong>{t("fachadas.interactionHints.clickOnPoint")}</strong> = {t("fachadas.interactionHints.assignUnit")} · <strong>{t("fachadas.interactionHints.drag")}</strong> = {t("fachadas.interactionHints.move")} · <strong>Arrastrar</strong> = {t("fachadas.interactionHints.rectSelection")}
            </p>
          )}

          {/* Empty state */}
          {!showGridEditor && viewMode === "planta" && (
            <div className={emptyState}>
              <div className={emptyStateIcon}>
                <Layers size={24} className="text-[var(--text-muted)]" />
              </div>
              <p className={emptyStateTitle}>{t("fachadas.plantas.noPlantas")}</p>
              <p className={emptyStateDescription}>{t("fachadas.plantas.noPlantasDescription")}</p>
              <button onClick={() => setShowPlantaTipoForm(true)} className={btnPrimary}>
                <Plus size={14} />
                {t("fachadas.plantas.addPlantaTipo")}
              </button>
            </div>
          )}
          {!showGridEditor && viewMode === "fachada" && fachadas.filter((f) => (f.tipo || "fachada") === "fachada").length === 0 && (
            <div className={emptyState}>
              <div className={emptyStateIcon}>
                <Eye size={24} className="text-[var(--text-muted)]" />
              </div>
              <p className={emptyStateTitle}>{t("fachadas.noGridsConfigured")}</p>
              <p className={emptyStateDescription}>{t("fachadas.noGridsConfiguredDescription")}</p>
              <div className="flex gap-6 text-center mb-5">
                {[t("fachadas.instructions.upload"), t("fachadas.instructions.click"), t("fachadas.instructions.assign")].map((text, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 max-w-[140px]">
                    <div className="w-8 h-8 rounded-full bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] flex items-center justify-center text-xs font-bold">{i + 1}</div>
                    <p className="text-xs text-[var(--text-tertiary)]">{text}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAddForm(true)} className={btnPrimary}>
                <Plus size={14} />
                {t("fachadas.addFirstGrid")}
              </button>
            </div>
          )}

          {/* No units warning */}
          {selectedFachada && unassignedUnits.length === 0 && assignedUnits.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/15 text-xs text-amber-400/70">
              <Package size={14} className="shrink-0" />
              <span>
                {t("fachadas.noUnitsWarning")}{" "}
                <Link href={`/editor/${projectId}/inventario`} className="text-[var(--site-primary)] hover:underline">{t("fachadas.goToInventory")}</Link>{" "}
                {t("fachadas.createUnitsFirst")}
              </span>
            </div>
          )}

          {/* Grid editor */}
          {showGridEditor && renderGridEditor(visibleFachadas)}
        </>
      )}

      {/* ============================================================
          MODALS (shared)
          ============================================================ */}

      {/* Add grid modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={resetAddForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl p-6 bg-[var(--surface-1)] rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-[var(--text-primary)] font-medium">
                  {isMultiTorre && activeTorre ? t("fachadas.newGridFor", { name: activeTorre.nombre }) : t("fachadas.newGrid")}
                </h3>
                <button onClick={resetAddForm} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div>
                <label className={labelClass}>{t("fachadas.name")}</label>
                <input type="text" value={newNombre} onChange={(e) => setNewNombre(e.target.value)} placeholder={t("fachadas.namePlaceholder")} className={inputClass} autoFocus />
              </div>
              <div>
                <label className={labelClass}>{t("fachadas.gridImageLabel")}</label>
                <FileUploader currentUrl={newImagenUrl || null} onUpload={(url) => setNewImagenUrl(url)} folder={`proyectos/${projectId}/fachadas`} label={t("fachadas.uploadGridImage")} />
              </div>
              {!isMultiTorre && (
                <>
                  <div>
                    <label className={labelClass}>{t("fachadas.numFloors")}</label>
                    <input type="number" value={newNumPisos} onChange={(e) => setNewNumPisos(e.target.value)} placeholder={t("fachadas.numFloorsPlaceholder")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("fachadas.descriptionLabel")}</label>
                    <textarea value={newDescripcion} onChange={(e) => setNewDescripcion(e.target.value)} placeholder={t("fachadas.descriptionPlaceholder")} rows={3} className={inputClass + " resize-none"} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("fachadas.amenities")}</label>
                    <input type="text" value={newAmenidades} onChange={(e) => setNewAmenidades(e.target.value)} placeholder={t("fachadas.amenitiesPlaceholder")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("fachadas.coverImage")}</label>
                    <FileUploader currentUrl={newImagenPortada || null} onUpload={(url) => setNewImagenPortada(url)} folder={`proyectos/${projectId}/fachadas`} label={t("fachadas.uploadCoverImage")} />
                  </div>
                </>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button onClick={handleAddFachada} disabled={addingFachada || !newNombre.trim() || !newImagenUrl} className={btnPrimary}>
                  {addingFachada ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {addingFachada ? t("fachadas.saving") : t("fachadas.saveGrid")}
                </button>
                <button onClick={resetAddForm} className={btnSecondary}>{t("fachadas.cancel")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add planta tipo modal */}
      <AnimatePresence>
        {showPlantaTipoForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={resetPlantaTipoForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg p-6 bg-[var(--surface-1)] rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-[var(--text-primary)] font-medium flex items-center gap-2">
                  <Layers size={16} className="text-[var(--site-primary)]" />
                  {t("fachadas.plantas.addPlantaTipo")}
                </h3>
                <button onClick={resetPlantaTipoForm} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div>
                <label className={labelClass}>{t("fachadas.plantas.plantaTipoName")}</label>
                <input
                  type="text"
                  value={plantaTipoNombre}
                  onChange={(e) => setPlantaTipoNombre(e.target.value)}
                  placeholder={t("fachadas.plantas.plantaTipoNamePlaceholder")}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>{t("fachadas.plantas.floorPlanImage")}</label>
                <FileUploader
                  currentUrl={plantaTipoImagenUrl || null}
                  onUpload={(url) => setPlantaTipoImagenUrl(url)}
                  folder={`proyectos/${projectId}/plantas`}
                  label={t("fachadas.plantas.uploadFloorPlan")}
                />
              </div>
              {torreFloors.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass + " !mb-0"}>Pisos asignados</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const available = torreFloors
                            .filter((f) => !assignedPisos.has(f.piso_numero))
                            .map((f) => f.piso_numero);
                          setPlantaTipoSelectedPisos(new Set(available));
                        }}
                        className="text-[10px] text-[var(--site-primary)] hover:underline"
                      >
                        Seleccionar todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlantaTipoSelectedPisos(new Set())}
                        className="text-[10px] text-[var(--text-muted)] hover:underline"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2.5 max-h-52 overflow-y-auto scrollbar-thin rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3">
                    {([
                      { name: "Sótano", color: "bg-white/20" },
                      { name: "Planta Baja", color: "bg-emerald-400/50" },
                      { name: "Podio", color: "bg-blue-400/50" },
                      { name: "Residencial", color: "bg-[rgba(var(--site-primary-rgb),0.6)]" },
                      { name: "Rooftop", color: "bg-amber-400/70" },
                    ] as const).map((section) => {
                      const sectionFloors = torreFloors.filter((f) => f.section === section.name);
                      if (sectionFloors.length === 0) return null;
                      return (
                        <div key={section.name}>
                          <p className="text-[10px] text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-sm ${section.color}`} />
                            {section.name}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {sectionFloors.map((floor) => {
                              const isAssigned = assignedPisos.has(floor.piso_numero);
                              const isSelected = plantaTipoSelectedPisos.has(floor.piso_numero);
                              return (
                                <button
                                  key={floor.piso_numero}
                                  type="button"
                                  disabled={isAssigned}
                                  onClick={() => {
                                    setPlantaTipoSelectedPisos((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(floor.piso_numero)) next.delete(floor.piso_numero);
                                      else next.add(floor.piso_numero);
                                      return next;
                                    });
                                  }}
                                  className={cn(
                                    "min-w-[2.25rem] px-2 py-1 rounded-lg text-[11px] font-mono transition-all border",
                                    isAssigned
                                      ? "opacity-25 cursor-not-allowed border-transparent bg-[var(--surface-2)] text-[var(--text-muted)] line-through"
                                      : isSelected
                                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.4)] text-[var(--site-primary)]"
                                        : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                                  )}
                                >
                                  {floor.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {plantaTipoSelectedPisos.size > 0 && (
                    <p className="text-[10px] text-[var(--site-primary)] mt-1.5">
                      {plantaTipoSelectedPisos.size} pisos seleccionados: {Array.from(plantaTipoSelectedPisos).sort((a, b) => a - b).map((p) => p < 0 ? `S${Math.abs(p)}` : p === 0 ? "PB" : `P${p}`).join(", ")}
                    </p>
                  )}
                  {assignedPisos.size > 0 && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      Los pisos tachados ya tienen planta tipo asignada
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className={labelClass}>{t("fachadas.plantas.floorRange")}</label>
                  <input
                    type="text"
                    value={plantaTipoPisos}
                    onChange={(e) => setPlantaTipoPisos(e.target.value)}
                    placeholder={t("fachadas.plantas.floorRangePlaceholder")}
                    className={inputClass}
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">{t("fachadas.plantas.floorRangeHint")}</p>
                  {plantaTipoPisos.trim() && (
                    <p className="text-[10px] text-[var(--site-primary)] mt-0.5">
                      {parseFloorRange(plantaTipoPisos).length > 0
                        ? `→ ${parseFloorRange(plantaTipoPisos).map((p) => `P${p}`).join(", ")}`
                        : ""}
                    </p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleAddPlantaTipo}
                  disabled={creatingPlantas || !plantaTipoNombre.trim() || !plantaTipoImagenUrl || (torreFloors.length > 0 ? plantaTipoSelectedPisos.size === 0 : parseFloorRange(plantaTipoPisos).length === 0)}
                  className={btnPrimary}
                >
                  {creatingPlantas ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {creatingPlantas ? t("fachadas.plantas.creating") : t("fachadas.plantas.createPlantaTipo")}
                </button>
                <button onClick={resetPlantaTipoForm} className={btnSecondary}>{t("fachadas.cancel")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duplicate hotspots modal */}
      <AnimatePresence>
        {showDuplicateModal && selectedFachada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDuplicateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm p-6 bg-[var(--surface-1)] rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-[var(--text-primary)] font-medium flex items-center gap-2">
                  <Copy size={16} className="text-[var(--site-primary)]" />
                  {t("fachadas.plantas.duplicateFrom", { from: selectedFachada.piso_numero ?? 0 })}
                </h3>
                <button onClick={() => setShowDuplicateModal(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                  <X size={16} />
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)]">{t("fachadas.plantas.selectTargetFloors")}</p>
              <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
                {duplicateTargetCandidates.map((f) => (
                  <label
                    key={f.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={duplicateTargetFloors.has(f.id)}
                      onChange={() => {
                        setDuplicateTargetFloors((prev) => {
                          const next = new Set(prev);
                          if (next.has(f.id)) next.delete(f.id); else next.add(f.id);
                          return next;
                        });
                      }}
                      className="w-3.5 h-3.5 accent-[var(--site-primary)]"
                    />
                    <span className="text-xs text-[var(--text-secondary)]">
                      {t("fachadas.plantas.floor", { n: f.piso_numero ?? 0 })}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleDuplicateHotspots}
                  disabled={duplicatingHotspots || duplicateTargetFloors.size === 0}
                  className={btnPrimary}
                >
                  {duplicatingHotspots ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                  {duplicatingHotspots ? t("fachadas.plantas.duplicating") : t("fachadas.plantas.duplicateHotspots")}
                </button>
                <button onClick={() => setShowDuplicateModal(false)} className={btnSecondary}>{t("fachadas.cancel")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

/* ====================================================================
   TorreInfoCard — Inline editable torre info
   ==================================================================== */
function TorreInfoCard({
  torre,
  projectId,
  onUpdate,
  onDelete,
  deleting,
  hideDelete = false,
}: {
  torre: Torre;
  projectId: string;
  onUpdate: (id: string, data: Partial<Torre>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  deleting: boolean;
  hideDelete?: boolean;
}) {
  const { t } = useTranslation("editor");
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(torre.nombre);
  const [numPisos, setNumPisos] = useState(torre.num_pisos?.toString() ?? "");
  const [descripcion, setDescripcion] = useState(torre.descripcion ?? "");
  const [amenidades, setAmenidades] = useState(torre.amenidades ?? "");
  const [caracteristicas, setCaracteristicas] = useState(torre.caracteristicas ?? "");
  const [imagenPortada, setImagenPortada] = useState(torre.imagen_portada ?? "");
  const [logoUrl, setLogoUrl] = useState(torre.logo_url ?? "");
  const [saving, setSaving] = useState(false);

  // Sync when torre changes (e.g. after refresh)
  useEffect(() => {
    setNombre(torre.nombre);
    setNumPisos(torre.num_pisos?.toString() ?? "");
    setDescripcion(torre.descripcion ?? "");
    setAmenidades(torre.amenidades ?? "");
    setCaracteristicas(torre.caracteristicas ?? "");
    setImagenPortada(torre.imagen_portada ?? "");
    setLogoUrl(torre.logo_url ?? "");
  }, [torre]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(torre.id, {
        nombre: nombre.trim(),
        num_pisos: numPisos ? parseInt(numPisos) : null,
        descripcion: descripcion.trim() || null,
        amenidades: amenidades.trim() || null,
        caracteristicas: caracteristicas.trim() || null,
        imagen_portada: imagenPortada || null,
        logo_url: logoUrl || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    // Compact read-only view
    return (
      <div className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] flex items-center gap-4">
        {/* Logo / portada preview */}
        {(torre.logo_url || torre.imagen_portada) && (
          <div className="h-12 max-w-[120px] rounded-lg overflow-hidden border border-[var(--border-subtle)] shrink-0 bg-[var(--surface-2)]">
            <img
              src={torre.logo_url || torre.imagen_portada || ""}
              alt={torre.nombre}
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-[var(--site-primary)] shrink-0" />
            <h3 className="text-sm font-medium text-white truncate">{torre.nombre}</h3>
            {torre.num_pisos && (
              <span className="text-[10px] text-[var(--text-muted)] shrink-0">{t("fachadas.floorCount", { n: torre.num_pisos })}</span>
            )}
          </div>
          {(torre.amenidades || torre.caracteristicas) && (
            <p className="text-[10px] text-[var(--text-tertiary)] truncate mt-0.5">
              {[torre.amenidades, torre.caracteristicas].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEditing(true)} className={btnSecondary}>
            {t("fachadas.edit")}
          </button>
          {!hideDelete && (
            <button onClick={() => onDelete(torre.id)} disabled={deleting} className={btnDanger}>
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Expanded edit view
  return (
    <div className="p-5 bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Building2 size={14} className="text-[var(--site-primary)]" />
          {t("fachadas.editTower")}
        </h3>
        <button onClick={() => setEditing(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-[11px]">
          {t("fachadas.cancelEdit")}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className={labelClass}>{t("fachadas.towerName")}</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t("fachadas.floors")}</label>
          <input type="number" value={numPisos} onChange={(e) => setNumPisos(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{t("fachadas.towerAmenities")}</label>
          <input type="text" value={amenidades} onChange={(e) => setAmenidades(e.target.value)} placeholder={t("fachadas.towerAmenitiesPlaceholder")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t("fachadas.characteristics")}</label>
          <input type="text" value={caracteristicas} onChange={(e) => setCaracteristicas(e.target.value)} placeholder={t("fachadas.characteristicsPlaceholder")} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t("fachadas.towerDescription")}</label>
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className={inputClass + " resize-none"} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{t("fachadas.towerCoverImage")}</label>
          <FileUploader currentUrl={imagenPortada || null} onUpload={(url) => setImagenPortada(url)} folder={`proyectos/${projectId}/torres`} label={t("fachadas.cover")} />
        </div>
        <div>
          <label className={labelClass}>{t("fachadas.logo")}</label>
          <FileUploader currentUrl={logoUrl || null} onUpload={(url) => setLogoUrl(url)} folder={`proyectos/${projectId}/torres`} label={t("fachadas.logo")} aspect="logo" />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button onClick={handleSave} disabled={saving || !nombre.trim()} className={btnPrimary}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? t("fachadas.savingChanges") : t("fachadas.saveChanges")}
        </button>
        <button onClick={() => setEditing(false)} className={btnSecondary}>{t("fachadas.cancel")}</button>
        {!hideDelete && (
          <>
            <div className="flex-1" />
            <button onClick={() => onDelete(torre.id)} disabled={deleting} className={btnDanger}>
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {t("fachadas.deleteTower")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
