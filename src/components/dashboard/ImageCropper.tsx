"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { motion } from "framer-motion";
import { Crop, X, ZoomIn, ZoomOut } from "lucide-react";
import { getCroppedImg } from "@/lib/crop-image";

interface ImageCropperProps {
  imageSrc: string;
  aspect: number;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropper({
  imageSrc,
  aspect,
  onCrop,
  onCancel,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCrop(blob);
    } catch {
      // fallback: pass original
      onCancel();
    } finally {
      setProcessing(false);
    }
  };

  const aspectLabel =
    aspect === 1
      ? "1:1"
      : aspect === 16 / 9
      ? "16:9"
      : aspect === 4 / 3
      ? "4:3"
      : `${aspect.toFixed(1)}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[var(--surface-0)] backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <Crop size={16} className="text-[var(--site-primary)]" />
          <span className="text-sm text-[var(--text-primary)]">
            Recortar imagen
            <span className="ml-2 text-xs text-[var(--text-tertiary)]">({aspectLabel})</span>
          </span>
        </div>
        <button
          onClick={onCancel}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Cropper area */}
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: "#0a0a0a" }, // theme-allow: scrim over image being cropped
            cropAreaStyle: { border: "2px solid var(--site-primary)" },
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-0)]">
        {/* Zoom slider */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <ZoomOut size={14} className="text-[var(--text-tertiary)] shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 sm:w-32 accent-noddo-primary"
          />
          <ZoomIn size={14} className="text-[var(--text-tertiary)] shrink-0" />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs text-[var(--text-secondary)] border border-[var(--border-default)] rounded-lg hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--site-primary)] text-black rounded-lg text-xs font-medium hover:brightness-110 transition-all disabled:opacity-50" /* // theme-allow: dark text on gold */
          >
            <Crop size={14} />
            {processing ? "Procesando..." : "Recortar y subir"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
