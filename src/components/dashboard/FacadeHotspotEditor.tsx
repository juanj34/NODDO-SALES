"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Trash2, Unlink, AlertTriangle, XCircle,
  Copy, Grid3X3, CopyPlus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, GripVertical, Undo2, Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlignmentToolbar } from "@/components/dashboard/AlignmentToolbar";
import { useHotspotCanvas } from "@/hooks/useHotspotCanvas";
import type { Unidad, Fachada } from "@/types";

/* ------------------------------------------------------------------
   Constants
   ------------------------------------------------------------------ */
const STATUS_COLORS: Record<Unidad["estado"], string> = {
  disponible: "#22c55e",
  separado: "#eab308",
  reservada: "#f97316",
  vendida: "#ef4444",
  proximamente: "#3b82f6",
};

const STATUS_LABELS: Record<Unidad["estado"], string> = {
  disponible: "Disponible",
  separado: "Separado",
  reservada: "Reservada",
  vendida: "Vendida",
  proximamente: "Próximamente",
};

const EMPTY_DOT_COLOR = "#ffffff";
const SELECTION_COLOR = "#38bdf8";
const DRAG_THRESHOLD = 5; // px
const MAX_UNDO = 50;

/* ------------------------------------------------------------------
   Types
   ------------------------------------------------------------------ */
interface HotspotUnit {
  id: string;
  identificador: string;
  estado: Unidad["estado"];
  fachada_x: number;
  fachada_y: number;
  tipologiaNombre?: string | null;
  habitaciones?: number | null;
}

interface EmptyDot {
  localId: string;
  x: number;
  y: number;
}

interface UnassignedUnit {
  id: string;
  identificador: string;
  estado: Unidad["estado"];
  tipologiaNombre?: string | null;
  habitaciones?: number | null;
}

interface FacadeHotspotEditorProps {
  fachada: Fachada;
  assignedUnits: HotspotUnit[];
  unassignedUnits: UnassignedUnit[];
  onUpdateUnit: (
    unitId: string,
    data: { fachada_id: string; fachada_x: number; fachada_y: number }
  ) => Promise<void>;
  onRemoveUnit: (unitId: string) => Promise<void>;
  onClearAll: (fachadaId: string) => Promise<void>;
}

/* Transient (non-render) state types */
interface DragState {
  dotId: string;
  isEmptyDot: boolean;
  startX: number;
  startY: number;
  origPositions: Map<string, { x: number; y: number }>;
  origEmptyDots: EmptyDot[];
}

interface DotInteraction {
  dotId: string;
  isEmptyDot: boolean;
  startClientX: number;
  startClientY: number;
  moved: boolean;
}

interface CanvasMouseDown {
  startClientX: number;
  startClientY: number;
  pos: { x: number; y: number };
}

interface RectSelectState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/* ------------------------------------------------------------------
   Pure grid generation helpers
   ------------------------------------------------------------------ */
function generateRowRepeat(
  sourceDots: { x: number; y: number }[],
  copies: number,
  spacing: number,
  direction: "up" | "down" | "left" | "right"
): EmptyDot[] {
  const result: EmptyDot[] = [];
  for (let i = 1; i <= copies; i++) {
    const isVertical = direction === "up" || direction === "down";
    const offset = (direction === "up" || direction === "left") ? -spacing * i : spacing * i;
    for (const dot of sourceDots) {
      const newX = isVertical ? dot.x : dot.x + offset;
      const newY = isVertical ? dot.y + offset : dot.y;
      if (newX < 0 || newX > 100 || newY < 0 || newY > 100) continue;
      result.push({
        localId: crypto.randomUUID(),
        x: Math.round(newX * 100) / 100,
        y: Math.round(newY * 100) / 100,
      });
    }
  }
  return result;
}

function generateGrid(
  cols: number, rows: number,
  x1: number, y1: number, x2: number, y2: number
): EmptyDot[] {
  const result: EmptyDot[] = [];
  for (let r = 0; r < rows; r++) {
    const y = rows === 1 ? (y1 + y2) / 2 : y1 + (r / (rows - 1)) * (y2 - y1);
    for (let c = 0; c < cols; c++) {
      const x = cols === 1 ? (x1 + x2) / 2 : x1 + (c / (cols - 1)) * (x2 - x1);
      result.push({
        localId: crypto.randomUUID(),
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
      });
    }
  }
  return result;
}

/* ------------------------------------------------------------------
   Component
   ------------------------------------------------------------------ */
export function FacadeHotspotEditor({
  fachada,
  assignedUnits,
  unassignedUnits,
  onUpdateUnit,
  onRemoveUnit,
  onClearAll,
}: FacadeHotspotEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const menuSearchRef = useRef<HTMLInputElement>(null);

  /* ---- Render-affecting state ---- */
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [emptyDots, setEmptyDots] = useState<EmptyDot[]>(() =>
    (fachada.puntos_vacios ?? []).map((p) => ({
      localId: crypto.randomUUID(),
      x: p.x,
      y: p.y,
    }))
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeMenuDotId, setActiveMenuDotId] = useState<string | null>(null);
  const [menuSearch, setMenuSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [lastAssignedId, setLastAssignedId] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState("4/3");
  const [dotsSaveStatus, setDotsSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isDragging, setIsDragging] = useState(false);

  // Rect select — state for rendering only
  const [rectSelect, setRectSelect] = useState<RectSelectState | null>(null);

  // Repeat Row state
  const [showRepeatRow, setShowRepeatRow] = useState(false);
  const [repeatCount, setRepeatCount] = useState(fachada.num_pisos ? Math.max(1, fachada.num_pisos - 1) : 10);
  const [repeatSpacing, setRepeatSpacing] = useState(5);
  const [repeatDirection, setRepeatDirection] = useState<"up" | "down" | "left" | "right">("up");

  // Duplicate-follow-mouse state
  const [duplicateGhosts, setDuplicateGhosts] = useState<{ dots: { x: number; y: number }[]; offset: { dx: number; dy: number } } | null>(null);
  const duplicateGhostsRef = useRef(duplicateGhosts);
  duplicateGhostsRef.current = duplicateGhosts;

  // Quick Grid state
  const [showQuickGrid, setShowQuickGrid] = useState(false);
  const [gridCols, setGridCols] = useState(4);
  const [gridRows, setGridRows] = useState(fachada.num_pisos || 10);
  const [gridBounds, setGridBounds] = useState({ x1: 15, y1: 10, x2: 85, y2: 90 });

  /* ---- Ref mirrors (for stable event handlers) ---- */
  const positionsRef = useRef(positions);
  const emptyDotsRef = useRef(emptyDots);
  const selectedIdsRef = useRef(selectedIds);
  const lastSavedDotsRef = useRef<string>(JSON.stringify(fachada.puntos_vacios ?? []));
  const fachadaIdRef = useRef(fachada.id);

  // Keep refs in sync with state
  positionsRef.current = positions;
  emptyDotsRef.current = emptyDots;
  selectedIdsRef.current = selectedIds;
  fachadaIdRef.current = fachada.id;

  /* ---- Transient refs (no re-renders) ---- */
  const draggingRef = useRef<DragState | null>(null);
  const dotInteractionRef = useRef<DotInteraction | null>(null);
  const canvasMouseDownRef = useRef<CanvasMouseDown | null>(null);

  // Undo/redo history for empty dots
  const undoStackRef = useRef<EmptyDot[][]>([]);
  const redoStackRef = useRef<EmptyDot[][]>([]);
  const [undoLen, setUndoLen] = useState(0);
  const [redoLen, setRedoLen] = useState(0);

  // Stable ref to latest props
  const propsRef = useRef({ fachada, onUpdateUnit, onRemoveUnit, onClearAll });
  propsRef.current = { fachada, onUpdateUnit, onRemoveUnit, onClearAll };

  /* ---- Canvas hook ---- */
  const { getImageBounds, toPercent, toPx } = useHotspotCanvas(containerRef, imgRef);
  const toPercentRef = useRef(toPercent);
  toPercentRef.current = toPercent;

  /* ---- Undo/redo helpers ---- */
  const pushUndo = useCallback(() => {
    undoStackRef.current.push(emptyDotsRef.current.map((d) => ({ ...d })));
    if (undoStackRef.current.length > MAX_UNDO) undoStackRef.current.shift();
    redoStackRef.current = [];
    setUndoLen(undoStackRef.current.length);
    setRedoLen(0);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current.pop()!;
    redoStackRef.current.push(emptyDotsRef.current.map((d) => ({ ...d })));
    setEmptyDots(prev);
    emptyDotsRef.current = prev;
    setUndoLen(undoStackRef.current.length);
    setRedoLen(redoStackRef.current.length);
    setSelectedIds(new Set());
    selectedIdsRef.current = new Set();
    setActiveMenuDotId(null);
  }, []);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(emptyDotsRef.current.map((d) => ({ ...d })));
    setEmptyDots(next);
    emptyDotsRef.current = next;
    setUndoLen(undoStackRef.current.length);
    setRedoLen(redoStackRef.current.length);
    setSelectedIds(new Set());
    selectedIdsRef.current = new Set();
    setActiveMenuDotId(null);
  }, []);

  /* ================================================================
     Effects
     ================================================================ */

  /* 1. Sync assignedUnits → positions */
  useEffect(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const u of assignedUnits) {
      m.set(u.id, { x: u.fachada_x, y: u.fachada_y });
    }
    setPositions(m);
    positionsRef.current = m;
  }, [assignedUnits]);

  /* 2. Re-init emptyDots on fachada change */
  useEffect(() => {
    const dots = (fachada.puntos_vacios ?? []).map((p) => ({
      localId: crypto.randomUUID(),
      x: p.x,
      y: p.y,
    }));
    setEmptyDots(dots);
    emptyDotsRef.current = dots;
    lastSavedDotsRef.current = JSON.stringify(fachada.puntos_vacios ?? []);
    setSelectedIds(new Set());
    selectedIdsRef.current = new Set();
    setActiveMenuDotId(null);
    undoStackRef.current = [];
    redoStackRef.current = [];
    setUndoLen(0);
    setRedoLen(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fachada.id]);

  /* 3. Auto-save emptyDots to API (debounced) */
  useEffect(() => {
    const current = JSON.stringify(emptyDots.map(({ x, y }) => ({ x, y })));
    if (current === lastSavedDotsRef.current) return;

    setDotsSaveStatus("saving");
    const timeout = setTimeout(async () => {
      try {
        const puntos_vacios = emptyDotsRef.current.map(({ x, y }) => ({ x, y }));
        const res = await fetch(`/api/fachadas/${fachadaIdRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ puntos_vacios }),
        });
        if (res.ok) {
          lastSavedDotsRef.current = JSON.stringify(puntos_vacios);
          setDotsSaveStatus("saved");
          setTimeout(() => setDotsSaveStatus("idle"), 1500);
        } else {
          setDotsSaveStatus("idle");
        }
      } catch {
        setDotsSaveStatus("idle");
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [emptyDots]);

  /* 4. Flush pending save on unmount */
  useEffect(() => {
    return () => {
      const puntos_vacios = emptyDotsRef.current.map(({ x, y }) => ({ x, y }));
      const current = JSON.stringify(puntos_vacios);
      if (current !== lastSavedDotsRef.current) {
        fetch(`/api/fachadas/${fachadaIdRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ puntos_vacios }),
          keepalive: true,
        });
      }
    };
  }, []);

  /* 5. Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z / Escape */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && duplicateGhostsRef.current) {
        setDuplicateGhosts(null);
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && ((e.key === "z" && e.shiftKey) || e.key === "y")) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  /* 6. Focus menu search when opened */
  useEffect(() => {
    if (activeMenuDotId) {
      setMenuSearch("");
      requestAnimationFrame(() => menuSearchRef.current?.focus());
    }
  }, [activeMenuDotId]);

  /* 6. Window-level drag listeners (mount-only — reads from refs) */
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      const drag = draggingRef.current;
      if (!drag) return;

      // Mark interaction as moved
      if (dotInteractionRef.current) dotInteractionRef.current.moved = true;

      const pos = toPercentRef.current(e.clientX, e.clientY);
      if (!pos) return;
      const dx = pos.x - drag.startX;
      const dy = pos.y - drag.startY;

      const selected = selectedIdsRef.current;
      const idsToMove = selected.has(drag.dotId)
        ? [...selected]
        : [drag.dotId];

      // Update assigned unit positions
      setPositions((prev) => {
        const next = new Map(prev);
        for (const id of idsToMove) {
          const orig = drag.origPositions.get(id);
          if (orig) {
            next.set(id, {
              x: Math.max(0, Math.min(100, orig.x + dx)),
              y: Math.max(0, Math.min(100, orig.y + dy)),
            });
          }
        }
        positionsRef.current = next;
        return next;
      });

      // Update empty dot positions
      setEmptyDots((prev) => {
        const next = prev.map((d) => {
          if (!idsToMove.includes(d.localId)) return d;
          const orig = drag.origEmptyDots.find((od) => od.localId === d.localId);
          if (!orig) return d;
          return {
            ...d,
            x: Math.max(0, Math.min(100, orig.x + dx)),
            y: Math.max(0, Math.min(100, orig.y + dy)),
          };
        });
        emptyDotsRef.current = next;
        return next;
      });
    };

    const handleWindowMouseUp = async () => {
      const drag = draggingRef.current;
      if (!drag) return;

      const interaction = dotInteractionRef.current;
      dotInteractionRef.current = null;
      draggingRef.current = null;
      setIsDragging(false);

      // If didn't move much → it was a click → show context menu
      if (interaction && !interaction.moved) {
        setActiveMenuDotId(drag.dotId);
        const selected = selectedIdsRef.current;
        if (!selected.has(drag.dotId)) {
          const next = new Set([drag.dotId]);
          setSelectedIds(next);
          selectedIdsRef.current = next;
        }
        return;
      }

      // Push undo snapshot if any empty dots moved
      const selected = selectedIdsRef.current;
      const idsToSave = selected.has(drag.dotId)
        ? [...selected]
        : [drag.dotId];
      if (idsToSave.some((id) => drag.origEmptyDots.some((d) => d.localId === id))) {
        undoStackRef.current.push(drag.origEmptyDots.map((d) => ({ ...d })));
        if (undoStackRef.current.length > MAX_UNDO) undoStackRef.current.shift();
        redoStackRef.current = [];
        setUndoLen(undoStackRef.current.length);
        setRedoLen(0);
      }

      // Persist moved assigned unit positions

      const currentPositions = positionsRef.current;
      const currentEmptyDots = emptyDotsRef.current;
      const { fachada: f, onUpdateUnit: update } = propsRef.current;

      for (const id of idsToSave) {
        // Skip empty dots — they auto-save via the emptyDots effect
        if (currentEmptyDots.some((d) => d.localId === id)) continue;
        const p = currentPositions.get(id);
        if (p) {
          await update(id, {
            fachada_id: f.id,
            fachada_x: Math.round(p.x * 100) / 100,
            fachada_y: Math.round(p.y * 100) / 100,
          });
        }
      }
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, []);

  /* ================================================================
     Helpers
     ================================================================ */
  const isEmptyDotId = useCallback(
    (id: string) => emptyDotsRef.current.some((d) => d.localId === id),
    []
  );

  const getDotPos = useCallback(
    (dotId: string): { x: number; y: number } | null => {
      const assigned = positionsRef.current.get(dotId);
      if (assigned) return assigned;
      const empty = emptyDotsRef.current.find((d) => d.localId === dotId);
      if (empty) return { x: empty.x, y: empty.y };
      return null;
    },
    []
  );

  /* ================================================================
     Canvas event handlers
     ================================================================ */
  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    // If in duplicate-ghost mode, place the dots on click
    if (duplicateGhostsRef.current) {
      e.stopPropagation();
      const ghost = duplicateGhostsRef.current;
      const newDots: EmptyDot[] = ghost.dots.map((dot) => ({
        localId: crypto.randomUUID(),
        x: Math.max(0, Math.min(100, Math.round((dot.x + ghost.offset.dx) * 100) / 100)),
        y: Math.max(0, Math.min(100, Math.round((dot.y + ghost.offset.dy) * 100) / 100)),
      }));
      pushUndo();
      setEmptyDots((prev) => {
        const next = [...prev, ...newDots];
        emptyDotsRef.current = next;
        return next;
      });
      const newIds = new Set(newDots.map((d) => d.localId));
      setSelectedIds(newIds);
      selectedIdsRef.current = newIds;
      setDuplicateGhosts(null);
      return;
    }

    if ((e.target as HTMLElement).closest("[data-hotspot]")) return;
    if ((e.target as HTMLElement).closest("[data-context-menu]")) return;
    if ((e.target as HTMLElement).closest("[data-toolbar]")) return;

    const pos = toPercentRef.current(e.clientX, e.clientY);
    if (!pos) return;

    setActiveMenuDotId(null);
    canvasMouseDownRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      pos,
    };
  }, [pushUndo]);

  const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
    // If in duplicate-ghost mode, update offset relative to source centroid
    if (duplicateGhostsRef.current) {
      const pos = toPercentRef.current(e.clientX, e.clientY);
      if (pos) {
        const ghost = duplicateGhostsRef.current;
        const cx = ghost.dots.reduce((s, d) => s + d.x, 0) / ghost.dots.length;
        const cy = ghost.dots.reduce((s, d) => s + d.y, 0) / ghost.dots.length;
        setDuplicateGhosts((prev) => prev ? { ...prev, offset: { dx: pos.x - cx, dy: pos.y - cy } } : null);
      }
      return;
    }

    // Already tracking rect-select
    if (rectSelect) {
      const pos = toPercentRef.current(e.clientX, e.clientY);
      if (pos) {
        setRectSelect((prev) => prev ? { ...prev, currentX: pos.x, currentY: pos.y } : null);
      }
      return;
    }

    // Start rect-select after threshold
    const down = canvasMouseDownRef.current;
    if (down) {
      const dist = Math.sqrt(
        (e.clientX - down.startClientX) ** 2 + (e.clientY - down.startClientY) ** 2
      );
      if (dist > DRAG_THRESHOLD) {
        const pos = toPercentRef.current(e.clientX, e.clientY);
        if (pos) {
          setRectSelect({ startX: down.pos.x, startY: down.pos.y, currentX: pos.x, currentY: pos.y });
        }
      }
    }
  }, [rectSelect]);

  const handleContainerMouseUp = useCallback((e: React.MouseEvent) => {
    // If in duplicate-ghost mode, mouseDown already handled placement
    if (duplicateGhostsRef.current) return;

    const down = canvasMouseDownRef.current;
    canvasMouseDownRef.current = null;

    // Finish rectangle selection
    if (rectSelect) {
      const dx = Math.abs(rectSelect.currentX - rectSelect.startX);
      const dy = Math.abs(rectSelect.currentY - rectSelect.startY);

      if (dx > 1 || dy > 1) {
        const x1 = Math.min(rectSelect.startX, rectSelect.currentX);
        const x2 = Math.max(rectSelect.startX, rectSelect.currentX);
        const y1 = Math.min(rectSelect.startY, rectSelect.currentY);
        const y2 = Math.max(rectSelect.startY, rectSelect.currentY);

        const ids = new Set<string>();
        positionsRef.current.forEach((pos, id) => {
          if (pos.x >= x1 && pos.x <= x2 && pos.y >= y1 && pos.y <= y2) ids.add(id);
        });
        emptyDotsRef.current.forEach((d) => {
          if (d.x >= x1 && d.x <= x2 && d.y >= y1 && d.y <= y2) ids.add(d.localId);
        });
        setSelectedIds(ids);
        selectedIdsRef.current = ids;
        setRectSelect(null);
        return;
      }
      setRectSelect(null);
    }

    if (!down) return;

    // Check if mouse moved — if so it was a drag, not a click
    const movedDist = Math.sqrt(
      (e.clientX - down.startClientX) ** 2 + (e.clientY - down.startClientY) ** 2
    );
    if (movedDist > DRAG_THRESHOLD) return;

    // Click on empty canvas → create empty dot
    pushUndo();
    const newDot: EmptyDot = {
      localId: crypto.randomUUID(),
      x: down.pos.x,
      y: down.pos.y,
    };
    setEmptyDots((prev) => {
      const next = [...prev, newDot];
      emptyDotsRef.current = next;
      return next;
    });
    setSelectedIds(new Set());
    selectedIdsRef.current = new Set();
  }, [rectSelect, pushUndo]);

  /* ================================================================
     Dot event handlers
     ================================================================ */
  const handleDotMouseDown = useCallback((e: React.MouseEvent, dotId: string, isEmpty: boolean) => {
    e.stopPropagation();

    if (e.shiftKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(dotId)) next.delete(dotId);
        else next.add(dotId);
        selectedIdsRef.current = next;
        return next;
      });
      return;
    }

    setActiveMenuDotId(null);

    dotInteractionRef.current = {
      dotId,
      isEmptyDot: isEmpty,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
    };

    // Select this dot if not already selected
    const currentSelected = selectedIdsRef.current;
    if (!currentSelected.has(dotId)) {
      const next = new Set([dotId]);
      setSelectedIds(next);
      selectedIdsRef.current = next;
    }

    const pos = toPercentRef.current(e.clientX, e.clientY);
    if (!pos) return;

    // Build origin snapshots for all positions
    const origPositions = new Map(positionsRef.current);
    for (const d of emptyDotsRef.current) {
      if (!origPositions.has(d.localId)) {
        origPositions.set(d.localId, { x: d.x, y: d.y });
      }
    }

    draggingRef.current = {
      dotId,
      isEmptyDot: isEmpty,
      startX: pos.x,
      startY: pos.y,
      origPositions,
      origEmptyDots: [...emptyDotsRef.current],
    };
    setIsDragging(true);
  }, []);

  /* ================================================================
     Context menu actions
     ================================================================ */
  const handleAssignUnit = useCallback((unitId: string) => {
    const dotId = activeMenuDotId;
    if (!dotId) return;

    // Track last assigned identifier for smart sorting
    const assignedUnit = unassignedUnits.find((u) => u.id === unitId);
    if (assignedUnit) setLastAssignedId(assignedUnit.identificador);

    const currentEmptyDots = emptyDotsRef.current;
    const dot = currentEmptyDots.find((d) => d.localId === dotId);
    const { fachada: f, onUpdateUnit: update, onRemoveUnit: remove } = propsRef.current;

    setActiveMenuDotId(null);
    setSelectedIds(new Set());
    selectedIdsRef.current = new Set();

    if (dot) {
      // Assigning from empty dot: remove dot optimistically
      setEmptyDots((prev) => {
        const next = prev.filter((d) => d.localId !== dotId);
        emptyDotsRef.current = next;
        return next;
      });
      update(unitId, {
        fachada_id: f.id,
        fachada_x: Math.round(dot.x * 100) / 100,
        fachada_y: Math.round(dot.y * 100) / 100,
      }).catch(() => {
        // Rollback
        setEmptyDots((prev) => {
          const next = [...prev, dot];
          emptyDotsRef.current = next;
          return next;
        });
      });
    } else {
      // Reassign: dotId is an existing unit
      const pos = positionsRef.current.get(dotId);
      if (pos) {
        remove(dotId)
          .then(() =>
            update(unitId, {
              fachada_id: f.id,
              fachada_x: Math.round(pos.x * 100) / 100,
              fachada_y: Math.round(pos.y * 100) / 100,
            })
          )
          .catch(() => {});
      }
    }
  }, [activeMenuDotId]);

  const handleDeleteDot = useCallback(() => {
    if (!activeMenuDotId) return;
    if (isEmptyDotId(activeMenuDotId)) {
      pushUndo();
      setEmptyDots((prev) => {
        const next = prev.filter((d) => d.localId !== activeMenuDotId);
        emptyDotsRef.current = next;
        return next;
      });
    } else {
      propsRef.current.onRemoveUnit(activeMenuDotId).catch(() => {});
    }
    setActiveMenuDotId(null);
    setSelectedIds(new Set());
    selectedIdsRef.current = new Set();
  }, [activeMenuDotId, isEmptyDotId, pushUndo]);

  const handleUnassignDot = useCallback(() => {
    if (!activeMenuDotId || isEmptyDotId(activeMenuDotId)) return;
    propsRef.current.onRemoveUnit(activeMenuDotId).catch(() => {});
    setActiveMenuDotId(null);
    setSelectedIds(new Set());
    selectedIdsRef.current = new Set();
  }, [activeMenuDotId, isEmptyDotId]);

  const handleBatchDelete = useCallback(() => {
    const ids = selectedIdsRef.current;
    if ([...ids].some((id) => isEmptyDotId(id))) pushUndo();
    ids.forEach((id) => {
      if (isEmptyDotId(id)) {
        setEmptyDots((prev) => {
          const next = prev.filter((d) => d.localId !== id);
          emptyDotsRef.current = next;
          return next;
        });
      } else {
        propsRef.current.onRemoveUnit(id).catch(() => {});
      }
    });
    setSelectedIds(new Set());
    selectedIdsRef.current = new Set();
    setActiveMenuDotId(null);
  }, [isEmptyDotId, pushUndo]);

  const handleBatchDuplicate = useCallback(() => {
    const ids = selectedIdsRef.current;
    const sourceDots: { x: number; y: number }[] = [];
    for (const id of ids) {
      const pos = getDotPos(id);
      if (pos) sourceDots.push(pos);
    }
    if (sourceDots.length === 0) return;
    // Enter ghost-follow mode: dots follow cursor until click
    setDuplicateGhosts({ dots: sourceDots, offset: { dx: 0, dy: 0 } });
  }, [getDotPos]);

  const handleApplyRepeatRow = useCallback(() => {
    const ids = selectedIdsRef.current;
    const sourceDots: { x: number; y: number }[] = [];
    for (const id of ids) {
      const pos = getDotPos(id);
      if (pos) sourceDots.push(pos);
    }
    if (sourceDots.length === 0) return;
    const newDots = generateRowRepeat(sourceDots, repeatCount, repeatSpacing, repeatDirection);
    pushUndo();
    setEmptyDots((prev) => {
      const next = [...prev, ...newDots];
      emptyDotsRef.current = next;
      return next;
    });
    const newIds = new Set(newDots.map((d) => d.localId));
    setSelectedIds(newIds);
    selectedIdsRef.current = newIds;
    setShowRepeatRow(false);
  }, [getDotPos, repeatCount, repeatSpacing, repeatDirection, pushUndo]);

  const handleApplyQuickGrid = useCallback(() => {
    const newDots = generateGrid(gridCols, gridRows, gridBounds.x1, gridBounds.y1, gridBounds.x2, gridBounds.y2);
    pushUndo();
    setEmptyDots((prev) => {
      const next = [...prev, ...newDots];
      emptyDotsRef.current = next;
      return next;
    });
    const newIds = new Set(newDots.map((d) => d.localId));
    setSelectedIds(newIds);
    selectedIdsRef.current = newIds;
    setShowQuickGrid(false);
  }, [gridCols, gridRows, gridBounds, pushUndo]);

  const handleClearAll = useCallback(() => {
    if (emptyDotsRef.current.length > 0) pushUndo();
    propsRef.current.onClearAll(propsRef.current.fachada.id);
    setEmptyDots([]);
    emptyDotsRef.current = [];
    setSelectedIds(new Set());
    selectedIdsRef.current = new Set();
    setActiveMenuDotId(null);
    setConfirmClear(false);
  }, [pushUndo]);

  /* ================================================================
     Alignment
     ================================================================ */
  const handleAlign = useCallback(async (
    updates: { id: string; fachada_x: number; fachada_y: number }[]
  ) => {
    pushUndo();
    // Update assigned positions optimistically
    setPositions((prev) => {
      const next = new Map(prev);
      for (const u of updates) {
        if (!emptyDotsRef.current.some((d) => d.localId === u.id)) {
          next.set(u.id, { x: u.fachada_x, y: u.fachada_y });
        }
      }
      positionsRef.current = next;
      return next;
    });

    // Update empty dots
    setEmptyDots((prev) => {
      const next = prev.map((d) => {
        const update = updates.find((u) => u.id === d.localId);
        if (!update) return d;
        return { ...d, x: update.fachada_x, y: update.fachada_y };
      });
      emptyDotsRef.current = next;
      return next;
    });

    // Persist assigned units
    const { fachada: f, onUpdateUnit: update } = propsRef.current;
    for (const u of updates) {
      if (emptyDotsRef.current.some((d) => d.localId === u.id)) continue;
      await update(u.id, {
        fachada_id: f.id,
        fachada_x: Math.round(u.fachada_x * 100) / 100,
        fachada_y: Math.round(u.fachada_y * 100) / 100,
      });
    }
  }, [pushUndo]);

  /* ================================================================
     Derived data (for rendering)
     ================================================================ */
  const unitMap = useMemo(() => {
    const m = new Map<string, HotspotUnit>();
    for (const u of assignedUnits) m.set(u.id, u);
    return m;
  }, [assignedUnits]);

  const selectedUnitsData = useMemo(() => {
    const result: { id: string; fachada_x: number; fachada_y: number }[] = [];
    for (const id of selectedIds) {
      const pos = getDotPos(id);
      if (pos) result.push({ id, fachada_x: pos.x, fachada_y: pos.y });
    }
    return result;
  }, [selectedIds, getDotPos, positions, emptyDots]);

  const previewDots = useMemo(() => {
    if (showRepeatRow) {
      const sourceDots: { x: number; y: number }[] = [];
      for (const id of selectedIds) {
        const pos = getDotPos(id);
        if (pos) sourceDots.push(pos);
      }
      if (sourceDots.length === 0) return [];
      return generateRowRepeat(sourceDots, repeatCount, repeatSpacing, repeatDirection);
    }
    if (showQuickGrid) {
      return generateGrid(gridCols, gridRows, gridBounds.x1, gridBounds.y1, gridBounds.x2, gridBounds.y2);
    }
    return [];
  }, [showRepeatRow, showQuickGrid, selectedIds, repeatCount, repeatSpacing, repeatDirection, gridCols, gridRows, gridBounds, getDotPos, positions, emptyDots]);

  const autoSpacing = useMemo(() => {
    if (selectedIds.size === 0) return 5;
    const sourceDots: { x: number; y: number }[] = [];
    for (const id of selectedIds) {
      const pos = getDotPos(id);
      if (pos) sourceDots.push(pos);
    }
    if (sourceDots.length === 0) return 5;
    const isVertical = repeatDirection === "up" || repeatDirection === "down";
    if (isVertical) {
      const avgY = sourceDots.reduce((s, d) => s + d.y, 0) / sourceDots.length;
      const available = repeatDirection === "up" ? avgY : (100 - avgY);
      return repeatCount > 0 ? Math.round((available / repeatCount) * 10) / 10 : 5;
    } else {
      const avgX = sourceDots.reduce((s, d) => s + d.x, 0) / sourceDots.length;
      const available = repeatDirection === "left" ? avgX : (100 - avgX);
      return repeatCount > 0 ? Math.round((available / repeatCount) * 10) / 10 : 5;
    }
  }, [selectedIds, repeatCount, repeatDirection, getDotPos, positions, emptyDots]);

  const filteredUnassigned = useMemo(() => {
    let list = unassignedUnits;
    if (menuSearch) {
      const q = menuSearch.toLowerCase();
      list = list.filter((u) =>
        u.identificador.toLowerCase().includes(q) ||
        (u.tipologiaNombre?.toLowerCase().includes(q) ?? false)
      );
    }
    // Smart sort: units numerically closest to last assigned come first
    if (lastAssignedId) {
      const lastNum = parseFloat(lastAssignedId.replace(/[^\d.]/g, ""));
      if (!isNaN(lastNum)) {
        list = [...list].sort((a, b) => {
          const aNum = parseFloat(a.identificador.replace(/[^\d.]/g, ""));
          const bNum = parseFloat(b.identificador.replace(/[^\d.]/g, ""));
          const aDist = isNaN(aNum) ? Infinity : Math.abs(aNum - lastNum);
          const bDist = isNaN(bNum) ? Infinity : Math.abs(bNum - lastNum);
          if (aDist !== bDist) return aDist - bDist;
          return (aNum || 0) - (bNum || 0);
        });
      }
    }
    return list;
  }, [menuSearch, unassignedUnits, lastAssignedId]);

  /* ================================================================
     Render helpers
     ================================================================ */
  const getRectStyle = () => {
    if (!rectSelect) return undefined;
    const bounds = getImageBounds();
    if (!bounds) return undefined;
    const { imgW, imgH, offsetX, offsetY } = bounds;
    const x1 = Math.min(rectSelect.startX, rectSelect.currentX);
    const x2 = Math.max(rectSelect.startX, rectSelect.currentX);
    const y1 = Math.min(rectSelect.startY, rectSelect.currentY);
    const y2 = Math.max(rectSelect.startY, rectSelect.currentY);
    return {
      left: offsetX + (x1 / 100) * imgW,
      top: offsetY + (y1 / 100) * imgH,
      width: ((x2 - x1) / 100) * imgW,
      height: ((y2 - y1) / 100) * imgH,
    };
  };

  const getMenuPos = (pos: { x: number; y: number }) => {
    const bounds = getImageBounds();
    if (!bounds) return { left: 0, top: 0, transform: "translate(0,0)" };
    const { imgW, imgH, offsetX, offsetY } = bounds;
    const left = offsetX + (pos.x / 100) * imgW;
    const top = offsetY + (pos.y / 100) * imgH;
    const nearRight = pos.x > 60;
    const nearBottom = pos.y > 60;
    let transform = "translate(4px, 4px)";
    if (nearRight && nearBottom) transform = "translate(calc(-100% - 4px), calc(-100% - 4px))";
    else if (nearRight) transform = "translate(calc(-100% - 4px), 4px)";
    else if (nearBottom) transform = "translate(4px, calc(-100% - 4px))";
    return { left, top, transform };
  };

  const activeMenuDot = activeMenuDotId ? getDotPos(activeMenuDotId) : null;
  const activeMenuUnit = activeMenuDotId ? unitMap.get(activeMenuDotId) : null;
  const activeMenuIsEmpty = activeMenuDotId ? isEmptyDotId(activeMenuDotId) : false;
  const rectStyle = getRectStyle();

  /* ================================================================
     JSX
     ================================================================ */
  return (
    <div className="space-y-2">
      {/* Status legend */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-lg">
        <span className="font-ui text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-1">Estado</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-dashed border-gray-500 bg-white" />
          <span className="text-[10px] text-[var(--text-muted)]">Vacío</span>
        </div>
        {(Object.keys(STATUS_COLORS) as Unidad["estado"][]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s] }} />
            <span className="text-[10px] text-[var(--text-tertiary)]">{STATUS_LABELS[s]}</span>
          </div>
        ))}
        <span className="ml-auto w-20 text-right text-[10px]">
          {dotsSaveStatus === "saving" && (
            <span className="text-[var(--text-muted)] animate-pulse">Guardando...</span>
          )}
          {dotsSaveStatus === "saved" && (
            <span className="text-green-400">Guardado</span>
          )}
        </span>
      </div>

      {/* Image canvas */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full max-h-[65vh] select-none",
          duplicateGhosts ? "cursor-copy" : isDragging ? "cursor-grabbing" : "cursor-crosshair"
        )}
        style={{ aspectRatio: imageAspectRatio }}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
      >
        {/* Image */}
        <div className="absolute inset-0 rounded-xl overflow-hidden border border-[var(--border-default)] bg-[var(--surface-2)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={fachada.imagen_url}
            alt={fachada.nombre}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
            onLoad={() => {
              if (imgRef.current) {
                const { naturalWidth, naturalHeight } = imgRef.current;
                if (naturalWidth && naturalHeight) {
                  setImageAspectRatio(`${naturalWidth}/${naturalHeight}`);
                }
              }
            }}
          />
        </div>

        {/* Floating toolbar */}
        <div
          data-toolbar
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            {confirmClear ? (
              <motion.div
                key="confirm-clear"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3 px-4 py-2.5 bg-black/80 backdrop-blur-xl border border-red-500/30 rounded-xl shadow-lg"
              >
                <AlertTriangle size={15} className="text-red-400 shrink-0" />
                <span className="text-[12px] text-red-300 whitespace-nowrap">Eliminar todos los puntos?</span>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1 text-[11px] text-[var(--text-secondary)] hover:text-white bg-[var(--surface-3)] hover:bg-[var(--surface-4)] rounded-lg border border-[var(--border-subtle)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1 text-[11px] text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                >
                  Confirmar
                </button>
              </motion.div>
            ) : (selectedIds.size >= 1 || positions.size > 0 || emptyDots.length > 0 || showQuickGrid || undoLen > 0 || redoLen > 0) ? (
              <motion.div
                key="toolbar"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 px-2 py-1.5 whitespace-nowrap bg-black/70 backdrop-blur-xl border border-[var(--border-default)] rounded-xl shadow-lg"
              >
                {/* Undo / Redo */}
                <button
                  onClick={handleUndo}
                  disabled={undoLen === 0}
                  className="flex items-center justify-center w-7 h-7 text-[var(--text-secondary)] hover:text-white bg-[var(--surface-2)]/60 hover:bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                  title="Deshacer (Ctrl+Z)"
                >
                  <Undo2 size={13} />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoLen === 0}
                  className="flex items-center justify-center w-7 h-7 text-[var(--text-secondary)] hover:text-white bg-[var(--surface-2)]/60 hover:bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                  title="Rehacer (Ctrl+Shift+Z)"
                >
                  <Redo2 size={13} />
                </button>
                <div className="w-px h-5 bg-[var(--border-subtle)]" />
                {selectedUnitsData.length >= 2 && (
                  <AlignmentToolbar
                    selectedUnits={selectedUnitsData}
                    onAlign={handleAlign}
                  />
                )}
                {selectedIds.size >= 2 && !showRepeatRow && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => {
                      setShowQuickGrid(false);
                      setRepeatSpacing(autoSpacing);
                      setShowRepeatRow(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--site-primary)] bg-[var(--surface-2)]/60 hover:bg-[var(--surface-3)] border border-[var(--border-subtle)] hover:border-[rgba(var(--site-primary-rgb),0.3)] rounded-xl transition-all"
                  >
                    <CopyPlus size={13} />
                    Repetir fila
                  </motion.button>
                )}
                {selectedIds.size >= 1 && (
                  <>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={handleBatchDuplicate}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--site-primary)] bg-[var(--surface-2)]/60 hover:bg-[var(--surface-3)] border border-[var(--border-subtle)] hover:border-[rgba(var(--site-primary-rgb),0.3)] rounded-xl transition-all"
                    >
                      <Copy size={13} />
                      Duplicar {selectedIds.size > 1 ? `(${selectedIds.size})` : ""}
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={handleBatchDelete}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-red-400/80 hover:text-red-400 bg-[var(--surface-2)]/60 hover:bg-red-500/10 border border-[var(--border-subtle)] hover:border-red-500/20 rounded-xl transition-all"
                    >
                      <Trash2 size={13} />
                      Eliminar {selectedIds.size > 1 ? `(${selectedIds.size})` : ""}
                    </motion.button>
                  </>
                )}
                {selectedIds.size === 0 && !showQuickGrid && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => {
                      setShowRepeatRow(false);
                      setShowQuickGrid(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--site-primary)] bg-[var(--surface-2)]/60 hover:bg-[var(--surface-3)] border border-[var(--border-subtle)] hover:border-[rgba(var(--site-primary-rgb),0.3)] rounded-xl transition-all"
                  >
                    <Grid3X3 size={13} />
                    Cuadrícula
                  </motion.button>
                )}
                {selectedIds.size === 0 && (positions.size > 0 || emptyDots.length > 0) && (
                  <span className="text-[11px] text-[var(--text-muted)] px-1">
                    {positions.size + emptyDots.length} punto{positions.size + emptyDots.length !== 1 ? "s" : ""}
                  </span>
                )}
                {(positions.size > 0 || emptyDots.length > 0) && (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1 px-2 py-1.5 text-[11px] text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <XCircle size={13} />
                  </button>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Hotspot dots */}
        <AllDots
          positions={positions}
          emptyDots={emptyDots}
          unitMap={unitMap}
          selectedIds={selectedIds}
          hoveredId={hoveredId}
          isDragging={isDragging}
          draggingDotId={draggingRef.current?.dotId ?? null}
          activeMenuDotId={activeMenuDotId}
          toPx={toPx}
          onMouseDown={handleDotMouseDown}
          onHover={setHoveredId}
          onContextMenu={(id, isEmpty) => {
            if (isEmpty) {
              pushUndo();
              setEmptyDots((prev) => {
                const next = prev.filter((d) => d.localId !== id);
                emptyDotsRef.current = next;
                return next;
              });
            } else {
              propsRef.current.onRemoveUnit(id).catch(() => {});
            }
          }}
        />

        {/* Ghost preview dots */}
        {previewDots.length > 0 && (() => {
          const bounds = getImageBounds();
          if (!bounds) return null;
          const { imgW, imgH, offsetX, offsetY } = bounds;
          return previewDots.map((dot) => (
            <div
              key={dot.localId}
              className="absolute w-2.5 h-2.5 rounded-full pointer-events-none"
              style={{
                left: offsetX + (dot.x / 100) * imgW,
                top: offsetY + (dot.y / 100) * imgH,
                transform: "translate(-50%, -50%)",
                backgroundColor: "rgba(56, 189, 248, 0.3)",
                border: "1.5px dashed rgba(56, 189, 248, 0.6)",
                zIndex: 5,
              }}
            />
          ));
        })()}

        {/* Duplicate ghost dots (follow cursor) */}
        {duplicateGhosts && (() => {
          const bounds = getImageBounds();
          if (!bounds) return null;
          const { imgW, imgH, offsetX, offsetY } = bounds;
          return duplicateGhosts.dots.map((dot, i) => {
            const gx = dot.x + duplicateGhosts.offset.dx;
            const gy = dot.y + duplicateGhosts.offset.dy;
            return (
              <div
                key={`dup-ghost-${i}`}
                className="absolute w-3 h-3 rounded-full pointer-events-none"
                style={{
                  left: offsetX + (gx / 100) * imgW,
                  top: offsetY + (gy / 100) * imgH,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "rgba(56, 189, 248, 0.4)",
                  border: "2px solid rgba(56, 189, 248, 0.8)",
                  zIndex: 10,
                }}
              />
            );
          });
        })()}

        {/* Quick Grid bounding box preview */}
        {showQuickGrid && (() => {
          const bounds = getImageBounds();
          if (!bounds) return null;
          const { imgW, imgH, offsetX, offsetY } = bounds;
          const left = offsetX + (gridBounds.x1 / 100) * imgW;
          const top = offsetY + (gridBounds.y1 / 100) * imgH;
          const width = ((gridBounds.x2 - gridBounds.x1) / 100) * imgW;
          const height = ((gridBounds.y2 - gridBounds.y1) / 100) * imgH;
          return (
            <div
              className="absolute border border-dashed border-[rgba(56,189,248,0.4)] bg-[rgba(56,189,248,0.05)] pointer-events-none rounded-sm"
              style={{ left, top, width, height, zIndex: 4 }}
            />
          );
        })()}

        {/* Rectangle selection overlay */}
        {rectSelect && rectStyle && (
          <div
            className="absolute border border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.1)] pointer-events-none"
            style={rectStyle}
          />
        )}

        {/* Context menu */}
        <AnimatePresence>
          {activeMenuDotId && activeMenuDot && (
            <motion.div
              data-context-menu
              key={activeMenuDotId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 w-52 bg-[var(--surface-1)] backdrop-blur-xl border border-[var(--border-default)] rounded-xl shadow-2xl overflow-hidden"
              style={getMenuPos(activeMenuDot)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
                {activeMenuUnit ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[activeMenuUnit.estado] }} />
                    <span className="text-xs font-medium text-[var(--text-primary)]">{activeMenuUnit.identificador}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">({STATUS_LABELS[activeMenuUnit.estado]})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full border border-dashed border-gray-400" style={{ background: EMPTY_DOT_COLOR }} />
                    <span className="text-xs text-[var(--text-muted)]">Punto sin asignar</span>
                  </div>
                )}
              </div>

              {/* Unit search/assign */}
              {(activeMenuIsEmpty || activeMenuUnit) && unassignedUnits.length > 0 && (
                <div className="border-b border-[var(--border-subtle)]">
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-2 py-1 bg-[var(--surface-3)] rounded-lg border border-[var(--border-subtle)]">
                      <Search size={11} className="text-[var(--text-muted)] shrink-0" />
                      <input
                        ref={menuSearchRef}
                        type="text"
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && filteredUnassigned.length > 0) {
                            handleAssignUnit(filteredUnassigned[0].id);
                          }
                          if (e.key === "Escape") setActiveMenuDotId(null);
                        }}
                        placeholder={activeMenuIsEmpty ? "Asignar unidad..." : "Cambiar unidad..."}
                        className="bg-transparent text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none w-full"
                      />
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {filteredUnassigned.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleAssignUnit(u.id)}
                        className="w-full flex items-start gap-2 px-3 py-1.5 hover:bg-[var(--surface-2)] transition-colors text-left"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: STATUS_COLORS[u.estado] }} />
                        <span className="min-w-0">
                          <span className="block text-[11px] text-[var(--text-secondary)] truncate">{u.identificador}</span>
                          {u.tipologiaNombre && (
                            <span className="block text-[9px] text-[var(--text-muted)] truncate">
                              {u.tipologiaNombre}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                    {filteredUnassigned.length === 0 && (
                      <p className="px-3 py-2 text-[10px] text-[var(--text-muted)] text-center">Sin resultados</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="py-1">
                {activeMenuUnit && (
                  <button
                    onClick={handleUnassignDot}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <Unlink size={12} />
                    Desasignar
                  </button>
                )}
                <button
                  onClick={handleDeleteDot}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={12} />
                  Eliminar punto
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Close menu on click outside */}
      {activeMenuDotId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveMenuDotId(null)}
          onContextMenu={(e) => { e.preventDefault(); setActiveMenuDotId(null); }}
        />
      )}

      {/* Repeat Row panel */}
      <AnimatePresence>
        {showRepeatRow && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-[15%] right-[20%] z-50 px-4 py-3 bg-[var(--surface-1)]/95 backdrop-blur-xl border border-[var(--border-default)] rounded-xl shadow-xl w-[340px]"
          >
            <div className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-[var(--text-muted)]" />
                <span className="text-[12px] font-medium text-[var(--text-primary)]">Repetir fila</span>
              </div>
              <button onClick={() => setShowRepeatRow(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold mb-1 block">Copias</label>
                <input type="number" min={1} max={50} value={repeatCount}
                  onChange={(e) => setRepeatCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold mb-1 block">Espaciado %</label>
                <input type="number" min={0.5} max={20} step={0.5} value={repeatSpacing}
                  onChange={(e) => setRepeatSpacing(Math.max(0.5, Math.min(20, parseFloat(e.target.value) || 1)))}
                  className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold mb-1 block">Dirección</label>
                <div className="grid grid-cols-3 gap-0.5 w-fit">
                  <div />
                  <button onClick={() => setRepeatDirection("up")}
                    className={cn("flex items-center justify-center w-7 h-7 rounded-md border text-[11px] transition-all",
                      repeatDirection === "up"
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.4)] text-[var(--site-primary)]"
                        : "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                    )}>
                    <ArrowUp size={12} />
                  </button>
                  <div />
                  <button onClick={() => setRepeatDirection("left")}
                    className={cn("flex items-center justify-center w-7 h-7 rounded-md border text-[11px] transition-all",
                      repeatDirection === "left"
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.4)] text-[var(--site-primary)]"
                        : "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                    )}>
                    <ArrowLeft size={12} />
                  </button>
                  <button onClick={() => setRepeatDirection("down")}
                    className={cn("flex items-center justify-center w-7 h-7 rounded-md border text-[11px] transition-all",
                      repeatDirection === "down"
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.4)] text-[var(--site-primary)]"
                        : "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                    )}>
                    <ArrowDown size={12} />
                  </button>
                  <button onClick={() => setRepeatDirection("right")}
                    className={cn("flex items-center justify-center w-7 h-7 rounded-md border text-[11px] transition-all",
                      repeatDirection === "right"
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.4)] text-[var(--site-primary)]"
                        : "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                    )}>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
            {previewDots.length > 0 && (
              <p className="text-[10px] text-[var(--text-tertiary)] mb-3">
                Vista previa: {previewDots.length} puntos nuevos
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowRepeatRow(false)}
                className="px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-white bg-[var(--surface-3)] hover:bg-[var(--surface-4)] rounded-lg border border-[var(--border-subtle)] transition-colors">
                Cancelar
              </button>
              <button onClick={handleApplyRepeatRow} disabled={previewDots.length === 0}
                className="px-4 py-1.5 text-[11px] text-[var(--surface-0)] bg-[var(--site-primary)] hover:brightness-110 rounded-lg font-medium transition-all disabled:opacity-40">
                Aplicar ({previewDots.length})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Grid panel */}
      <AnimatePresence>
        {showQuickGrid && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-[15%] right-[20%] z-50 px-4 py-3 bg-[var(--surface-1)]/95 backdrop-blur-xl border border-[var(--border-default)] rounded-xl shadow-xl w-[340px]"
          >
            <div className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-[var(--text-muted)]" />
                <span className="text-[12px] font-medium text-[var(--text-primary)]">Cuadrícula rápida</span>
              </div>
              <button onClick={() => setShowQuickGrid(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold mb-1 block">Columnas</label>
                <input type="number" min={1} max={20} value={gridCols}
                  onChange={(e) => setGridCols(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold mb-1 block">Filas</label>
                <input type="number" min={1} max={50} value={gridRows}
                  onChange={(e) => setGridRows(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {(["x1", "y1", "x2", "y2"] as const).map((key, i) => (
                <div key={key}>
                  <label className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold mb-1 block">
                    {["Izq %", "Arriba %", "Der %", "Abajo %"][i]}
                  </label>
                  <input type="number" min={0} max={100} value={gridBounds[key]}
                    onChange={(e) => setGridBounds((b) => ({ ...b, [key]: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) }))}
                    className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
            {previewDots.length > 0 && (
              <p className="text-[10px] text-[var(--text-tertiary)] mb-3">
                Vista previa: {gridCols} × {gridRows} = {previewDots.length} puntos
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowQuickGrid(false)}
                className="px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-white bg-[var(--surface-3)] hover:bg-[var(--surface-4)] rounded-lg border border-[var(--border-subtle)] transition-colors">
                Cancelar
              </button>
              <button onClick={handleApplyQuickGrid} disabled={previewDots.length === 0}
                className="px-4 py-1.5 text-[11px] text-[var(--surface-0)] bg-[var(--site-primary)] hover:brightness-110 rounded-lg font-medium transition-all disabled:opacity-40">
                Generar ({previewDots.length})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------
   AllDots — renders both assigned and empty dots
   ------------------------------------------------------------------ */
function AllDots({
  positions,
  emptyDots,
  unitMap,
  selectedIds,
  hoveredId,
  isDragging,
  draggingDotId,
  activeMenuDotId,
  toPx,
  onMouseDown,
  onHover,
  onContextMenu,
}: {
  positions: Map<string, { x: number; y: number }>;
  emptyDots: EmptyDot[];
  unitMap: Map<string, HotspotUnit>;
  selectedIds: Set<string>;
  hoveredId: string | null;
  isDragging: boolean;
  draggingDotId: string | null;
  activeMenuDotId: string | null;
  toPx: (x: number, y: number) => { left: number; top: number } | null;
  onMouseDown: (e: React.MouseEvent, id: string, isEmpty: boolean) => void;
  onHover: (id: string | null) => void;
  onContextMenu: (id: string, isEmpty: boolean) => void;
}) {
  return (
    <>
      {/* Assigned unit dots */}
      {[...positions.entries()].map(([id, pos]) => {
        const unit = unitMap.get(id);
        if (!unit) return null;
        const isSelected = selectedIds.has(id);
        const isHovered = hoveredId === id;
        const isThisDragging = draggingDotId === id;
        const isMenuOpen = activeMenuDotId === id;
        const px = toPx(pos.x, pos.y);
        if (!px) return null;

        return (
          <div
            key={id}
            data-hotspot
            className={cn(
              "absolute w-4 h-4 rounded-full border-2 transition-colors",
              isThisDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{
              left: px.left,
              top: px.top,
              transform: 'translate(-50%, -50%)',
              backgroundColor: STATUS_COLORS[unit.estado],
              borderColor: isSelected || isMenuOpen ? SELECTION_COLOR : "rgba(0,0,0,0.5)",
              boxShadow: isHovered || isMenuOpen
                ? `0 0 0 4px ${STATUS_COLORS[unit.estado]}40`
                : "0 1px 3px rgba(0,0,0,0.5)",
              zIndex: isSelected || isHovered || isMenuOpen ? 20 : 10,
              pointerEvents: isDragging && !isThisDragging && !isSelected ? "none" : "auto",
            }}
            onMouseDown={(e) => onMouseDown(e, id, false)}
            onMouseEnter={() => onHover(id)}
            onMouseLeave={() => onHover(null)}
            onContextMenu={(e) => { e.preventDefault(); onContextMenu(id, false); }}
          >
            {/* Always-visible identifier label */}
            <div
              className="absolute left-full top-1/2 -translate-y-1/2 ml-1 px-1 py-0.5 bg-black/75 rounded pointer-events-none whitespace-nowrap"
              style={{ zIndex: 25 }}
            >
              <span className="text-[9px] font-mono font-bold text-white leading-none">{unit.identificador}</span>
            </div>
            {(isHovered || isSelected) && !isMenuOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-[10px] rounded-md whitespace-nowrap pointer-events-none z-30">
                <span className="font-medium">{unit.identificador}</span>
                <span className="text-[var(--text-secondary)] ml-1">({STATUS_LABELS[unit.estado]})</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Empty (unassigned) dots */}
      {emptyDots.map((dot) => {
        const isSelected = selectedIds.has(dot.localId);
        const isHovered = hoveredId === dot.localId;
        const isThisDragging = draggingDotId === dot.localId;
        const isMenuOpen = activeMenuDotId === dot.localId;
        const px = toPx(dot.x, dot.y);
        if (!px) return null;

        return (
          <div
            key={dot.localId}
            data-hotspot
            className={cn(
              "absolute w-3 h-3 rounded-full transition-colors",
              isThisDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{
              left: px.left,
              top: px.top,
              transform: 'translate(-50%, -50%)',
              backgroundColor: EMPTY_DOT_COLOR,
              border: `2px dashed ${isSelected || isMenuOpen ? SELECTION_COLOR : "rgba(255,255,255,0.4)"}`,
              boxShadow: isHovered || isMenuOpen
                ? `0 0 0 4px ${EMPTY_DOT_COLOR}40`
                : "0 1px 3px rgba(0,0,0,0.5)",
              zIndex: isSelected || isHovered || isMenuOpen ? 20 : 10,
              pointerEvents: isDragging && !isThisDragging && !isSelected ? "none" : "auto",
            }}
            onMouseDown={(e) => onMouseDown(e, dot.localId, true)}
            onMouseEnter={() => onHover(dot.localId)}
            onMouseLeave={() => onHover(null)}
            onContextMenu={(e) => { e.preventDefault(); onContextMenu(dot.localId, true); }}
          >
            {isHovered && !isMenuOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-[10px] rounded-md whitespace-nowrap pointer-events-none z-30">
                Sin asignar
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
