"use client";

import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHotspotCanvas } from "@/hooks/useHotspotCanvas";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnDanger,
} from "@/components/dashboard/editor-styles";
import { FileUploader } from "@/components/dashboard/FileUploader";
import type { PlanoPunto, Fachada, Torre } from "@/types";
import { useTranslation } from "@/i18n";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";

/* ------------------------------------------------------------------
   Props
   ------------------------------------------------------------------ */
interface PlanoHotspotEditorProps {
  imagenUrl: string;
  puntos: PlanoPunto[];
  tipo: "implantacion" | "urbanismo";
  fachadas: Fachada[];
  torres?: Torre[];
  isMultiTorre?: boolean;
  onAddPunto: (data: {
    titulo: string;
    descripcion: string | null;
    imagen_url: string | null;
    render_url: string | null;
    fachada_id: string | null;
    torre_id: string | null;
    x: number;
    y: number;
  }) => Promise<void>;
  onUpdatePunto: (id: string, data: Partial<PlanoPunto>) => Promise<void>;
  onDeletePunto: (id: string) => Promise<void>;
  uploadFolder?: string;
}

/* ------------------------------------------------------------------
   Component
   ------------------------------------------------------------------ */
export function PlanoHotspotEditor({
  imagenUrl,
  puntos,
  tipo,
  fachadas,
  torres = [],
  isMultiTorre = false,
  onAddPunto,
  onUpdatePunto,
  onDeletePunto,
  uploadFolder = "planos",
}: PlanoHotspotEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const { t } = useTranslation("editor");

  const [imageAspectRatio, setImageAspectRatio] = useState("4/3");
  const [previewDot, setPreviewDot] = useState<{ x: number; y: number } | null>(null);
  const [selectedPuntoId, setSelectedPuntoId] = useState<string | null>(null);

  // Form state
  const [formTitulo, setFormTitulo] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formImagenUrl, setFormImagenUrl] = useState("");
  const [formRenderUrl, setFormRenderUrl] = useState("");
  const [formFachadaId, setFormFachadaId] = useState("");
  const [formTorreId, setFormTorreId] = useState("");
  const [saving, setSaving] = useState(false);

  // Drag state
  const [dragging, setDragging] = useState<{
    puntoId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const [dragPositions, setDragPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  const dotInteraction = useRef<{
    puntoId: string;
    startClientX: number;
    startClientY: number;
    moved: boolean;
  } | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [axisLock, setAxisLock] = useState<"x" | "y" | null>(null);

  // Use shared hotspot canvas hook for image bounds & coordinate conversion
  const { getImageBounds, toPercent, toPx } = useHotspotCanvas(containerRef, imgRef);

  const getPuntoPos = useCallback(
    (punto: PlanoPunto): { x: number; y: number } => {
      const override = dragPositions.get(punto.id);
      if (override) return override;
      return { x: punto.x, y: punto.y };
    },
    [dragPositions]
  );

  /* ── Lookup maps ── */
  const fachadaMap = new Map<string, Fachada>();
  for (const e of fachadas) fachadaMap.set(e.id, e);
  const torreMap = new Map<string, Torre>();
  for (const t of torres) torreMap.set(t.id, t);

  /* ── Form helpers ── */
  const resetForm = useCallback(() => {
    setPreviewDot(null);
    setSelectedPuntoId(null);
    setFormTitulo("");
    setFormDescripcion("");
    setFormImagenUrl("");
    setFormRenderUrl("");
    setFormFachadaId("");
    setFormTorreId("");
  }, []);

  const selectPunto = useCallback((punto: PlanoPunto) => {
    setPreviewDot(null);
    setSelectedPuntoId(punto.id);
    setFormTitulo(punto.titulo);
    setFormDescripcion(punto.descripcion || "");
    setFormImagenUrl(punto.imagen_url || "");
    setFormRenderUrl(punto.render_url || "");
    setFormFachadaId(punto.fachada_id || "");
    setFormTorreId(punto.torre_id || "");
  }, []);

  /* ── Canvas click ── */
  const handleContainerClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-hotspot]")) return;
    // Implantation: block new points when all torres are assigned
    if (isImplantacionMultiTorre && puntos.length >= torres.length) return;
    const pos = toPercent(e.clientX, e.clientY);
    if (!pos) return;
    const bounds = getImageBounds();
    if (!bounds) return;
    const { imgW, imgH, offsetX, offsetY, cRect } = bounds;
    const relX = e.clientX - cRect.left;
    const relY = e.clientY - cRect.top;
    if (relX < offsetX || relX > offsetX + imgW || relY < offsetY || relY > offsetY + imgH) return;

    setSelectedPuntoId(null);
    setPreviewDot(pos);
    setFormTitulo("");
    setFormDescripcion("");
    setFormImagenUrl("");
    setFormRenderUrl("");
    setFormFachadaId("");
    setFormTorreId("");
  };

  /* ── Save / Edit / Delete ── */
  const handleSaveNew = async () => {
    if (!previewDot || !formTitulo.trim()) return;
    if (isImplantacionMultiTorre && !formTorreId) return;
    setSaving(true);
    try {
      await onAddPunto({
        titulo: formTitulo.trim(),
        descripcion: formDescripcion.trim() || null,
        imagen_url: formImagenUrl || null,
        render_url: formRenderUrl || null,
        fachada_id: formFachadaId || null,
        torre_id: formTorreId || null,
        x: Math.round(previewDot.x * 100) / 100,
        y: Math.round(previewDot.y * 100) / 100,
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPuntoId || !formTitulo.trim()) return;
    setSaving(true);
    try {
      await onUpdatePunto(selectedPuntoId, {
        titulo: formTitulo.trim(),
        descripcion: formDescripcion.trim() || null,
        imagen_url: formImagenUrl || null,
        render_url: formRenderUrl || null,
        fachada_id: formFachadaId || null,
        torre_id: formTorreId || null,
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPuntoId) return;
    setSaving(true);
    try {
      await onDeletePunto(selectedPuntoId);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  /* ── Dot drag ── */
  const handleDotMouseDown = (e: React.MouseEvent, punto: PlanoPunto) => {
    e.stopPropagation();
    dotInteraction.current = {
      puntoId: punto.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
    };
    const pos = toPercent(e.clientX, e.clientY);
    if (!pos) return;
    const currentPos = getPuntoPos(punto);
    setDragging({
      puntoId: punto.id,
      startX: pos.x,
      startY: pos.y,
      origX: currentPos.x,
      origY: currentPos.y,
    });
  };

  useEffect(() => {
    if (!dragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (dotInteraction.current) dotInteraction.current.moved = true;
      const pos = toPercent(e.clientX, e.clientY);
      if (!pos) return;
      let dx = pos.x - dragging.startX;
      let dy = pos.y - dragging.startY;

      // Shift+drag: lock to the axis with more displacement
      if (e.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) {
          dy = 0;
          setAxisLock("x");
        } else {
          dx = 0;
          setAxisLock("y");
        }
      } else {
        setAxisLock(null);
      }

      setDragPositions((prev) => {
        const next = new Map(prev);
        next.set(dragging.puntoId, {
          x: Math.max(0, Math.min(100, dragging.origX + dx)),
          y: Math.max(0, Math.min(100, dragging.origY + dy)),
        });
        return next;
      });
    };

    const handleWindowMouseUp = async () => {
      const interaction = dotInteraction.current;
      dotInteraction.current = null;
      setAxisLock(null);
      if (interaction && !interaction.moved) {
        const punto = puntos.find((p) => p.id === dragging.puntoId);
        if (punto) selectPunto(punto);
        setDragging(null);
        setDragPositions(new Map());
        return;
      }
      const newPos = dragPositions.get(dragging.puntoId);
      if (newPos) {
        await onUpdatePunto(dragging.puntoId, {
          x: Math.round(newPos.x * 100) / 100,
          y: Math.round(newPos.y * 100) / 100,
        });
      }
      setDragging(null);
      setDragPositions(new Map());
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp, { once: true });
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  /* ── Tooltip ── */
  const getTooltip = (punto: PlanoPunto): string => {
    if (tipo === "implantacion") {
      if (isMultiTorre && punto.torre_id) {
        const torre = torreMap.get(punto.torre_id);
        return torre ? torre.nombre : punto.titulo;
      }
      if (punto.fachada_id) {
        const fachada = fachadaMap.get(punto.fachada_id);
        return fachada ? fachada.nombre : punto.titulo;
      }
    }
    return punto.titulo;
  };

  const sortedPuntos = [...puntos].sort((a, b) => a.orden - b.orden);
  const showForm = previewDot !== null || selectedPuntoId !== null;
  const isEditing = selectedPuntoId !== null;

  // Implantation rules: 1 hotspot per torre
  const isImplantacionMultiTorre = tipo === "implantacion" && isMultiTorre;
  const usedTorreIds = new Set(
    puntos.filter((p) => p.torre_id).map((p) => p.torre_id as string)
  );
  const allTorresAssigned = isImplantacionMultiTorre && torres.length > 0 && usedTorreIds.size >= torres.length;
  // When editing, the current point's torre_id is "free" for reassignment
  const editingTorreId = isEditing ? puntos.find((p) => p.id === selectedPuntoId)?.torre_id : null;

  /* ── Ctrl+D: duplicate along line ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== "d") return;
      if (puntos.length < 2) return;
      // Block if implantation limit reached
      if (isImplantacionMultiTorre && puntos.length >= torres.length) return;
      e.preventDefault();

      const sorted = [...puntos].sort((a, b) => a.orden - b.orden);
      const p1 = sorted[sorted.length - 2];
      const p2 = sorted[sorted.length - 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const newX = Math.max(0, Math.min(100, p2.x + dx));
      const newY = Math.max(0, Math.min(100, p2.y + dy));

      setSelectedPuntoId(null);
      setPreviewDot({ x: newX, y: newY });
      setFormTitulo("");
      setFormDescripcion("");
      setFormImagenUrl("");
      setFormRenderUrl("");
      setFormFachadaId("");
      setFormTorreId("");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [puntos, isImplantacionMultiTorre, torres.length]);

  /* ══════════════════════════════════════════════════════════════════
     RENDER — Side-by-side: image left, panel right
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* ═══ LEFT: Image Canvas ═══ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Hint */}
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] mb-2 shrink-0">
          <MapPin size={11} className="text-[var(--site-primary)] shrink-0" />
          {allTorresAssigned
            ? t("planoHotspot.allTorresAssigned")
            : t("planoHotspot.clickToAdd")}
          {puntos.length >= 2 && (
            <span className="ml-auto text-[var(--text-muted)] flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[var(--surface-3)] text-[8px] font-mono">Ctrl+D</kbd>
              <span className="text-[9px]">{t("planoHotspot.duplicateHint")}</span>
            </span>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className={cn(
            "relative flex-1 min-h-0 select-none",
            dragging ? "cursor-grabbing" : "cursor-crosshair"
          )}
          style={{ aspectRatio: imageAspectRatio }}
          onClick={handleContainerClick}
        >
          <div className="absolute inset-0 rounded-xl overflow-hidden border border-[var(--border-default)] bg-[var(--surface-2)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imagenUrl}
              alt={t("planoHotspot.interactivePlan")}
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
              onLoad={() => {
                if (imgRef.current) {
                  const { naturalWidth, naturalHeight } = imgRef.current;
                  if (naturalWidth && naturalHeight) {
                    setImageAspectRatio(`${naturalWidth}/${naturalHeight}`);
                    // useHotspotCanvas hook handles resize/load updates internally
                  }
                }
              }}
            />
          </div>

          {/* Axis lock guide line during Shift+drag */}
          {dragging && axisLock && (() => {
            const dragPos = dragPositions.get(dragging.puntoId);
            if (!dragPos) return null;
            const bounds = getImageBounds();
            if (!bounds) return null;
            const { imgW, imgH, offsetX, offsetY } = bounds;
            if (axisLock === "x") {
              // Horizontal line at locked Y
              const top = offsetY + (dragging.origY / 100) * imgH;
              return (
                <div
                  className="absolute pointer-events-none z-[5]"
                  style={{
                    left: offsetX,
                    top,
                    width: imgW,
                    height: 0,
                    borderTop: "1px dashed rgba(var(--site-primary-rgb), 0.4)",
                  }}
                />
              );
            } else {
              // Vertical line at locked X
              const left = offsetX + (dragging.origX / 100) * imgW;
              return (
                <div
                  className="absolute pointer-events-none z-[5]"
                  style={{
                    left,
                    top: offsetY,
                    width: 0,
                    height: imgH,
                    borderLeft: "1px dashed rgba(var(--site-primary-rgb), 0.4)",
                  }}
                />
              );
            }
          })()}

          {/* Existing dots */}
          {sortedPuntos.map((punto, index) => {
            const pos = getPuntoPos(punto);
            const px = toPx(pos.x, pos.y);
            if (!px) return null;
            const isSelected = selectedPuntoId === punto.id;
            const isHovered = hoveredId === punto.id;
            const isDragging = dragging?.puntoId === punto.id;

            return (
              <div
                key={punto.id}
                data-hotspot
                className={cn(
                  "absolute flex items-center justify-center transition-shadow",
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                )}
                style={{
                  left: px.left,
                  top: px.top,
                  transform: "translate(-50%, -50%)",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "var(--site-primary)",
                  border: isSelected ? "3px solid white" : "2px solid rgba(0,0,0,0.4)",
                  boxShadow: isSelected
                    ? "0 0 0 4px rgba(var(--site-primary-rgb),0.4), 0 2px 8px rgba(0,0,0,0.5)"
                    : isHovered
                      ? "0 0 0 4px rgba(var(--site-primary-rgb),0.25), 0 2px 8px rgba(0,0,0,0.4)"
                      : "0 2px 6px rgba(0,0,0,0.4)",
                  zIndex: isSelected || isHovered || isDragging ? 20 : 10,
                  pointerEvents: dragging && !isDragging ? "none" : "auto",
                }}
                onMouseDown={(e) => handleDotMouseDown(e, punto)}
                onMouseEnter={() => setHoveredId(punto.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <span className="text-[11px] font-bold text-[#141414] select-none pointer-events-none">
                  {index + 1}
                </span>
                {(isHovered || isSelected) && !isDragging && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-black/90 backdrop-blur-sm text-white text-[10px] rounded-md whitespace-nowrap pointer-events-none z-30 max-w-[200px] truncate">
                    {getTooltip(punto)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Preview dot (green pulsing) */}
          {previewDot && (() => {
            const px = toPx(previewDot.x, previewDot.y);
            if (!px) return null;
            return (
              <div
                data-hotspot
                className="absolute z-20"
                style={{ left: px.left, top: px.top, transform: "translate(-50%, -50%)" }}
              >
                <div className="absolute inset-0 w-8 h-8 -m-1 rounded-full bg-green-500/20 animate-ping" />
                <div
                  className="relative w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"
                  style={{
                    backgroundColor: "#22c55e",
                    boxShadow: "0 0 0 4px rgba(34,197,94,0.3), 0 2px 8px rgba(0,0,0,0.5)",
                  }}
                >
                  <span className="text-[10px] font-bold text-white select-none">+</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ═══ RIGHT: Sidebar Panel ═══ */}
      <div className="w-[320px] shrink-0 flex flex-col min-h-0 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
        {/* Scrollable container for all content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Form section */}
          <AnimatePresence mode="wait">
            {showForm ? (
              <motion.div
                key={isEditing ? `edit-${selectedPuntoId}` : "new"}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                className="p-4 border-b border-[var(--border-subtle)] space-y-3 bg-[var(--surface-2)]"
              >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                  {isEditing ? t("planoHotspot.editPoint") : t("planoHotspot.newPoint")}
                </span>
                <button
                  onClick={resetForm}
                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {t("planoHotspot.cancel")}
                </button>
              </div>

              {/* Urbanismo/Implantaciones: title + description + render upload */}
              {tipo === "urbanismo" ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                    placeholder={t("planoHotspot.title")}
                    className={cn(inputClass, "text-xs !py-1.5")}
                  />
                  <textarea
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    placeholder={t("planoHotspot.descriptionOptional")}
                    rows={2}
                    className={cn(inputClass, "resize-none text-xs !py-1.5")}
                  />
                  <div>
                    <label className={cn(labelClass, "!text-[10px] !mb-1")}>
                      {t("planos.renderLabel")}
                    </label>
                    <FileUploader
                      currentUrl={formRenderUrl || null}
                      onUpload={(url) => setFormRenderUrl(url)}
                      folder={uploadFolder}
                      label={t("planos.renderLabel")}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <input
                      type="text"
                      value={formTitulo}
                      onChange={(e) => setFormTitulo(e.target.value)}
                      placeholder={t("planoHotspot.pointName")}
                      className={cn(inputClass, "text-xs !py-1.5")}
                    />
                  </div>
                  <div>
                    <label className={cn(labelClass, "!text-[10px] !mb-1")}>
                      {isMultiTorre ? t("planoHotspot.towerLabel") : t("planoHotspot.fachadaOrTower")}
                    </label>
                    {isMultiTorre ? (
                      <NodDoDropdown
                        variant="form"
                        size="sm"
                        value={formTorreId}
                        onChange={(val) => { setFormTorreId(val); setFormFachadaId(""); }}
                        placeholder={`— ${t("planoHotspot.selectTower")} —`}
                        error={isImplantacionMultiTorre && !formTorreId ? " " : undefined}
                        options={[
                          { value: "", label: `— ${t("planoHotspot.selectTower")} —` },
                          ...torres.map((torre) => {
                            const isUsed = usedTorreIds.has(torre.id) && torre.id !== editingTorreId;
                            return {
                              value: torre.id,
                              label: `${torre.nombre}${isUsed ? ` (${t("planoHotspot.assigned")})` : ""}`,
                              disabled: isUsed,
                            };
                          }),
                        ]}
                      />
                    ) : (
                      <NodDoDropdown
                        variant="form"
                        size="sm"
                        value={formFachadaId}
                        onChange={(val) => { setFormFachadaId(val); setFormTorreId(""); }}
                        placeholder={t("planoHotspot.unassigned")}
                        options={[
                          { value: "", label: t("planoHotspot.unassigned") },
                          ...fachadas.map((fachada) => ({ value: fachada.id, label: fachada.nombre })),
                        ]}
                      />
                    )}
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={isEditing ? handleSaveEdit : handleSaveNew}
                  disabled={saving || !formTitulo.trim() || (isImplantacionMultiTorre && !isEditing && !formTorreId)}
                  className={cn(btnPrimary, "!text-xs !py-1.5 !px-3")}
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : isEditing ? t("planoHotspot.save") : t("planoHotspot.add")}
                </button>
                {isEditing && (
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className={cn(btnDanger, "!text-xs !py-1.5 !px-3")}
                  >
                    {saving ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 border-b border-[var(--border-subtle)] shrink-0"
            >
              <p className="text-[10px] text-[var(--text-muted)] text-center">
                {t("planoHotspot.clickOnPlanOrPoint")}
              </p>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Points list section */}
          <div className="p-4">
            {sortedPuntos.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                    {t("planoHotspot.pointCount", { count: String(sortedPuntos.length) })}
                  </p>
                  <span className="text-[9px] text-[var(--text-tertiary)]">
                    {sortedPuntos.length}/{tipo === "implantacion" && isMultiTorre ? torres.length : "∞"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {sortedPuntos.map((punto, index) => {
                    const isSelected = selectedPuntoId === punto.id;
                    const subtitle = tipo === "implantacion"
                      ? isMultiTorre && punto.torre_id
                        ? torreMap.get(punto.torre_id)?.nombre
                        : punto.fachada_id
                          ? fachadaMap.get(punto.fachada_id)?.nombre
                          : null
                      : punto.descripcion;

                    return (
                      <button
                        key={punto.id}
                        onClick={() => selectPunto(punto)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all",
                          isSelected
                            ? "bg-[rgba(var(--site-primary-rgb),0.12)] ring-1 ring-[rgba(var(--site-primary-rgb),0.35)]"
                            : "hover:bg-[var(--surface-3)]"
                        )}
                      >
                        {/* Number badge */}
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-[#141414] shrink-0"
                          style={{ backgroundColor: "var(--site-primary)" }}
                        >
                          {index + 1}
                        </span>
                        {/* Render thumbnail */}
                        {tipo === "urbanismo" && punto.render_url && (
                          <Image src={punto.render_url} alt="undefined" width={400} height={300} className="w-10 h-10 rounded object-cover shrink-0" />
                        )}
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--text-primary)] font-medium truncate">
                            {punto.titulo}
                          </p>
                          {subtitle && (
                            <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                              {subtitle}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <MapPin size={24} className="text-[var(--text-muted)] mb-2 opacity-40" />
                <p className="text-[10px] text-[var(--text-muted)] text-center">
                  {t("planoHotspot.noPoints")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
