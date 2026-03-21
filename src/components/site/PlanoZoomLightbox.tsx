"use client";

import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Minimize2 } from "lucide-react";
import { CloseButton } from "@/components/ui/CloseButton";
import type { LightboxImage } from "@/types";

interface PlanoZoomLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.3;
const DOUBLE_CLICK_SCALE = 2.5;

export function PlanoZoomLightbox({
  images,
  initialIndex = 0,
  onClose,
}: PlanoZoomLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);

  const current = images[currentIndex];

  // --- Clamp translate so image doesn't drift out of view ---
  const clampTranslate = useCallback(
    (tx: number, ty: number, s: number) => {
      if (s <= 1) return { x: 0, y: 0 };
      const container = containerRef.current;
      const img = imageRef.current;
      if (!container || !img) return { x: tx, y: ty };

      const cRect = container.getBoundingClientRect();
      const iRect = img.getBoundingClientRect();

      // Natural dimensions of the displayed image (before scale)
      const naturalW = iRect.width / scale;
      const naturalH = iRect.height / scale;

      const scaledW = naturalW * s;
      const scaledH = naturalH * s;

      const maxTx = Math.max(0, (scaledW - cRect.width) / 2 / s);
      const maxTy = Math.max(0, (scaledH - cRect.height) / 2 / s);

      return {
        x: Math.max(-maxTx, Math.min(maxTx, tx)),
        y: Math.max(-maxTy, Math.min(maxTy, ty)),
      };
    },
    [scale],
  );

  // --- Zoom centered on a specific point ---
  const zoomAt = useCallback(
    (clientX: number, clientY: number, newScale: number) => {
      const img = imageRef.current;
      if (!img) return;

      const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
      if (clamped === MIN_SCALE) {
        setScale(MIN_SCALE);
        setTranslate({ x: 0, y: 0 });
        return;
      }

      const rect = img.getBoundingClientRect();
      // Cursor position relative to the image center (in screen coords)
      const cx = clientX - (rect.left + rect.width / 2);
      const cy = clientY - (rect.top + rect.height / 2);

      // Adjust translate so the point under cursor stays fixed
      const ratio = 1 - clamped / scale;
      const newTx = translate.x + (cx * ratio) / scale;
      const newTy = translate.y + (cy * ratio) / scale;

      setScale(clamped);
      setTranslate(clampTranslate(newTx, newTy, clamped));
    },
    [scale, translate, clampTranslate],
  );

  // --- Wheel zoom ---
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      zoomAt(e.clientX, e.clientY, scale + delta);
    },
    [scale, zoomAt],
  );

  // --- Double click: zoom in or reset ---
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (scale > 1.1) {
        setScale(MIN_SCALE);
        setTranslate({ x: 0, y: 0 });
      } else {
        zoomAt(e.clientX, e.clientY, DOUBLE_CLICK_SCALE);
      }
    },
    [scale, zoomAt],
  );

  // --- Pointer pan ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (scale <= 1) return;
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      translateStart.current = { ...translate };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [scale, translate],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      const dx = (e.clientX - panStart.current.x) / scale;
      const dy = (e.clientY - panStart.current.y) / scale;
      setTranslate(
        clampTranslate(
          translateStart.current.x + dx,
          translateStart.current.y + dy,
          scale,
        ),
      );
    },
    [isPanning, scale, clampTranslate],
  );

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // --- Touch pinch-to-zoom ---
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 2) {
        lastPinchDist.current = null;
        return;
      }
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;

      if (lastPinchDist.current !== null) {
        const delta = (dist - lastPinchDist.current) * 0.008;
        zoomAt(centerX, centerY, scale + delta);
      }
      lastPinchDist.current = dist;
    },
    [scale, zoomAt],
  );

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
  }, []);

  // --- Keyboard ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
          if (currentIndex < images.length - 1) {
            setCurrentIndex((i) => i + 1);
            resetZoom();
          }
          break;
        case "ArrowLeft":
          if (currentIndex > 0) {
            setCurrentIndex((i) => i - 1);
            resetZoom();
          }
          break;
        case "+":
        case "=":
          setScale((s) => Math.min(MAX_SCALE, s + ZOOM_STEP));
          break;
        case "-":
          zoomOut();
          break;
        case "0":
          resetZoom();
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, images.length, onClose]);

  const resetZoom = () => {
    setScale(MIN_SCALE);
    setTranslate({ x: 0, y: 0 });
  };

  const zoomInBtn = () => {
    setScale((s) => Math.min(MAX_SCALE, s + ZOOM_STEP));
  };

  const zoomOut = () => {
    const newScale = Math.max(MIN_SCALE, scale - ZOOM_STEP);
    setScale(newScale);
    if (newScale <= 1) setTranslate({ x: 0, y: 0 });
    else setTranslate(clampTranslate(translate.x, translate.y, newScale));
  };

  const goToImage = (idx: number) => {
    setCurrentIndex(idx);
    resetZoom();
  };

  const isZoomed = scale > 1.05;
  const zoomPercent = Math.round(scale * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex flex-col"
      style={{ backgroundColor: "rgba(var(--overlay-rgb), 0.98)" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {images.length > 1 && (
            <span className="text-[var(--text-secondary)] text-sm tracking-wider">
              {currentIndex + 1} / {images.length}
            </span>
          )}
          {current.label && (
            <span className="text-[var(--text-primary)] text-sm font-medium tracking-wide">
              {current.label}
            </span>
          )}
        </div>
        <CloseButton onClick={onClose} variant="glass" size={20} />
      </div>

      {/* Main image area */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{
          cursor: isZoomed
            ? isPanning
              ? "grabbing"
              : "grab"
            : "zoom-in",
        }}
        onWheel={handleWheel}
      >
        {/* Prev button */}
        {images.length > 1 && (
          <button
            onClick={() => goToImage(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="absolute left-4 z-20 w-12 h-12 flex items-center justify-center glass rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Zoomable image */}
        <div
          className="relative select-none"
          style={{
            transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
            willChange: "transform",
            transition: isPanning ? "none" : "transform 0.15s ease-out",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            ref={imageRef}
            src={current.url}
            alt={current.alt_text || ""}
            width={1920}
            height={1080}
            className="max-w-[85vw] max-h-[calc(100vh-180px)] object-contain rounded-lg pointer-events-none"
            draggable={false}
            priority
          />
        </div>

        {/* Next button */}
        {images.length > 1 && (
          <button
            onClick={() => goToImage(Math.min(images.length - 1, currentIndex + 1))}
            disabled={currentIndex === images.length - 1}
            className="absolute right-4 z-20 w-12 h-12 flex items-center justify-center glass rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all cursor-pointer"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Zoom controls — bottom-left */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 glass rounded-xl px-1 py-1">
          <button
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>

          <span className="w-12 text-center text-xs font-mono text-[var(--text-secondary)] tabular-nums select-none">
            {zoomPercent}%
          </span>

          <button
            onClick={zoomInBtn}
            disabled={scale >= MAX_SCALE}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>

          {isZoomed && (
            <button
              onClick={resetZoom}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Reset zoom"
            >
              <Minimize2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Thumbnail strip — only when multiple images */}
      {images.length > 1 && (
        <div className="px-6 py-4 flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => goToImage(idx)}
              className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-[3px] transition-all cursor-pointer ${
                idx === currentIndex
                  ? "border-[var(--site-primary)] opacity-100 scale-105"
                  : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              <Image
                src={img.thumbnail_url || img.url}
                alt={img.alt_text || ""}
                width={64}
                height={48}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
