"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Trash2, Link2, Unlink, AlertTriangle, XCircle, Copy, Grid3X3, CopyPlus, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlignmentToolbar } from "@/components/dashboard/AlignmentToolbar";
import type { Unidad, Fachada } from "@/types";

/* ------------------------------------------------------------------
   Status color map
   ------------------------------------------------------------------ */
const STATUS_COLORS: Record<Unidad["estado"], string> = {
  disponible: "#22c55e",
  separado: "#eab308",
  reservada: "#f97316",
  vendida: "#ef4444",
};

const STATUS_LABELS: Record<Unidad["estado"], string> = {
  disponible: "Disponible",
  separado: "Separado",
  reservada: "Reservada",
  vendida: "Vendida",
};

const EMPTY_DOT_COLOR = "#6b7280";

const SELECTION_COLOR = "#38bdf8";       // sky-400 — high contrast on light/dark

/* ------------------------------------------------------------------
   Types
   ------------------------------------------------------------------ */
interface HotspotUnit {
  id: string;
  identificador: string;
  estado: Unidad["estado"];
  fachada_x: number;
  fachada_y: number;
}

interface EmptyDot {
  localId: string;
  x: number;
  y: number;
}

interface FacadeHotspotEditorProps {
  fachada: Fachada;
  assignedUnits: HotspotUnit[];
  unassignedUnits: { id: string; identificador: string; estado: Unidad["estado"] }[];
  onUpdateUnit: (
    unitId: string,
    data: { fachada_id: string; fachada_x: number; fachada_y: number }
  ) => Promise<void>;
  onRemoveUnit: (unitId: string) => Promise<void>;
  onClearAll: (fachadaId: string) => Promise<void>;
}

/* ------------------------------------------------------------------
   Grid generation helpers (pure functions)
   ------------------------------------------------------------------ */
function generateRowRepeat(
  sourceDots: { x: number; y: number }[],
  copies: number,
  spacing: number,
  direction: "up" | "down"
): EmptyDot[] {
  const result: EmptyDot[] = [];
  for (let i = 1; i <= copies; i++) {
    const yOffset = direction === "up" ? -spacing * i : spacing * i;
    for (const dot of sourceDots) {
      const newY = dot.y + yOffset;
      if (newY < 0 || newY > 100) continue;
      result.push({
        localId: crypto.randomUUID(),
        x: dot.x,
        y: Math.round(newY * 100) / 100,
      });
    }
  }
  return result;
}

function generateGrid(
  cols: number,
  rows: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
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

  // Local positions for assigned units (instant drag feedback; persisted on mouseUp)
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Empty (unassigned) dots — ephemeral, local-only
  const [emptyDots, setEmptyDots] = useState<EmptyDot[]>([]);

  // Track last placed dot position for Shift/Ctrl constrained placement
  const lastPlacedPos = useRef<{ x: number; y: number } | null>(null);

  // Selection (can contain both unit ids and empty dot localIds)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Which dot's context menu is open (unit id or empty dot localId)
  const [activeMenuDotId, setActiveMenuDotId] = useState<string | null>(null);
  const [menuSearch, setMenuSearch] = useState("");

  // Drag state
  const [dragging, setDragging] = useState<{
    dotId: string;
    isEmptyDot: boolean;
    startX: number;
    startY: number;
    origPositions: Map<string, { x: number; y: number }>;
    origEmptyDots: EmptyDot[];
  } | null>(null);

  // Click/drag disambiguation
  const dotInteraction = useRef<{
    dotId: string;
    isEmptyDot: boolean;
    startClientX: number;
    startClientY: number;
    moved: boolean;
  } | null>(null);

  // Rectangle selection
  const [rectSelect, setRectSelect] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Canvas mousedown tracker for rect-select vs dot-placement disambiguation
  const canvasMouseDown = useRef<{
    startClientX: number;
    startClientY: number;
    shiftKey: boolean;
    ctrlKey: boolean;
    pos: { x: number; y: number };
  } | null>(null);

  // Hovered hotspot (for tooltip)
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Confirm clear all prompt
  const [confirmClear, setConfirmClear] = useState(false);

  // Dynamic image aspect ratio
  const [imageAspectRatio, setImageAspectRatio] = useState("4/3");
  const [, setTick] = useState(0);

  // Repeat Row popover state
  const [showRepeatRow, setShowRepeatRow] = useState(false);
  const [repeatCount, setRepeatCount] = useState(fachada.num_pisos ? Math.max(1, fachada.num_pisos - 1) : 10);
  const [repeatSpacing, setRepeatSpacing] = useState(5);
  const [repeatDirection, setRepeatDirection] = useState<"up" | "down">("up");

  // Quick Grid popover state
  const [showQuickGrid, setShowQuickGrid] = useState(false);
  const [gridCols, setGridCols] = useState(4);
  const [gridRows, setGridRows] = useState(fachada.num_pisos || 10);
  const [gridBounds, setGridBounds] = useState({ x1: 15, y1: 10, x2: 85, y2: 90 });

  /* Sync incoming positions */
  useEffect(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const u of assignedUnits) {
      m.set(u.id, { x: u.fachada_x, y: u.fachada_y });
    }
    setPositions(m);
  }, [assignedUnits]);

  /* Focus menu search when opened */
  useEffect(() => {
    if (activeMenuDotId) {
      setMenuSearch("");
      requestAnimationFrame(() => menuSearchRef.current?.focus());
    }
  }, [activeMenuDotId]);

  /* ------------------------------------------------------------------
     Image bounds helper (accounts for object-contain)
     ------------------------------------------------------------------ */
  const getImageBounds = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return null;
    const cRect = container.getBoundingClientRect();
    const naturalRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = cRect.width / cRect.height;

    let imgW: number, imgH: number, offsetX: number, offsetY: number;
    if (naturalRatio > containerRatio) {
      imgW = cRect.width;
      imgH = cRect.width / naturalRatio;
      offsetX = 0;
      offsetY = (cRect.height - imgH) / 2;
    } else {
      imgH = cRect.height;
      imgW = cRect.height * naturalRatio;
      offsetX = (cRect.width - imgW) / 2;
      offsetY = 0;
    }

    return { imgW, imgH, offsetX, offsetY, cRect };
  }, []);

  /* ------------------------------------------------------------------
     Percentage helpers (relative to actual image, not container)
     ------------------------------------------------------------------ */
  const toPercent = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const bounds = getImageBounds();
      if (!bounds) return null;
      const { imgW, imgH, offsetX, offsetY, cRect } = bounds;
      const x = ((clientX - cRect.left - offsetX) / imgW) * 100;
      const y = ((clientY - cRect.top - offsetY) / imgH) * 100;
      return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    },
    [getImageBounds]
  );

  /* ------------------------------------------------------------------
     Helpers for getting/setting dot positions (both types)
     ------------------------------------------------------------------ */
  const getDotPos = useCallback(
    (dotId: string): { x: number; y: number } | null => {
      // Check assigned positions first
      const assigned = positions.get(dotId);
      if (assigned) return assigned;
      // Check empty dots
      const empty = emptyDots.find((d) => d.localId === dotId);
      if (empty) return { x: empty.x, y: empty.y };
      return null;
    },
    [positions, emptyDots]
  );

  const isEmptyDotId = useCallback(
    (id: string) => emptyDots.some((d) => d.localId === id),
    [emptyDots]
  );

  /* ------------------------------------------------------------------
     Canvas mousedown: start rect-select tracking or place dot
     ------------------------------------------------------------------ */
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-hotspot]")) return;
    if ((e.target as HTMLElement).closest("[data-context-menu]")) return;
    if ((e.target as HTMLElement).closest("[data-toolbar]")) return;

    const pos = toPercent(e.clientX, e.clientY);
    if (!pos) return;

    // Close any open menu
    setActiveMenuDotId(null);

    // Record the mousedown for later disambiguation
    canvasMouseDown.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey || e.metaKey,
      pos,
    };

    // Don't start rect-select on mousedown — defer to mousemove with threshold
    // so that Shift+click (no drag) reaches constrained placement in mouseUp.
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    // Already tracking a rect-select — update it
    if (rectSelect) {
      const pos = toPercent(e.clientX, e.clientY);
      if (pos) {
        setRectSelect((prev) => (prev ? { ...prev, currentX: pos.x, currentY: pos.y } : null));
      }
      return;
    }

    // Start rect-select only after Shift+drag beyond a threshold
    const down = canvasMouseDown.current;
    if (down?.shiftKey) {
      const dist = Math.sqrt(
        (e.clientX - down.startClientX) ** 2 + (e.clientY - down.startClientY) ** 2
      );
      if (dist > 5) {
        const pos = toPercent(e.clientX, e.clientY);
        if (pos) {
          setRectSelect({ startX: down.pos.x, startY: down.pos.y, currentX: pos.x, currentY: pos.y });
        }
      }
    }
  };

  const handleContainerMouseUp = (e: React.MouseEvent) => {
    const down = canvasMouseDown.current;
    canvasMouseDown.current = null;

    // Finish rectangle selection
    if (rectSelect) {
      const dx = Math.abs(rectSelect.currentX - rectSelect.startX);
      const dy = Math.abs(rectSelect.currentY - rectSelect.startY);

      if (dx > 1 || dy > 1) {
        // It was a drag — select dots in rectangle
        const x1 = Math.min(rectSelect.startX, rectSelect.currentX);
        const x2 = Math.max(rectSelect.startX, rectSelect.currentX);
        const y1 = Math.min(rectSelect.startY, rectSelect.currentY);
        const y2 = Math.max(rectSelect.startY, rectSelect.currentY);

        const ids = new Set<string>();
        positions.forEach((pos, id) => {
          if (pos.x >= x1 && pos.x <= x2 && pos.y >= y1 && pos.y <= y2) ids.add(id);
        });
        emptyDots.forEach((d) => {
          if (d.x >= x1 && d.x <= x2 && d.y >= y1 && d.y <= y2) ids.add(d.localId);
        });
        setSelectedIds(ids);
        setRectSelect(null);
        return;
      }

      // Shift was held but no significant drag — it's a shift+click for constrained placement
      setRectSelect(null);
    }

    if (!down) return;

    // Check if the mouse actually moved (if so, it was a drag, not a click)
    const movedDist = Math.sqrt(
      (e.clientX - down.startClientX) ** 2 + (e.clientY - down.startClientY) ** 2
    );
    if (movedDist > 5) return; // Was a drag, not a click

    // This is a click on empty canvas — create an empty dot
    let finalX = down.pos.x;
    let finalY = down.pos.y;

    // Modifier constraints relative to last placed dot
    if (lastPlacedPos.current) {
      if (down.shiftKey) {
        finalY = lastPlacedPos.current.y; // Constrain horizontal
      } else if (down.ctrlKey) {
        finalX = lastPlacedPos.current.x; // Constrain vertical
      }
    }

    const newDot: EmptyDot = {
      localId: crypto.randomUUID(),
      x: finalX,
      y: finalY,
    };

    setEmptyDots((prev) => [...prev, newDot]);
    lastPlacedPos.current = { x: finalX, y: finalY };
    setSelectedIds(new Set());
  };

  /* ------------------------------------------------------------------
     Window-level drag listeners (so mouseup fires even outside container)
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (!dragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      // Mark interaction as moved
      if (dotInteraction.current) dotInteraction.current.moved = true;

      const pos = toPercent(e.clientX, e.clientY);
      if (!pos) return;
      const dx = pos.x - dragging.startX;
      const dy = pos.y - dragging.startY;

      const idsToMove = selectedIds.has(dragging.dotId)
        ? [...selectedIds]
        : [dragging.dotId];

      // Update assigned unit positions
      setPositions((prev) => {
        const next = new Map(prev);
        for (const id of idsToMove) {
          const orig = dragging.origPositions.get(id);
          if (orig) {
            next.set(id, {
              x: Math.max(0, Math.min(100, orig.x + dx)),
              y: Math.max(0, Math.min(100, orig.y + dy)),
            });
          }
        }
        return next;
      });

      // Update empty dot positions
      setEmptyDots((prev) =>
        prev.map((d) => {
          if (!idsToMove.includes(d.localId)) return d;
          const orig = dragging.origEmptyDots.find((od) => od.localId === d.localId);
          if (!orig) return d;
          return {
            ...d,
            x: Math.max(0, Math.min(100, orig.x + dx)),
            y: Math.max(0, Math.min(100, orig.y + dy)),
          };
        })
      );
    };

    const handleWindowMouseUp = async () => {
      const interaction = dotInteraction.current;
      dotInteraction.current = null;

      // If didn't move much, it was a click → show context menu
      if (interaction && !interaction.moved) {
        setActiveMenuDotId(dragging.dotId);
        if (!selectedIds.has(dragging.dotId)) {
          setSelectedIds(new Set([dragging.dotId]));
        }
        setDragging(null);
        return;
      }

      // Persist moved assigned unit positions
      const idsToSave = selectedIds.has(dragging.dotId)
        ? [...selectedIds]
        : [dragging.dotId];

      for (const id of idsToSave) {
        if (isEmptyDotId(id)) continue; // empty dots don't persist
        const pos = positions.get(id);
        if (pos) {
          await onUpdateUnit(id, {
            fachada_id: fachada.id,
            fachada_x: Math.round(pos.x * 100) / 100,
            fachada_y: Math.round(pos.y * 100) / 100,
          });
        }
      }
      setDragging(null);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp, { once: true });
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  /* ------------------------------------------------------------------
     Dot mousedown: start click/drag disambiguation
     ------------------------------------------------------------------ */
  const handleDotMouseDown = (e: React.MouseEvent, dotId: string, isEmpty: boolean) => {
    e.stopPropagation();

    if (e.shiftKey) {
      // Toggle selection
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(dotId)) next.delete(dotId);
        else next.add(dotId);
        return next;
      });
      return;
    }

    // Close any existing menu
    setActiveMenuDotId(null);

    // Record interaction for click/drag detection
    dotInteraction.current = {
      dotId,
      isEmptyDot: isEmpty,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
    };

    // Select this dot if not already selected
    if (!selectedIds.has(dotId)) {
      setSelectedIds(new Set([dotId]));
    }

    const pos = toPercent(e.clientX, e.clientY);
    if (!pos) return;

    // Build origin snapshots for all positions
    const origPositions = new Map(positions);
    // Add empty dot positions to the map for unified movement
    for (const d of emptyDots) {
      if (!origPositions.has(d.localId)) {
        origPositions.set(d.localId, { x: d.x, y: d.y });
      }
    }

    setDragging({
      dotId,
      isEmptyDot: isEmpty,
      startX: pos.x,
      startY: pos.y,
      origPositions,
      origEmptyDots: [...emptyDots],
    });
  };

  /* ------------------------------------------------------------------
     Context menu actions
     ------------------------------------------------------------------ */
  const handleAssignUnit = async (unitId: string) => {
    if (!activeMenuDotId) return;
    const dot = emptyDots.find((d) => d.localId === activeMenuDotId);
    if (dot) {
      // Assign unit at empty dot position, remove empty dot
      await onUpdateUnit(unitId, {
        fachada_id: fachada.id,
        fachada_x: Math.round(dot.x * 100) / 100,
        fachada_y: Math.round(dot.y * 100) / 100,
      });
      setEmptyDots((prev) => prev.filter((d) => d.localId !== activeMenuDotId));
    } else {
      // Reassign: the activeMenuDotId is an existing unit, replace it
      const pos = positions.get(activeMenuDotId);
      if (pos) {
        // First unassign the current unit from this position
        await onRemoveUnit(activeMenuDotId);
        // Then assign the new unit at the same position
        await onUpdateUnit(unitId, {
          fachada_id: fachada.id,
          fachada_x: Math.round(pos.x * 100) / 100,
          fachada_y: Math.round(pos.y * 100) / 100,
        });
      }
    }
    setActiveMenuDotId(null);
    setSelectedIds(new Set());
  };

  const handleDeleteDot = () => {
    if (!activeMenuDotId) return;
    if (isEmptyDotId(activeMenuDotId)) {
      setEmptyDots((prev) => prev.filter((d) => d.localId !== activeMenuDotId));
    } else {
      onRemoveUnit(activeMenuDotId);
    }
    setActiveMenuDotId(null);
    setSelectedIds(new Set());
  };

  const handleUnassignDot = () => {
    if (!activeMenuDotId || isEmptyDotId(activeMenuDotId)) return;
    onRemoveUnit(activeMenuDotId);
    setActiveMenuDotId(null);
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    selectedIds.forEach((id) => {
      if (isEmptyDotId(id)) {
        setEmptyDots((prev) => prev.filter((d) => d.localId !== id));
      } else {
        onRemoveUnit(id);
      }
    });
    setSelectedIds(new Set());
    setActiveMenuDotId(null);
  };

  const handleBatchDuplicate = () => {
    // Smart vertical offset: use average vertical gap if detectable, else 3%
    const selectedPositions: { x: number; y: number }[] = [];
    for (const id of selectedIds) {
      const pos = getDotPos(id);
      if (pos) selectedPositions.push(pos);
    }
    let offset = 3;
    if (selectedPositions.length >= 2) {
      const ys = selectedPositions.map((p) => p.y).sort((a, b) => a - b);
      const gaps: number[] = [];
      for (let i = 1; i < ys.length; i++) {
        const gap = ys[i] - ys[i - 1];
        if (gap > 0.5) gaps.push(gap);
      }
      if (gaps.length > 0) {
        offset = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      }
    }
    const newDots: EmptyDot[] = [];
    for (const id of selectedIds) {
      const pos = getDotPos(id);
      if (!pos) continue;
      newDots.push({
        localId: crypto.randomUUID(),
        x: pos.x,
        y: Math.min(100, pos.y + offset),
      });
    }
    setEmptyDots((prev) => [...prev, ...newDots]);
    setSelectedIds(new Set(newDots.map((d) => d.localId)));
  };

  // Repeat Row: apply generated dots
  const handleApplyRepeatRow = () => {
    const sourceDots: { x: number; y: number }[] = [];
    for (const id of selectedIds) {
      const pos = getDotPos(id);
      if (pos) sourceDots.push(pos);
    }
    if (sourceDots.length === 0) return;
    const newDots = generateRowRepeat(sourceDots, repeatCount, repeatSpacing, repeatDirection);
    setEmptyDots((prev) => [...prev, ...newDots]);
    setSelectedIds(new Set(newDots.map((d) => d.localId)));
    setShowRepeatRow(false);
  };

  // Quick Grid: apply generated dots
  const handleApplyQuickGrid = () => {
    const newDots = generateGrid(gridCols, gridRows, gridBounds.x1, gridBounds.y1, gridBounds.x2, gridBounds.y2);
    setEmptyDots((prev) => [...prev, ...newDots]);
    setSelectedIds(new Set(newDots.map((d) => d.localId)));
    setShowQuickGrid(false);
  };

  const handleClearAll = () => {
    onClearAll(fachada.id);
    setEmptyDots([]);
    setSelectedIds(new Set());
    setActiveMenuDotId(null);
    setConfirmClear(false);
  };

  /* ------------------------------------------------------------------
     Alignment callback (handles both assigned + empty dots)
     ------------------------------------------------------------------ */
  const handleAlign = async (
    updates: { id: string; fachada_x: number; fachada_y: number }[]
  ) => {
    // Update assigned positions optimistically
    setPositions((prev) => {
      const next = new Map(prev);
      for (const u of updates) {
        if (!isEmptyDotId(u.id)) {
          next.set(u.id, { x: u.fachada_x, y: u.fachada_y });
        }
      }
      return next;
    });

    // Update empty dots
    setEmptyDots((prev) =>
      prev.map((d) => {
        const update = updates.find((u) => u.id === d.localId);
        if (!update) return d;
        return { ...d, x: update.fachada_x, y: update.fachada_y };
      })
    );

    // Persist assigned unit updates
    for (const u of updates) {
      if (isEmptyDotId(u.id)) continue;
      await onUpdateUnit(u.id, {
        fachada_id: fachada.id,
        fachada_x: Math.round(u.fachada_x * 100) / 100,
        fachada_y: Math.round(u.fachada_y * 100) / 100,
      });
    }
  };

  /* ------------------------------------------------------------------
     Build selected units data for AlignmentToolbar
     ------------------------------------------------------------------ */
  const selectedUnitsData = [...selectedIds]
    .map((id) => {
      const pos = getDotPos(id);
      if (!pos) return null;
      return { id, fachada_x: pos.x, fachada_y: pos.y };
    })
    .filter(Boolean) as { id: string; fachada_x: number; fachada_y: number }[];

  /* ------------------------------------------------------------------
     Ghost preview dots for Repeat Row / Quick Grid
     ------------------------------------------------------------------ */
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
  }, [showRepeatRow, showQuickGrid, selectedIds, repeatCount, repeatSpacing, repeatDirection, gridCols, gridRows, gridBounds, getDotPos]);

  // Auto-calculate default spacing for repeat row
  const autoSpacing = useMemo(() => {
    if (selectedIds.size === 0) return 5;
    const sourceDots: { x: number; y: number }[] = [];
    for (const id of selectedIds) {
      const pos = getDotPos(id);
      if (pos) sourceDots.push(pos);
    }
    if (sourceDots.length === 0) return 5;
    const avgY = sourceDots.reduce((s, d) => s + d.y, 0) / sourceDots.length;
    const available = repeatDirection === "up" ? avgY : (100 - avgY);
    return repeatCount > 0 ? Math.round((available / repeatCount) * 10) / 10 : 5;
  }, [selectedIds, repeatCount, repeatDirection, getDotPos]);

  /* ------------------------------------------------------------------
     Lookup helpers
     ------------------------------------------------------------------ */
  const unitMap = new Map<string, HotspotUnit>();
  for (const u of assignedUnits) {
    unitMap.set(u.id, u);
  }

  /* ------------------------------------------------------------------
     Rectangle selection geometry (pixel-based from image bounds)
     ------------------------------------------------------------------ */
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
  const rectStyle = getRectStyle();

  /* ------------------------------------------------------------------
     Filter unassigned units by search (for context menu)
     ------------------------------------------------------------------ */
  const filteredUnassigned = menuSearch
    ? unassignedUnits.filter((u) =>
        u.identificador.toLowerCase().includes(menuSearch.toLowerCase())
      )
    : unassignedUnits;

  /* ------------------------------------------------------------------
     Context menu position (pixel-based, quadrant-aware)
     ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------
     Active menu dot info
     ------------------------------------------------------------------ */
  const activeMenuDot = activeMenuDotId ? getDotPos(activeMenuDotId) : null;
  const activeMenuUnit = activeMenuDotId ? unitMap.get(activeMenuDotId) : null;
  const activeMenuIsEmpty = activeMenuDotId ? isEmptyDotId(activeMenuDotId) : false;

  return (
    <div className="space-y-3">
      {/* Status legend */}
      <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-dashed border-gray-400" style={{ background: EMPTY_DOT_COLOR }} />
          Sin asignar
        </div>
        {(Object.keys(STATUS_COLORS) as Unidad["estado"][]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s] }} />
            {STATUS_LABELS[s]}
          </div>
        ))}
      </div>

      {/* Image canvas — dynamic aspect ratio */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full max-h-[65vh] select-none",
          dragging ? "cursor-grabbing" : "cursor-crosshair"
        )}
        style={{ aspectRatio: imageAspectRatio }}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
      >
        {/* Image wrapper */}
        <div className="absolute inset-0 rounded-xl overflow-hidden border border-[var(--border-default)] bg-[var(--surface-2)]">
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
              requestAnimationFrame(() => setTick((t) => t + 1));
            }}
          />
        </div>

        {/* Floating toolbar overlay */}
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
            ) : (selectedIds.size >= 1 || positions.size > 0 || emptyDots.length > 0 || showQuickGrid) ? (
              <motion.div
                key="toolbar"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 px-2 py-1.5 bg-black/70 backdrop-blur-xl border border-[var(--border-default)] rounded-xl shadow-lg"
              >
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

          {/* Repeat Row popover */}
          <AnimatePresence>
            {showRepeatRow && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="px-4 py-3 bg-black/80 backdrop-blur-xl border border-[var(--border-default)] rounded-xl shadow-lg min-w-[320px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-medium text-[var(--text-primary)]">Repetir fila</span>
                  <button
                    onClick={() => setShowRepeatRow(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Copias</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                      className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Espaciado %</label>
                    <input
                      type="number"
                      min={0.5}
                      max={20}
                      step={0.5}
                      value={repeatSpacing}
                      onChange={(e) => setRepeatSpacing(Math.max(0.5, Math.min(20, parseFloat(e.target.value) || 1)))}
                      className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Dirección</label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setRepeatDirection("up")}
                        className={cn(
                          "flex-1 flex items-center justify-center py-1.5 rounded-lg border text-[11px] transition-all",
                          repeatDirection === "up"
                            ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.4)] text-[var(--site-primary)]"
                            : "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                        )}
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => setRepeatDirection("down")}
                        className={cn(
                          "flex-1 flex items-center justify-center py-1.5 rounded-lg border text-[11px] transition-all",
                          repeatDirection === "down"
                            ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.4)] text-[var(--site-primary)]"
                            : "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                        )}
                      >
                        <ArrowDown size={13} />
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
                  <button
                    onClick={() => setShowRepeatRow(false)}
                    className="px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-white bg-[var(--surface-3)] hover:bg-[var(--surface-4)] rounded-lg border border-[var(--border-subtle)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleApplyRepeatRow}
                    disabled={previewDots.length === 0}
                    className="px-4 py-1.5 text-[11px] text-[var(--surface-0)] bg-[var(--site-primary)] hover:brightness-110 rounded-lg font-medium transition-all disabled:opacity-40"
                  >
                    Aplicar ({previewDots.length})
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Grid popover */}
          <AnimatePresence>
            {showQuickGrid && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="px-4 py-3 bg-black/80 backdrop-blur-xl border border-[var(--border-default)] rounded-xl shadow-lg min-w-[320px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-medium text-[var(--text-primary)]">Cuadrícula rápida</span>
                  <button
                    onClick={() => setShowQuickGrid(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Columnas</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={gridCols}
                      onChange={(e) => setGridCols(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Filas</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={gridRows}
                      onChange={(e) => setGridRows(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                      className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Izq %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={gridBounds.x1}
                      onChange={(e) => setGridBounds((b) => ({ ...b, x1: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) }))}
                      className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Arriba %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={gridBounds.y1}
                      onChange={(e) => setGridBounds((b) => ({ ...b, y1: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) }))}
                      className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Der %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={gridBounds.x2}
                      onChange={(e) => setGridBounds((b) => ({ ...b, x2: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) }))}
                      className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Abajo %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={gridBounds.y2}
                      onChange={(e) => setGridBounds((b) => ({ ...b, y2: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) }))}
                      className="w-full px-2 py-1.5 text-[12px] text-white bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg focus:border-[var(--site-primary)] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {previewDots.length > 0 && (
                  <p className="text-[10px] text-[var(--text-tertiary)] mb-3">
                    Vista previa: {gridCols} × {gridRows} = {previewDots.length} puntos
                  </p>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowQuickGrid(false)}
                    className="px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-white bg-[var(--surface-3)] hover:bg-[var(--surface-4)] rounded-lg border border-[var(--border-subtle)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleApplyQuickGrid}
                    disabled={previewDots.length === 0}
                    className="px-4 py-1.5 text-[11px] text-[var(--surface-0)] bg-[var(--site-primary)] hover:brightness-110 rounded-lg font-medium transition-all disabled:opacity-40"
                  >
                    Generar ({previewDots.length})
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hotspot dots — both assigned and empty */}
        <AllDots
          positions={positions}
          emptyDots={emptyDots}
          unitMap={unitMap}
          selectedIds={selectedIds}
          hoveredId={hoveredId}
          dragging={dragging}
          activeMenuDotId={activeMenuDotId}
          getImageBounds={getImageBounds}
          onMouseDown={handleDotMouseDown}
          onHover={setHoveredId}
          onContextMenu={(id, isEmpty) => {
            if (isEmpty) {
              setEmptyDots((prev) => prev.filter((d) => d.localId !== id));
            } else {
              onRemoveUnit(id);
            }
          }}
        />

        {/* Ghost preview dots for Repeat Row / Quick Grid */}
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
              {/* Header: unit info or "Sin asignar" */}
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
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-2)] transition-colors"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[u.estado] }} />
                        {u.identificador}
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
  dragging,
  activeMenuDotId,
  getImageBounds,
  onMouseDown,
  onHover,
  onContextMenu,
}: {
  positions: Map<string, { x: number; y: number }>;
  emptyDots: EmptyDot[];
  unitMap: Map<string, HotspotUnit>;
  selectedIds: Set<string>;
  hoveredId: string | null;
  dragging: { dotId: string } | null;
  activeMenuDotId: string | null;
  getImageBounds: () => {
    imgW: number;
    imgH: number;
    offsetX: number;
    offsetY: number;
    cRect: DOMRect;
  } | null;
  onMouseDown: (e: React.MouseEvent, id: string, isEmpty: boolean) => void;
  onHover: (id: string | null) => void;
  onContextMenu: (id: string, isEmpty: boolean) => void;
}) {
  // Force re-render on resize so dots reposition
  const [, setTick] = useState(0);
  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const bounds = getImageBounds();
  if (!bounds) return null;
  const { imgW, imgH, offsetX, offsetY } = bounds;

  const toPx = (x: number, y: number) => ({
    left: offsetX + (x / 100) * imgW,
    top: offsetY + (y / 100) * imgH,
  });

  return (
    <>
      {/* Assigned unit dots */}
      {[...positions.entries()].map(([id, pos]) => {
        const unit = unitMap.get(id);
        if (!unit) return null;
        const isSelected = selectedIds.has(id);
        const isHovered = hoveredId === id;
        const isDragging = dragging?.dotId === id;
        const isMenuOpen = activeMenuDotId === id;
        const px = toPx(pos.x, pos.y);

        return (
          <div
            key={id}
            data-hotspot
            className={cn(
              "absolute w-4 h-4 rounded-full border-2 transition-colors",
              isDragging ? "cursor-grabbing" : "cursor-grab"
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
              pointerEvents: dragging && !isDragging && !isSelected ? "none" : "auto",
            }}
            onMouseDown={(e) => onMouseDown(e, id, false)}
            onMouseEnter={() => onHover(id)}
            onMouseLeave={() => onHover(null)}
            onContextMenu={(e) => { e.preventDefault(); onContextMenu(id, false); }}
          >
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
        const isDragging = dragging?.dotId === dot.localId;
        const isMenuOpen = activeMenuDotId === dot.localId;
        const px = toPx(dot.x, dot.y);

        return (
          <div
            key={dot.localId}
            data-hotspot
            className={cn(
              "absolute w-3 h-3 rounded-full transition-colors",
              isDragging ? "cursor-grabbing" : "cursor-grab"
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
              pointerEvents: dragging && !isDragging && !isSelected ? "none" : "auto",
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
