"use client";

import { useState, useRef } from "react";
import type { TipologiaHotspot } from "@/types";
import { resolveHotspotImages, syncRenderUrl } from "@/lib/hotspot-utils";
import { useHotspotCanvas } from "@/hooks/useHotspotCanvas";
import { inputClass, labelClass, btnPrimary, btnSecondary, btnDanger } from "./editor-styles";
import { Plus, X, Trash2, Check, MousePointerClick, ChevronUp, ChevronDown, Images, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/i18n";
import { useUploads } from "@/contexts/UploadContext";

/* ── Multi-image list (reusable within this file) ── */
function ImageListPanel({
  images,
  onChange,
  uploadFolder,
  uploadLabel,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  uploadFolder: string;
  uploadLabel: string;
}) {
  const { t } = useTranslation("editor");
  const { queueUploads } = useUploads();
  const inputRef = useRef<HTMLInputElement>(null);

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...images];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };
  const moveDown = (i: number) => {
    if (i === images.length - 1) return;
    const next = [...images];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  };
  const remove = (i: number) => {
    onChange(images.filter((_, idx) => idx !== i));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Filter to only images
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    // Queue uploads in background
    queueUploads(imageFiles, (results) => {
      // When uploads complete, add URLs to images array
      onChange([...images, ...results]);
    }, uploadFolder);

    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label className={labelClass}>
        <span className="flex items-center gap-1.5">
          <Images size={11} />
          {t("hotspotEditor.images")} ({images.length})
        </span>
      </label>

      {images.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)]"
            >
              <div className="relative w-10 h-8 rounded overflow-hidden bg-[var(--surface-2)] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Render ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-[var(--text-tertiary)] min-w-[16px] text-center shrink-0">
                {i + 1}
              </span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-20 transition-colors"
                title={t("hotspotEditor.moveUp")}
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === images.length - 1}
                className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-20 transition-colors"
                title={t("hotspotEditor.moveDown")}
              >
                <ChevronDown size={12} />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-0.5 rounded text-[var(--text-muted)] hover:text-red-400 transition-colors"
                title={t("hotspotEditor.removeImage")}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Background upload button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[var(--border-default)] hover:border-[var(--border-strong)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-tertiary)] transition-all group"
      >
        <Upload size={16} className="group-hover:scale-110 transition-transform" />
        <span className="text-xs">{uploadLabel}</span>
        <span className="text-[10px] text-[var(--text-muted)]">
          (se suben en segundo plano)
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

/* ── Main HotspotEditor ── */

interface HotspotEditorProps {
  imageUrl: string;
  hotspots: TipologiaHotspot[];
  onChange: (hotspots: TipologiaHotspot[]) => void;
  uploadFolder: string;
}

export function HotspotEditor({
  imageUrl,
  hotspots,
  onChange,
  uploadFolder,
}: HotspotEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const { t } = useTranslation("editor");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newHotspot, setNewHotspot] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newRenders, setNewRenders] = useState<string[]>([]);
  const [, setTick] = useState(0);

  // Use shared hotspot canvas hook for image bounds & coordinate conversion
  const { toPercent, toPx } = useHotspotCanvas(containerRef, imgRef);

  const handleImageClick = (e: React.MouseEvent) => {
    if (draggingId) return;
    // Deselect if clicking image with something selected
    if (editingId) {
      setEditingId(null);
      return;
    }
    const { x, y } = toPercent(e.clientX, e.clientY);
    setNewHotspot({ x, y });
    setNewLabel("");
    setNewRenders([]);
  };

  const addHotspot = () => {
    if (!newHotspot || !newLabel.trim()) return;
    const id = crypto.randomUUID();
    onChange([
      ...hotspots,
      {
        id,
        label: newLabel,
        x: newHotspot.x,
        y: newHotspot.y,
        render_url: syncRenderUrl(newRenders),
        renders: newRenders,
      },
    ]);
    setNewHotspot(null);
    setNewLabel("");
    setNewRenders([]);
  };

  const removeHotspot = (id: string) => {
    onChange(hotspots.filter((h) => h.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const updateHotspot = (id: string, updates: Partial<TipologiaHotspot>) => {
    onChange(
      hotspots.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  };

  // Drag handling
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId) return;
    const { x, y } = toPercent(e.clientX, e.clientY);
    updateHotspot(draggingId, { x, y });
  };

  const handlePointerUp = () => {
    setDraggingId(null);
  };

  const handleDotClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNewHotspot(null); // cancel any new hotspot
    setEditingId(editingId === id ? null : id);
  };

  const editingHotspot = editingId ? hotspots.find((h) => h.id === editingId) : null;

  // Resolve images for the editing hotspot (backward compat)
  const editingImages = editingHotspot ? resolveHotspotImages(editingHotspot) : [];

  const handleEditImagesChange = (images: string[]) => {
    if (!editingHotspot) return;
    updateHotspot(editingHotspot.id, {
      renders: images,
      render_url: syncRenderUrl(images),
    });
  };

  return (
    <div className="flex gap-4 h-full">
      {/* ═══ LEFT: Image with hotspot dots ═══ */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <MousePointerClick size={13} className="text-[var(--site-primary)]" />
          <span className="text-xs text-[var(--text-tertiary)]">
            {t("hotspotEditor.clickToAddHotspots")}
          </span>
        </div>

        <div
          ref={containerRef}
          className="relative flex-1 rounded-lg overflow-hidden bg-[var(--surface-2)] cursor-crosshair select-none border border-[var(--border-subtle)]"
          onClick={handleImageClick}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt={t("hotspotEditor.plan")}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
            onLoad={() => requestAnimationFrame(() => setTick((t) => t + 1))}
          />

          {/* Existing hotspots — pixel positioned via toPx() */}
          {hotspots.map((hs, i) => {
            const px = toPx(hs.x, hs.y);
            if (!px) return null;
            const imgCount = resolveHotspotImages(hs).length;
            return (
              <div
                key={hs.id}
                className={`absolute z-10 flex items-center justify-center cursor-grab active:cursor-grabbing ${
                  editingId === hs.id
                    ? "ring-2 ring-[var(--site-primary)] ring-offset-2 ring-offset-transparent"
                    : ""
                }`}
                style={{
                  left: px.left,
                  top: px.top,
                  transform: "translate(-50%, -50%)",
                }}
                onPointerDown={(e) => handlePointerDown(e, hs.id)}
                onClick={(e) => handleDotClick(e, hs.id)}
              >
                <div className={`w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-colors ${
                  editingId === hs.id ? "bg-white" : "bg-[var(--site-primary)]"
                }`}>
                  <span className={`text-[9px] font-bold ${
                    editingId === hs.id ? "text-[var(--site-primary)]" : "text-black"
                  }`}>
                    {i + 1}
                  </span>
                </div>
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 bg-black/80 rounded text-[9px] text-white pointer-events-none flex items-center gap-1">
                  {hs.label}
                  {imgCount > 1 && (
                    <span className="opacity-60">({imgCount})</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* New hotspot preview */}
          {newHotspot && (() => {
            const px = toPx(newHotspot.x, newHotspot.y);
            if (!px) return null;
            return (
              <div
                className="absolute z-20"
                style={{
                  left: px.left,
                  top: px.top,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="w-7 h-7 rounded-full bg-green-500 border-2 border-white shadow-lg animate-pulse flex items-center justify-center">
                  <Plus size={12} className="text-white" />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ═══ RIGHT: Form panel ═══ */}
      <div className="w-[320px] shrink-0 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-lg overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {newHotspot ? (
            /* ── New hotspot form ── */
            <motion.div
              key="new"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col"
            >
              <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-green-500/5">
                <h4 className="text-xs font-ui font-bold uppercase tracking-wide text-green-400 flex items-center gap-2">
                  <Plus size={12} />
                  {t("hotspotEditor.newHotspot")}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  ({newHotspot.x.toFixed(1)}%, {newHotspot.y.toFixed(1)}%)
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div>
                  <label className={labelClass}>{t("hotspotEditor.areaName")}</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder={t("hotspotEditor.areaPlaceholder")}
                    className={inputClass}
                    onKeyDown={(e) => e.key === "Enter" && addHotspot()}
                    autoFocus
                  />
                </div>
                <ImageListPanel
                  images={newRenders}
                  onChange={setNewRenders}
                  uploadFolder={uploadFolder}
                  uploadLabel={t("hotspotEditor.addImage")}
                />
              </div>

              <div className="px-4 py-3 border-t border-[var(--border-subtle)] flex gap-2">
                <button
                  onClick={addHotspot}
                  disabled={!newLabel.trim()}
                  className={btnPrimary}
                >
                  <Check size={14} />
                  {t("hotspotEditor.add")}
                </button>
                <button
                  onClick={() => setNewHotspot(null)}
                  className={btnSecondary}
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ) : editingHotspot ? (
            /* ── Edit existing hotspot ── */
            <motion.div
              key={`edit-${editingId}`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col"
            >
              <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[rgba(var(--site-primary-rgb),0.05)]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-ui font-bold uppercase tracking-wide text-[var(--site-primary)]">
                    {t("hotspotEditor.editingHotspot")}
                  </h4>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div>
                  <label className={labelClass}>{t("hotspotEditor.name")}</label>
                  <input
                    type="text"
                    value={editingHotspot.label}
                    onChange={(e) =>
                      updateHotspot(editingHotspot.id, { label: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("hotspotEditor.position")}</label>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    ({editingHotspot.x.toFixed(1)}%, {editingHotspot.y.toFixed(1)}%) — {t("hotspotEditor.dragToMove")}
                  </p>
                </div>
                <ImageListPanel
                  images={editingImages}
                  onChange={handleEditImagesChange}
                  uploadFolder={uploadFolder}
                  uploadLabel={t("hotspotEditor.addImage")}
                />
              </div>

              <div className="px-4 py-3 border-t border-[var(--border-subtle)] flex gap-2">
                <button
                  onClick={() => setEditingId(null)}
                  className={btnSecondary}
                >
                  <Check size={14} />
                  {t("hotspotEditor.done")}
                </button>
                <button
                  onClick={() => removeHotspot(editingHotspot.id)}
                  className={btnDanger}
                >
                  <Trash2 size={12} />
                  {t("hotspotEditor.delete")}
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── Hotspot list (default state) ── */
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col"
            >
              <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <h4 className="text-xs font-ui font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                  Hotspots ({hotspots.length})
                </h4>
              </div>

              <div className="flex-1 overflow-y-auto">
                {hotspots.length > 0 ? (
                  <div className="py-1">
                    {hotspots.map((hs, i) => {
                      const imgs = resolveHotspotImages(hs);
                      return (
                        <button
                          key={hs.id}
                          onClick={() => setEditingId(hs.id)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors text-left group"
                        >
                          <span className="w-5 h-5 rounded-full bg-[rgba(var(--site-primary-rgb),0.2)] flex items-center justify-center text-[10px] text-[var(--site-primary)] font-bold shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[var(--text-secondary)] truncate">{hs.label}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              ({hs.x.toFixed(0)}%, {hs.y.toFixed(0)}%)
                              {imgs.length > 0 && (
                                <span className="ml-1.5">
                                  <Images size={9} className="inline -mt-px mr-0.5" />
                                  {imgs.length}
                                </span>
                              )}
                            </p>
                          </div>
                          {imgs.length > 0 && (
                            <div className="flex -space-x-1 shrink-0">
                              {imgs.slice(0, 3).map((url, idx) => (
                                <div key={idx} className="relative w-7 h-5 rounded overflow-hidden bg-[var(--surface-3)] border border-[var(--surface-1)]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt={hs.label} className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <MousePointerClick size={20} className="text-[var(--text-muted)] mb-2" />
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {t("hotspotEditor.noHotspots")}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      {t("hotspotEditor.clickToAdd")}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
