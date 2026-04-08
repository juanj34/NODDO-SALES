"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CloudUpload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { useTourUploadContext } from "@/contexts/TourUploadContext";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

const spring = { type: "spring" as const, damping: 25, stiffness: 300 };

export function FloatingTourProgress() {
  const {
    status,
    progress,
    speed,
    eta,
    filesUploaded,
    filesTotal,
    error,
    isMinimized,
    setMinimized,
    cancel,
    reset,
  } = useTourUploadContext();
  const { t } = useTranslation("editor");

  // Auto-dismiss complete state after 5s
  useEffect(() => {
    if (status !== "complete") return;
    const timer = setTimeout(() => reset(), 5000);
    return () => clearTimeout(timer);
  }, [status, reset]);

  if (status === "idle") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isMinimized ? "pill" : "card"}
        layout
        className="fixed bottom-20 right-6 z-[90]"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={spring}
      >
        {isMinimized ? (
          <MinimizedPill
            status={status}
            progress={progress}
            onExpand={() => setMinimized(false)}
            onDismiss={reset}
            t={t}
          />
        ) : (
          <ExpandedCard
            status={status}
            progress={progress}
            speed={speed}
            eta={eta}
            filesUploaded={filesUploaded}
            filesTotal={filesTotal}
            error={error}
            onMinimize={() => setMinimized(true)}
            onCancel={cancel}
            onRetry={reset}
            onDismiss={reset}
            t={t}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────── Minimized Pill ─────────────────────── */

function MinimizedPill({
  status,
  progress,
  onExpand,
  onDismiss,
  t,
}: {
  status: string;
  progress: number;
  onExpand: () => void;
  onDismiss: () => void;
  t: (key: string) => string;
}) {
  return (
    <button
      onClick={status === "complete" ? onDismiss : onExpand}
      className={cn(
        "flex items-center gap-2.5 h-11 pl-3.5 pr-4",
        "bg-[var(--surface-2)]/90 backdrop-blur-xl",
        "border rounded-full shadow-lg",
        "hover:bg-[var(--surface-3)]/90 transition-colors cursor-pointer",
        status === "error"
          ? "border-red-500/30"
          : status === "complete"
            ? "border-emerald-500/30"
            : "border-[var(--border-default)]"
      )}
    >
      {status === "extracting" && (
        <>
          <Loader2
            size={15}
            className="text-[var(--site-primary)] animate-spin"
          />
          <span className="font-mono text-xs text-[var(--text-secondary)]">
            {t("config.tour.floatingPreparing")}
          </span>
        </>
      )}

      {status === "uploading" && (
        <>
          <CloudUpload
            size={15}
            className="text-[var(--site-primary)] animate-pulse"
          />
          <span className="font-mono text-xs text-[var(--text-secondary)] tabular-nums">
            {progress}%
          </span>
          <div className="w-16 h-1 rounded-full bg-[var(--surface-3)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--site-primary)]"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <ChevronUp size={12} className="text-[var(--text-muted)]" />
        </>
      )}

      {status === "complete" && (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 400 }}
          >
            <CheckCircle2 size={15} className="text-emerald-400" />
          </motion.div>
          <span className="font-mono text-xs text-emerald-400">
            {t("config.tour.floatingComplete")}
          </span>
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle size={15} className="text-red-400" />
          <span className="font-mono text-xs text-red-400">
            {t("config.tour.floatingError")}
          </span>
          <ChevronUp size={12} className="text-[var(--text-muted)]" />
        </>
      )}
    </button>
  );
}

/* ─────────────────────── Expanded Card ─────────────────────── */

function formatSpeed(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB/s`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatETA(seconds: number): string {
  if (seconds < 1) return "<1s";
  if (seconds < 60) return `~${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `~${m}m ${s}s` : `~${m}m`;
}

function ExpandedCard({
  status,
  progress,
  speed,
  eta,
  filesUploaded,
  filesTotal,
  error,
  onMinimize,
  onCancel,
  onRetry,
  onDismiss,
  t,
}: {
  status: string;
  progress: number;
  speed: number;
  eta: number;
  filesUploaded: number;
  filesTotal: number;
  error: string | null;
  onMinimize: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onDismiss: () => void;
  t: (key: string) => string;
}) {
  return (
    <motion.div
      layout
      className={cn(
        "w-80 backdrop-blur-xl overflow-hidden",
        "border rounded-[1.25rem] shadow-xl",
        status === "error"
          ? "bg-[var(--surface-2)]/95 border-red-500/25"
          : status === "complete"
            ? "bg-[var(--surface-2)]/95 border-emerald-500/25"
            : "bg-[var(--surface-2)]/95 border-[var(--border-default)]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          {status === "extracting" && (
            <Loader2
              size={15}
              className="text-[var(--site-primary)] animate-spin"
            />
          )}
          {status === "uploading" && (
            <CloudUpload
              size={15}
              className="text-[var(--site-primary)] animate-pulse"
            />
          )}
          {status === "complete" && (
            <CheckCircle2 size={15} className="text-emerald-400" />
          )}
          {status === "error" && (
            <AlertCircle size={15} className="text-red-400" />
          )}
          <span
            className={cn(
              "font-ui text-[10px] font-bold uppercase tracking-[0.1em]",
              status === "complete"
                ? "text-emerald-400"
                : status === "error"
                  ? "text-red-400"
                  : "text-[var(--text-secondary)]"
            )}
          >
            {status === "extracting" && t("config.tour.floatingPreparing")}
            {status === "uploading" && t("config.tour.floatingUploading")}
            {status === "complete" && t("config.tour.floatingComplete")}
            {status === "error" && t("config.tour.floatingError")}
          </span>
        </div>
        <button
          onClick={onMinimize}
          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3.5 space-y-3">
        {/* Extracting */}
        {status === "extracting" && (
          <div className="flex items-center justify-center py-2">
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {t("config.tour.extracting")}
            </span>
          </div>
        )}

        {/* Uploading */}
        {status === "uploading" && (
          <>
            <div className="w-full h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "var(--site-primary)",
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {filesUploaded.toLocaleString()} /{" "}
                {filesTotal.toLocaleString()}{" "}
                {t("config.tour.floatingFiles")}
              </span>
              <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
                {progress}%
              </span>
            </div>
            {speed > 0 && (
              <p className="font-mono text-[10px] text-[var(--text-tertiary)] tabular-nums">
                {formatSpeed(speed)}
                {eta > 0 && ` · ${formatETA(eta)} restantes`}
              </p>
            )}
            <button
              onClick={onCancel}
              className={cn(
                "w-full py-2 font-ui text-[10px] font-bold uppercase tracking-[0.1em]",
                "text-[var(--text-muted)] hover:text-red-400",
                "border border-[var(--border-subtle)] hover:border-red-500/30",
                "rounded-[0.75rem] transition-all cursor-pointer"
              )}
            >
              {t("config.tour.floatingCancel")}
            </button>
          </>
        )}

        {/* Complete */}
        {status === "complete" && (
          <div className="flex items-center justify-between py-1">
            <span className="font-mono text-xs text-emerald-400/80">
              {filesTotal.toLocaleString()} {t("config.tour.floatingFiles")}
            </span>
            <button
              onClick={onDismiss}
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            {error && (
              <p className="font-mono text-xs text-red-400/80 line-clamp-2">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={onDismiss}
                className={cn(
                  "flex-1 py-2 font-ui text-[10px] font-bold uppercase tracking-[0.1em]",
                  "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                  "border border-[var(--border-subtle)] hover:border-[var(--border-default)]",
                  "rounded-[0.75rem] transition-all cursor-pointer"
                )}
              >
                {t("config.tour.floatingCancel")}
              </button>
              <button
                onClick={onRetry}
                className={cn(
                  "flex-1 py-2 font-ui text-[10px] font-bold uppercase tracking-[0.1em]",
                  "text-red-400 hover:text-red-300",
                  "border border-red-500/20 hover:border-red-500/40 bg-red-500/8 hover:bg-red-500/15",
                  "rounded-[0.75rem] transition-all cursor-pointer"
                )}
              >
                {t("config.tour.floatingRetry")}
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
