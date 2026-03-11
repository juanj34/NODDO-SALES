"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
  sectionCard,
  pageHeader,
  pageTitle,
  pageDescription,
} from "@/components/dashboard/editor-styles";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Eye,
  Package,
  ChevronRight,
  Search,
  X,
  ChevronDown,
  Sparkles,
  Upload,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import type { Torre, Fachada, Unidad, AmenidadItem } from "@/types";
import {
  AMENIDADES_CATALOG,
  AMENIDADES_CATEGORIAS,
  DynamicIcon,
} from "@/data/amenidades-catalog";

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
  const { project, projectId, refresh } = useEditorProject();
  const toast = useToast();
  const { confirm } = useConfirm();

  const torres = project?.torres ?? [];
  const fachadas = project?.fachadas ?? [];
  const unidades = project?.unidades ?? [];

  /* ── Shared state ─────────────────────────────────────────────── */
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

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

  /* ── Add form state ───────────────────────────────────────────── */
  const [addNombre, setAddNombre] = useState(torres.length === 0 ? DEFAULTS.nombre : "");
  const [addPrefijo, setAddPrefijo] = useState("");
  const [addNameError, setAddNameError] = useState(false);

  /* ── Count helpers ────────────────────────────────────────────── */
  const fachadasForTorre = (torreId: string) =>
    fachadas.filter((f) => f.torre_id === torreId).length;
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
    setAddNameError(false);
    setShowAddForm(false);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!addNombre.trim()) {
      setAddNameError(true);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/torres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          nombre: addNombre.trim(),
          prefijo: addPrefijo.trim() || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        resetAddForm();
        await refresh();
        setSelectedTorreId(created.id);
        setTorreDetailTab("info");
        toast.success("Torre creada");
      } else {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        toast.error(err.error || `Error ${res.status}`);
        console.error("Torre creation failed:", res.status, err);
      }
    } catch (err) {
      toast.error("Error de conexión");
      console.error("Torre creation error:", err);
    } finally {
      setSaving(false);
    }
  }, [
    projectId,
    addNombre,
    addPrefijo,
    refresh,
    resetAddForm,
    toast,
  ]);

  /* ── Update torre (auto-save on blur) ─────────────────────────── */
  const handleUpdate = useCallback(
    async (torreId: string, data: Partial<Torre>) => {
      try {
        const res = await fetch(`/api/torres/${torreId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Error desconocido" }));
          toast.error(err.error || `Error al guardar (${res.status})`);
          return;
        }
        await refresh();
      } catch (err) {
        toast.error("Error de conexión al guardar");
        console.error("Torre update error:", err);
      }
    },
    [refresh, toast]
  );

  /* ── Delete torre ─────────────────────────────────────────────── */
  const handleDelete = useCallback(
    async (torreId: string) => {
      if (
        !(await confirm({
          title: t("torres.deleteTitle") || "Eliminar torre",
          message: t("torres.deleteConfirm"),
        }))
      )
        return;
      setDeletingId(torreId);
      try {
        // Detach fachadas
        await Promise.all(
          fachadas
            .filter((f) => f.torre_id === torreId)
            .map((f) =>
              fetch(`/api/fachadas/${f.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ torre_id: null }),
              })
            )
        );
        // Detach unidades
        await Promise.all(
          unidades
            .filter((u) => u.torre_id === torreId)
            .map((u) =>
              fetch(`/api/unidades/${u.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ torre_id: null }),
              })
            )
        );
        await fetch(`/api/torres/${torreId}`, { method: "DELETE" });
        // If the deleted torre was selected, reset selection
        if (selectedTorreId === torreId) setSelectedTorreId(null);
        await refresh();
      } finally {
        setDeletingId(null);
      }
    },
    [fachadas, unidades, selectedTorreId, refresh]
  );

  /* ── Disable multi-torre (keep first, delete rest) ────────────── */
  const handleDisable = useCallback(async () => {
    if (torres.length < 2) return;
    setDisabling(true);
    try {
      const first = torres[0];
      const rest = torres.slice(1);

      // Detach fachadas from deleted torres
      await Promise.all(
        fachadas
          .filter((f) => rest.some((t) => t.id === f.torre_id))
          .map((f) =>
            fetch(`/api/fachadas/${f.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ torre_id: null }),
            })
          )
      );
      // Detach unidades from deleted torres
      await Promise.all(
        unidades
          .filter((u) => rest.some((t) => t.id === u.torre_id))
          .map((u) =>
            fetch(`/api/unidades/${u.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ torre_id: null }),
            })
          )
      );
      // Delete all torres except the first
      await Promise.all(
        rest.map((t) => fetch(`/api/torres/${t.id}`, { method: "DELETE" }))
      );

      void first; // kept intentionally
      setShowDisableConfirm(false);
      setSelectedTorreId(null);
      await refresh();
    } finally {
      setDisabling(false);
    }
  }, [torres, fachadas, unidades, refresh]);

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
      <div className={pageHeader}>
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
              <Building2 size={18} className="text-[var(--site-primary)]" />
            </div>
            <div>
              <h1 className={pageTitle}>{t("torres.title")}</h1>
              <p className={pageDescription}>
                {t("torres.description")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Master-Detail Layout (always visible) ──────────────── */}
      <div className="flex gap-4" style={{ minHeight: "480px" }}>
        {/* ── Sidebar (left) ─────────────────────────────────────── */}
        <div className="w-56 shrink-0 flex flex-col gap-2">
          {/* Torre list */}
          {torres.map((torre) => {
            const isSelected = selectedTorreId === torre.id && !showAddForm;
            const nFachadas = fachadasForTorre(torre.id);
            const nUnidades = unidadesForTorre(torre.id);
            const hasData = !!(torre.num_pisos || nFachadas > 0 || nUnidades > 0);
            return (
              <button
                key={torre.id}
                onClick={() => {
                  setSelectedTorreId(torre.id);
                  setShowAddForm(false);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all",
                  isSelected
                    ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)]"
                    : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    isSelected
                      ? "bg-[rgba(var(--site-primary-rgb),0.15)]"
                      : "bg-[rgba(var(--site-primary-rgb),0.1)]"
                  )}>
                    <Building2 size={14} className="text-[var(--site-primary)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{torre.nombre}</p>
                    {hasData ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                        {(torre.pisos_residenciales || torre.num_pisos) && <span>{torre.pisos_residenciales || torre.num_pisos}p</span>}
                        {(torre.pisos_residenciales || torre.num_pisos) && (nUnidades > 0 || nFachadas > 0) && <span>·</span>}
                        {nUnidades > 0 && <span>{nUnidades} ud</span>}
                        {nUnidades > 0 && nFachadas > 0 && <span>·</span>}
                        {nFachadas > 0 && <span>{nFachadas} fach</span>}
                      </div>
                    ) : (
                      <p className="text-[10px] text-[var(--text-muted)] italic">{t("torres.notConfigured")}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Empty state hint when no torres */}
          {torres.length === 0 && (
            <div className="p-4 rounded-xl border border-dashed border-[var(--border-default)] text-center">
              <Building2 size={20} className="mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-[11px] text-[var(--text-tertiary)]">
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
            <Plus size={14} />
            {t("torres.addTower")}
          </button>

          {/* Disable multi-torre (only when 2+ torres) */}
          {torres.length >= 2 && (
            !showDisableConfirm ? (
              <button
                onClick={() => setShowDisableConfirm(true)}
                className={btnDanger + " w-full justify-center text-[11px]"}
              >
                <AlertTriangle size={12} />
                {t("torres.disableMulti")}
              </button>
            ) : (
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    size={14}
                    className="text-red-400 shrink-0 mt-0.5"
                  />
                  <p className="text-[10px] text-red-300 leading-relaxed">
                    {t("torres.disableWarning")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDisable}
                    disabled={disabling}
                    className="flex-1 px-3 py-1.5 text-[11px] font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {disabling ? "..." : t("torres.confirm")}
                  </button>
                  <button
                    onClick={() => setShowDisableConfirm(false)}
                    className="px-3 py-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {t("torres.no")}
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* ── Right panel ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
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
                  <h3 className="text-sm font-medium text-white mb-3">{t("torres.newTower")}</h3>
                  <div
                    className="grid grid-cols-[1fr_100px] gap-3 items-end"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAdd();
                      }
                    }}
                  >
                    <div>
                      <label className={labelClass}>{t("torres.nameRequired")}</label>
                      <input
                        type="text"
                        value={addNombre}
                        onChange={(e) => {
                          setAddNombre(e.target.value);
                          if (addNameError) setAddNameError(false);
                        }}
                        className={cn(inputClass, addNameError && "!border-red-500/60 !ring-1 !ring-red-500/30")}
                        placeholder={t("torres.namePlaceholder")}
                        autoFocus
                      />
                      {addNameError && (
                        <p className="text-[10px] text-red-400 mt-1">{t("torres.nameError")}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>{t("torres.prefix")}</label>
                      <input
                        type="text"
                        value={addPrefijo}
                        onChange={(e) => setAddPrefijo(e.target.value)}
                        className={inputClass}
                        placeholder="T1"

                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-2">
                    {t("torres.addHint")}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleAdd} disabled={saving} className={btnPrimary}>
                      {saving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      {saving ? t("torres.creating") : t("torres.createTower")}
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
                <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] mb-4">
                  {([
                    { id: "info" as const, label: t("torres.tabs.info"), icon: Building2 },
                    { id: "amenidades" as const, label: "Amenidades", icon: Sparkles },
                    { id: "fachadas" as const, label: t("torres.tabs.fachadas"), icon: Eye },
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
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          isActive
                            ? "bg-[var(--surface-3)] text-white shadow-sm"
                            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                        )}
                      >
                        <tab.icon size={13} />
                        {tab.label}
                        {count !== null && count > 0 && (
                          <span
                            className={cn(
                              "ml-1 px-1.5 py-0.5 text-[10px] rounded-full",
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
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                          deletingId={deletingId}
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
                      <AmenidadesTabContent
                        torre={selectedTorre}
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
                className="flex items-center justify-center h-64 text-sm text-[var(--text-muted)]"
              >
                Selecciona una torre de la lista
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
      <h3 className="text-sm font-medium text-white mb-2">
        {t("torres.fachadasOf", { name: torre.nombre })}
      </h3>
      <p className="text-xs text-[var(--text-tertiary)] mb-4">
        {t("torres.fachadasCount", { count: String(nFachadas) })}
      </p>
      {fachadasList.length > 0 ? (
        <div className="space-y-2">
          {fachadasList.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface-2)]">
              {f.imagen_url && (
                <img src={f.imagen_url} alt="" className="w-12 h-8 rounded object-cover" />
              )}
              <span className="text-xs text-[var(--text-secondary)]">{f.nombre}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">No hay fachadas asignadas.</p>
      )}
      <Link
        href={`/editor/${projectId}/fachadas`}
        className="inline-flex items-center gap-1.5 mt-4 text-xs text-[var(--site-primary)] hover:underline"
      >
        {t("torres.goToNoddoGrid")} <ChevronRight size={12} />
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
      <h3 className="text-sm font-medium text-white mb-2">
        {t("torres.unitsOf", { name: torre.nombre })}
      </h3>
      <p className="text-xs text-[var(--text-tertiary)] mb-4">
        {t("torres.unitsCount", { count: String(nUnidades) })}
      </p>
      {unidadesList.length > 0 ? (
        <div className="space-y-2">
          {unidadesList.map((u) => {
            const tipNombre = getTipologiaNombre(u.tipologia_id);
            return (
              <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface-2)]">
                <span className="text-xs font-medium text-white">{u.identificador}</span>
                {tipNombre && (
                  <span className="text-[10px] text-[var(--text-muted)]">{tipNombre}</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">No hay unidades asignadas.</p>
      )}
      <Link
        href={`/editor/${projectId}/inventario`}
        className="inline-flex items-center gap-1.5 mt-4 text-xs text-[var(--site-primary)] hover:underline"
      >
        {t("torres.goToInventory")} <ChevronRight size={12} />
      </Link>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   AmenidadesTabContent — icon picker + custom amenity editor
   ════════════════════════════════════════════════════════════════════ */

interface AmenidadesTabContentProps {
  torre: Torre;
  projectId: string;
  onUpdate: (torreId: string, data: Partial<Torre>) => Promise<void>;
}

function AmenidadesTabContent({ torre, projectId, onUpdate }: AmenidadesTabContentProps) {
  const [search, setSearch] = useState("");
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [customNombre, setCustomNombre] = useState("");
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  const selected: AmenidadItem[] = torre.amenidades_data ?? [];
  const selectedIds = new Set(selected.map((a) => a.id));

  const toggleCat = (cat: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggle = (item: { id: string; nombre: string; icono: string }) => {
    let next: AmenidadItem[];
    if (selectedIds.has(item.id)) {
      next = selected.filter((a) => a.id !== item.id);
    } else {
      next = [...selected, { id: item.id, nombre: item.nombre, icono: item.icono }];
    }
    onUpdate(torre.id, { amenidades_data: next });
  };

  const remove = (id: string) => {
    const next = selected.filter((a) => a.id !== id);
    onUpdate(torre.id, { amenidades_data: next });
  };

  const addCustom = () => {
    if (!customNombre.trim()) return;
    const id = `custom-${Date.now()}`;
    const next: AmenidadItem[] = [
      ...selected,
      {
        id,
        nombre: customNombre.trim(),
        icono: "Star",
        ...(customIconUrl ? { icon_url: customIconUrl } : {}),
      },
    ];
    onUpdate(torre.id, { amenidades_data: next });
    setCustomNombre("");
    setCustomIconUrl("");
    setShowCustomForm(false);
  };

  const filteredCatalog = search.trim()
    ? AMENIDADES_CATALOG.filter((a) =>
        a.nombre.toLowerCase().includes(search.toLowerCase())
      )
    : AMENIDADES_CATALOG;

  const categoriesWithItems = AMENIDADES_CATEGORIAS.filter((cat) =>
    filteredCatalog.some((a) => a.categoria === cat)
  );

  return (
    <div className={sectionCard}>
      {/* Selected amenities */}
      {selected.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase mb-2">
            Seleccionadas ({selected.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.2)] rounded-lg text-xs text-[var(--site-primary)]"
              >
                {a.icon_url ? (
                  <img src={a.icon_url} alt="" className="w-3.5 h-3.5 object-contain" />
                ) : (
                  <DynamicIcon name={a.icono} size={12} />
                )}
                {a.nombre}
                <button
                  onClick={() => remove(a.id)}
                  className="ml-0.5 p-0.5 rounded hover:bg-white/10 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass + " pl-9"}
          placeholder="Buscar amenidades..."
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Catalog by categories */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-hide">
        {categoriesWithItems.map((cat) => {
          const items = filteredCatalog.filter((a) => a.categoria === cat);
          const isCollapsed = collapsedCats.has(cat);

          return (
            <div key={cat}>
              <button
                onClick={() => toggleCat(cat)}
                className="flex items-center gap-2 w-full text-left mb-2 group"
              >
                <ChevronDown
                  size={12}
                  className={cn(
                    "text-[var(--text-muted)] transition-transform",
                    isCollapsed && "-rotate-90"
                  )}
                />
                <span className="text-[10px] tracking-wider uppercase text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                  {cat}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {items.filter((i) => selectedIds.has(i.id)).length}/{items.length}
                </span>
              </button>
              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-1.5 ml-4">
                  {items.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggle(item)}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all text-left",
                          isSelected
                            ? "bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.25)] text-[var(--site-primary)]"
                            : "bg-[var(--surface-2)] border border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-3)]"
                        )}
                      >
                        <DynamicIcon name={item.icono} size={14} className="flex-shrink-0" />
                        <span className="truncate">{item.nombre}</span>
                        {isSelected && <Check size={12} className="ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom amenity */}
      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
        {showCustomForm ? (
          <div className="space-y-3">
            <p className="text-[10px] tracking-wider uppercase text-[var(--text-tertiary)]">
              Amenidad personalizada
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className={labelClass}>Nombre</label>
                <input
                  type="text"
                  value={customNombre}
                  onChange={(e) => setCustomNombre(e.target.value)}
                  className={inputClass}
                  placeholder="Ej: Sala de lectura"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                />
              </div>
              <div className="w-20">
                <label className={labelClass}>Icono</label>
                <div className="w-full">
                  <FileUploader
                    currentUrl={customIconUrl || null}
                    onUpload={(url) => setCustomIconUrl(url)}
                    folder={`proyectos/${projectId}/amenidades`}
                    label=""
                    aspect="square"
                    minWidth={64}
                    minHeight={64}
                    enablePaste={false}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addCustom} disabled={!customNombre.trim()} className={btnPrimary}>
                <Plus size={14} />
                Agregar
              </button>
              <button
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomNombre("");
                  setCustomIconUrl("");
                }}
                className={btnSecondary}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomForm(true)}
            className={cn(btnSecondary, "w-full justify-center")}
          >
            <Plus size={14} />
            Amenidad personalizada
          </button>
        )}
      </div>
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
  onUpdate: (torreId: string, data: Partial<Torre>) => Promise<void>;
  onDelete: (torreId: string) => Promise<void>;
  deletingId: string | null;
}

function TorreEditFormInline({
  torre,
  projectId,
  onUpdate,
  onDelete,
  deletingId,
}: TorreEditFormInlineProps) {
  const { t } = useTranslation("editor");

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

  // Sync from prop when torre data changes (e.g. after refresh)
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
  }, [torre]);

  const compositionFields = [
    { key: "pisos_sotano" as const, label: "Sótanos", placeholder: "0", value: pisosSotano, setter: setPisosSotano },
    { key: "pisos_planta_baja" as const, label: "Planta Baja", placeholder: "1", value: pisosPlantaBaja, setter: setPisosPlantaBaja },
    { key: "pisos_podio" as const, label: "Podios", placeholder: "0", value: pisosPodio, setter: setPisosPodio },
    { key: "pisos_residenciales" as const, label: "Residencial", placeholder: "0", value: pisosResidenciales, setter: setPisosResidenciales },
    { key: "pisos_rooftop" as const, label: "Rooftop", placeholder: "0", value: pisosRooftop, setter: setPisosRooftop },
  ];

  return (
    <div className="space-y-4">
      {/* Row 1: Nombre */}
      <div>
        <label className={labelClass}>{t("torres.infoForm.name")}</label>
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

      {/* Composición del edificio */}
      <div>
        <label className={labelClass}>Composición del edificio</label>
        <div className="grid grid-cols-5 gap-3 mt-1">
          {compositionFields.map((field) => (
            <div key={field.key} className="text-center">
              <p className="text-[10px] text-[var(--text-tertiary)] mb-1">{field.label}</p>
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
          const s = torre.pisos_sotano || 0;
          const pb = torre.pisos_planta_baja || 0;
          const pod = torre.pisos_podio || 0;
          const res = torre.pisos_residenciales || 0;
          const rt = torre.pisos_rooftop || 0;
          const total = s + pb + pod + res + rt;
          if (total === 0) return null;

          const sections = [
            { label: "Rooftop", count: rt, color: "bg-amber-400/70", text: "text-amber-300" },
            { label: "Residencial", count: res, color: "bg-[rgba(var(--site-primary-rgb),0.5)]", text: "text-[var(--site-primary)]" },
            { label: "Podio", count: pod, color: "bg-blue-400/30", text: "text-blue-300" },
            { label: "PB", count: pb, color: "bg-emerald-400/30", text: "text-emerald-300" },
            { label: "Sótano", count: s, color: "bg-white/8", text: "text-[var(--text-muted)]" },
          ].filter((sec) => sec.count > 0);

          return (
            <div className="mt-3 flex items-stretch gap-3">
              {/* Stacked bar */}
              <div className="w-10 flex flex-col-reverse rounded-lg overflow-hidden border border-[var(--border-subtle)]" style={{ height: Math.min(total * 8 + 16, 140) }}>
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
                  <div key={sec.label} className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-sm", sec.color)} />
                    <span className="text-[10px] text-[var(--text-tertiary)]">{sec.label}</span>
                    <span className={cn("text-[10px] font-medium", sec.text)}>{sec.count}</span>
                  </div>
                ))}
                <div className="border-t border-[var(--border-subtle)] mt-1 pt-1">
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">Total: {total} niveles</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Row: Prefijo */}
      <div>
        <label className={labelClass}>{t("torres.infoForm.prefix")}</label>
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
        <p className="text-[10px] text-[var(--text-muted)] mt-1">{t("torres.infoForm.prefixHint")}</p>
      </div>

      {/* Características */}
      <div>
        <label className={labelClass}>{t("torres.infoForm.features")}</label>
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
        <label className={labelClass}>{t("torres.infoForm.description")}</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          onBlur={(e) => {
            const val = e.target.value.trim() || null;
            if (val !== torre.descripcion) {
              onUpdate(torre.id, { descripcion: val });
            }
          }}
          rows={3}
          className={inputClass + " resize-none"}
          placeholder={t("torres.infoForm.descriptionPlaceholder")}
        />
      </div>

      {/* Row 5: Imagen de portada + Logo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t("torres.infoForm.coverImage")}</label>
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
          <label className={labelClass}>{t("torres.infoForm.logo")}</label>
          <FileUploader
            currentUrl={torre.logo_url || null}
            onUpload={(url) => onUpdate(torre.id, { logo_url: url })}
            folder={`proyectos/${projectId}/torres`}
            label={t("torres.infoForm.uploadLogo")}
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
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Trash2 size={12} />
          )}
          {t("torres.infoForm.deleteTower")}
        </button>
      </div>
    </div>
  );
}

