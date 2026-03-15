"use client";

import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";

/* ------------------------------------------------------------------
   Types
   ------------------------------------------------------------------ */
export type UploadState = "idle" | "processing" | "uploading" | "complete" | "error";

export interface UploadProgressProps {
  state: UploadState;
  progress: number; // 0-100
  variant?: "linear" | "circular";
  label?: string;
  showPercentage?: boolean;
  canCancel?: boolean;
  onCancel?: () => void;
  error?: string | null;
  className?: string;
}

/* ------------------------------------------------------------------
   Component
   ------------------------------------------------------------------ */
export function UploadProgress({
  state,
  progress,
  variant = "linear",
  label,
  showPercentage = true,
  canCancel = false,
  onCancel,
  error,
  className = "",
}: UploadProgressProps) {
  if (state === "idle") return null;

  const isProcessing = state === "processing";
  const isUploading = state === "uploading";
  const isComplete = state === "complete";
  const isError = state === "error";
  const isActive = isProcessing || isUploading;

  const getStateLabel = () => {
    if (label) return label;
    switch (state) {
      case "processing":
        return "Procesando...";
      case "uploading":
        return "Subiendo...";
      case "complete":
        return "Completado";
      case "error":
        return "Error";
      default:
        return "";
    }
  };

  const getStateColor = () => {
    if (isError) return "text-red-400";
    if (isComplete) return "text-green-400";
    return "text-[var(--site-primary)]";
  };

  const getBarColor = () => {
    if (isError) return "bg-red-400";
    if (isComplete) return "bg-green-400";
    return "bg-[var(--site-primary)]";
  };

  if (variant === "circular") {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`flex flex-col items-center gap-3 ${className}`}
      >
        {/* Circular progress */}
        <div className="relative w-16 h-16">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
            {/* Background circle */}
            <circle
              cx="25"
              cy="25"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="3"
            />
            {/* Progress circle */}
            <motion.circle
              cx="25"
              cy="25"
              r={radius}
              fill="none"
              stroke={isError ? "#f87171" : isComplete ? "#4ade80" : "var(--site-primary)"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </svg>
          {/* Center icon or percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isActive && !showPercentage && (
              <Loader2 size={20} className={`animate-spin ${getStateColor()}`} />
            )}
            {isComplete && <CheckCircle2 size={20} className="text-green-400" />}
            {isError && <AlertCircle size={20} className="text-red-400" />}
            {showPercentage && isActive && (
              <span className={`text-xs font-medium ${getStateColor()}`}>
                {Math.round(progress)}%
              </span>
            )}
          </div>
        </div>

        {/* Label */}
        <div className="text-center space-y-1">
          <p className={`text-xs font-medium ${getStateColor()}`}>{getStateLabel()}</p>
          {isError && error && (
            <p className="text-[10px] text-red-400/70 max-w-[200px]">{error}</p>
          )}
        </div>

        {/* Cancel button */}
        {canCancel && isActive && onCancel && (
          <button
            onClick={onCancel}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors underline"
          >
            Cancelar
          </button>
        )}
      </motion.div>
    );
  }

  // Linear variant
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={`space-y-2 ${className}`}
    >
      {/* Header with label and percentage/icon */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isActive && <Loader2 size={14} className={`animate-spin ${getStateColor()} shrink-0`} />}
          {isComplete && <CheckCircle2 size={14} className="text-green-400 shrink-0" />}
          {isError && <AlertCircle size={14} className="text-red-400 shrink-0" />}
          <span className={`text-xs font-medium ${getStateColor()} truncate`}>
            {getStateLabel()}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showPercentage && isActive && (
            <span className={`text-xs font-medium tabular-nums ${getStateColor()}`}>
              {Math.round(progress)}%
            </span>
          )}
          {canCancel && isActive && onCancel && (
            <button
              onClick={onCancel}
              className="w-5 h-5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label="Cancelar"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getBarColor()}`}
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            boxShadow: isActive
              ? "0 0 8px rgba(var(--site-primary-rgb), 0.4)"
              : undefined,
          }}
        />
      </div>

      {/* Error message */}
      {isError && error && (
        <p className="text-[10px] text-red-400/70">{error}</p>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------
   Overlay variant (for fullscreen/modal usage)
   ------------------------------------------------------------------ */
export interface UploadProgressOverlayProps extends UploadProgressProps {
  message?: string;
}

export function UploadProgressOverlay({
  message,
  ...props
}: UploadProgressOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 px-6 z-10"
    >
      <UploadProgress {...props} variant="circular" className="w-full max-w-[240px]" />
      {message && (
        <p className="text-[11px] text-[var(--text-tertiary)] text-center max-w-[280px]">
          {message}
        </p>
      )}
    </motion.div>
  );
}
