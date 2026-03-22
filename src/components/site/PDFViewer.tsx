"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Download, Loader2, FileText } from "lucide-react";
import { CloseButton } from "@/components/ui/CloseButton";
import { trackEvent } from "@/lib/tracking";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PDFViewerProps {
  url: string;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

const slideVariants = {
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

export function PDFViewer({ url, onClose, projectId, projectName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pageWidth, setPageWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goNext = useCallback(() => {
    if (currentPage < numPages) {
      setDirection(1);
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, numPages]);

  const goPrev = useCallback(() => {
    if (currentPage > 1) {
      setDirection(-1);
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  // Responsive page sizing
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Fit PDF to viewport: prioritize height, clamp to width
      const heightBased = (rect.height - 32) / 1.414;
      const widthBased = rect.width - 128;
      setPageWidth(Math.min(heightBased, widthBased, 1200));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) goNext();
    else if (diff < -50) goPrev();
  };

  const handleDownload = useCallback(() => {
    trackEvent(projectId, "brochure_download");
    window.open(url, "_blank", "noopener,noreferrer");
  }, [url, projectId]);

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
        <span className="text-[var(--text-secondary)] text-sm tracking-wider font-mono">
          {isLoading ? "..." : `${currentPage} / ${numPages}`}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--site-primary)] transition-colors cursor-pointer"
            aria-label="Download PDF"
          >
            <Download size={18} />
          </button>
          <CloseButton onClick={onClose} variant="glass" size={20} />
        </div>
      </div>

      {/* Main PDF area */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center px-16 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Prev button */}
        <button
          onClick={goPrev}
          disabled={currentPage <= 1}
          className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center glass rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all cursor-pointer"
        >
          <ChevronLeft size={24} />
        </button>

        {/* PDF Document */}
        {hasError ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="glass-card w-20 h-20 flex items-center justify-center">
              <FileText size={32} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-tertiary)] text-sm">
              No se pudo cargar el brochure
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
                <Loader2 className="animate-spin text-[var(--site-primary)]" size={32} />
              </div>
            }
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPage}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex items-center justify-center"
              >
                <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-[var(--border-subtle)]">
                  <Page
                    pageNumber={currentPage}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div
                        className="flex items-center justify-center bg-[var(--surface-2)]"
                        style={{ width: pageWidth, height: pageWidth * 1.414 }}
                      >
                        <Loader2 className="animate-spin text-[var(--site-primary)]" size={24} />
                      </div>
                    }
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Prefetch adjacent pages (hidden) */}
            <div className="absolute opacity-0 pointer-events-none overflow-hidden w-0 h-0" aria-hidden="true">
              {currentPage > 1 && (
                <Page pageNumber={currentPage - 1} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
              )}
              {currentPage < numPages && (
                <Page pageNumber={currentPage + 1} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
              )}
            </div>
          </Document>
        )}

        {/* Next button */}
        <button
          onClick={goNext}
          disabled={currentPage >= numPages}
          className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center glass rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all cursor-pointer"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </motion.div>
  );
}
