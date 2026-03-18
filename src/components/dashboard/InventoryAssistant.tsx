"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Loader2,
  Send,
  TrendingUp,
  Layers,
  Building2,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Tag,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  btnPrimary,
  inputClass,
} from "@/components/dashboard/editor-styles";
import type { Unidad, Tipologia, Torre, Fachada } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AssistantMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  changes?: EnrichedChange[];
  changesApplied?: boolean;
  isError?: boolean;
  timestamp: Date;
}

interface EnrichedChange {
  id: string;
  identificador: string;
  updates: Record<string, unknown>;
  before: Record<string, unknown>;
}

interface SuggestionChip {
  label: string;
  prompt: string;
  icon: React.ElementType;
}

export interface InventoryAssistantProps {
  unidades: Unidad[];
  tipologias: Tipologia[];
  fachadas: Fachada[];
  torres: Torre[];
  projectId: string;
  tipoProyecto: string;
  tipologiaMode?: string;
  unidadTipologias?: { unidad_id: string; tipologia_id: string }[];
  onClose: () => void;
  onDone: (appliedChanges?: { id: string; updates: Record<string, unknown> }[]) => void;
}

// ---------------------------------------------------------------------------
// SVG Avatar — inspired by hugo-avatar.svg (gold chat bubble + grid + sparkle)
// ---------------------------------------------------------------------------

function AssistantAvatar({ size = 48 }: { size?: number }) {
  const id = `avatar-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4b05a" />
          <stop offset="100%" stopColor="#b8973a" />
        </linearGradient>
        <linearGradient id={`${id}-glow`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8973a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#b8973a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Background */}
      <circle cx="100" cy="100" r="100" fill="#141414" />

      {/* Outer glow */}
      <circle cx="100" cy="100" r="90" fill={`url(#${id}-glow)`} opacity="0.4" />

      {/* Chat bubble */}
      <path
        d="M 60 65 L 140 65 Q 150 65 150 75 L 150 115 Q 150 125 140 125 L 110 125 L 100 140 L 90 125 L 60 125 Q 50 125 50 115 L 50 75 Q 50 65 60 65 Z"
        fill={`url(#${id}-gold)`}
        opacity="0.9"
      />

      {/* Building grid inside bubble */}
      <g opacity="0.4">
        <line x1="70" y1="75" x2="70" y2="115" stroke="#141414" strokeWidth="1.5" />
        <line x1="85" y1="75" x2="85" y2="115" stroke="#141414" strokeWidth="1.5" />
        <line x1="100" y1="75" x2="100" y2="115" stroke="#141414" strokeWidth="1.5" />
        <line x1="115" y1="75" x2="115" y2="115" stroke="#141414" strokeWidth="1.5" />
        <line x1="130" y1="75" x2="130" y2="115" stroke="#141414" strokeWidth="1.5" />
        <line x1="60" y1="85" x2="140" y2="85" stroke="#141414" strokeWidth="1.5" />
        <line x1="60" y1="100" x2="140" y2="100" stroke="#141414" strokeWidth="1.5" />
      </g>

      {/* AI sparkle (top-right) */}
      <g transform="translate(135, 70)">
        <circle cx="0" cy="0" r="3" fill="#f4f0e8" />
        <line x1="0" y1="-8" x2="0" y2="-12" stroke="#f4f0e8" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="0" x2="12" y2="0" stroke="#f4f0e8" strokeWidth="2" strokeLinecap="round" />
        <line x1="-8" y1="0" x2="-12" y2="0" stroke="#f4f0e8" strokeWidth="2" strokeLinecap="round" />
        <line x1="0" y1="8" x2="0" y2="12" stroke="#f4f0e8" strokeWidth="2" strokeLinecap="round" />
        <line x1="6" y1="-6" x2="9" y2="-9" stroke="#f4f0e8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="6" x2="9" y2="9" stroke="#f4f0e8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="-6" y1="-6" x2="-9" y2="-9" stroke="#f4f0e8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="-6" y1="6" x2="-9" y2="9" stroke="#f4f0e8" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* "H" letter for Hugo */}
      <text
        x="100"
        y="105"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="32"
        fontWeight="700"
        fill="#141414"
        textAnchor="middle"
        dominantBaseline="middle"
        opacity="0.8"
      >
        H
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Field labels for diff display
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  precio: "Precio",
  estado: "Estado",
  tipologia_id: "Tipología",
  available_tipologia_ids: "Tipologías",
  fachada_id: "Fachada",
  torre_id: "Torre",
  piso: "Piso",
  area_m2: "Área (m²)",
  area_construida: "Área construida",
  area_privada: "Área privada",
  area_lote: "Área lote",
  habitaciones: "Habitaciones",
  banos: "Baños",
  parqueaderos: "Parqueaderos",
  depositos: "Depósitos",
  orientacion: "Orientación",
  vista: "Vista",
  notas: "Notas",
  etapa_nombre: "Etapa",
  lote: "Lote",
  identificador: "Identificador",
};

// ---------------------------------------------------------------------------
// Capability cards for welcome
// ---------------------------------------------------------------------------

const CAPABILITIES = [
  {
    icon: TrendingUp,
    label: "Ajustar precios en lote",
    desc: "Sube, baja o fija precios",
  },
  {
    icon: Building2,
    label: "Asignar etapas y tipologías",
    desc: "Por rangos o condiciones",
  },
  {
    icon: FileSpreadsheet,
    label: "Importar datos CSV",
    desc: "Pega o sube un archivo",
  },
  {
    icon: Tag,
    label: "Cambiar estados",
    desc: "Masivamente por filtros",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function InventoryAssistant({
  unidades,
  tipologias,
  fachadas,
  torres,
  projectId,
  tipoProyecto,
  tipologiaMode,
  unidadTipologias,
  onClose,
  onDone,
}: InventoryAssistantProps) {
  // ── Session storage key for this project ──────────────────────────
  const storageKey = `noddo_assistant_${projectId}`;

  // ── State ──────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as AssistantMessage[];
      // Restore Date objects
      return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    content: string;
    size: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Persist messages to sessionStorage ────────────────────────────
  useEffect(() => {
    if (messages.length === 0) {
      sessionStorage.removeItem(storageKey);
    } else {
      // Strip changes data to keep storage small — only keep text
      const light = messages.map(({ changes, ...rest }) => rest);
      sessionStorage.setItem(storageKey, JSON.stringify(light));
    }
  }, [messages, storageKey]);

  // ── Auto-scroll on new messages ────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Focus input on mount ───────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Suggestions ────────────────────────────────────────────────────
  const suggestions = useMemo<SuggestionChip[]>(() => {
    const chips: SuggestionChip[] = [];

    const disponibles = unidades.filter(
      (u) => u.estado === "disponible"
    ).length;
    if (disponibles > 0) {
      chips.push({
        label: "Subir precios 5%",
        prompt:
          "Sube los precios un 5% a todas las unidades disponibles",
        icon: TrendingUp,
      });
    }

    const withoutTipo = unidades.filter((u) => !u.tipologia_id).length;
    if (withoutTipo > 0) {
      chips.push({
        label: `${withoutTipo} sin tipología`,
        prompt: `Hay ${withoutTipo} unidades sin tipología asignada. ¿Cuáles tipologías les asigno?`,
        icon: Layers,
      });
    }

    if (tipoProyecto !== "apartamentos") {
      const withoutEtapa = unidades.filter(
        (u) => !u.etapa_nombre
      ).length;
      if (withoutEtapa > 0) {
        chips.push({
          label: "Asignar etapas",
          prompt:
            "Necesito asignar etapas a las unidades. ¿Cómo quieres distribuirlas?",
          icon: Building2,
        });
      }
    }

    const withoutPrice = unidades.filter(
      (u) => u.estado === "disponible" && !u.precio
    ).length;
    if (withoutPrice > 0) {
      chips.push({
        label: `${withoutPrice} sin precio`,
        prompt: `Hay ${withoutPrice} unidades disponibles sin precio asignado`,
        icon: DollarSign,
      });
    }

    chips.push({
      label: "Pegar datos CSV",
      prompt: "__CSV_MODE__",
      icon: FileSpreadsheet,
    });

    return chips;
  }, [unidades, tipoProyecto]);

  // ── Build conversation history for API ─────────────────────────────
  const buildHistory = useCallback((): Array<{
    role: "user" | "model";
    text: string;
  }> => {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: (m.role === "user" ? "user" : "model") as "user" | "model",
        text:
          m.role === "assistant" && m.changes && m.changes.length > 0
            ? `${m.content}\n\n[Propuse ${m.changes.length} cambios]`
            : m.content,
      }));
  }, [messages]);

  // ── Format display values ──────────────────────────────────────────
  const formatValue = useCallback(
    (field: string, value: unknown): string => {
      if (value === null || value === undefined) return "—";
      if (field === "precio" && typeof value === "number") {
        return `$${value.toLocaleString("es-CO")}`;
      }
      if (field === "tipologia_id" && typeof value === "string") {
        return tipologias.find((t) => t.id === value)?.nombre ?? "—";
      }
      if (field === "available_tipologia_ids" && Array.isArray(value)) {
        const names = (value as string[])
          .map((id) => tipologias.find((t) => t.id === id)?.nombre)
          .filter(Boolean);
        return names.length > 0 ? names.join(", ") : "—";
      }
      if (field === "fachada_id" && typeof value === "string") {
        return fachadas.find((f) => f.id === value)?.nombre ?? "—";
      }
      if (field === "estado" && typeof value === "string") {
        return value.charAt(0).toUpperCase() + value.slice(1);
      }
      return String(value);
    },
    [tipologias, fachadas]
  );

  // ── Send message ───────────────────────────────────────────────────
  const handleSend = useCallback(
    async (messageOverride?: string) => {
      const typedText = messageOverride || input.trim();
      const file = attachedFile;

      // Need either text or file
      if (!typedText && !file) return;
      if (loading) return;

      setInput("");
      if (file) setAttachedFile(null);
      // Reset textarea height
      if (inputRef.current) inputRef.current.style.height = "auto";

      // Build the full message for the AI (includes file content)
      let aiMessage = typedText;
      if (file) {
        const fileData = `Tengo estos datos del archivo "${file.name}":\n\n${file.content}`;
        aiMessage = typedText
          ? `${fileData}\n\n${typedText}`
          : `${fileData}\n\nAplica estos datos al inventario`;
      }

      // Display message: show typed text + file indicator, not raw CSV
      const displayContent = file
        ? `\u{1F4CE} ${file.name}\n${typedText || "Aplica estos datos al inventario"}`
        : typedText;

      const userMessage: AssistantMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: displayContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const history = buildHistory();

        const res = await fetch("/api/ai/modify-units", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: aiMessage,
            unidades: unidades.map((u) => ({
              id: u.id,
              identificador: u.identificador,
              tipologia_id: u.tipologia_id,
              fachada_id: u.fachada_id,
              torre_id: u.torre_id,
              piso: u.piso,
              lote: u.lote,
              etapa_nombre: u.etapa_nombre,
              area_m2: u.area_m2,
              area_construida: u.area_construida,
              area_privada: u.area_privada,
              area_lote: u.area_lote,
              precio: u.precio,
              estado: u.estado,
              habitaciones: u.habitaciones,
              banos: u.banos,
              parqueaderos: u.parqueaderos,
              depositos: u.depositos,
            })),
            tipologias: tipologias.map((t) => ({
              id: t.id,
              nombre: t.nombre,
            })),
            fachadas: fachadas.map((f) => ({
              id: f.id,
              nombre: f.nombre,
            })),
            torres: torres.map((t) => ({ id: t.id, nombre: t.nombre })),
            history,
            tipologiaMode,
          }),
        });

        if (!res.ok) throw new Error("Error");
        const data = await res.json();

        // Enrich changes with before values for diff display
        const enrichedChanges: EnrichedChange[] = (data.changes || []).map(
          (c: { id: string; identificador: string; updates: Record<string, unknown> }) => {
            const unit = unidades.find((u) => u.id === c.id);
            const before: Record<string, unknown> = {};
            if (unit) {
              for (const key of Object.keys(c.updates)) {
                if (key === "available_tipologia_ids") {
                  // For multi-tipo, show current junction tipología IDs as "before"
                  const currentIds = (unidadTipologias ?? [])
                    .filter((ut) => ut.unidad_id === c.id)
                    .map((ut) => ut.tipologia_id);
                  before[key] = currentIds.length > 0 ? currentIds : null;
                } else {
                  before[key] = (unit as unknown as Record<string, unknown>)[key];
                }
              }
            }
            return { ...c, before };
          }
        );

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.summary || "Cambios listos.",
            changes: enrichedChanges.length > 0 ? enrichedChanges : undefined,
            timestamp: new Date(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Error al procesar la solicitud. Intenta de nuevo.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, attachedFile, buildHistory, unidades, tipologias, fachadas, torres, tipologiaMode, unidadTipologias]
  );

  // ── Apply changes (bulk) ───────────────────────────────────────────
  const handleApplyChanges = useCallback(
    async (msgId: string, changes: EnrichedChange[]) => {
      if (!changes.length) return;
      setApplyingId(msgId);

      try {
        // Separate multi-tipo changes from regular field updates
        const multiTipoEntries: { unitId: string; tipoIds: string[] }[] = [];
        const regularChanges: { id: string; updates: Record<string, unknown> }[] = [];

        for (const c of changes) {
          const updates = { ...c.updates };
          if (Array.isArray(updates.available_tipologia_ids)) {
            multiTipoEntries.push({
              unitId: c.id,
              tipoIds: updates.available_tipologia_ids as string[],
            });
            delete updates.available_tipologia_ids;
          }
          if (Object.keys(updates).length > 0) {
            regularChanges.push({ id: c.id, updates });
          }
        }

        const results: { updated: number; errors: number }[] = [];

        // 1) Regular field updates via bulk-update
        if (regularChanges.length > 0) {
          const res = await fetch("/api/unidades/bulk-update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              proyecto_id: projectId,
              changes: regularChanges,
            }),
          });
          const data = await res.json();
          results.push({ updated: data.updated ?? 0, errors: data.errors ?? 0 });
        }

        // 2) Multi-tipo assignments via unidad-tipologias endpoint
        if (multiTipoEntries.length > 0) {
          // Group by tipología set for efficiency
          const groups = new Map<string, string[]>();
          for (const entry of multiTipoEntries) {
            const key = [...entry.tipoIds].sort().join(",");
            const group = groups.get(key) ?? [];
            group.push(entry.unitId);
            groups.set(key, group);
          }
          for (const [tipoKey, unitIds] of groups) {
            const tipoIds = tipoKey.split(",");
            const res = await fetch("/api/unidad-tipologias", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                proyecto_id: projectId,
                unidad_ids: unitIds,
                tipologia_ids: tipoIds,
              }),
            });
            const data = await res.json();
            results.push({
              updated: data.inserted ?? unitIds.length,
              errors: data.error ? unitIds.length : 0,
            });
          }
        }

        const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
        const totalErrors = results.reduce((s, r) => s + r.errors, 0);
        const hasUpdates = totalUpdated > 0;
        const hasErrors = totalErrors > 0;

        setMessages((prev) =>
          prev
            .map((m) =>
              m.id === msgId ? { ...m, changesApplied: hasUpdates } : m
            )
            .concat({
              id: crypto.randomUUID(),
              role: "system",
              content: hasUpdates
                ? `${changes.length} unidades actualizadas${hasErrors ? ` · ${totalErrors} con errores` : ""}.`
                : `Error: no se pudo actualizar ninguna unidad${hasErrors ? ` (${totalErrors} errores)` : ""}.`,
              isError: !hasUpdates,
              timestamp: new Date(),
            })
        );

        if (hasUpdates) {
          // Pass applied changes so parent can update local state immediately
          const appliedChanges = regularChanges.filter((c) =>
            changes.some((ch) => ch.id === c.id)
          );
          onDone(appliedChanges);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "system",
            content: "Error al aplicar los cambios.",
            isError: true,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setApplyingId(null);
      }
    },
    [projectId, onDone]
  );

  // ── Suggestion chip click ──────────────────────────────────────────
  const handleSuggestion = useCallback(
    (chip: SuggestionChip) => {
      if (chip.prompt === "__CSV_MODE__") {
        fileInputRef.current?.click();
        return;
      }
      handleSend(chip.prompt);
    },
    [handleSend]
  );

  // ── File upload (attach as chip) ──────────────────────────────────
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") {
          setAttachedFile({ name: file.name, content: text, size: file.size });
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    []
  );

  // ── Drag & drop file support ───────────────────────────────────────
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    // Only accept text-like files
    if (!file.name.match(/\.(csv|tsv|txt|xls|xlsx)$/i) && !file.type.startsWith("text/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        setAttachedFile({ name: file.name, content: text, size: file.size });
      }
    };
    reader.readAsText(file);
  }, []);

  // ── Keyboard shortcut (Escape to close) ────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ── Show welcome when no user messages ─────────────────────────────
  const showWelcome = messages.length === 0 && !loading;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      style={{ zIndex: 2147483648 }}
      className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-[var(--surface-0)] border-l border-[var(--border-default)] flex flex-col shadow-[-8px_0_30px_rgba(0,0,0,0.5)]"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--surface-0)]/90 border-2 border-dashed border-[#b8973a] rounded-lg pointer-events-none"
          >
            <div className="text-center">
              <Upload size={32} className="text-[#b8973a] mx-auto mb-2" />
              <p className="text-sm text-[#b8973a] font-ui font-bold uppercase tracking-wider">
                Soltar archivo
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">CSV, TSV o TXT</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Gold glow behind avatar */}
              <div className="absolute inset-0 rounded-full bg-[rgba(184,151,58,0.12)] blur-md scale-125" />
              <AssistantAvatar size={40} />
            </div>
            <div>
              <h3 className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                Asistente de Inventario
              </h3>
              <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                {unidades.length} unidades · {tipologias.length} tipologías
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
          >
            <kbd className="text-[9px] font-ui uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)] leading-none">
              ESC
            </kbd>
            <X size={14} className="text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* ── Messages Area ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Welcome block */}
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Greeting */}
                <div className="flex items-start gap-3">
                  <AssistantAvatar size={28} />
                  <div className="pt-0.5">
                    <p className="text-sm text-white font-medium leading-relaxed">
                      ¡Hola! Soy tu asistente de inventario.
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 leading-relaxed">
                      Puedo modificar tu inventario con instrucciones en lenguaje natural. Describe lo que necesitas y te mostraré los cambios antes de aplicarlos.
                    </p>
                  </div>
                </div>

                {/* Capabilities grid */}
                <div className="grid grid-cols-2 gap-2">
                  {CAPABILITIES.map((cap, i) => (
                    <motion.div
                      key={cap.label}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      className="flex items-center gap-2.5 px-3 py-2.5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-lg"
                    >
                      <div className="p-1.5 rounded-md bg-[rgba(184,151,58,0.1)]">
                        <cap.icon size={14} className="text-[#b8973a]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
                          {cap.label}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          {cap.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Suggestions label + chips */}
                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-ui text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                      Sugerencias
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((chip, i) => (
                        <motion.button
                          key={chip.label}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.04 }}
                          onClick={() => handleSuggestion(chip)}
                          className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-lg text-[11px] text-[var(--text-secondary)] hover:text-white hover:border-[rgba(184,151,58,0.3)] hover:bg-[rgba(184,151,58,0.06)] transition-all"
                        >
                          <chip.icon
                            size={13}
                            className="text-[#b8973a] opacity-70"
                          />
                          {chip.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message bubbles */}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              applyingId={applyingId}
              onApply={handleApplyChanges}
              formatValue={formatValue}
            />
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5"
            >
              <AssistantAvatar size={24} />
              <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2
                  size={14}
                  className="animate-spin text-[#b8973a]"
                />
                <span className="text-[11px] text-[var(--text-muted)]">
                  Analizando inventario...
                </span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
          {/* File attachment chip */}
          <AnimatePresence>
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 px-3 py-2 mb-2 bg-[var(--surface-1)] border border-[rgba(184,151,58,0.2)] rounded-lg"
              >
                <FileSpreadsheet size={14} className="text-[#b8973a] shrink-0" />
                <span className="text-xs text-white truncate flex-1">{attachedFile.name}</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {formatFileSize(attachedFile.size)}
                </span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="p-0.5 hover:bg-[var(--surface-2)] rounded transition-colors"
                >
                  <X size={12} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 mb-0.5 bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] rounded-lg transition-colors shrink-0 group"
              title="Adjuntar archivo CSV"
            >
              <FileSpreadsheet
                size={15}
                className="text-[var(--text-muted)] group-hover:text-[#b8973a] transition-colors"
              />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-px h-5 bg-[var(--border-subtle)]" />
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={attachedFile ? "Describe qué hacer con el archivo..." : "Describe los cambios que necesitas..."}
              rows={1}
              className={cn(inputClass, "flex-1 text-xs resize-none min-h-[40px] max-h-[160px] py-2.5")}
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !attachedFile) || loading}
              className={cn(
                btnPrimary,
                "!px-3 !py-2.5 shrink-0"
              )}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------

function MessageBubble({
  msg,
  applyingId,
  onApply,
  formatValue,
}: {
  msg: AssistantMessage;
  applyingId: string | null;
  onApply: (msgId: string, changes: EnrichedChange[]) => void;
  formatValue: (field: string, value: unknown) => string;
}) {
  if (msg.role === "system") {
    const isError = msg.isError;
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <div className={cn(
          "flex items-center gap-2 px-4 py-1.5 rounded-full border",
          isError
            ? "bg-red-500/10 border-red-500/20"
            : "bg-green-500/10 border-green-500/20"
        )}>
          {isError ? (
            <AlertCircle size={12} className="text-red-400" />
          ) : (
            <CheckCircle2 size={12} className="text-green-400" />
          )}
          <span className={cn("text-[11px]", isError ? "text-red-400" : "text-green-400")}>
            {msg.content}
          </span>
        </div>
      </motion.div>
    );
  }

  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex", isUser ? "justify-end" : "items-start gap-2.5")}
    >
      {/* Small avatar for assistant messages */}
      {!isUser && <AssistantAvatar size={24} />}

      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3",
          isUser
            ? "bg-[rgba(184,151,58,0.12)] border border-[rgba(184,151,58,0.18)] text-white"
            : "bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)]"
        )}
      >
        <p className="text-xs leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </p>

        {msg.changes && msg.changes.length > 0 && (
          <ChangesPreview
            msgId={msg.id}
            changes={msg.changes}
            applied={!!msg.changesApplied}
            applying={applyingId === msg.id}
            onApply={onApply}
            formatValue={formatValue}
          />
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Changes Preview (before → after diff table)
// ---------------------------------------------------------------------------

function ChangesPreview({
  msgId,
  changes,
  applied,
  applying,
  onApply,
  formatValue,
}: {
  msgId: string;
  changes: EnrichedChange[];
  applied: boolean;
  applying: boolean;
  onApply: (msgId: string, changes: EnrichedChange[]) => void;
  formatValue: (field: string, value: unknown) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const DISPLAY_LIMIT = 8;
  const displayChanges = expanded
    ? changes
    : changes.slice(0, DISPLAY_LIMIT);

  // Group updates by unit for compact display
  const rows: Array<{
    identificador: string;
    field: string;
    before: string;
    after: string;
    key: string;
  }> = [];

  for (const c of displayChanges) {
    for (const [field, newVal] of Object.entries(c.updates)) {
      rows.push({
        identificador: c.identificador,
        field: FIELD_LABELS[field] || field,
        before: formatValue(field, c.before[field]),
        after: formatValue(field, newVal),
        key: `${c.id}-${field}`,
      });
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Table */}
      <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-[var(--surface-2)]">
              <th className="text-left py-2 px-3 font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Unidad
              </th>
              <th className="text-left py-2 px-3 font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Campo
              </th>
              <th className="text-left py-2 px-3 font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Antes
              </th>
              <th className="text-left py-2 px-3 font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Después
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-t border-[var(--border-subtle)] hover:bg-[var(--surface-1)]/50"
              >
                <td className="py-1.5 px-3 text-white font-mono font-medium text-[11px]">
                  {row.identificador}
                </td>
                <td className="py-1.5 px-3 text-[var(--text-tertiary)] font-mono text-[11px]">
                  {row.field}
                </td>
                <td className="py-1.5 px-3 text-[var(--text-muted)] font-mono text-[11px] line-through">
                  {row.before}
                </td>
                <td className="py-1.5 px-3 text-[#b8973a] font-mono font-medium text-[11px]">
                  {row.after}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {changes.length > DISPLAY_LIMIT && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-1.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors flex items-center justify-center gap-1 border-t border-[var(--border-subtle)]"
          >
            {expanded ? (
              <>
                <ChevronUp size={10} />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDown size={10} />+{changes.length - DISPLAY_LIMIT}{" "}
                cambios más
              </>
            )}
          </button>
        )}
      </div>

      {/* Apply / Applied */}
      {applied ? (
        <div className="flex items-center gap-2 text-green-400 text-[11px]">
          <CheckCircle2 size={14} />
          Cambios aplicados
        </div>
      ) : (
        <button
          onClick={() => onApply(msgId, changes)}
          disabled={applying}
          className={cn(btnPrimary, "w-full justify-center")}
        >
          {applying ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Check size={12} />
          )}
          Aplicar {changes.length} cambios
        </button>
      )}
    </div>
  );
}
