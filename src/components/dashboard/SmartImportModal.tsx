"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Sparkles,
  Loader2,
  AlertTriangle,
  Check,
  Download,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  Columns3,
  ArrowLeftRight,
  Building2,
  Layers,
  Settings2,
  CircleDot,
  CheckCircle2,
  MinusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  inputClass,
  btnPrimary,
  btnSecondary,
} from "@/components/dashboard/editor-styles";
import {
  extractCSVHeadersAndSample,
  parseCSVWithMapping,
  parseCSVWithMappingComplementos,
  type MappedUnit,
  type MappedComplemento,
  type EstadoUnidad,
  type ColumnMapping,
} from "@/lib/csv-parser";
import type { Tipologia, Torre } from "@/types";

type ImportMode = "unidades" | "parqueaderos" | "depositos";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = "upload" | "config" | "preview" | "importing";

interface AIAnalysis {
  columnMapping: Record<string, string>;
  ignoredColumns: string[];
  statusMapping: Record<string, string>;
  detectedEtapas: string[];
  detectedTipologias: string[];
  missingFields: string[];
  notes: string;
}

interface PreviewUnit extends MappedUnit {
  _selected: boolean;
  _torre_id: string;
  _tipologia_id: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ESTADOS: { value: EstadoUnidad; label: string; color: string }[] = [
  { value: "disponible", label: "Disponible", color: "#22c55e" },
  { value: "separado", label: "Separado", color: "#eab308" },
  { value: "reservada", label: "Reservada", color: "#f97316" },
  { value: "vendida", label: "Vendida", color: "#ef4444" },
];

const ESTADO_COLORS: Record<string, string> = {
  disponible: "#22c55e",
  separado: "#eab308",
  reservada: "#f97316",
  vendida: "#ef4444",
};

const DB_FIELD_LABELS_UNIDADES: Record<string, string> = {
  identificador: "Identificador",
  piso: "Piso",
  area_m2: "Área (m²)",
  precio: "Precio",
  estado: "Estado",
  habitaciones: "Habitaciones",
  banos: "Baños",
  parqueaderos: "Parqueaderos",
  depositos: "Depósitos",
  orientacion: "Orientación",
  vista: "Vista",
  notas: "Notas",
  _etapa: "Torre / Etapa",
  _tipologia: "Tipología",
};

const DB_FIELD_LABELS_COMPLEMENTOS: Record<string, string> = {
  identificador: "Identificador",
  subtipo: "Subtipo",
  nivel: "Nivel",
  area_m2: "Área (m²)",
  precio: "Precio",
  estado: "Estado",
  notas: "Notas",
  _etapa: "Torre / Etapa",
};

function getFieldLabels(mode: ImportMode) {
  return mode === "unidades" ? DB_FIELD_LABELS_UNIDADES : DB_FIELD_LABELS_COMPLEMENTOS;
}

// ---------------------------------------------------------------------------
// Small reusable pieces
// ---------------------------------------------------------------------------

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  count,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/50">
        <div className="w-7 h-7 rounded-lg bg-[rgba(var(--site-primary-rgb),0.1)] flex items-center justify-center shrink-0">
          <Icon size={14} className="text-[var(--site-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-white">
              {title}
            </span>
            {count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(var(--site-primary-rgb),0.12)] text-[var(--site-primary)] font-medium">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EstadoDot({ estado, size = 8 }: { estado: string; size?: number }) {
  const color = ESTADO_COLORS[estado] || "#666";
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}50`,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// SmartImportModal
// ---------------------------------------------------------------------------

export function SmartImportModal({
  tipologias,
  torres,
  proyectoId,
  activeTorreId,
  onClose,
  onDone,
  importMode: initialMode = "unidades",
}: {
  tipologias: Tipologia[];
  torres: Torre[];
  proyectoId: string;
  activeTorreId: string | null;
  onClose: () => void;
  onDone: () => void;
  importMode?: ImportMode;
}) {
  // ---- State ----
  const [step, setStep] = useState<Step>("upload");
  const [importMode, setImportMode] = useState<ImportMode>(initialMode);
  const DB_FIELD_LABELS = getFieldLabels(importMode);
  const ALL_DB_FIELDS = Object.keys(DB_FIELD_LABELS);
  const [rawCSV, setRawCSV] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsed CSV structure
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvAllRows, setCsvAllRows] = useState<string[][]>([]);
  const [totalRows, setTotalRows] = useState(0);

  // AI analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  // User-editable config (initialized from AI analysis)
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [statusMap, setStatusMap] = useState<Record<string, EstadoUnidad>>({});
  const [etapaToTorre, setEtapaToTorre] = useState<Record<string, string>>({});
  const [tipologiaMap, setTipologiaMap] = useState<Record<string, string>>({});
  const [defaults, setDefaults] = useState<Record<string, string>>({});

  // Preview
  const [previewUnits, setPreviewUnits] = useState<PreviewUnit[]>([]);

  // Import
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- File handling ----
  const processFile = async (file: File) => {
    setError(null);
    try {
      let text: string;
      if (file.name.match(/\.xlsx?$/i)) {
        const XLSX = (await import("xlsx")).default;
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer);
        const ws = wb.Sheets[wb.SheetNames[0]];
        text = XLSX.utils.sheet_to_csv(ws);
      } else {
        text = await file.text();
      }
      setRawCSV(text);
    } catch {
      setError("Error al leer el archivo.");
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

  const handleDownloadExample = () => {
    const torreNombre =
      torres.length > 0
        ? torres.find((t) => t.id === activeTorreId)?.nombre ||
          torres[0].nombre ||
          "Torre 1"
        : "Torre 1";
    const tipNombre =
      tipologias.length > 0 ? tipologias[0].nombre || "Tipo A" : "Tipo A";

    const rows = [
      "identificador,piso,area_m2,precio,estado,habitaciones,banos,parqueaderos,depositos,orientacion,vista,torre,tipologia,notas",
      `101,1,65.5,350000000,disponible,2,2,1,1,Norte,Interior,${torreNombre},${tipNombre},`,
      `102,1,72.3,380000000,disponible,3,2,2,0,Sur,Exterior,${torreNombre},${tipNombre},`,
      `201,2,65.5,360000000,separado,2,2,1,1,Norte,Interior,${torreNombre},${tipNombre},Separada por cliente`,
      `202,2,72.3,390000000,disponible,3,2,2,0,Sur,Exterior,${torreNombre},${tipNombre},`,
      `301,3,80.1,420000000,vendida,3,3,2,1,Oriente,Montaña,${torreNombre},${tipNombre},`,
    ];
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ejemplo_inventario.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- AI Analysis ----
  const handleAnalyze = async () => {
    setError(null);
    setAnalyzing(true);
    try {
      const { headers, sampleRows, allRows, totalRows: total } =
        extractCSVHeadersAndSample(rawCSV);

      if (headers.length === 0 || total === 0) {
        setError("No se encontraron datos en el archivo.");
        setAnalyzing(false);
        return;
      }

      setCsvHeaders(headers);
      setCsvAllRows(allRows);
      setTotalRows(total);

      const res = await fetch("/api/ai/analyze-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers,
          sampleRows,
          tipologias: tipologias.map((t) => ({ id: t.id, nombre: t.nombre })),
          torres: torres.map((t) => ({ id: t.id, nombre: t.nombre })),
          importMode,
        }),
      });

      if (!res.ok) throw new Error("AI analysis failed");

      const data: AIAnalysis = await res.json();
      setAnalysis(data);

      // Initialize user-editable state from AI results
      setColumnMap(data.columnMapping || {});
      const sMap: Record<string, EstadoUnidad> = {};
      for (const [k, v] of Object.entries(data.statusMapping || {})) {
        sMap[k] = v as EstadoUnidad;
      }
      setStatusMap(sMap);

      // Initialize etapa→torre mapping
      const etMap: Record<string, string> = {};
      for (const etapa of data.detectedEtapas || []) {
        const match = torres.find(
          (t) =>
            t.nombre.toLowerCase().includes(etapa.toLowerCase()) ||
            etapa.toLowerCase().includes(t.nombre.toLowerCase())
        );
        etMap[etapa] = match?.id || "";
      }
      setEtapaToTorre(etMap);

      // Initialize tipologia mapping
      const tipMap: Record<string, string> = {};
      for (const tipVal of data.detectedTipologias || []) {
        const match = tipologias.find(
          (t) =>
            t.nombre.toLowerCase().includes(tipVal.toLowerCase()) ||
            tipVal.toLowerCase().includes(t.nombre.toLowerCase())
        );
        tipMap[tipVal] = match?.id || "";
      }
      setTipologiaMap(tipMap);

      setStep("config");
    } catch {
      setError("Error al analizar el archivo. Intenta de nuevo.");
    } finally {
      setAnalyzing(false);
    }
  };

  // ---- Build preview ----
  const handleBuildPreview = useCallback(() => {
    setError(null);
    try {
      const mapping: ColumnMapping = {
        columnMap,
        statusMap,
      };

      if (importMode !== "unidades") {
        // Complemento mode
        const parsed = parseCSVWithMappingComplementos(csvAllRows, csvHeaders, mapping);
        if (parsed.length === 0) {
          setError("No se encontraron items válidos con el mapeo actual.");
          return;
        }
        const preview: PreviewUnit[] = parsed.map((c) => {
          const torreId = c._etapa
            ? etapaToTorre[c._etapa] || ""
            : activeTorreId && activeTorreId !== "__none__"
              ? activeTorreId
              : "";
          return {
            identificador: c.identificador,
            piso: null,
            area_m2: c.area_m2 ?? (defaults.area_m2 ? parseFloat(defaults.area_m2) : null),
            precio: c.precio ?? (defaults.precio ? parseFloat(defaults.precio) : null),
            estado: c.estado,
            habitaciones: null,
            banos: null,
            parqueaderos: null,
            depositos: null,
            orientacion: null,
            vista: null,
            notas: c.notas,
            _etapa: c._etapa,
            _tipologia: c.subtipo,
            _selected: true,
            _torre_id: torreId,
            _tipologia_id: "",
            _subtipo: c.subtipo,
            _nivel: c.nivel,
          } as PreviewUnit & { _subtipo?: string | null; _nivel?: string | null };
        });
        setPreviewUnits(preview);
        setStep("preview");
        return;
      }

      const parsed = parseCSVWithMapping(csvAllRows, csvHeaders, mapping);

      if (parsed.length === 0) {
        setError("No se encontraron unidades válidas con el mapeo actual.");
        return;
      }

      const preview: PreviewUnit[] = parsed.map((u) => {
        const torreId = u._etapa
          ? etapaToTorre[u._etapa] || ""
          : activeTorreId && activeTorreId !== "__none__"
            ? activeTorreId
            : "";
        const tipId = u._tipologia ? tipologiaMap[u._tipologia] || "" : "";

        return {
          ...u,
          area_m2:
            u.area_m2 ?? (defaults.area_m2 ? parseFloat(defaults.area_m2) : null),
          precio:
            u.precio ?? (defaults.precio ? parseFloat(defaults.precio) : null),
          habitaciones:
            u.habitaciones ??
            (defaults.habitaciones ? parseInt(defaults.habitaciones) : null),
          banos:
            u.banos ?? (defaults.banos ? parseInt(defaults.banos) : null),
          parqueaderos:
            u.parqueaderos ??
            (defaults.parqueaderos ? parseInt(defaults.parqueaderos) : null),
          depositos:
            u.depositos ??
            (defaults.depositos ? parseInt(defaults.depositos) : null),
          _selected: true,
          _torre_id: torreId,
          _tipologia_id: tipId,
        };
      });

      setPreviewUnits(preview);
      setStep("preview");
    } catch {
      setError("Error al procesar las unidades.");
    }
  }, [
    columnMap,
    statusMap,
    csvAllRows,
    csvHeaders,
    etapaToTorre,
    tipologiaMap,
    defaults,
    activeTorreId,
    importMode,
  ]);

  // ---- Import ----
  const selectedUnits = useMemo(
    () => previewUnits.filter((u) => u._selected),
    [previewUnits]
  );

  const handleConfirm = async () => {
    if (selectedUnits.length === 0) {
      setError("No hay items seleccionados para importar.");
      return;
    }
    setSubmitting(true);
    setStep("importing");
    setError(null);
    try {
      if (importMode !== "unidades") {
        // Complemento import
        const tipo = importMode === "parqueaderos" ? "parqueadero" : "deposito";
        const payload = selectedUnits.map((u) => ({
          proyecto_id: proyectoId,
          identificador: u.identificador,
          tipo,
          subtipo: (u as PreviewUnit & { _subtipo?: string | null })._subtipo || u._tipologia || null,
          nivel: (u as PreviewUnit & { _nivel?: string | null })._nivel || null,
          torre_id: u._torre_id || null,
          area_m2: u.area_m2,
          precio: u.precio,
          estado: u.estado,
          notas: u.notas || null,
        }));

        const res = await fetch("/api/complementos/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proyecto_id: proyectoId, complementos: payload }),
        });
        if (!res.ok) throw new Error("Error al crear complementos");
      } else {
        const payload = selectedUnits.map((u) => ({
          proyecto_id: proyectoId,
          identificador: u.identificador,
          tipologia_id: u._tipologia_id || null,
          torre_id: u._torre_id || null,
          piso: u.piso,
          area_m2: u.area_m2,
          precio: u.precio,
          estado: u.estado,
          habitaciones: u.habitaciones,
          banos: u.banos,
          parqueaderos: u.parqueaderos,
          depositos: u.depositos,
          orientacion: u.orientacion || null,
          vista: u.vista || null,
          notas: u.notas || null,
        }));

        const res = await fetch("/api/unidades/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proyecto_id: proyectoId, unidades: payload }),
        });
        if (!res.ok) throw new Error("Error al crear unidades");
      }
      onDone();
    } catch {
      setError("Error al importar. Intenta de nuevo.");
      setStep("preview");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Preview helpers ----
  const toggleUnit = (index: number) => {
    setPreviewUnits((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], _selected: !copy[index]._selected };
      return copy;
    });
  };

  const toggleAll = () => {
    const allSelected = previewUnits.every((u) => u._selected);
    setPreviewUnits((prev) =>
      prev.map((u) => ({ ...u, _selected: !allSelected }))
    );
  };

  const updatePreviewField = (
    index: number,
    field: string,
    value: string
  ) => {
    setPreviewUnits((prev) => {
      const copy = [...prev];
      const unit = { ...copy[index] };
      const intFields = ["piso", "habitaciones", "banos", "parqueaderos", "depositos"];
      const floatFields = ["area_m2", "precio"];

      if (intFields.includes(field)) {
        (unit as unknown as Record<string, number | null>)[field] = value
          ? parseInt(value) || null
          : null;
      } else if (floatFields.includes(field)) {
        (unit as unknown as Record<string, number | null>)[field] = value
          ? parseFloat(value) || null
          : null;
      } else if (field === "estado") {
        unit.estado = value as EstadoUnidad;
      } else if (field === "_torre_id" || field === "_tipologia_id") {
        (unit as unknown as Record<string, string>)[field] = value;
      } else {
        (unit as unknown as Record<string, string>)[field] = value;
      }
      copy[index] = unit;
      return copy;
    });
  };

  // ---- Stats ----
  const stats = useMemo(() => {
    const sel = selectedUnits;
    return {
      total: previewUnits.length,
      selected: sel.length,
      disponible: sel.filter((u) => u.estado === "disponible").length,
      separado: sel.filter((u) => u.estado === "separado").length,
      reservada: sel.filter((u) => u.estado === "reservada").length,
      vendida: sel.filter((u) => u.estado === "vendida").length,
    };
  }, [previewUnits, selectedUnits]);

  // ---- Step indicator ----
  const steps: { key: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: "upload", label: "Subir", icon: Upload },
    { key: "config", label: "Configurar", icon: Settings2 },
    { key: "preview", label: "Revisar", icon: CheckCircle2 },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === step);

  // ---- Mapped column count ----
  const mappedCount = Object.keys(columnMap).length;
  const ignoredCount = analysis?.ignoredColumns?.length || 0;

  // ---- Select class for config dropdowns ----
  const selectClass =
    "flex-1 bg-[var(--surface-3)] border border-[var(--border-default)] text-white text-[11px] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)] focus:shadow-[0_0_0_2px_rgba(var(--site-primary-rgb),0.08)] transition-all appearance-none cursor-pointer";

  // ---- Inline edit input class ----
  const cellInputClass =
    "bg-transparent border-b border-transparent text-white text-[11px] px-1 py-0.5 focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.4)] transition-colors hover:border-[var(--border-default)]";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface-0)] border border-[var(--border-default)] rounded-2xl w-full max-w-[calc(100vw-2rem)] lg:max-w-5xl max-h-[90vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03)_inset]"
      >
        {/* ═══════════ Header ═══════════ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center shadow-[0_0_16px_rgba(var(--site-primary-rgb),0.08)]">
              <FileSpreadsheet size={16} className="text-[var(--site-primary)]" />
            </div>
            <div>
              <h3 className="font-ui text-xs font-bold uppercase tracking-[0.1em] text-white">
                Importar inventario
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                CSV, Excel o texto — con análisis inteligente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Step indicators */}
            <div className="hidden sm:flex items-center gap-0.5">
              {steps.map((s, i) => {
                const StepIcon = s.icon;
                const isActive = i === currentStepIdx;
                const isDone = i < currentStepIdx;
                const isFuture = i > currentStepIdx;

                return (
                  <div key={s.key} className="flex items-center">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
                          isDone &&
                            "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)]",
                          isActive &&
                            "bg-[var(--site-primary)] text-[#141414] shadow-[0_0_16px_rgba(var(--site-primary-rgb),0.3)]",
                          isFuture &&
                            "bg-[var(--surface-3)] text-[var(--text-muted)]"
                        )}
                      >
                        {isDone ? (
                          <Check size={11} strokeWidth={2.5} />
                        ) : (
                          <StepIcon size={12} />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium hidden md:inline transition-colors duration-300",
                          isActive
                            ? "text-white"
                            : isDone
                              ? "text-[var(--text-secondary)]"
                              : "text-[var(--text-muted)]"
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className={cn(
                          "w-6 h-px mx-2 transition-colors duration-300",
                          isDone
                            ? "bg-[rgba(var(--site-primary-rgb),0.3)]"
                            : "bg-[var(--border-subtle)]"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors"
            >
              <X size={16} className="text-[var(--text-tertiary)]" />
            </button>
          </div>
        </div>

        {/* ═══════════ Body ═══════════ */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* ─── Step 1: Upload ─── */}
            {step === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Import mode selector */}
                <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
                  {([
                    { value: "unidades" as ImportMode, label: "Unidades" },
                    { value: "parqueaderos" as ImportMode, label: "Parqueaderos" },
                    { value: "depositos" as ImportMode, label: "Depósitos" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setImportMode(opt.value)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all text-center",
                        importMode === opt.value
                          ? "bg-[var(--surface-3)] text-white shadow-sm"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group",
                    dragging
                      ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.06)]"
                      : rawCSV.trim()
                        ? "border-[rgba(var(--site-primary-rgb),0.3)] bg-[rgba(var(--site-primary-rgb),0.03)]"
                        : "border-[var(--border-default)] hover:border-[rgba(var(--site-primary-rgb),0.4)] hover:bg-[rgba(var(--site-primary-rgb),0.02)]"
                  )}
                >
                  {/* Subtle glow effect on hover */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(var(--site-primary-rgb),0.04)_0%,transparent_70%)]" />

                  <div className="relative">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300",
                        rawCSV.trim()
                          ? "bg-[rgba(var(--site-primary-rgb),0.12)] border border-[rgba(var(--site-primary-rgb),0.2)]"
                          : "bg-[var(--surface-2)] border border-[var(--border-subtle)] group-hover:border-[rgba(var(--site-primary-rgb),0.2)] group-hover:bg-[rgba(var(--site-primary-rgb),0.08)]"
                      )}
                    >
                      {rawCSV.trim() ? (
                        <CheckCircle2
                          size={22}
                          className="text-[var(--site-primary)]"
                        />
                      ) : (
                        <Upload
                          size={22}
                          className="text-[var(--text-muted)] group-hover:text-[var(--site-primary)] transition-colors duration-300"
                        />
                      )}
                    </div>

                    {rawCSV.trim() ? (
                      <>
                        <p className="text-xs font-medium text-[var(--site-primary)]">
                          Archivo cargado
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                          {rawCSV.split("\n").filter((l) => l.trim()).length - 1}{" "}
                          filas detectadas — haz clic para cambiar
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-[var(--text-secondary)] font-medium">
                          Arrastra un archivo CSV o Excel aquí
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                          .csv, .tsv, .xlsx, .xls — o haz clic para seleccionar
                        </p>
                      </>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.tsv,.txt,.xlsx,.xls"
                    hidden
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Download example */}
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadExample();
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] text-[var(--site-primary)] hover:text-[var(--site-primary)] hover:underline transition-colors px-3 py-1.5 rounded-lg hover:bg-[rgba(var(--site-primary-rgb),0.05)]"
                  >
                    <Download size={12} />
                    Descargar CSV de ejemplo
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    o pega el contenido
                  </span>
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                </div>

                {/* Paste area */}
                <textarea
                  value={rawCSV}
                  onChange={(e) => setRawCSV(e.target.value)}
                  placeholder={`identificador,piso,area_m2,precio,estado,habitaciones,banos,parqueaderos,depositos\n101,1,65,350000000,disponible,2,2,1,1\n102,1,72,380000000,disponible,3,2,2,0`}
                  rows={5}
                  className={inputClass + " resize-none font-mono text-[11px] leading-relaxed"}
                />
              </motion.div>
            )}

            {/* ─── Step 2: Config ─── */}
            {step === "config" && analysis && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* AI Notes Banner */}
                {analysis.notes && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-[rgba(var(--site-primary-rgb),0.04)] border border-[rgba(var(--site-primary-rgb),0.12)]">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={13} className="text-[var(--site-primary)]" />
                    </div>
                    <div>
                      <span className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--site-primary)]">
                        Análisis IA
                      </span>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                        {analysis.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    <FileSpreadsheet size={10} />
                    {csvHeaders.length} columnas
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.15)] text-green-400">
                    <CheckCircle2 size={10} />
                    {mappedCount} mapeadas
                  </span>
                  {ignoredCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                      <MinusCircle size={10} />
                      {ignoredCount} ignoradas
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[rgba(var(--site-primary-rgb),0.08)] border border-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)]">
                    <Layers size={10} />
                    {totalRows} filas
                  </span>
                </div>

                {/* Column Mapping */}
                <SectionCard
                  icon={Columns3}
                  title="Mapeo de columnas"
                  description="Asigna cada columna del archivo a un campo de la base de datos"
                  count={mappedCount}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_DB_FIELDS.map((dbField) => {
                      const mappedCsvCol = Object.entries(columnMap).find(
                        ([, v]) => v === dbField
                      )?.[0];
                      const isMapped = !!mappedCsvCol;

                      return (
                        <div
                          key={dbField}
                          className={cn(
                            "flex items-center gap-2.5 p-2.5 rounded-lg border transition-all",
                            isMapped
                              ? "bg-[rgba(34,197,94,0.03)] border-[rgba(34,197,94,0.12)]"
                              : "bg-[var(--surface-1)] border-[var(--border-subtle)]"
                          )}
                        >
                          {/* Mapped indicator */}
                          <div className="w-5 flex items-center justify-center shrink-0">
                            {isMapped ? (
                              <CheckCircle2
                                size={13}
                                className="text-green-400/70"
                              />
                            ) : (
                              <CircleDot
                                size={13}
                                className="text-[var(--text-muted)]/40"
                              />
                            )}
                          </div>

                          <span
                            className={cn(
                              "text-[11px] w-24 shrink-0 transition-colors",
                              isMapped
                                ? "text-white font-medium"
                                : "text-[var(--text-muted)]"
                            )}
                          >
                            {DB_FIELD_LABELS[dbField]}
                          </span>

                          <ArrowLeft
                            size={9}
                            className="text-[var(--text-muted)]/30 shrink-0"
                          />

                          <select
                            value={mappedCsvCol || ""}
                            onChange={(e) => {
                              const newMap = { ...columnMap };
                              for (const [k, v] of Object.entries(newMap)) {
                                if (v === dbField) delete newMap[k];
                              }
                              if (e.target.value) {
                                newMap[e.target.value] = dbField;
                              }
                              setColumnMap(newMap);
                            }}
                            className={selectClass}
                          >
                            <option value="" className="bg-[var(--surface-3)]">
                              — No mapeada
                            </option>
                            {csvHeaders.map((h) => (
                              <option
                                key={h}
                                value={h}
                                className="bg-[var(--surface-3)]"
                              >
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>

                {/* Status Mapping */}
                {Object.keys(statusMap).length > 0 && (
                  <SectionCard
                    icon={ArrowLeftRight}
                    title="Mapeo de estados"
                    description="Cada valor de estado del archivo se asigna a un estado válido"
                    count={Object.keys(statusMap).length}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(statusMap).map(([csvVal, estado]) => (
                        <div
                          key={csvVal}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)]"
                        >
                          <span className="text-[11px] text-[var(--text-secondary)] w-24 shrink-0 font-mono truncate">
                            &quot;{csvVal}&quot;
                          </span>
                          <ArrowRight
                            size={9}
                            className="text-[var(--text-muted)]/30 shrink-0"
                          />
                          <EstadoDot estado={estado} />
                          <select
                            value={estado}
                            onChange={(e) =>
                              setStatusMap((prev) => ({
                                ...prev,
                                [csvVal]: e.target.value as EstadoUnidad,
                              }))
                            }
                            className={selectClass}
                          >
                            {ESTADOS.map((e) => (
                              <option
                                key={e.value}
                                value={e.value}
                                className="bg-[var(--surface-3)]"
                              >
                                {e.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Etapa → Torre Mapping */}
                {Object.keys(etapaToTorre).length > 0 && torres.length > 0 && (
                  <SectionCard
                    icon={Building2}
                    title="Etapas → Torres"
                    description="Asigna cada valor de etapa detectado a una torre o manzana del proyecto"
                    count={Object.keys(etapaToTorre).length}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(etapaToTorre).map(([etapa, torreId]) => {
                        const isAssigned = !!torreId;
                        return (
                          <div
                            key={etapa}
                            className={cn(
                              "flex items-center gap-2.5 p-2.5 rounded-lg border transition-all",
                              isAssigned
                                ? "bg-[rgba(var(--site-primary-rgb),0.03)] border-[rgba(var(--site-primary-rgb),0.12)]"
                                : "bg-[var(--surface-1)] border-[var(--border-subtle)]"
                            )}
                          >
                            <span className="text-[11px] text-[var(--text-secondary)] w-24 shrink-0">
                              Etapa &quot;{etapa}&quot;
                            </span>
                            <ArrowRight
                              size={9}
                              className="text-[var(--text-muted)]/30 shrink-0"
                            />
                            <select
                              value={torreId}
                              onChange={(e) =>
                                setEtapaToTorre((prev) => ({
                                  ...prev,
                                  [etapa]: e.target.value,
                                }))
                              }
                              className={selectClass}
                            >
                              <option value="" className="bg-[var(--surface-3)]">
                                — Sin asignar
                              </option>
                              {torres.map((t) => (
                                <option
                                  key={t.id}
                                  value={t.id}
                                  className="bg-[var(--surface-3)]"
                                >
                                  {t.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}

                {/* Tipología Mapping */}
                {Object.keys(tipologiaMap).length > 0 &&
                  tipologias.length > 0 && (
                    <SectionCard
                      icon={Layers}
                      title="Tipologías"
                      description="Asigna cada código de tipología del archivo a una tipología del proyecto"
                      count={Object.keys(tipologiaMap).length}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(tipologiaMap).map(
                          ([tipVal, tipId]) => {
                            const isAssigned = !!tipId;
                            return (
                              <div
                                key={tipVal}
                                className={cn(
                                  "flex items-center gap-2.5 p-2.5 rounded-lg border transition-all",
                                  isAssigned
                                    ? "bg-[rgba(var(--site-primary-rgb),0.03)] border-[rgba(var(--site-primary-rgb),0.12)]"
                                    : "bg-[var(--surface-1)] border-[var(--border-subtle)]"
                                )}
                              >
                                <span className="text-[11px] text-[var(--text-secondary)] w-24 shrink-0 font-mono">
                                  &quot;{tipVal}&quot;
                                </span>
                                <ArrowRight
                                  size={9}
                                  className="text-[var(--text-muted)]/30 shrink-0"
                                />
                                <select
                                  value={tipId}
                                  onChange={(e) =>
                                    setTipologiaMap((prev) => ({
                                      ...prev,
                                      [tipVal]: e.target.value,
                                    }))
                                  }
                                  className={selectClass}
                                >
                                  <option
                                    value=""
                                    className="bg-[var(--surface-3)]"
                                  >
                                    — Sin asignar
                                  </option>
                                  {tipologias.map((t) => (
                                    <option
                                      key={t.id}
                                      value={t.id}
                                      className="bg-[var(--surface-3)]"
                                    >
                                      {t.nombre}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </SectionCard>
                  )}

                {/* Default values for missing fields */}
                {analysis.missingFields.length > 0 && (
                  <SectionCard
                    icon={Settings2}
                    title="Valores por defecto"
                    description="Estos campos no se encontraron en el archivo. Establece un valor por defecto o déjalos vacíos."
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {analysis.missingFields
                        .filter(
                          (f) =>
                            f !== "notas" &&
                            f !== "orientacion" &&
                            f !== "vista"
                        )
                        .map((field) => (
                          <div key={field}>
                            <label className="text-[10px] text-[var(--text-muted)] mb-1.5 block font-medium uppercase tracking-wider">
                              {DB_FIELD_LABELS[field] || field}
                            </label>
                            <input
                              type={
                                [
                                  "precio",
                                  "area_m2",
                                  "piso",
                                  "habitaciones",
                                  "banos",
                                  "parqueaderos",
                                  "depositos",
                                ].includes(field)
                                  ? "number"
                                  : "text"
                              }
                              value={defaults[field] || ""}
                              onChange={(e) =>
                                setDefaults((prev) => ({
                                  ...prev,
                                  [field]: e.target.value,
                                }))
                              }
                              placeholder="—"
                              className="w-full bg-[var(--surface-3)] border border-[var(--border-default)] text-white text-[11px] px-2.5 py-2 rounded-lg focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)] focus:shadow-[0_0_0_2px_rgba(var(--site-primary-rgb),0.08)] transition-all placeholder:text-[var(--text-muted)]"
                            />
                          </div>
                        ))}
                    </div>
                  </SectionCard>
                )}
              </motion.div>
            )}

            {/* ─── Step 3: Preview ─── */}
            {(step === "preview" || step === "importing") && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Stats bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    {stats.selected}/{stats.total} seleccionadas
                  </span>
                  {stats.disponible > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border" style={{ backgroundColor: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                      <EstadoDot estado="disponible" size={6} />
                      {stats.disponible} disponibles
                    </span>
                  )}
                  {stats.separado > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border" style={{ backgroundColor: "rgba(234,179,8,0.08)", borderColor: "rgba(234,179,8,0.15)", color: "#eab308" }}>
                      <EstadoDot estado="separado" size={6} />
                      {stats.separado} separadas
                    </span>
                  )}
                  {stats.reservada > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border" style={{ backgroundColor: "rgba(249,115,22,0.08)", borderColor: "rgba(249,115,22,0.15)", color: "#f97316" }}>
                      <EstadoDot estado="reservada" size={6} />
                      {stats.reservada} reservadas
                    </span>
                  )}
                  {stats.vendida > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border" style={{ backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                      <EstadoDot estado="vendida" size={6} />
                      {stats.vendida} vendidas
                    </span>
                  )}
                </div>

                {/* Preview table */}
                <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-[var(--surface-1)]">
                        <th className="py-2.5 px-2 text-left border-b border-[var(--border-default)]">
                          <button
                            onClick={toggleAll}
                            className="text-[var(--text-tertiary)] hover:text-white transition-colors"
                          >
                            {previewUnits.every((u) => u._selected) ? (
                              <CheckSquare size={14} className="text-[var(--site-primary)]" />
                            ) : (
                              <Square size={14} />
                            )}
                          </button>
                        </th>
                        {[
                          "ID",
                          "Torre",
                          "Tipología",
                          "Piso",
                          "Área m²",
                          "Precio",
                          "Estado",
                          "Hab",
                          "Baños",
                          "Parq",
                          "Dep",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left py-2.5 px-2 text-[var(--text-muted)] font-ui text-[9px] font-bold uppercase tracking-[0.12em] border-b border-[var(--border-default)]"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewUnits.map((u, i) => (
                        <tr
                          key={i}
                          className={cn(
                            "border-b border-[var(--border-subtle)] transition-all duration-150",
                            !u._selected && "opacity-30",
                            u._selected && "hover:bg-[var(--surface-1)]"
                          )}
                        >
                          <td className="py-1.5 px-2">
                            <button
                              onClick={() => toggleUnit(i)}
                              className="text-[var(--text-tertiary)] hover:text-white transition-colors"
                            >
                              {u._selected ? (
                                <CheckSquare
                                  size={13}
                                  className="text-[var(--site-primary)]"
                                />
                              ) : (
                                <Square size={13} />
                              )}
                            </button>
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              value={u.identificador}
                              onChange={(e) =>
                                updatePreviewField(
                                  i,
                                  "identificador",
                                  e.target.value
                                )
                              }
                              className={cn(cellInputClass, "w-16 font-medium")}
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <select
                              value={u._torre_id}
                              onChange={(e) =>
                                updatePreviewField(
                                  i,
                                  "_torre_id",
                                  e.target.value
                                )
                              }
                              className={cn(cellInputClass, "w-24")}
                            >
                              <option
                                value=""
                                className="bg-[var(--surface-2)]"
                              >
                                --
                              </option>
                              {torres.map((t) => (
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
                            <select
                              value={u._tipologia_id}
                              onChange={(e) =>
                                updatePreviewField(
                                  i,
                                  "_tipologia_id",
                                  e.target.value
                                )
                              }
                              className={cn(cellInputClass, "w-24")}
                            >
                              <option
                                value=""
                                className="bg-[var(--surface-2)]"
                              >
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
                                updatePreviewField(i, "piso", e.target.value)
                              }
                              className={cn(cellInputClass, "w-10")}
                              type="number"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              value={u.area_m2 ?? ""}
                              onChange={(e) =>
                                updatePreviewField(
                                  i,
                                  "area_m2",
                                  e.target.value
                                )
                              }
                              className={cn(cellInputClass, "w-14")}
                              type="number"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              value={u.precio ?? ""}
                              onChange={(e) =>
                                updatePreviewField(
                                  i,
                                  "precio",
                                  e.target.value
                                )
                              }
                              className={cn(cellInputClass, "w-24")}
                              type="number"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <div className="flex items-center gap-1.5">
                              <EstadoDot estado={u.estado} size={6} />
                              <select
                                value={u.estado}
                                onChange={(e) =>
                                  updatePreviewField(
                                    i,
                                    "estado",
                                    e.target.value
                                  )
                                }
                                className={cn(cellInputClass, "w-20")}
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
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              value={u.habitaciones ?? ""}
                              onChange={(e) =>
                                updatePreviewField(
                                  i,
                                  "habitaciones",
                                  e.target.value
                                )
                              }
                              className={cn(cellInputClass, "w-10")}
                              type="number"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              value={u.banos ?? ""}
                              onChange={(e) =>
                                updatePreviewField(
                                  i,
                                  "banos",
                                  e.target.value
                                )
                              }
                              className={cn(cellInputClass, "w-10")}
                              type="number"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              value={u.parqueaderos ?? ""}
                              onChange={(e) =>
                                updatePreviewField(
                                  i,
                                  "parqueaderos",
                                  e.target.value
                                )
                              }
                              className={cn(cellInputClass, "w-10")}
                              type="number"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              value={u.depositos ?? ""}
                              onChange={(e) =>
                                updatePreviewField(
                                  i,
                                  "depositos",
                                  e.target.value
                                )
                              }
                              className={cn(cellInputClass, "w-10")}
                              type="number"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/15">
              <AlertTriangle size={13} className="text-red-400 shrink-0" />
              <p className="text-[11px] text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* ═══════════ Footer ═══════════ */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-0)]">
          <div>
            {step === "config" && (
              <button
                onClick={() => setStep("upload")}
                className={btnSecondary + " text-xs"}
              >
                <ArrowLeft size={12} />
                Cambiar archivo
              </button>
            )}
            {step === "preview" && (
              <button
                onClick={() => setStep("config")}
                className={btnSecondary + " text-xs"}
              >
                <ArrowLeft size={12} />
                Configurar
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className={btnSecondary + " text-xs"}>
              Cancelar
            </button>

            {step === "upload" && (
              <button
                onClick={handleAnalyze}
                disabled={!rawCSV.trim() || analyzing}
                className={btnPrimary + " text-xs"}
              >
                {analyzing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                {analyzing ? "Analizando..." : "Analizar con IA"}
              </button>
            )}

            {step === "config" && (
              <button
                onClick={handleBuildPreview}
                disabled={!Object.values(columnMap).includes("identificador")}
                className={btnPrimary + " text-xs"}
              >
                <ArrowRight size={14} />
                Revisar {totalRows} unidades
              </button>
            )}

            {step === "preview" && (
              <button
                onClick={handleConfirm}
                disabled={submitting || selectedUnits.length === 0}
                className={btnPrimary + " text-xs"}
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {submitting
                  ? "Importando..."
                  : `Importar ${selectedUnits.length} unidades`}
              </button>
            )}

            {step === "importing" && (
              <div className="flex items-center gap-2.5">
                <div className="relative w-5 h-5">
                  <Loader2
                    size={18}
                    className="animate-spin text-[var(--site-primary)]"
                  />
                </div>
                <span className="text-xs text-[var(--text-secondary)]">
                  Importando {selectedUnits.length} unidades...
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
