"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GaleriaImagen } from "@/types";

interface LightboxProps {
  images: GaleriaImagen[];
  initialIndex?: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex = 0, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);

  const goNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, images.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const current = images[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/95 flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-white/50 text-sm tracking-wider">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main image area */}
      <div className="flex-1 relative flex items-center justify-center px-16 overflow-hidden">
        {/* Prev button */}
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center text-white/30 hover:text-white disabled:opacity-20 transition-all"
        >
          <ChevronLeft size={32} />
        </button>

        {/* Image */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.img
            key={current.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            src={current.url}
            alt={current.alt_text || ""}
            className="max-w-full max-h-[calc(100vh-200px)] object-contain"
          />
        </AnimatePresence>

        {/* Next button */}
        <button
          onClick={goNext}
          disabled={currentIndex === images.length - 1}
          className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center text-white/30 hover:text-white disabled:opacity-20 transition-all"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="px-6 py-4 flex items-center justify-center gap-2 overflow-x-auto">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all ${
              idx === currentIndex
                ? "border-[var(--site-primary)] opacity-100"
                : "border-transparent opacity-40 hover:opacity-70"
            }`}
          >
            <img
              src={img.thumbnail_url || img.url}
              alt={img.alt_text || ""}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
