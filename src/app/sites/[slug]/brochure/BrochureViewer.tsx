"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Download,
  Maximize,
  Minimize,
  BookOpen,
  Loader2,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/tracking";

interface BrochureViewerProps {
  url: string;
  projectId: string;
}

export default function BrochureViewer({ url, projectId }: BrochureViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent(projectId, "brochure_view");
  }, [projectId]);

  /* ── Fullscreen ───────────────────────────────────────── */

  const toggleFullscreen = useCallback(() => {
    if (!viewerRef.current) return;
    if (!document.fullscreenElement) {
      const el = viewerRef.current as HTMLElement & {
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "Escape" && isFullscreen) document.exitFullscreen?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFullscreen, toggleFullscreen]);

  const handleDownload = useCallback(() => {
    trackEvent(projectId, "brochure_download");
    window.open(url, "_blank", "noopener,noreferrer");
  }, [url, projectId]);

  return (
    <div
      ref={viewerRef}
      className="h-screen flex flex-col bg-[var(--surface-0)] select-none"
    >
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-0)]/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <BookOpen size={15} className="text-[var(--site-primary)]" />
          <span className="text-[10px] font-ui uppercase tracking-[0.15em] text-[var(--text-secondary)]">
            Brochure
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--site-primary)] hover:bg-white/5 transition-all cursor-pointer"
            aria-label="Descargar PDF"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* PDF viewer */}
      <div className="flex-1 relative">
        {/* Loading state */}
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10 bg-[var(--surface-0)]">
            {/* Icon with pulsing glow ring */}
            <div className="relative flex items-center justify-center">
              <motion.div
                className="absolute w-20 h-20 rounded-full border border-[rgba(var(--site-primary-rgb),0.15)]"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute w-20 h-20 rounded-full border border-[rgba(var(--site-primary-rgb),0.1)]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              />
              <div className="w-14 h-14 rounded-2xl bg-[rgba(var(--site-primary-rgb),0.08)] border border-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center">
                <FileText size={24} className="text-[var(--site-primary)]" />
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-mono text-[var(--text-secondary)]">
                Cargando brochure
              </span>
              <div className="flex items-center gap-1.5">
                <Loader2 className="animate-spin text-[var(--site-primary)]" size={12} />
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  Preparando documento...
                </span>
              </div>
            </div>

            {/* Indeterminate progress bar */}
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full w-1/3 rounded-full bg-[var(--site-primary)]"
                animate={{ x: ["-100%", "288px"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ boxShadow: "0 0 8px rgba(var(--site-primary-rgb), 0.4)" }}
              />
            </div>
          </div>
        )}
        <iframe
          src={`${url}#toolbar=0&navpanes=0&view=FitH`}
          className="w-full h-full border-0"
          title="Brochure PDF"
          onLoad={() => setIsLoaded(true)}
          style={{ background: "var(--surface-1)" }}
        />
      </div>
    </div>
  );
}
