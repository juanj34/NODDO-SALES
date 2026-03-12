"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
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
import { parseCSV } from "@/lib/csv-parser";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Search,
  Upload,
  Sparkles,
  ChevronDown,
  Loader2,
  AlertTriangle,
  FileSpreadsheet,
  CheckSquare,
  Square,
  MinusSquare,
  Package,
  Building2,
  TrendingUp,
  MessageSquare,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import type { Unidad, Tipologia, Torre, Fachada } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EstadoUnidad = Unidad["estado"];

interface UnitFormData {
  identificador: string;
  tipologia_id: string;
  fachada_id: string;
  piso: string;
  area_m2: string;
  precio: string;
  estado: EstadoUnidad;
  habitaciones: string;
  banos: string;
  orientacion: string;
  vista: string;
  notas: string;
}

interface ParsedPreviewUnit {
  identificador: string;
  tipologia_id: string;
  piso: number | null;
  area_m2: number | null;
  precio: number | null;
  estado: EstadoUnidad;
  habitaciones: number | null;
  banos: number | null;
  orientacion: string;
  vista: string;
  notas: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ESTADOS: { value: EstadoUnidad; label: string }[] = [
  { value: "disponible", label: "Disponible" },
  { value: "separado", label: "Separado" },
  { value: "reservada", label: "Reservada" },
  { value: "vendida", label: "Vendida" },
];

const ESTADO_COLORS: Record<EstadoUnidad, string> = {
  disponible: "bg-green-500/20 text-green-400 border-green-500/30",
  separado: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  reservada: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  vendida: "bg-red-500/20 text-red-400 border-red-500/30",
};

const EMPTY_FORM: UnitFormData = {
  identificador: "",
  tipologia_id: "",
  fachada_id: "",
  piso: "",
  area_m2: "",
  precio: "",
  estado: "disponible",
  habitaciones: "",
  banos: "",
  orientacion: "",
  vista: "",
  notas: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(value: number | null): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function tipologiaName(
  tipologias: Tipologia[],
  tipologiaId: string | null
): string {
  if (!tipologiaId) return "-";
  const t = tipologias.find((tp) => tp.id === tipologiaId);
  return t ? t.nombre : "-";
}

function fachadaName(
  fachadas: Fachada[],
  fachadaId: string | null
): string {
  if (!fachadaId) return "-";
  const f = fachadas.find((fc) => fc.id === fachadaId);
  return f ? f.nombre : "-";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EstadoBadge({ estado }: { estado: EstadoUnidad }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${ESTADO_COLORS[estado]}`}
    >
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
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
  const { t } = useTranslation("editor");
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
            {t("inventario.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/80 text-white rounded-lg text-xs font-medium hover:bg-red-500 transition-all"
          >
            <Trash2 size={12} />
            {t("galeria.delete")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Import CSV Modal
// ---------------------------------------------------------------------------

function ImportCSVModal({
  tipologias,
  proyectoId,
  activeTorreId,
  onClose,
  onDone,
}: {
  tipologias: Tipologia[];
  proyectoId: string;
  activeTorreId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation("editor");
  const [step, setStep] = useState<"input" | "preview">("input");
  const [rawCSV, setRawCSV] = useState("");
  const [parsed, setParsed] = useState<ParsedPreviewUnit[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (file.name.match(/\.xlsx?$/i)) {
      const XLSX = (await import("xlsx")).default;
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(ws);
      setRawCSV(csv);
    } else {
      const text = await file.text();
      setRawCSV(text);
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleParse = () => {
    setError(null);
    try {
      const units = parseCSV(rawCSV);
      if (units.length === 0) {
        setError(t("inventario.csvModal.noValidUnits"));
        return;
      }
      const preview: ParsedPreviewUnit[] = units.map((u) => ({
        identificador: u.identificador || "",
        tipologia_id: "",
        piso: u.piso ?? null,
        area_m2: u.area_m2 ?? null,
        precio: u.precio ?? null,
        estado: u.estado || "disponible",
        habitaciones: u.habitaciones ?? null,
        banos: u.banos ?? null,
        orientacion: u.orientacion || "",
        vista: u.vista || "",
        notas: u.notas || "",
      }));
      setParsed(preview);
      setStep("preview");
    } catch {
      setError(t("inventario.csvModal.parseError"));
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const torreId = activeTorreId && activeTorreId !== "__none__" ? activeTorreId : null;
      const payload = parsed.map((u) => ({
        proyecto_id: proyectoId,
        identificador: u.identificador,
        tipologia_id: u.tipologia_id || null,
        piso: u.piso,
        area_m2: u.area_m2,
        precio: u.precio,
        estado: u.estado,
        habitaciones: u.habitaciones,
        banos: u.banos,
        orientacion: u.orientacion || null,
        vista: u.vista || null,
        notas: u.notas || null,
        torre_id: torreId,
      }));
      const res = await fetch("/api/unidades/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyecto_id: proyectoId, unidades: payload }),
      });
      if (!res.ok) throw new Error("Error al crear unidades");
      onDone();
    } catch {
      setError("Error al crear las unidades. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const updatePreviewUnit = (
    index: number,
    field: keyof ParsedPreviewUnit,
    value: string
  ) => {
    setParsed((prev) => {
      const copy = [...prev];
      const unit = { ...copy[index] };
      if (
        field === "piso" ||
        field === "habitaciones" ||
        field === "banos"
      ) {
        unit[field] = value ? parseInt(value) || null : null;
      } else if (field === "area_m2" || field === "precio") {
        unit[field] = value ? parseFloat(value) || null : null;
      } else if (field === "estado") {
        unit.estado = value as EstadoUnidad;
      } else {
        (unit as unknown as Record<string, string>)[field] = value;
      }
      copy[index] = unit;
      return copy;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgba(var(--site-primary-rgb),0.1)] rounded-lg">
              <FileSpreadsheet size={18} className="text-[var(--site-primary)]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{t("inventario.csvModal.title")}</h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                {step === "input"
                  ? t("inventario.csvModal.description")
                  : t("inventario.csvModal.unitsDetected", { n: String(parsed.length) })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
          >
            <X size={16} className="text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "input" ? (
            <div className="space-y-4">
              {/* Drop zone + file picker */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  dragging
                    ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.05)]"
                    : "border-[var(--border-default)] hover:border-[var(--site-primary)]"
                )}
              >
                <Upload size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
                <p className="text-xs text-[var(--text-secondary)]">{t("inventario.dragDropFile")}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">{t("inventario.dragDropFormats")}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.xlsx,.xls"
                  hidden
                  onChange={handleFileSelect}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                <span className="text-[10px] text-[var(--text-muted)]">{t("inventario.orPaste")}</span>
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              </div>
              <textarea
                value={rawCSV}
                onChange={(e) => setRawCSV(e.target.value)}
                placeholder={`identificador,piso,area_m2,precio,estado,habitaciones,banos\nApto 101,1,65,350000000,disponible,2,2\nApto 102,1,72,380000000,disponible,3,2`}
                rows={8}
                className={inputClass + " resize-none font-mono text-xs"}
              />
              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-secondary)]">
                {t("inventario.csvModal.reviewDescription")}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-default)]">
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        ID
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.typology")}
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.floor")}
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.area")}
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.price")}
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.state")}
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.bedrooms")}
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.bathrooms")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((u, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)]"
                      >
                        <td className="py-1.5 px-2">
                          <input
                            value={u.identificador}
                            onChange={(e) =>
                              updatePreviewUnit(
                                i,
                                "identificador",
                                e.target.value
                              )
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-24 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <select
                            value={u.tipologia_id}
                            onChange={(e) =>
                              updatePreviewUnit(
                                i,
                                "tipologia_id",
                                e.target.value
                              )
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-28 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                          >
                            <option value="" className="bg-[var(--surface-2)]">
                              --
                            </option>
                            {tipologias.map((t) => (
                              <option
                                key={t.id}
                                value={t.id}
                                className="bg-[var(--surface-2)]"
                              >
                                {t.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            value={u.piso ?? ""}
                            onChange={(e) =>
                              updatePreviewUnit(i, "piso", e.target.value)
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-12 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                            type="number"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            value={u.area_m2 ?? ""}
                            onChange={(e) =>
                              updatePreviewUnit(i, "area_m2", e.target.value)
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-16 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                            type="number"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            value={u.precio ?? ""}
                            onChange={(e) =>
                              updatePreviewUnit(i, "precio", e.target.value)
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-28 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                            type="number"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <select
                            value={u.estado}
                            onChange={(e) =>
                              updatePreviewUnit(i, "estado", e.target.value)
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-24 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
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
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            value={u.habitaciones ?? ""}
                            onChange={(e) =>
                              updatePreviewUnit(
                                i,
                                "habitaciones",
                                e.target.value
                              )
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-12 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                            type="number"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            value={u.banos ?? ""}
                            onChange={(e) =>
                              updatePreviewUnit(i, "banos", e.target.value)
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-12 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                            type="number"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border-subtle)]">
          <button onClick={onClose} className={btnSecondary}>
            {t("inventario.cancel")}
          </button>
          {step === "input" ? (
            <button
              onClick={handleParse}
              disabled={!rawCSV.trim()}
              className={btnPrimary}
            >
              <Upload size={14} />
              {t("inventario.csvModal.parse")}
            </button>
          ) : (
            <>
              <button onClick={() => setStep("input")} className={btnSecondary}>
                {t("inventario.back")}
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={btnPrimary}
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {submitting
                  ? t("inventario.creating")
                  : t("inventario.createUnits", { n: String(parsed.length) })}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Import AI Modal
// ---------------------------------------------------------------------------

function ImportAIModal({
  tipologias,
  proyectoId,
  activeTorreId,
  onClose,
  onDone,
}: {
  tipologias: Tipologia[];
  proyectoId: string;
  activeTorreId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation("editor");
  const [step, setStep] = useState<"input" | "preview">("input");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedPreviewUnit[]>([]);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingAI, setDraggingAI] = useState(false);
  const fileInputAIRef = useRef<HTMLInputElement>(null);

  const processFileAI = async (file: File) => {
    if (file.name.match(/\.xlsx?$/i)) {
      const XLSX = (await import("xlsx")).default;
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(ws);
      setRawText(csv);
    } else {
      const text = await file.text();
      setRawText(text);
    }
  };

  const handleFileDropAI = async (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingAI(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFileAI(file);
  };

  const handleFileSelectAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFileAI(file);
  };

  const handleParse = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/parse-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          tipologias: tipologias.map((t) => ({ id: t.id, nombre: t.nombre })),
        }),
      });
      if (!res.ok) throw new Error("Error al procesar con IA");
      const data = await res.json();
      const units: ParsedPreviewUnit[] = (
        data.unidades as Record<string, unknown>[]
      ).map((u) => ({
        identificador: (u.identificador as string) || "",
        tipologia_id: (u.tipologia_id as string) || "",
        piso: (u.piso as number) ?? null,
        area_m2: (u.area_m2 as number) ?? null,
        precio: (u.precio as number) ?? null,
        estado: ((u.estado as string) || "disponible") as EstadoUnidad,
        habitaciones: (u.habitaciones as number) ?? null,
        banos: (u.banos as number) ?? null,
        orientacion: (u.orientacion as string) || "",
        vista: (u.vista as string) || "",
        notas: (u.notas as string) || "",
      }));
      if (units.length === 0) {
        setError(t("inventario.aiModal.noUnitsDetected"));
        return;
      }
      setParsed(units);
      setStep("preview");
    } catch {
      setError(t("inventario.aiModal.processingError"));
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const torreId = activeTorreId && activeTorreId !== "__none__" ? activeTorreId : null;
      const payload = parsed.map((u) => ({
        proyecto_id: proyectoId,
        identificador: u.identificador,
        tipologia_id: u.tipologia_id || null,
        piso: u.piso,
        area_m2: u.area_m2,
        precio: u.precio,
        estado: u.estado,
        habitaciones: u.habitaciones,
        banos: u.banos,
        orientacion: u.orientacion || null,
        vista: u.vista || null,
        notas: u.notas || null,
        torre_id: torreId,
      }));
      const res = await fetch("/api/unidades/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyecto_id: proyectoId, unidades: payload }),
      });
      if (!res.ok) throw new Error("Error al crear unidades");
      onDone();
    } catch {
      setError("Error al crear las unidades. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const updatePreviewUnit = (
    index: number,
    field: keyof ParsedPreviewUnit,
    value: string
  ) => {
    setParsed((prev) => {
      const copy = [...prev];
      const unit = { ...copy[index] };
      if (
        field === "piso" ||
        field === "habitaciones" ||
        field === "banos"
      ) {
        unit[field] = value ? parseInt(value) || null : null;
      } else if (field === "area_m2" || field === "precio") {
        unit[field] = value ? parseFloat(value) || null : null;
      } else if (field === "estado") {
        unit.estado = value as EstadoUnidad;
      } else {
        (unit as unknown as Record<string, string>)[field] = value;
      }
      copy[index] = unit;
      return copy;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Sparkles size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">
                {t("inventario.aiModal.title")}
              </h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                {step === "input"
                  ? t("inventario.aiModal.description")
                  : t("inventario.csvModal.unitsDetected", { n: String(parsed.length) })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
          >
            <X size={16} className="text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "input" ? (
            <div className="space-y-4">
              {/* Drop zone + file picker */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDraggingAI(true); }}
                onDragLeave={() => setDraggingAI(false)}
                onDrop={handleFileDropAI}
                onClick={() => fileInputAIRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  draggingAI
                    ? "border-purple-400 bg-purple-500/5"
                    : "border-[var(--border-default)] hover:border-purple-400"
                )}
              >
                <Upload size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
                <p className="text-xs text-[var(--text-secondary)]">{t("inventario.dragDropFile")}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">{t("inventario.dragDropFormats")}</p>
                <input
                  ref={fileInputAIRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.xlsx,.xls"
                  hidden
                  onChange={handleFileSelectAI}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                <span className="text-[10px] text-[var(--text-muted)]">{t("inventario.orPaste")}</span>
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Ejemplo:\nEl proyecto tiene los siguientes apartamentos:\n- Apto 101, piso 1, 65m2, 3 habitaciones, 2 banos, $350.000.000\n- Apto 102, piso 1, 72m2, 2 habitaciones, 2 banos, $380.000.000\n- Apto 201, piso 2, 65m2, 3 habitaciones, 2 banos, $370.000.000`}
                rows={8}
                className={inputClass + " resize-none text-xs"}
              />
              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-secondary)]">
                {t("inventario.csvModal.reviewDescription")}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-default)]">
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        ID
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.typology")}
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.floor")}
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.area")}
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.price")}
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.state")}
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.bedrooms")}
                      </th>
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-normal">
                        {t("inventario.fields.bathrooms")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((u, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)]"
                      >
                        <td className="py-1.5 px-2">
                          <input
                            value={u.identificador}
                            onChange={(e) =>
                              updatePreviewUnit(
                                i,
                                "identificador",
                                e.target.value
                              )
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-24 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <select
                            value={u.tipologia_id}
                            onChange={(e) =>
                              updatePreviewUnit(
                                i,
                                "tipologia_id",
                                e.target.value
                              )
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-28 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                          >
                            <option value="" className="bg-[var(--surface-2)]">
                              --
                            </option>
                            {tipologias.map((t) => (
                              <option
                                key={t.id}
                                value={t.id}
                                className="bg-[var(--surface-2)]"
                              >
                                {t.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            value={u.piso ?? ""}
                            onChange={(e) =>
                              updatePreviewUnit(i, "piso", e.target.value)
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-12 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                            type="number"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            value={u.area_m2 ?? ""}
                            onChange={(e) =>
                              updatePreviewUnit(i, "area_m2", e.target.value)
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-16 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                            type="number"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            value={u.precio ?? ""}
                            onChange={(e) =>
                              updatePreviewUnit(i, "precio", e.target.value)
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-28 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                            type="number"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <select
                            value={u.estado}
                            onChange={(e) =>
                              updatePreviewUnit(i, "estado", e.target.value)
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-24 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
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
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            value={u.habitaciones ?? ""}
                            onChange={(e) =>
                              updatePreviewUnit(
                                i,
                                "habitaciones",
                                e.target.value
                              )
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-12 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                            type="number"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            value={u.banos ?? ""}
                            onChange={(e) =>
                              updatePreviewUnit(i, "banos", e.target.value)
                            }
                            className="bg-transparent border-b border-[var(--border-default)] text-white text-xs px-1 py-0.5 w-12 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
                            type="number"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border-subtle)]">
          <button onClick={onClose} className={btnSecondary}>
            {t("inventario.cancel")}
          </button>
          {step === "input" ? (
            <button
              onClick={handleParse}
              disabled={!rawText.trim() || processing}
              className={btnPrimary}
            >
              {processing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {processing ? t("inventario.aiModal.processing") : t("inventario.aiModal.process")}
            </button>
          ) : (
            <>
              <button onClick={() => setStep("input")} className={btnSecondary}>
                {t("inventario.back")}
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={btnPrimary}
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {submitting
                  ? t("inventario.creating")
                  : t("inventario.createUnits", { n: String(parsed.length) })}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Unit Form (Inline Create / Edit)
// ---------------------------------------------------------------------------

function UnitForm({
  initial,
  tipologias,
  fachadas,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: UnitFormData;
  tipologias: Tipologia[];
  fachadas: Fachada[];
  onSubmit: (data: UnitFormData) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const { t } = useTranslation("editor");
  const [form, setForm] = useState<UnitFormData>(initial);

  const set = (field: keyof UnitFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-5 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>{t("inventario.fields.identifier")}</label>
            <input
              type="text"
              value={form.identificador}
              onChange={(e) => set("identificador", e.target.value)}
              placeholder="Apto 101"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.typology")}</label>
            <select
              value={form.tipologia_id}
              onChange={(e) => set("tipologia_id", e.target.value)}
              className={inputClass}
            >
              <option value="" className="bg-[var(--surface-2)]">
                {t("inventario.noTypology")}
              </option>
              {tipologias.map((t) => (
                <option key={t.id} value={t.id} className="bg-[var(--surface-2)]">
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          {fachadas.length > 0 && (
            <div>
              <label className={labelClass}>{t("inventario.fields.fachada")}</label>
              <select
                value={form.fachada_id}
                onChange={(e) => set("fachada_id", e.target.value)}
                className={inputClass}
              >
                <option value="" className="bg-[var(--surface-2)]">
                  {t("inventario.allFachadas")}
                </option>
                {fachadas.map((f) => (
                  <option key={f.id} value={f.id} className="bg-[var(--surface-2)]">
                    {f.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={labelClass}>{t("inventario.fields.floor")}</label>
            <input
              type="number"
              value={form.piso}
              onChange={(e) => set("piso", e.target.value)}
              placeholder="1"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.area")}</label>
            <input
              type="number"
              value={form.area_m2}
              onChange={(e) => set("area_m2", e.target.value)}
              placeholder="65"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.price")}</label>
            <input
              type="number"
              value={form.precio}
              onChange={(e) => set("precio", e.target.value)}
              placeholder="350000000"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.state")}</label>
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
          <div>
            <label className={labelClass}>{t("inventario.fields.bedrooms")}</label>
            <input
              type="number"
              value={form.habitaciones}
              onChange={(e) => set("habitaciones", e.target.value)}
              placeholder="3"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.bathrooms")}</label>
            <input
              type="number"
              value={form.banos}
              onChange={(e) => set("banos", e.target.value)}
              placeholder="2"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.orientation")}</label>
            <input
              type="text"
              value={form.orientacion}
              onChange={(e) => set("orientacion", e.target.value)}
              placeholder="Norte"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.view")}</label>
            <input
              type="text"
              value={form.vista}
              onChange={(e) => set("vista", e.target.value)}
              placeholder="Exterior"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>{t("inventario.fields.notes")}</label>
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
            {submitting ? t("general.saving") : t("inventario.save")}
          </button>
          <button onClick={onCancel} className={btnSecondary}>
            <X size={14} />
            {t("inventario.cancel")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Price Adjust Modal
// ---------------------------------------------------------------------------

function PriceAdjustModal({
  unidades,
  selectedIds,
  onClose,
  onDone,
}: {
  unidades: Unidad[];
  selectedIds: Set<string>;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation("editor");
  const [scope, setScope] = useState<"selected" | "available">(
    selectedIds.size > 0 ? "selected" : "available"
  );
  const [adjustType, setAdjustType] = useState<"percentage" | "fixed">("percentage");
  const [adjustValue, setAdjustValue] = useState("");
  const [applying, setApplying] = useState(false);

  const affectedUnits = useMemo(() => {
    if (scope === "selected") {
      return unidades.filter((u) => selectedIds.has(u.id) && u.precio != null);
    }
    return unidades.filter((u) => u.estado === "disponible" && u.precio != null);
  }, [unidades, selectedIds, scope]);

  const numValue = parseFloat(adjustValue) || 0;

  const computeNewPrice = (precio: number) => {
    if (adjustType === "percentage") {
      return Math.round(precio * (1 + numValue / 100));
    }
    return Math.round(precio + numValue);
  };

  const handleApply = async () => {
    if (affectedUnits.length === 0 || numValue === 0) return;
    setApplying(true);
    try {
      const promises = affectedUnits.map((u) =>
        fetch(`/api/unidades/${u.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ precio: computeNewPrice(u.precio!) }),
        })
      );
      await Promise.all(promises);
      onDone();
    } catch {
      // Price batch apply error - handled silently since onDone refreshes
    } finally {
      setApplying(false);
    }
  };

  const availableCount = unidades.filter((u) => u.estado === "disponible" && u.precio != null).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgba(var(--site-primary-rgb),0.1)] rounded-lg">
              <TrendingUp size={18} className="text-[var(--site-primary)]" />
            </div>
            <h3 className="text-sm font-medium text-white">{t("inventario.priceAdjustTitle")}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors">
            <X size={16} className="text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Scope */}
          <div className="space-y-2">
            <p className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold">{t("inventario.applyTo")}</p>
            <div className="flex flex-col gap-2">
              {selectedIds.size > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === "selected"}
                    onChange={() => setScope("selected")}
                    className="accent-[var(--site-primary)]"
                  />
                  <span className="text-xs text-[var(--text-secondary)]">
                    {t("inventario.applyToSelected", { n: String(selectedIds.size) })}
                  </span>
                </label>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "available"}
                  onChange={() => setScope("available")}
                  className="accent-[var(--site-primary)]"
                />
                <span className="text-xs text-[var(--text-secondary)]">
                  {t("inventario.applyToAvailable", { n: String(availableCount) })}
                </span>
              </label>
            </div>
          </div>

          {/* Adjust type */}
          <div className="space-y-2">
            <p className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold">{t("inventario.adjustType")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setAdjustType("percentage")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                  adjustType === "percentage"
                    ? "bg-[var(--surface-3)] text-white shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
              >
                {t("inventario.percentage")}
              </button>
              <button
                onClick={() => setAdjustType("fixed")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                  adjustType === "fixed"
                    ? "bg-[var(--surface-3)] text-white shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
              >
                {t("inventario.fixedAmount")}
              </button>
            </div>
          </div>

          {/* Value input */}
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={adjustValue}
              onChange={(e) => setAdjustValue(e.target.value)}
              placeholder={adjustType === "percentage" ? "5" : "10000000"}
              className={inputClass + " flex-1"}
            />
            <span className="text-sm text-[var(--text-tertiary)]">
              {adjustType === "percentage" ? "%" : "COP"}
            </span>
          </div>

          {/* Preview */}
          {numValue !== 0 && affectedUnits.length > 0 && (
            <div className="space-y-2">
              <p className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold">{t("inventario.preview")}</p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--border-subtle)]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-default)]">
                      <th className="text-left py-2 px-3 text-[var(--text-tertiary)] font-normal">ID</th>
                      <th className="text-right py-2 px-3 text-[var(--text-tertiary)] font-normal">Actual</th>
                      <th className="text-right py-2 px-3 text-[var(--text-tertiary)] font-normal">Nuevo</th>
                      <th className="text-right py-2 px-3 text-[var(--text-tertiary)] font-normal">Dif.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affectedUnits.slice(0, 20).map((u) => {
                      const newP = computeNewPrice(u.precio!);
                      const diff = newP - u.precio!;
                      return (
                        <tr key={u.id} className="border-b border-[var(--border-subtle)]">
                          <td className="py-1.5 px-3 text-white">{u.identificador}</td>
                          <td className="py-1.5 px-3 text-right text-[var(--text-secondary)]">{formatPrice(u.precio)}</td>
                          <td className="py-1.5 px-3 text-right text-white">{formatPrice(newP)}</td>
                          <td className={cn("py-1.5 px-3 text-right", diff > 0 ? "text-green-400" : "text-red-400")}>
                            {diff > 0 ? "+" : ""}{formatPrice(diff)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {affectedUnits.length > 20 && (
                  <p className="text-[10px] text-[var(--text-muted)] text-center py-2">
                    +{affectedUnits.length - 20} más...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border-subtle)]">
          <button onClick={onClose} className={btnSecondary}>
            {t("inventario.cancel")}
          </button>
          <button
            onClick={handleApply}
            disabled={applying || numValue === 0 || affectedUnits.length === 0}
            className={btnPrimary}
          >
            {applying ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {applying
              ? t("inventario.applying")
              : t("inventario.applyToN", { n: String(affectedUnits.length) })}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AI Chat Modal
// ---------------------------------------------------------------------------

interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
  changes?: Array<{ id: string; updates: Record<string, unknown>; identificador: string }>;
}

function AIChatModal({
  unidades,
  tipologias,
  fachadas,
  onClose,
  onDone,
}: {
  unidades: Unidad[];
  tipologias: Tipologia[];
  fachadas: Fachada[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation("editor");
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { role: "assistant", content: t("inventario.aiChatWelcome") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyingChanges, setApplyingChanges] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/modify-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          unidades: unidades.map((u) => ({
            id: u.id,
            identificador: u.identificador,
            tipologia_id: u.tipologia_id,
            fachada_id: u.fachada_id,
            piso: u.piso,
            area_m2: u.area_m2,
            precio: u.precio,
            estado: u.estado,
            habitaciones: u.habitaciones,
            banos: u.banos,
          })),
          tipologias: tipologias.map((tp) => ({ id: tp.id, nombre: tp.nombre })),
          fachadas: fachadas.map((f) => ({ id: f.id, nombre: f.nombre })),
        }),
      });
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.summary || "Cambios listos.",
          changes: data.changes,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al procesar la solicitud. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleApplyChanges = async (changes: AIChatMessage["changes"]) => {
    if (!changes || changes.length === 0) return;
    setApplyingChanges(true);
    try {
      const promises = changes.map((c) =>
        fetch(`/api/unidades/${c.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(c.updates),
        })
      );
      await Promise.all(promises);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("inventario.aiApplied", { n: String(changes.length) }) },
      ]);
      onDone();
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al aplicar los cambios." },
      ]);
    } finally {
      setApplyingChanges(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl w-full max-w-2xl h-[70vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <MessageSquare size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{t("inventario.aiChatTitle")}</h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                {unidades.length} unidades
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors">
            <X size={16} className="text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-2.5 text-xs",
                  msg.role === "user"
                    ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-white"
                    : "bg-[var(--surface-3)] text-[var(--text-secondary)]"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.changes && msg.changes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="max-h-32 overflow-y-auto rounded border border-[var(--border-subtle)]">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="border-b border-[var(--border-default)]">
                            <th className="text-left py-1 px-2 text-[var(--text-tertiary)] font-normal">ID</th>
                            <th className="text-left py-1 px-2 text-[var(--text-tertiary)] font-normal">Cambios</th>
                          </tr>
                        </thead>
                        <tbody>
                          {msg.changes.slice(0, 10).map((c, ci) => (
                            <tr key={ci} className="border-b border-[var(--border-subtle)]">
                              <td className="py-1 px-2 text-white">{c.identificador}</td>
                              <td className="py-1 px-2 text-[var(--text-secondary)]">
                                {Object.entries(c.updates).map(([k, v]) => `${k}: ${v}`).join(", ")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {msg.changes.length > 10 && (
                        <p className="text-[10px] text-[var(--text-muted)] text-center py-1">
                          +{msg.changes.length - 10} más
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleApplyChanges(msg.changes)}
                      disabled={applyingChanges}
                      className={btnPrimary}
                    >
                      {applyingChanges ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      {t("inventario.aiConfirmApply", { n: String(msg.changes.length) })}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--surface-3)] rounded-xl px-4 py-2.5">
                <Loader2 size={14} className="animate-spin text-purple-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={t("inventario.aiChatPlaceholder")}
              className={inputClass + " flex-1"}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={btnPrimary}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function InventarioPage() {
  const { project, refresh, projectId } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();

  // --- UI state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipologia, setFilterTipologia] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEstado, setBulkEstado] = useState<EstadoUnidad>("disponible");
  const [bulkTorreId, setBulkTorreId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // --- Form state ---
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // --- Modals ---
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPriceAdjust, setShowPriceAdjust] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // --- Bulk tipología/fachada ---
  const [bulkTipologiaId, setBulkTipologiaId] = useState("");
  const [bulkFachadaId, setBulkFachadaId] = useState("");

  // --- Torre state ---
  const [activeTorreId, setActiveTorreId] = useState<string | null>(null);

  // --- Data ---
  const unidades = project.unidades || [];
  const tipologias = project.tipologias || [];
  const fachadas: Fachada[] = project.fachadas || [];
  const torres: Torre[] = project.torres || [];
  const isMultiTorre = torres.length > 1;

  // --- Filtering (includes torre filter) ---
  const filteredUnidades = useMemo(() => {
    return unidades.filter((u) => {
      // Torre filter (when multi-torre is active)
      if (isMultiTorre) {
        if (activeTorreId === "__none__") {
          if (u.torre_id) return false;
        } else if (activeTorreId) {
          if (u.torre_id !== activeTorreId) return false;
        }
      }
      if (filterTipologia && u.tipologia_id !== filterTipologia) return false;
      if (filterEstado && u.estado !== filterEstado) return false;
      if (
        searchQuery &&
        !u.identificador.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [unidades, filterTipologia, filterEstado, searchQuery, isMultiTorre, activeTorreId]);

  // --- Selection helpers ---
  const allFilteredSelected =
    filteredUnidades.length > 0 &&
    filteredUnidades.every((u) => selectedIds.has(u.id));
  const someFilteredSelected =
    filteredUnidades.some((u) => selectedIds.has(u.id)) &&
    !allFilteredSelected;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUnidades.map((u) => u.id)));
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

  // --- CRUD handlers ---
  const handleCreate = useCallback(
    async (data: UnitFormData) => {
      setFormLoading(true);
      try {
        const res = await fetch("/api/unidades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proyecto_id: projectId,
            identificador: data.identificador,
            tipologia_id: data.tipologia_id || null,
            piso: data.piso ? parseInt(data.piso) : null,
            area_m2: data.area_m2 ? parseFloat(data.area_m2) : null,
            precio: data.precio ? parseFloat(data.precio) : null,
            estado: data.estado,
            habitaciones: data.habitaciones
              ? parseInt(data.habitaciones)
              : null,
            banos: data.banos ? parseInt(data.banos) : null,
            orientacion: data.orientacion || null,
            vista: data.vista || null,
            notas: data.notas || null,
            fachada_id: data.fachada_id || null,
            torre_id: isMultiTorre && activeTorreId && activeTorreId !== "__none__" ? activeTorreId : null,
          }),
        });
        if (!res.ok) throw new Error("Error creating unit");
        setShowCreateForm(false);
        await refresh();
      } catch {
        toast.error("Error al crear unidad");
      } finally {
        setFormLoading(false);
      }
    },
    [projectId, refresh, isMultiTorre, activeTorreId]
  );

  const handleUpdate = useCallback(
    async (id: string, data: UnitFormData) => {
      setFormLoading(true);
      try {
        const res = await fetch(`/api/unidades/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identificador: data.identificador,
            tipologia_id: data.tipologia_id || null,
            piso: data.piso ? parseInt(data.piso) : null,
            area_m2: data.area_m2 ? parseFloat(data.area_m2) : null,
            precio: data.precio ? parseFloat(data.precio) : null,
            estado: data.estado,
            habitaciones: data.habitaciones
              ? parseInt(data.habitaciones)
              : null,
            banos: data.banos ? parseInt(data.banos) : null,
            orientacion: data.orientacion || null,
            vista: data.vista || null,
            notas: data.notas || null,
            fachada_id: data.fachada_id || null,
          }),
        });
        if (!res.ok) throw new Error("Error updating unit");
        setEditingId(null);
        await refresh();
      } catch {
        toast.error("Error al actualizar unidad");
      } finally {
        setFormLoading(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/unidades/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error deleting unit");
        setDeleteConfirm(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await refresh();
      } catch {
        toast.error("Error al eliminar unidad");
      }
    },
    [refresh, toast]
  );

  const handleBulkStatusChange = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/unidades/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: bulkEstado }),
        })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      await refresh();
    } catch {
      toast.error("Error al cambiar estado");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, bulkEstado, refresh, toast]);

  const handleBulkTorreChange = useCallback(async () => {
    if (selectedIds.size === 0 || !bulkTorreId) return;
    setBulkLoading(true);
    try {
      const newTorreId = bulkTorreId === "__none__" ? null : bulkTorreId;
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/unidades/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ torre_id: newTorreId }),
        })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      await refresh();
    } catch {
      toast.error("Error al asignar torre");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, bulkTorreId, refresh, toast]);

  const handleInlineUpdate = useCallback(
    async (unitId: string, field: string, value: string | null) => {
      try {
        await fetch(`/api/unidades/${unitId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
        await refresh();
      } catch {
        toast.error("Error al actualizar");
      }
    },
    [refresh, toast]
  );

  const handleBulkTipologiaChange = useCallback(async () => {
    if (selectedIds.size === 0 || !bulkTipologiaId) return;
    setBulkLoading(true);
    try {
      const newTipId = bulkTipologiaId === "__none__" ? null : bulkTipologiaId;
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/unidades/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipologia_id: newTipId }),
        })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      await refresh();
    } catch {
      toast.error("Error al asignar tipología");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, bulkTipologiaId, refresh, toast]);

  const handleBulkFachadaChange = useCallback(async () => {
    if (selectedIds.size === 0 || !bulkFachadaId) return;
    setBulkLoading(true);
    try {
      const newFacId = bulkFachadaId === "__none__" ? null : bulkFachadaId;
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/unidades/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fachada_id: newFacId }),
        })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      await refresh();
    } catch {
      toast.error("Error al asignar fachada");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, bulkFachadaId, refresh, toast]);

  const handleImportDone = useCallback(async () => {
    setShowCSVModal(false);
    setShowAIModal(false);
    await refresh();
  }, [refresh]);

  // --- Build edit form initial data ---
  const getEditFormData = (u: Unidad): UnitFormData => ({
    identificador: u.identificador,
    tipologia_id: u.tipologia_id || "",
    fachada_id: u.fachada_id || "",
    piso: u.piso != null ? String(u.piso) : "",
    area_m2: u.area_m2 != null ? String(u.area_m2) : "",
    precio: u.precio != null ? String(u.precio) : "",
    estado: u.estado,
    habitaciones: u.habitaciones != null ? String(u.habitaciones) : "",
    banos: u.banos != null ? String(u.banos) : "",
    orientacion: u.orientacion || "",
    vista: u.vista || "",
    notas: u.notas || "",
  });

  // --- Tipologias filtered by active torre for the form dropdown ---
  const tipologiasForDropdown = useMemo(() => {
    if (!isMultiTorre || !activeTorreId) return tipologias;
    if (activeTorreId === "__none__") return tipologias.filter(t => !t.torre_ids?.length);
    // Show tipologias for the active torre + those with no torre assigned
    return tipologias.filter(t => t.torre_ids?.includes(activeTorreId) || !t.torre_ids?.length);
  }, [tipologias, isMultiTorre, activeTorreId]);

  // --- Auto-prefix identifier for new units ---
  const createFormInitial = useMemo((): UnitFormData => {
    if (isMultiTorre && activeTorreId && activeTorreId !== "__none__") {
      const activeTorre = torres.find(t => t.id === activeTorreId);
      const prefix = activeTorre?.prefijo ? `${activeTorre.prefijo}-` : "";
      return { ...EMPTY_FORM, identificador: prefix };
    }
    return EMPTY_FORM;
  }, [isMultiTorre, activeTorreId, torres]);

  // --- Stats (scoped to active torre when multi-torre) ---
  const statsUnidades = useMemo(() => {
    if (!isMultiTorre) return unidades;
    if (activeTorreId === "__none__") return unidades.filter((u) => !u.torre_id);
    if (activeTorreId) return unidades.filter((u) => u.torre_id === activeTorreId);
    return unidades;
  }, [unidades, isMultiTorre, activeTorreId]);

  const stats = useMemo(() => {
    const s = { disponible: 0, separado: 0, reservada: 0, vendida: 0 };
    for (const u of statsUnidades) {
      s[u.estado]++;
    }
    return s;
  }, [statsUnidades]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className={pageHeader}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Package size={18} className="text-[var(--site-primary)]" />
          </div>
          <div>
            <h2 className={pageTitle}>{t("inventario.title")}</h2>
            <p className={pageDescription}>{t("inventario.description")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCSVModal(true)}
            className={btnSecondary}
          >
            <Upload size={14} />
            {t("inventario.importCsv")}
          </button>
          <button onClick={() => setShowAIModal(true)} className={btnSecondary}>
            <Sparkles size={14} />
            {t("inventario.importWithAI")}
          </button>
          <button onClick={() => setShowPriceAdjust(true)} className={btnSecondary}>
            <TrendingUp size={14} />
            {t("inventario.priceAdjust")}
          </button>
          <button onClick={() => setShowAIChat(true)} className={btnSecondary}>
            <MessageSquare size={14} />
            {t("inventario.aiChat")}
          </button>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingId(null);
              // Auto-prefix will be handled via createFormInitial
            }}
            className={btnPrimary}
          >
            <Plus size={14} />
            {t("inventario.newUnit")}
          </button>
        </div>
      </div>

      {/* Torre tabs (when multi-torre) */}
      {isMultiTorre && (
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-x-auto scrollbar-thin">
          {/* All units tab */}
          <button
            onClick={() => setActiveTorreId(null)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
              activeTorreId === null
                ? "bg-[var(--surface-3)] text-white shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            )}
          >
            {t("inventario.all")}
            <span className="text-[10px] text-[var(--text-muted)]">{unidades.length}</span>
          </button>

          {/* Per-torre tabs */}
          {torres.map((torre) => {
            const count = unidades.filter((u) => u.torre_id === torre.id).length;
            return (
              <button
                key={torre.id}
                onClick={() => setActiveTorreId(torre.id)}
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

          {/* Unassigned tab */}
          {unidades.some((u) => !u.torre_id) && (
            <button
              onClick={() => setActiveTorreId("__none__")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                activeTorreId === "__none__"
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
            >
              {t("inventario.noTower")}
              <span className="text-[10px] text-[var(--text-muted)]">
                {unidades.filter((u) => !u.torre_id).length}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {ESTADOS.map((e) => (
          <div
            key={e.value}
            className="p-3 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--text-tertiary)]">{e.label}</span>
              <EstadoBadge estado={e.value} />
            </div>
            <p className="text-xl font-light text-white">{stats[e.value]}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreateForm && (
          <UnitForm
            key={activeTorreId ?? "all"}
            initial={createFormInitial}
            tipologias={tipologiasForDropdown}
            fachadas={fachadas}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            submitting={formLoading}
          />
        )}
      </AnimatePresence>

      {/* Filters & Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("inventario.searchPlaceholder")}
            className={inputClass + " pl-9"}
          />
        </div>
        <div className="relative">
          <select
            value={filterTipologia}
            onChange={(e) => setFilterTipologia(e.target.value)}
            className={inputClass + " w-44 appearance-none pr-8"}
          >
            <option value="" className="bg-[var(--surface-2)]">
              {t("inventario.allTypologies")}
            </option>
            {tipologias.map((t) => (
              <option key={t.id} value={t.id} className="bg-[var(--surface-2)]">
                {t.nombre}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
        </div>
        <div className="relative">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className={inputClass + " w-40 appearance-none pr-8"}
          >
            <option value="" className="bg-[var(--surface-2)]">
              {t("inventario.allStates")}
            </option>
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value} className="bg-[var(--surface-2)]">
                {e.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
        </div>
      </div>

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 bg-[rgba(var(--site-primary-rgb),0.05)] border border-[rgba(var(--site-primary-rgb),0.2)] rounded-xl">
              <span className="text-xs text-[var(--site-primary)]">
                {selectedIds.size} seleccionada
                {selectedIds.size !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <span className="text-xs text-[var(--text-tertiary)]">{t("inventario.bulkState")}</span>
                <div className="relative">
                  <select
                    value={bulkEstado}
                    onChange={(e) =>
                      setBulkEstado(e.target.value as EstadoUnidad)
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

                {isMultiTorre && (
                  <>
                    <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
                    <span className="text-xs text-[var(--text-tertiary)]">{t("inventario.bulkMoveTo")}</span>
                    <div className="relative">
                      <select
                        value={bulkTorreId}
                        onChange={(e) => setBulkTorreId(e.target.value)}
                        className={inputClass + " w-40 appearance-none pr-8 py-1.5"}
                      >
                        <option value="" className="bg-[var(--surface-2)]">
                          {t("inventario.selectTower")}
                        </option>
                        {torres.map((torre) => (
                          <option key={torre.id} value={torre.id} className="bg-[var(--surface-2)]">
                            {torre.nombre}
                          </option>
                        ))}
                        <option value="__none__" className="bg-[var(--surface-2)]">
                          {t("inventario.noTower")}
                        </option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                      />
                    </div>
                    <button
                      onClick={handleBulkTorreChange}
                      disabled={bulkLoading || !bulkTorreId}
                      className={btnPrimary}
                    >
                      {bulkLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Building2 size={14} />
                      )}
                      Mover
                    </button>
                  </>
                )}

                {/* Bulk tipología */}
                <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
                <span className="text-xs text-[var(--text-tertiary)]">{t("inventario.bulkTypology")}</span>
                <div className="relative">
                  <select
                    value={bulkTipologiaId}
                    onChange={(e) => setBulkTipologiaId(e.target.value)}
                    className={inputClass + " w-36 appearance-none pr-8 py-1.5"}
                  >
                    <option value="" className="bg-[var(--surface-2)]">
                      {t("inventario.selectTypology")}
                    </option>
                    {tipologiasForDropdown.map((tp) => (
                      <option key={tp.id} value={tp.id} className="bg-[var(--surface-2)]">
                        {tp.nombre}
                      </option>
                    ))}
                    <option value="__none__" className="bg-[var(--surface-2)]">—</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                  />
                </div>
                <button
                  onClick={handleBulkTipologiaChange}
                  disabled={bulkLoading || !bulkTipologiaId}
                  className={btnPrimary}
                >
                  {t("inventario.assign")}
                </button>

                {fachadas.length > 0 && (
                  <>
                    <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
                    <span className="text-xs text-[var(--text-tertiary)]">{t("inventario.bulkFachada")}</span>
                    <div className="relative">
                      <select
                        value={bulkFachadaId}
                        onChange={(e) => setBulkFachadaId(e.target.value)}
                        className={inputClass + " w-36 appearance-none pr-8 py-1.5"}
                      >
                        <option value="" className="bg-[var(--surface-2)]">
                          {t("inventario.selectFachada")}
                        </option>
                        {fachadas.map((f) => (
                          <option key={f.id} value={f.id} className="bg-[var(--surface-2)]">
                            {f.nombre}
                          </option>
                        ))}
                        <option value="__none__" className="bg-[var(--surface-2)]">—</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                      />
                    </div>
                    <button
                      onClick={handleBulkFachadaChange}
                      disabled={bulkLoading || !bulkFachadaId}
                      className={btnPrimary}
                    >
                      {t("inventario.assign")}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setSelectedIds(new Set())}
                  className={btnSecondary}
                >
                  <X size={14} />
                  Deseleccionar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
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
                      <CheckSquare size={16} className="text-[var(--site-primary)]" />
                    ) : someFilteredSelected ? (
                      <MinusSquare size={16} className="text-[rgba(var(--site-primary-rgb),0.6)]" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  {t("inventario.fields.identifier")}
                </th>
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  {t("inventario.fields.typology")}
                </th>
                {fachadas.length > 0 && (
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                    {t("inventario.fields.fachada")}
                  </th>
                )}
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  {t("inventario.fields.floor")}
                </th>
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  {t("inventario.fields.area")}
                </th>
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  {t("inventario.fields.price")}
                </th>
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  {t("inventario.fields.state")}
                </th>
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  {t("inventario.fields.bedrooms")}
                </th>
                <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                  {t("inventario.fields.bathrooms")}
                </th>
                <th className="text-right py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">

                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUnidades.length === 0 ? (
                <tr>
                  <td
                    colSpan={fachadas.length > 0 ? 11 : 10}
                    className="py-16 text-center text-[var(--text-muted)] text-sm"
                  >
                    {unidades.length === 0
                      ? t("inventario.noUnits")
                      : t("inventario.noUnitsFiltered")}
                  </td>
                </tr>
              ) : (
                filteredUnidades.map((unit) => (
                  <motion.tr
                    key={unit.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)] transition-colors group"
                  >
                    {editingId === unit.id ? (
                      <td colSpan={fachadas.length > 0 ? 11 : 10} className="p-4">
                        <UnitForm
                          initial={getEditFormData(unit)}
                          tipologias={tipologiasForDropdown}
                          fachadas={fachadas}
                          onSubmit={(data) => handleUpdate(unit.id, data)}
                          onCancel={() => setEditingId(null)}
                          submitting={formLoading}
                        />
                      </td>
                    ) : (
                      <>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleSelect(unit.id)}
                            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                          >
                            {selectedIds.has(unit.id) ? (
                              <CheckSquare
                                size={16}
                                className="text-[var(--site-primary)]"
                              />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {unit.identificador}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={unit.tipologia_id || ""}
                            onChange={(e) => handleInlineUpdate(unit.id, "tipologia_id", e.target.value || null)}
                            className="bg-transparent text-xs text-[var(--text-secondary)] hover:text-white cursor-pointer focus:outline-none border-none appearance-none"
                          >
                            <option value="" className="bg-[var(--surface-2)]">—</option>
                            {tipologiasForDropdown.map((tp) => (
                              <option key={tp.id} value={tp.id} className="bg-[var(--surface-2)]">
                                {tp.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                        {fachadas.length > 0 && (
                          <td className="py-3 px-4">
                            <select
                              value={unit.fachada_id || ""}
                              onChange={(e) => handleInlineUpdate(unit.id, "fachada_id", e.target.value || null)}
                              className="bg-transparent text-xs text-[var(--text-secondary)] hover:text-white cursor-pointer focus:outline-none border-none appearance-none"
                            >
                              <option value="" className="bg-[var(--surface-2)]">—</option>
                              {fachadas.map((f) => (
                                <option key={f.id} value={f.id} className="bg-[var(--surface-2)]">
                                  {f.nombre}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {unit.piso ?? "-"}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {unit.area_m2 != null ? `${unit.area_m2} m²` : "-"}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {formatPrice(unit.precio)}
                        </td>
                        <td className="py-3 px-4">
                          <EstadoBadge estado={unit.estado} />
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {unit.habitaciones ?? "-"}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {unit.banos ?? "-"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingId(unit.id);
                                setShowCreateForm(false);
                              }}
                              className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors text-[var(--text-tertiary)] hover:text-white"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(unit.id)}
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

      {/* Modals */}
      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmDialog
            title={t("inventario.deleteUnit")}
            message={t("inventario.deleteConfirm")}
            onConfirm={() => handleDelete(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCSVModal && (
          <ImportCSVModal
            tipologias={tipologias}
            proyectoId={projectId}
            activeTorreId={activeTorreId}
            onClose={() => setShowCSVModal(false)}
            onDone={handleImportDone}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAIModal && (
          <ImportAIModal
            tipologias={tipologias}
            proyectoId={projectId}
            activeTorreId={activeTorreId}
            onClose={() => setShowAIModal(false)}
            onDone={handleImportDone}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPriceAdjust && (
          <PriceAdjustModal
            unidades={unidades}
            selectedIds={selectedIds}
            onClose={() => setShowPriceAdjust(false)}
            onDone={async () => {
              setShowPriceAdjust(false);
              await refresh();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAIChat && (
          <AIChatModal
            unidades={unidades}
            tipologias={tipologias}
            fachadas={fachadas}
            onClose={() => setShowAIChat(false)}
            onDone={async () => {
              await refresh();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
