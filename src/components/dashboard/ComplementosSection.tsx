"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Search,
  ChevronDown,
  Loader2,
  AlertTriangle,
  CheckSquare,
  Square,
  MinusSquare,
  Car,
  Warehouse,
  Link,
  Unlink,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
} from "@/components/dashboard/editor-styles";
import type { ProyectoCompleto, Complemento, ComplementoMode, Unidad, Torre } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EstadoComplemento = Complemento["estado"];
type TipoComplemento = Complemento["tipo"];
type ActiveTab = "parqueadero" | "deposito";

interface ComplementosSectionProps {
  project: ProyectoCompleto;
  onRefresh: () => void;
  parqueaderosMode?: ComplementoMode;
  depositosMode?: ComplementoMode;
}

interface ComplementoFormData {
  identificador: string;
  tipo: TipoComplemento;
  subtipo: string;
  nivel: string;
  area_m2: string;
  precio: string;
  estado: EstadoComplemento;
  unidad_id: string;
  notas: string;
  torre_id: string;
}

interface ToastState {
  message: string;
  type: "success" | "error";
  id: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ESTADOS: { value: EstadoComplemento; label: string }[] = [
  { value: "disponible", label: "Disponible" },
  { value: "separado", label: "Separado" },
  { value: "reservada", label: "Reservada" },
  { value: "vendida", label: "Vendida" },
];

const ESTADO_COLORS: Record<EstadoComplemento, string> = {
  disponible: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  separado: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  reservada: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  vendida: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const EMPTY_FORM: ComplementoFormData = {
  identificador: "",
  tipo: "parqueadero",
  subtipo: "",
  nivel: "",
  area_m2: "",
  precio: "",
  estado: "disponible",
  unidad_id: "",
  notas: "",
  torre_id: "",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EstadoBadge({ estado }: { estado: EstadoComplemento }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${ESTADO_COLORS[estado]}`}
    >
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Car;
  accent?: string;
}) {
  return (
    <div className="p-3 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
        <div
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            accent || "bg-[var(--surface-3)]"
          )}
        >
          <Icon size={14} className={accent ? "text-white" : "text-[var(--text-tertiary)]"} />
        </div>
      </div>
      <p className="text-xl font-light text-white">{value}</p>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <h3 className="text-sm font-medium text-white">{title}</h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className={btnSecondary}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/80 text-white rounded-lg text-xs font-medium hover:bg-red-500 transition-all"
          >
            <Trash2 size={12} />
            Eliminar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InlineToast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl",
        toast.type === "success"
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          : "bg-red-500/15 text-red-400 border border-red-500/30"
      )}
    >
      {toast.type === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
      {toast.message}
      <button onClick={onDismiss} className="ml-2 hover:opacity-70 transition-opacity">
        <X size={12} />
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Complemento Form (Inline Create / Edit)
// ---------------------------------------------------------------------------

function ComplementoForm({
  initial,
  unidades,
  torres,
  onSubmit,
  onCancel,
  submitting,
  showPrecio = true,
}: {
  initial: ComplementoFormData;
  unidades: Unidad[];
  torres: Torre[];
  onSubmit: (data: ComplementoFormData) => void;
  onCancel: () => void;
  submitting: boolean;
  showPrecio?: boolean;
}) {
  const [form, setForm] = useState<ComplementoFormData>(initial);
  const [unitSearch, setUnitSearch] = useState("");
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const set = (field: keyof ComplementoFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const filteredUnits = useMemo(() => {
    if (!unitSearch.trim()) return unidades.slice(0, 20);
    const q = unitSearch.toLowerCase();
    return unidades
      .filter((u) => u.identificador.toLowerCase().includes(q))
      .slice(0, 20);
  }, [unidades, unitSearch]);

  const selectedUnit = unidades.find((u) => u.id === form.unidad_id);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-5 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Identificador */}
          <div>
            <label className={labelClass}>Identificador</label>
            <input
              type="text"
              value={form.identificador}
              onChange={(e) => set("identificador", e.target.value)}
              placeholder="P-01"
              className={inputClass}
            />
          </div>

          {/* Tipo */}
          <div>
            <label className={labelClass}>Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
              className={inputClass}
            >
              <option value="parqueadero" className="bg-[var(--surface-2)]">
                Parqueadero
              </option>
              <option value="deposito" className="bg-[var(--surface-2)]">
                Deposito
              </option>
            </select>
          </div>

          {/* Subtipo */}
          <div>
            <label className={labelClass}>Subtipo</label>
            <input
              type="text"
              value={form.subtipo}
              onChange={(e) => set("subtipo", e.target.value)}
              placeholder="Cubierto, Doble..."
              className={inputClass}
            />
          </div>

          {/* Nivel */}
          <div>
            <label className={labelClass}>Nivel</label>
            <input
              type="text"
              value={form.nivel}
              onChange={(e) => set("nivel", e.target.value)}
              placeholder="Sotano 1"
              className={inputClass}
            />
          </div>

          {/* Area m2 */}
          <div>
            <label className={labelClass}>Area m2</label>
            <input
              type="number"
              value={form.area_m2}
              onChange={(e) => set("area_m2", e.target.value)}
              placeholder="12.5"
              className={inputClass}
            />
          </div>

          {/* Precio — only when mode is inventario_separado */}
          {showPrecio && (
            <div>
              <label className={labelClass}>Precio</label>
              <input
                type="number"
                value={form.precio}
                onChange={(e) => set("precio", e.target.value)}
                placeholder="45000000"
                className={inputClass}
              />
            </div>
          )}

          {/* Estado */}
          <div>
            <label className={labelClass}>Estado</label>
            <select
              value={form.estado}
              onChange={(e) => set("estado", e.target.value)}
              className={inputClass}
            >
              {ESTADOS.map((e) => (
                <option
                  key={e.value}
                  value={e.value}
                  className="bg-[var(--surface-2)]"
                >
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          {/* Torre */}
          {torres.length > 0 && (
            <div>
              <label className={labelClass}>Torre</label>
              <select
                value={form.torre_id}
                onChange={(e) => set("torre_id", e.target.value)}
                className={inputClass}
              >
                <option value="" className="bg-[var(--surface-2)]">
                  Sin torre
                </option>
                {torres.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[var(--surface-2)]">
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Unidad asignada (searchable dropdown) */}
          <div className="relative">
            <label className={labelClass}>Asignar a unidad</label>
            <div className="relative">
              <input
                type="text"
                value={showUnitDropdown ? unitSearch : selectedUnit?.identificador || ""}
                onChange={(e) => {
                  setUnitSearch(e.target.value);
                  setShowUnitDropdown(true);
                }}
                onFocus={() => setShowUnitDropdown(true)}
                placeholder="Buscar unidad..."
                className={inputClass}
              />
              {form.unidad_id && (
                <button
                  onClick={() => {
                    set("unidad_id", "");
                    setUnitSearch("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <AnimatePresence>
              {showUnitDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full mt-1 bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg shadow-2xl z-30 max-h-48 overflow-y-auto"
                >
                  <button
                    onClick={() => {
                      set("unidad_id", "");
                      setUnitSearch("");
                      setShowUnitDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    Sin asignar
                  </button>
                  {filteredUnits.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        set("unidad_id", u.id);
                        setUnitSearch("");
                        setShowUnitDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between",
                        form.unidad_id === u.id
                          ? "text-[var(--site-primary)]"
                          : "text-[var(--text-secondary)]"
                      )}
                    >
                      <span>{u.identificador}</span>
                      {u.tipologia_id && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          Piso {u.piso ?? "-"}
                        </span>
                      )}
                    </button>
                  ))}
                  {filteredUnits.length === 0 && (
                    <p className="px-3 py-2 text-xs text-[var(--text-muted)]">
                      No se encontraron unidades
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <label className={labelClass}>Notas</label>
            <input
              type="text"
              value={form.notas}
              onChange={(e) => set("notas", e.target.value)}
              placeholder="Observaciones adicionales"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => onSubmit(form)}
            disabled={!form.identificador.trim() || submitting}
            className={btnPrimary}
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {submitting ? "Guardando..." : "Guardar"}
          </button>
          <button onClick={onCancel} className={btnSecondary}>
            <X size={14} />
            Cancelar
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ComplementosSection({ project, onRefresh, parqueaderosMode, depositosMode }: ComplementosSectionProps) {
  // --- Modes ---
  const pMode = parqueaderosMode ?? (project.parqueaderos_mode as ComplementoMode) ?? "sin_inventario";
  const dMode = depositosMode ?? (project.depositos_mode as ComplementoMode) ?? "sin_inventario";
  const showParqueaderos = pMode !== "sin_inventario";
  const showDepositos = dMode !== "sin_inventario";
  const showPrecioParq = pMode === "inventario_separado";
  const showPrecioDepo = dMode === "inventario_separado";

  // --- Data ---
  const complementos: Complemento[] = useMemo(() => (project.complementos || []) as Complemento[], [project.complementos]);
  const unidades = useMemo(() => project.unidades || [], [project.unidades]);
  const torres: Torre[] = useMemo(() => project.torres || [], [project.torres]);
  const isMultiTorre = torres.length > 1;

  // --- UI state ---
  const defaultTab: ActiveTab = showParqueaderos ? "parqueadero" : "deposito";
  const [activeTab, setActiveTab] = useState<ActiveTab>(defaultTab);
  const [activeTorreId, setActiveTorreId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEstado, setBulkEstado] = useState<EstadoComplemento>("disponible");
  const [bulkUnidadId, setBulkUnidadId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // --- Form state ---
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // --- Modals ---
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // --- Toast ---
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastCounterRef = useRef(0);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = ++toastCounterRef.current;
    setToast({ message, type, id });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  }, []);

  // --- Filtering ---
  const filteredComplementos = useMemo(() => {
    return complementos.filter((c) => {
      // Type filter
      if (c.tipo !== activeTab) return false;

      // Torre filter
      if (isMultiTorre) {
        if (activeTorreId === "__none__") {
          if (c.torre_id) return false;
        } else if (activeTorreId) {
          if (c.torre_id !== activeTorreId) return false;
        }
      }

      // Search filter
      if (
        searchQuery &&
        !c.identificador.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;

      return true;
    });
  }, [complementos, activeTab, isMultiTorre, activeTorreId, searchQuery]);

  // --- Stats ---
  const stats = useMemo(() => {
    const parqueaderos = complementos.filter((c) => c.tipo === "parqueadero");
    const depositos = complementos.filter((c) => c.tipo === "deposito");
    const asignados = complementos.filter((c) => c.unidad_id);
    const sinAsignar = complementos.filter((c) => !c.unidad_id);
    return {
      parqueaderos: parqueaderos.length,
      depositos: depositos.length,
      asignados: asignados.length,
      sinAsignar: sinAsignar.length,
    };
  }, [complementos]);

  // --- Selection helpers ---
  const allFilteredSelected =
    filteredComplementos.length > 0 &&
    filteredComplementos.every((c) => selectedIds.has(c.id));
  const someFilteredSelected =
    filteredComplementos.some((c) => selectedIds.has(c.id)) &&
    !allFilteredSelected;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredComplementos.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // --- Helpers ---
  const getUnitIdentificador = useCallback(
    (unidadId: string | null): string | null => {
      if (!unidadId) return null;
      const unit = unidades.find((u) => u.id === unidadId);
      return unit?.identificador ?? null;
    },
    [unidades]
  );

  // --- CRUD handlers ---
  const handleCreate = useCallback(
    async (data: ComplementoFormData) => {
      setFormLoading(true);
      try {
        const res = await fetch("/api/complementos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proyecto_id: project.id,
            identificador: data.identificador,
            tipo: data.tipo,
            subtipo: data.subtipo || null,
            nivel: data.nivel || null,
            area_m2: data.area_m2 ? parseFloat(data.area_m2) : null,
            precio: data.precio ? parseFloat(data.precio) : null,
            estado: data.estado,
            unidad_id: data.unidad_id || null,
            notas: data.notas || null,
            torre_id: data.torre_id || (isMultiTorre && activeTorreId && activeTorreId !== "__none__" ? activeTorreId : null),
          }),
        });
        if (!res.ok) throw new Error("Error creating complemento");
        setShowCreateForm(false);
        showToast("Complemento creado");
        await onRefresh();
      } catch {
        showToast("Error al crear complemento", "error");
      } finally {
        setFormLoading(false);
      }
    },
    [project.id, onRefresh, showToast, isMultiTorre, activeTorreId]
  );

  const handleUpdate = useCallback(
    async (id: string, data: ComplementoFormData) => {
      setFormLoading(true);
      try {
        const res = await fetch(`/api/complementos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identificador: data.identificador,
            tipo: data.tipo,
            subtipo: data.subtipo || null,
            nivel: data.nivel || null,
            area_m2: data.area_m2 ? parseFloat(data.area_m2) : null,
            precio: data.precio ? parseFloat(data.precio) : null,
            estado: data.estado,
            unidad_id: data.unidad_id || null,
            notas: data.notas || null,
            torre_id: data.torre_id || null,
          }),
        });
        if (!res.ok) throw new Error("Error updating complemento");
        setEditingId(null);
        showToast("Complemento actualizado");
        await onRefresh();
      } catch {
        showToast("Error al actualizar complemento", "error");
      } finally {
        setFormLoading(false);
      }
    },
    [onRefresh, showToast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/complementos/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error deleting complemento");
        setDeleteConfirm(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        showToast("Complemento eliminado");
        await onRefresh();
      } catch {
        showToast("Error al eliminar complemento", "error");
      }
    },
    [onRefresh, showToast]
  );

  // --- Bulk operations ---
  const handleBulkStatusChange = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/complementos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: bulkEstado }),
        })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      showToast(`Estado actualizado (${promises.length})`);
      await onRefresh();
    } catch {
      showToast("Error al cambiar estado", "error");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, bulkEstado, onRefresh, showToast]);

  const handleBulkAssign = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const assignments = Array.from(selectedIds).map((complemento_id) => ({
        complemento_id,
        unidad_id: bulkUnidadId || null,
      }));
      const res = await fetch("/api/complementos/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      });
      if (!res.ok) throw new Error("Error assigning");
      setSelectedIds(new Set());
      setBulkUnidadId("");
      showToast(`Asignacion actualizada (${assignments.length})`);
      await onRefresh();
    } catch {
      showToast("Error al asignar", "error");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, bulkUnidadId, onRefresh, showToast]);

  const handleBulkClearAssignment = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const assignments = Array.from(selectedIds).map((complemento_id) => ({
        complemento_id,
        unidad_id: null,
      }));
      const res = await fetch("/api/complementos/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      });
      if (!res.ok) throw new Error("Error clearing assignment");
      setSelectedIds(new Set());
      showToast("Asignacion removida");
      await onRefresh();
    } catch {
      showToast("Error al remover asignacion", "error");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, onRefresh, showToast]);

  // --- Build edit form initial data ---
  const getEditFormData = (c: Complemento): ComplementoFormData => ({
    identificador: c.identificador,
    tipo: c.tipo,
    subtipo: c.subtipo || "",
    nivel: c.nivel || "",
    area_m2: c.area_m2 != null ? String(c.area_m2) : "",
    precio: c.precio != null ? String(c.precio) : "",
    estado: c.estado,
    unidad_id: c.unidad_id || "",
    notas: c.notas || "",
    torre_id: c.torre_id || "",
  });

  // --- Create form initial ---
  const createFormInitial = useMemo((): ComplementoFormData => {
    return {
      ...EMPTY_FORM,
      tipo: activeTab,
      torre_id: isMultiTorre && activeTorreId && activeTorreId !== "__none__" ? activeTorreId : "",
    };
  }, [activeTab, isMultiTorre, activeTorreId]);

  // --- Tab counts ---
  const parqueaderoCount = complementos.filter((c) => c.tipo === "parqueadero").length;
  const depositoCount = complementos.filter((c) => c.tipo === "deposito").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Parqueaderos"
          value={stats.parqueaderos}
          icon={Car}
          accent="bg-[rgba(184,151,58,0.15)]"
        />
        <StatCard
          label="Depositos"
          value={stats.depositos}
          icon={Warehouse}
          accent="bg-[rgba(184,151,58,0.15)]"
        />
        <StatCard
          label="Asignados"
          value={stats.asignados}
          icon={Link}
          accent="bg-emerald-500/15"
        />
        <StatCard
          label="Sin asignar"
          value={stats.sinAsignar}
          icon={Unlink}
        />
      </div>

      {/* Type tabs — only show tabs for enabled modes */}
      {showParqueaderos && showDepositos ? (
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
          <button
            onClick={() => {
              setActiveTab("parqueadero");
              setSelectedIds(new Set());
              setSearchQuery("");
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
              activeTab === "parqueadero"
                ? "bg-[var(--surface-3)] text-white shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            )}
          >
            <Car size={14} />
            Parqueaderos
            <span className="text-[10px] text-[var(--text-muted)]">{parqueaderoCount}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("deposito");
              setSelectedIds(new Set());
              setSearchQuery("");
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
              activeTab === "deposito"
                ? "bg-[var(--surface-3)] text-white shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            )}
          >
            <Warehouse size={14} />
            Depositos
            <span className="text-[10px] text-[var(--text-muted)]">{depositoCount}</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          {showParqueaderos && <><Car size={14} /> Parqueaderos ({parqueaderoCount})</>}
          {showDepositos && <><Warehouse size={14} /> Depósitos ({depositoCount})</>}
        </div>
      )}

      {/* Torre tabs (when multi-torre) */}
      {isMultiTorre && (
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-x-auto scrollbar-thin">
          <button
            onClick={() => {
              setActiveTorreId(null);
              setSelectedIds(new Set());
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
              activeTorreId === null
                ? "bg-[var(--surface-3)] text-white shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            )}
          >
            Todas
            <span className="text-[10px] text-[var(--text-muted)]">
              {complementos.filter((c) => c.tipo === activeTab).length}
            </span>
          </button>
          {torres.map((torre) => {
            const count = complementos.filter(
              (c) => c.tipo === activeTab && c.torre_id === torre.id
            ).length;
            return (
              <button
                key={torre.id}
                onClick={() => {
                  setActiveTorreId(torre.id);
                  setSelectedIds(new Set());
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                  activeTorreId === torre.id
                    ? "bg-[var(--surface-3)] text-white shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
              >
                <Building2 size={13} />
                {torre.nombre}
                <span className="text-[10px] text-[var(--text-muted)]">{count}</span>
              </button>
            );
          })}
          {complementos.some((c) => c.tipo === activeTab && !c.torre_id) && (
            <button
              onClick={() => {
                setActiveTorreId("__none__");
                setSelectedIds(new Set());
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                activeTorreId === "__none__"
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
            >
              Sin torre
              <span className="text-[10px] text-[var(--text-muted)]">
                {complementos.filter((c) => c.tipo === activeTab && !c.torre_id).length}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Search + Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por identificador..."
            className={inputClass + " pl-9"}
          />
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingId(null);
          }}
          className={btnPrimary}
        >
          <Plus size={14} />
          {activeTab === "parqueadero" ? "Nuevo parqueadero" : "Nuevo deposito"}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreateForm && (
          <ComplementoForm
            key={`create-${activeTab}-${activeTorreId}`}
            initial={createFormInitial}
            unidades={unidades}
            torres={torres}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            submitting={formLoading}
            showPrecio={activeTab === "parqueadero" ? showPrecioParq : showPrecioDepo}
          />
        )}
      </AnimatePresence>

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 bg-[rgba(184,151,58,0.05)] border border-[rgba(184,151,58,0.2)] rounded-xl flex-wrap">
              <span className="text-xs text-[#b8973a]">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </span>

              {/* Change status */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-[var(--text-tertiary)]">Estado:</span>
                <div className="relative">
                  <select
                    value={bulkEstado}
                    onChange={(e) =>
                      setBulkEstado(e.target.value as EstadoComplemento)
                    }
                    className={inputClass + " w-36 appearance-none pr-8 py-1.5"}
                  >
                    {ESTADOS.map((e) => (
                      <option
                        key={e.value}
                        value={e.value}
                        className="bg-[var(--surface-2)]"
                      >
                        {e.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                  />
                </div>
                <button
                  onClick={handleBulkStatusChange}
                  disabled={bulkLoading}
                  className={btnPrimary}
                >
                  {bulkLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Aplicar
                </button>
              </div>

              {/* Assign to unit */}
              <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-tertiary)]">Asignar:</span>
                <div className="relative">
                  <select
                    value={bulkUnidadId}
                    onChange={(e) => setBulkUnidadId(e.target.value)}
                    className={inputClass + " w-40 appearance-none pr-8 py-1.5"}
                  >
                    <option value="" className="bg-[var(--surface-2)]">
                      Seleccionar unidad
                    </option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id} className="bg-[var(--surface-2)]">
                        {u.identificador}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                  />
                </div>
                <button
                  onClick={handleBulkAssign}
                  disabled={bulkLoading || !bulkUnidadId}
                  className={btnPrimary}
                >
                  <Link size={14} />
                  Asignar
                </button>
                <button
                  onClick={handleBulkClearAssignment}
                  disabled={bulkLoading}
                  className={btnSecondary}
                >
                  <Unlink size={14} />
                  Quitar
                </button>
              </div>

              {/* Deselect */}
              <button
                onClick={() => setSelectedIds(new Set())}
                className={btnSecondary}
              >
                <X size={14} />
                Deseleccionar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data table */}
      <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="text-left py-3 px-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {allFilteredSelected ? (
                      <CheckSquare size={16} className="text-[#b8973a]" />
                    ) : someFilteredSelected ? (
                      <MinusSquare size={16} className="text-[rgba(184,151,58,0.6)]" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  Identificador
                </th>
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  Subtipo
                </th>
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  Nivel
                </th>
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  Area m2
                </th>
                {((activeTab === "parqueadero" && showPrecioParq) || (activeTab === "deposito" && showPrecioDepo)) && (
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                    Precio
                  </th>
                )}
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  Asignado a
                </th>
                <th className="text-right py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  {/* Actions */}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredComplementos.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-16 text-center text-[var(--text-muted)] text-sm"
                  >
                    {complementos.filter((c) => c.tipo === activeTab).length === 0
                      ? activeTab === "parqueadero"
                        ? "No hay parqueaderos. Agrega el primero."
                        : "No hay depositos. Agrega el primero."
                      : "No se encontraron resultados."}
                  </td>
                </tr>
              ) : (
                filteredComplementos.map((comp) => (
                  <motion.tr
                    key={comp.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)] transition-colors group"
                  >
                    {editingId === comp.id ? (
                      <td colSpan={9} className="p-4">
                        <ComplementoForm
                          initial={getEditFormData(comp)}
                          unidades={unidades}
                          torres={torres}
                          onSubmit={(data) => handleUpdate(comp.id, data)}
                          onCancel={() => setEditingId(null)}
                          submitting={formLoading}
                          showPrecio={activeTab === "parqueadero" ? showPrecioParq : showPrecioDepo}
                        />
                      </td>
                    ) : (
                      <>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleSelect(comp.id)}
                            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                          >
                            {selectedIds.has(comp.id) ? (
                              <CheckSquare
                                size={16}
                                className="text-[#b8973a]"
                              />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {comp.identificador}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {comp.subtipo || "-"}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {comp.nivel || "-"}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {comp.area_m2 != null ? `${comp.area_m2} m2` : "-"}
                        </td>
                        {((activeTab === "parqueadero" && showPrecioParq) || (activeTab === "deposito" && showPrecioDepo)) && (
                          <td className="py-3 px-4 text-[var(--text-secondary)]">
                            {comp.precio
                              ? formatCurrency(comp.precio, project.moneda_base, {
                                  compact: true,
                                })
                              : "-"}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <EstadoBadge estado={comp.estado} />
                        </td>
                        <td className="py-3 px-4">
                          {comp.unidad_id ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(184,151,58,0.1)] text-[#b8973a] border border-[rgba(184,151,58,0.2)]">
                              <Link size={10} />
                              {getUnitIdentificador(comp.unidad_id)}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)] text-xs">
                              -
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingId(comp.id);
                                setShowCreateForm(false);
                              }}
                              className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors text-[var(--text-tertiary)] hover:text-white"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(comp.id)}
                              className={btnDanger}
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer count */}
      {filteredComplementos.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] text-[var(--text-muted)]">
            {filteredComplementos.length} de{" "}
            {complementos.filter((c) => c.tipo === activeTab).length}{" "}
            {activeTab === "parqueadero" ? "parqueaderos" : "depositos"}
          </p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmDialog
            title="Eliminar complemento"
            message="Esta accion no se puede deshacer. El complemento sera eliminado permanentemente."
            onConfirm={() => handleDelete(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      <AnimatePresence>
        {toast && (
          <InlineToast toast={toast} onDismiss={() => setToast(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
