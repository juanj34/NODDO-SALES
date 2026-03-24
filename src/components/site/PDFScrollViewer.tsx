"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";
import { Download, Loader2, FileText } from "lucide-react";
import { CloseButton } from "@/components/ui/CloseButton";
import { trackEvent } from "@/lib/tracking";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PDFScrollViewerProps {
  url: string;
  onClose: () => void;
  title?: string;
  projectId: string;
  trackingEvent?: string;
  trackingMeta?: Record<string, string>;
}

export function PDFScrollViewer({
  url,
  onClose,
  title,
  projectId,
  trackingEvent = "pdf_download",
  trackingMeta,
}: PDFScrollViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pageWidth, setPageWidth] = useState(800);
  const [pageAspect, setPageAspect] = useState(9 / 16); // default 16:9 landscape
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([1, 2, 3]));

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibilityObserverRef = useRef<IntersectionObserver | null>(null);
  const rafRef = useRef<number>(0);

  // Calculate page width based on container
  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      // Leave padding for the scroll container
      setPageWidth(Math.min(w - 48, 1400));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Keyboard: Escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lazy loading observer — load pages as they approach viewport
  useEffect(() => {
    if (numPages === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const toLoad: number[] = [];
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute("data-page"));
            if (pageNum && !loadedPages.has(pageNum)) {
              toLoad.push(pageNum);
            }
          }
        }
        if (toLoad.length > 0) {
          setLoadedPages((prev) => {
            const next = new Set(prev);
            for (const p of toLoad) next.add(p);
            return next;
          });
        }
      },
      {
        root: scrollRef.current,
        rootMargin: "100% 0px",
      }
    );

    // Observe all page containers
    for (const [, el] of pageRefs.current) {
      observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [numPages, loadedPages]);

  // Visibility observer — track which page is most visible for the counter
  useEffect(() => {
    if (numPages === 0) return;

    const visibleEntries = new Map<number, number>();

    visibilityObserverRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNum = Number(entry.target.getAttribute("data-page"));
          if (pageNum) {
            visibleEntries.set(pageNum, entry.intersectionRatio);
          }
        }

        // Find the page with highest intersection ratio
        let maxRatio = 0;
        let maxPage = currentPage;
        for (const [page, ratio] of visibleEntries) {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            maxPage = page;
          }
        }
        if (maxPage !== currentPage && maxRatio > 0) {
          setCurrentPage(maxPage);
        }
      },
      {
        root: scrollRef.current,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    for (const [, el] of pageRefs.current) {
      visibilityObserverRef.current.observe(el);
    }

    return () => {
      visibilityObserverRef.current?.disconnect();
    };
  }, [numPages, currentPage]);

  // Set ref for a page container
  const setPageRef = useCallback(
    (pageNum: number) => (el: HTMLDivElement | null) => {
      if (el) {
        pageRefs.current.set(pageNum, el);
        el.setAttribute("data-page", String(pageNum));
        // Observe with both observers if they exist
        observerRef.current?.observe(el);
        visibilityObserverRef.current?.observe(el);
      } else {
        const existing = pageRefs.current.get(pageNum);
        if (existing) {
          observerRef.current?.unobserve(existing);
          visibilityObserverRef.current?.unobserve(existing);
        }
        pageRefs.current.delete(pageNum);
      }
    },
    []
  );

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

  const estimatedPageHeight = useMemo(
    () => pageWidth * pageAspect,
    [pageWidth, pageAspect]
  );

  const pages = useMemo(
    () => Array.from({ length: numPages }, (_, i) => i + 1),
    [numPages]
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex flex-col bg-[var(--surface-0)]"
      >
        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-3 bg-[var(--surface-0)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
          <span className="text-[var(--text-secondary)] text-sm tracking-wider font-mono min-w-[60px]">
            {isLoading ? "..." : `${currentPage} / ${numPages}`}
          </span>

          {title && (
            <span className="text-[var(--text-secondary)] text-xs tracking-[0.15em] uppercase font-ui truncate max-w-[40%] text-center">
              {title}
            </span>
          )}

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

        {/* Scrollable PDF area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        >
          {hasError ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
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
                // Pre-load first 3 pages
                setLoadedPages(new Set([1, 2, 3]));
              }}
              onLoadError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
              loading={
                <div className="flex items-center justify-center h-full min-h-[60vh]">
                  <Loader2
                    className="animate-spin text-[var(--site-primary)]"
                    size={32}
                  />
                </div>
              }
            >
              <div className="flex flex-col items-center gap-4 py-8 px-6">
                {pages.map((pageNum) => (
                  <div
                    key={pageNum}
                    ref={setPageRef(pageNum)}
                    className="flex items-center justify-center"
                    style={{ minHeight: estimatedPageHeight }}
                  >
                    {loadedPages.has(pageNum) ? (
                      <div className="rounded-lg overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-[var(--border-subtle)]">
                        <Page
                          pageNumber={pageNum}
                          width={pageWidth}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          onRenderSuccess={(page) => {
                            if (pageNum === 1) {
                              handleFirstPageRender(page);
                            }
                          }}
                          loading={
                            <div
                              className="flex items-center justify-center bg-[var(--surface-2)]"
                              style={{
                                width: pageWidth,
                                height: estimatedPageHeight,
                              }}
                            >
                              <Loader2
                                className="animate-spin text-[var(--site-primary)]"
                                size={24}
                              />
                            </div>
                          }
                        />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center bg-[var(--surface-2)] rounded-lg ring-1 ring-[var(--border-subtle)]"
                        style={{
                          width: pageWidth,
                          height: estimatedPageHeight,
                        }}
                      >
                        <Loader2
                          className="animate-spin text-[var(--text-muted)]"
                          size={24}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Document>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
