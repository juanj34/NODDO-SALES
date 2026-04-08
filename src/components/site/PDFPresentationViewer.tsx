"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Download,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
} from "lucide-react";
import { CloseButton } from "@/components/ui/CloseButton";
import { trackEvent } from "@/lib/tracking";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PDFPresentationViewerProps {
  url: string;
  onClose: () => void;
  title?: string;
  projectId: string;
  trackingEvent?: string;
  trackingMeta?: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Animation variants (Lightbox pattern)                              */
/* ------------------------------------------------------------------ */

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 400 : -400,
    opacity: 0,
    scale: 0.92,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    x: dir < 0 ? 400 : -400,
    opacity: 0,
    scale: 0.92,
  }),
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PDFPresentationViewer({
  url,
  onClose,
  title,
  projectId,
  trackingEvent = "pdf_download",
  trackingMeta,
}: PDFPresentationViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [pageAspect, setPageAspect] = useState(0.75); // height/width — default portrait

  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* ── Page dimensions ─────────────────────────────────────── */

  const pageDimensions = useMemo(() => {
    // Available area: full viewport minus top bar (56px) and bottom bar (80px)
    const padding = 136; // top + bottom bars
    const margin = 48; // horizontal margin
    const availW = (typeof window !== "undefined" ? window.innerWidth : 1200) - margin;
    const availH = (typeof window !== "undefined" ? window.innerHeight : 800) - padding;

    // Fit page within available area preserving aspect ratio
    let w = availW;
    let h = w * pageAspect;
    if (h > availH) {
      h = availH;
      w = h / pageAspect;
    }
    return { width: Math.round(w), height: Math.round(h) };
  }, [pageAspect]);

  /* ── Navigation ──────────────────────────────────────────── */

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentPage((p) => Math.min(p + 1, numPages));
  }, [numPages]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, []);

  /* ── Controls auto-hide ──────────────────────────────────── */

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [showControls]);

  /* ── Fullscreen ──────────────────────────────────────────── */

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      const el = containerRef.current as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };
      (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.());
    } else {
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>;
      };
      (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, []);

  /* ── Keyboard ────────────────────────────────────────────── */

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      showControls();
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          goPrev();
          break;
        case "Escape":
          if (isFullscreen) {
            document.exitFullscreen?.();
          } else {
            onClose();
          }
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose, isFullscreen, toggleFullscreen, showControls]);

  /* ── Resize listener ─────────────────────────────────────── */

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const onResize = () => forceUpdate((n) => n + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Handlers ────────────────────────────────────────────── */

  const handleDownload = useCallback(() => {
    trackEvent(projectId, trackingEvent, undefined, trackingMeta);
    window.open(url, "_blank", "noopener,noreferrer");
  }, [url, projectId, trackingEvent, trackingMeta]);

  const handleFirstPageRender = useCallback(
    (page: { width: number; height: number }) => {
      if (page.width > 0 && page.height > 0) {
        setPageAspect(page.height / page.width);
      }
    },
    []
  );

  /* ── Preload pages (current ± 1) ────────────────────────── */

  const preloadPages = useMemo(() => {
    const pages: number[] = [];
    if (currentPage > 1) pages.push(currentPage - 1);
    if (currentPage < numPages) pages.push(currentPage + 1);
    return pages;
  }, [currentPage, numPages]);

  /* ── Progress ────────────────────────────────────────────── */

  const progress = numPages > 0 ? (currentPage / numPages) * 100 : 0;

  /* ── Thumbnail pages ─────────────────────────────────────── */

  const allPages = useMemo(
    () => Array.from({ length: numPages }, (_, i) => i + 1),
    [numPages]
  );

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex flex-col bg-[var(--surface-0)] select-none"
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      {/* ── Top bar ─────────────────────────────────────────── */}
      <motion.div
        initial={false}
        animate={{ opacity: controlsVisible ? 1 : 0, y: controlsVisible ? 0 : -20 }}
        transition={{ duration: 0.3 }}
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3 bg-[var(--surface-0)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]"
        style={{ pointerEvents: controlsVisible ? "auto" : "none" }}
      >
        <span className="text-[var(--text-secondary)] text-sm tracking-wider font-mono min-w-[60px]">
          {isLoading ? "..." : `${currentPage} / ${numPages}`}
        </span>

        {title && (
          <span className="text-[var(--text-secondary)] text-xs tracking-[0.15em] uppercase font-ui truncate max-w-[40%] text-center">
            {title}
          </span>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--site-primary)] transition-colors cursor-pointer"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button
            onClick={handleDownload}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--site-primary)] transition-colors cursor-pointer"
            aria-label="Download PDF"
          >
            <Download size={18} />
          </button>
          <CloseButton onClick={onClose} variant="glass" size={20} showEsc={false} />
        </div>
      </motion.div>

      {/* ── Main slide area ─────────────────────────────────── */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {hasError ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="glass-card w-20 h-20 flex items-center justify-center">
              <FileText size={32} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-tertiary)] text-sm">
              No se pudo cargar el documento
            </p>
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              setIsLoading(false);
            }}
            onLoadError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
            loading={
              <div className="flex items-center justify-center">
                <Loader2
                  className="animate-spin text-[var(--site-primary)]"
                  size={32}
                />
              </div>
            }
          >
            {/* Visible current page */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPage}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-center justify-center"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={(_e, info) => {
                  if (info.offset.x < -80 && currentPage < numPages) goNext();
                  else if (info.offset.x > 80 && currentPage > 1) goPrev();
                }}
              >
                <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-[var(--border-subtle)]">
                  <Page
                    pageNumber={currentPage}
                    width={pageDimensions.width}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onRenderSuccess={(page) => {
                      if (currentPage === 1) handleFirstPageRender(page);
                    }}
                    loading={
                      <div
                        className="flex items-center justify-center bg-[var(--surface-2)]"
                        style={{
                          width: pageDimensions.width,
                          height: pageDimensions.height,
                        }}
                      >
                        <Loader2
                          className="animate-spin text-[var(--site-primary)]"
                          size={28}
                        />
                      </div>
                    }
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Preloaded adjacent pages (hidden) */}
            <div className="sr-only" aria-hidden="true">
              {preloadPages.map((p) => (
                <Page
                  key={`preload-${p}`}
                  pageNumber={p}
                  width={pageDimensions.width}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              ))}
            </div>
          </Document>
        )}

        {/* ── Prev / Next buttons ───────────────────────────── */}
        {numPages > 1 && !hasError && (
          <>
            <motion.button
              initial={false}
              animate={{ opacity: controlsVisible ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              onClick={goPrev}
              disabled={currentPage === 1}
              className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center glass rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all cursor-pointer"
              style={{ pointerEvents: controlsVisible ? "auto" : "none" }}
            >
              <ChevronLeft size={24} />
            </motion.button>
            <motion.button
              initial={false}
              animate={{ opacity: controlsVisible ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              onClick={goNext}
              disabled={currentPage === numPages}
              className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center glass rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all cursor-pointer"
              style={{ pointerEvents: controlsVisible ? "auto" : "none" }}
            >
              <ChevronRight size={24} />
            </motion.button>
          </>
        )}
      </div>

      {/* ── Bottom bar: progress + thumbnails ───────────────── */}
      <motion.div
        initial={false}
        animate={{ opacity: controlsVisible ? 1 : 0, y: controlsVisible ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        className="relative z-20"
        style={{ pointerEvents: controlsVisible ? "auto" : "none" }}
      >
        {/* Progress bar */}
        <div className="h-[2px] bg-white/5 w-full">
          <motion.div
            className="h-full bg-[var(--site-primary)]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>

        {/* Thumbnail strip */}
        {numPages > 1 && numPages <= 30 && (
          <div className="px-6 py-3 flex items-center justify-center gap-1.5 overflow-x-auto scrollbar-hide bg-[var(--surface-0)]/80 backdrop-blur-xl">
            {allPages.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setDirection(p > currentPage ? 1 : -1);
                  setCurrentPage(p);
                }}
                className={`flex-shrink-0 transition-all duration-200 cursor-pointer rounded-md ${
                  p === currentPage
                    ? "w-8 h-1.5 bg-[var(--site-primary)] scale-110"
                    : "w-4 h-1.5 bg-white/10 hover:bg-white/25"
                }`}
                aria-label={`Page ${p}`}
              />
            ))}
          </div>
        )}

        {/* For large PDFs, show just the counter */}
        {numPages > 30 && (
          <div className="px-6 py-3 flex items-center justify-center bg-[var(--surface-0)]/80 backdrop-blur-xl">
            <span className="text-[var(--text-tertiary)] text-xs font-mono tracking-wider">
              {currentPage} / {numPages}
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
