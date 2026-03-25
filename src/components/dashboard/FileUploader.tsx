"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, X, Loader2, AlertTriangle, Crop, Image as ImageIcon, FileText, Film, Music } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageCropper } from "@/components/dashboard/ImageCropper";
import { compressImage } from "@/lib/compress-image";
import { useTranslation } from "@/i18n";
import { UploadProgress, UploadProgressOverlay, type UploadState } from "@/components/ui/UploadProgress";
import { createClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------
   Types
   ------------------------------------------------------------------ */
export interface UploadResult {
  url: string;
  thumbnail_url?: string;
  width: number;
  height: number;
}

interface FileUploaderProps {
  onUpload: (url: string) => void;
  /** Called with all results when multiple files are uploaded */
  onUploadMultiple?: (results: UploadResult[]) => void;
  /** Allow multiple file selection/drop */
  multiple?: boolean;
  accept?: string;
  folder?: string;
  currentUrl?: string | null;
  label?: string;
  aspect?: "video" | "square" | "logo";
  /** Aspect ratio for cropping (e.g., 16/9, 1). Enables crop + aspect validation. */
  cropAspect?: number;
  /** Minimum recommended width (default: 1280) */
  minWidth?: number;
  /** Minimum recommended height (default: 720) */
  minHeight?: number;
  /** Enable paste (Ctrl+V) support. Default: true */
  enablePaste?: boolean;
  /** Render a compact, smaller dropzone (fixed h-24 instead of aspect ratio) */
  compact?: boolean;
}

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */
function getImageDimensions(
  src: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

function checkAspectRatio(
  width: number,
  height: number,
  targetAspect: number,
  tolerance = 0.08
): boolean {
  const actual = width / height;
  return Math.abs(actual - targetAspect) / targetAspect <= tolerance;
}

function formatAspectLabel(aspect: number): string {
  if (Math.abs(aspect - 16 / 9) < 0.01) return "16:9";
  if (Math.abs(aspect - 4 / 3) < 0.01) return "4:3";
  if (Math.abs(aspect - 1) < 0.01) return "1:1";
  return `${aspect.toFixed(1)}`;
}

/** Detect non-image file type from URL extension */
function getNonImageFileType(url: string): "pdf" | "video" | "audio" | null {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["mp4", "webm", "mov"].includes(ext || "")) return "video";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext || "")) return "audio";
  return null;
}

/* ------------------------------------------------------------------
   Component
   ------------------------------------------------------------------ */
export function FileUploader({
  onUpload,
  onUploadMultiple,
  multiple = false,
  accept = "image/*",
  folder = "",
  currentUrl,
  label = "Subir archivo",
  aspect = "video",
  cropAspect,
  minWidth = 1280,
  minHeight = 720,
  enablePaste = true,
  compact = false,
}: FileUploaderProps) {
  const { t } = useTranslation("editor");
  const [uploading, setUploading] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // Aspect ratio warning
  const [aspectWarning, setAspectWarning] = useState<{
    file: File;
    width: number;
    height: number;
    objectUrl: string;
  } | null>(null);

  // Quality warning
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);

  // Pending file for aspect warnings
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Sync preview with currentUrl prop
  useEffect(() => {
    setPreview(currentUrl || null);
  }, [currentUrl]);

  /* ------------------------------------------------------------------
     Upload helpers
     ------------------------------------------------------------------ */
  /** Upload non-image files (PDFs, etc.) directly to Supabase Storage
      to bypass Vercel's 4.5MB serverless body limit */
  const uploadDirectToStorage = useCallback(
    async (file: File): Promise<UploadResult> => {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "bin";
      const prefix = folder ? folder + "/" : "";
      const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const fileName = `${prefix}${baseName}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      // Increment storage counter
      const folderMatch = folder.match(/^proyectos\/([a-f0-9-]+)/i);
      if (folderMatch?.[1]) {
        supabase.rpc("increment_storage_media_bytes", {
          p_id: folderMatch[1],
          p_bytes: file.size,
        }).then();
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(fileName);

      return { url: publicUrl, width: 0, height: 0 };
    },
    [folder]
  );

  const uploadSingleFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      // Non-image, non-video files (PDFs, etc.): upload directly to Supabase
      // to bypass Vercel's 4.5MB serverless function body limit
      if (!isImage && !isVideo) {
        setUploadState("uploading");
        setUploadProgressPercent(0);
        const result = await uploadDirectToStorage(file);
        setUploadProgressPercent(100);
        setUploadState("complete");
        return result;
      }

      // Compress large images client-side before uploading
      let fileToUpload = file;
      if (isImage && file.size > 4 * 1024 * 1024) {
        setUploadState("processing");
        setUploadProgressPercent(0);
        try {
          fileToUpload = await compressImage(file);
          setUploadProgressPercent(100);
        } finally {
          setUploadState("uploading");
          setUploadProgressPercent(0);
        }
      }

      // Reject videos over 100MB (too heavy for browser-based compression)
      if (isVideo && file.size > 100 * 1024 * 1024) {
        throw new Error("El video excede 100MB. Por favor usa un archivo más liviano.");
      }

      // Compress large videos client-side (FFmpeg WASM, lazy-loaded)
      if (isVideo && file.size > 5 * 1024 * 1024) {
        setUploadState("processing");
        setUploadProgressPercent(0);
        try {
          const { compressVideo } = await import("@/lib/compress-video");
          fileToUpload = await compressVideo(file, (ratio) => {
            setUploadProgressPercent(Math.round(ratio * 100));
          });
        } finally {
          setUploadState("uploading");
          setUploadProgressPercent(0);
        }
      }

      // Set uploading state
      if (uploadState !== "uploading") {
        setUploadState("uploading");
        setUploadProgressPercent(0);
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("bucket", "media");
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        // Handle non-JSON responses (e.g. Vercel "Request Entity Too Large")
        let errorMsg = t("fileUploader.uploadError");
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          const text = await res.text().catch(() => "");
          if (text.toLowerCase().includes("entity too large") || res.status === 413) {
            errorMsg = "El archivo excede el límite de tamaño. Intenta con un archivo más pequeño.";
          } else if (text) {
            errorMsg = text.slice(0, 200);
          }
        }
        throw new Error(errorMsg);
      }

      // Simulate upload progress complete
      setUploadProgressPercent(100);
      setUploadState("complete");

      return await res.json();
    },
    [folder, t, uploadState, uploadDirectToStorage]
  );

  const uploadBlob = useCallback(
    async (blob: Blob): Promise<UploadResult> => {
      const formData = new FormData();
      formData.append("file", blob, "cropped.jpg");
      formData.append("bucket", "media");
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = t("fileUploader.uploadError");
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          const text = await res.text().catch(() => "");
          if (text) errorMsg = text.slice(0, 200);
        }
        throw new Error(errorMsg);
      }

      return await res.json();
    },
    [folder, t]
  );

  /* ------------------------------------------------------------------
     Single file processing (with validation)
     ------------------------------------------------------------------ */
  const processSingleFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploadState("idle");
      setUploadProgressPercent(0);
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        // Non-image: upload directly
        setUploading(true);
        setUploadState("uploading");
        try {
          const result = await uploadSingleFile(file);
          onUpload(result.url);
          setPreview(result.url);
          setUploadState("complete");
          // Reset after brief delay
          setTimeout(() => setUploadState("idle"), 1500);
        } catch (err) {
          const errorMsg = t("fileUploader.uploadFailed", { error: err instanceof Error ? err.message : t("fileUploader.uploadError") });
          setUploadError(errorMsg);
          setUploadState("error");
          // Reset error state after delay
          setTimeout(() => setUploadState("idle"), 3000);
        } finally {
          setUploading(false);
        }
        return;
      }

      // Check image dimensions
      const objectUrl = URL.createObjectURL(file);
      try {
        const dims = await getImageDimensions(objectUrl);

        // Quality warning
        if (dims.width < minWidth || dims.height < minHeight) {
          setQualityWarning(
            t("fileUploader.lowResolution", { width: String(dims.width), height: String(dims.height), minWidth: String(minWidth), minHeight: String(minHeight) })
          );
          // Auto-dismiss after 5s
          setTimeout(() => setQualityWarning(null), 5000);
        }

        // Aspect ratio check (only when cropAspect is set)
        if (cropAspect && !checkAspectRatio(dims.width, dims.height, cropAspect)) {
          // Show warning with options
          setAspectWarning({ file, width: dims.width, height: dims.height, objectUrl });
          return;
        }

        // If cropAspect is set and aspect matches, still offer crop
        if (cropAspect) {
          setCropSrc(objectUrl);
          setPreview(objectUrl);
          setPendingFile(file);
          return;
        }

        // No crop needed - upload directly
        setPreview(objectUrl);
        setUploading(true);
        setUploadState("uploading");
        try {
          const result = await uploadSingleFile(file);
          onUpload(result.url);
          setPreview(result.url);
          setUploadState("complete");
          setTimeout(() => setUploadState("idle"), 1500);
        } catch (err) {
          const errorMsg = t("fileUploader.uploadFailed", { error: err instanceof Error ? err.message : t("fileUploader.uploadError") });
          setUploadError(errorMsg);
          setPreview(null);
          setUploadState("error");
          setTimeout(() => setUploadState("idle"), 3000);
        } finally {
          setUploading(false);
        }
      } catch {
        URL.revokeObjectURL(objectUrl);
        // If dimension check fails, upload anyway
        setUploading(true);
        setUploadState("uploading");
        try {
          const result = await uploadSingleFile(file);
          onUpload(result.url);
          setPreview(result.url);
          setUploadState("complete");
          setTimeout(() => setUploadState("idle"), 1500);
        } catch (err) {
          const errorMsg = t("fileUploader.uploadFailed", { error: err instanceof Error ? err.message : t("fileUploader.uploadError") });
          setUploadError(errorMsg);
          setPreview(null);
          setUploadState("error");
          setTimeout(() => setUploadState("idle"), 3000);
        } finally {
          setUploading(false);
        }
      }
    },
    [cropAspect, minWidth, minHeight, onUpload, uploadSingleFile, t]
  );

  /* ------------------------------------------------------------------
     Multi-file processing
     ------------------------------------------------------------------ */
  const processMultipleFiles = useCallback(
    async (files: File[]) => {
      // Accept images always; also accept non-images when accept prop allows them
      const acceptsOnlyImages = accept === "image/*";
      const imageFiles = acceptsOnlyImages
        ? files.filter((f) => f.type.startsWith("image/"))
        : files;
      if (imageFiles.length === 0) return;

      setUploading(true);
      setUploadProgress({ done: 0, total: imageFiles.length });

      const results: UploadResult[] = [];

      for (const file of imageFiles) {
        try {
          const result = await uploadSingleFile(file);
          results.push(result);
          setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        } catch {
          // Skip failed uploads
          setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        }
      }

      setUploading(false);
      setUploadProgress({ done: 0, total: 0 });

      if (results.length > 0) {
        if (onUploadMultiple) {
          onUploadMultiple(results);
        } else {
          // Fallback: call onUpload with first result
          onUpload(results[0].url);
          setPreview(results[0].url);
        }
      }
    },
    [onUpload, onUploadMultiple, uploadSingleFile]
  );

  /* ------------------------------------------------------------------
     File input handler
     ------------------------------------------------------------------ */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset input so user can re-select same file
    if (inputRef.current) inputRef.current.value = "";

    if (multiple && files.length > 1) {
      await processMultipleFiles(files);
    } else {
      await processSingleFile(files[0]);
    }
  };

  /* ------------------------------------------------------------------
     Drag & Drop handlers
     ------------------------------------------------------------------ */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files).filter((f) => {
      if (accept === "image/*") return f.type.startsWith("image/");
      return true;
    });

    if (files.length === 0) return;

    if (multiple && files.length > 1) {
      await processMultipleFiles(files);
    } else {
      await processSingleFile(files[0]);
    }
  };

  /* ------------------------------------------------------------------
     Paste (Ctrl+V) handler
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (!enablePaste) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageItems.push(file);
        }
      }

      if (imageItems.length === 0) return;

      // Only handle paste if this uploader's container is in view
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      e.preventDefault();

      if (multiple && imageItems.length > 1) {
        await processMultipleFiles(imageItems);
      } else {
        await processSingleFile(imageItems[0]);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [enablePaste, multiple, processSingleFile, processMultipleFiles]);

  /* ------------------------------------------------------------------
     Crop handlers
     ------------------------------------------------------------------ */
  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null);
    setPendingFile(null);
    setAspectWarning(null);
    setPreview(URL.createObjectURL(blob));
    setUploading(true);
    try {
      const result = await uploadBlob(blob);
      onUpload(result.url);
      setPreview(result.url);
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    setPendingFile(null);
    if (!currentUrl) setPreview(null);
    else setPreview(currentUrl);
  };

  /* ------------------------------------------------------------------
     Aspect warning handlers
     ------------------------------------------------------------------ */
  const handleAspectCrop = () => {
    if (!aspectWarning) return;
    setCropSrc(aspectWarning.objectUrl);
    setPreview(aspectWarning.objectUrl);
    setPendingFile(aspectWarning.file);
    setAspectWarning(null);
  };

  const handleAspectUploadAsIs = async () => {
    if (!aspectWarning) return;
    const file = aspectWarning.file;
    URL.revokeObjectURL(aspectWarning.objectUrl);
    setAspectWarning(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const result = await uploadSingleFile(file);
      onUpload(result.url);
      setPreview(result.url);
    } finally {
      setUploading(false);
    }
  };

  /* ------------------------------------------------------------------
     Render
     ------------------------------------------------------------------ */
  const showProgress = uploading && uploadProgress.total > 1;

  return (
    <>
      <div
        ref={containerRef}
        className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all duration-200 ${
          compact ? "h-24" : aspect === "video" ? "aspect-video" : aspect === "logo" ? "aspect-[3/1]" : "aspect-square"
        } ${
          isDragging
            ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.08)] scale-[1.01]"
            : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {preview && !cropSrc && !aspectWarning ? (
          <>
            {(() => {
              const fileType = getNonImageFileType(preview);
              if (fileType) {
                const Icon = fileType === "pdf" ? FileText : fileType === "video" ? Film : Music;
                const fileName = decodeURIComponent(preview.split("/").pop()?.split("?")[0] || "");
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[var(--surface-2)]">
                    <Icon size={32} className="text-[var(--site-primary)]" />
                    <span className="text-xs text-[var(--text-secondary)] max-w-[80%] truncate text-center">
                      {fileName}
                    </span>
                  </div>
                );
              }
              return (
                <Image
                  src={preview}
                  alt=""
                  fill
                  sizes="300px"
                  unoptimized
                  className={`w-full h-full ${aspect === "logo" ? "object-contain bg-[var(--surface-3)]" : "object-cover"}`}
                  onError={() => {
                    console.warn("[FileUploader] Image failed to load:", preview);
                  }}
                />
              );
            })()}
            {/* Remove button */}
            <button
              onClick={() => {
                setPreview(null);
                onUpload("");
              }}
              className="absolute top-2 right-2 w-7 h-7 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
            {/* Upload progress overlay */}
            <AnimatePresence>
              {uploadState !== "idle" && (
                <UploadProgressOverlay
                  state={uploadState}
                  progress={uploadProgressPercent}
                  error={uploadError}
                  label={
                    uploadState === "processing"
                      ? t("fileUploader.compressingFile")
                      : uploadState === "uploading"
                      ? t("fileUploader.uploading")
                      : uploadState === "complete"
                      ? t("fileUploader.uploadComplete")
                      : undefined
                  }
                  message={
                    uploadState === "processing"
                      ? t("fileUploader.canContinueWorking")
                      : undefined
                  }
                />
              )}
            </AnimatePresence>
          </>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading || uploadState === "processing"}
            className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-tertiary)] transition-colors"
          >
            {uploadState === "processing" || uploadState === "uploading" ? (
              <div className="w-full max-w-[240px] px-6">
                <UploadProgress
                  state={uploadState}
                  progress={uploadProgressPercent}
                  variant="circular"
                  label={
                    uploadState === "processing"
                      ? t("fileUploader.compressingFile")
                      : t("fileUploader.uploading")
                  }
                />
              </div>
            ) : uploading && showProgress ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-[var(--site-primary)]" />
                <span className="text-xs text-[var(--text-tertiary)]">
                  {uploadProgress.done}/{uploadProgress.total} {t("fileUploader.images")}
                </span>
              </div>
            ) : isDragging ? (
              <>
                <ImageIcon size={compact ? 20 : 28} className="text-[var(--site-primary)]" />
                <span className={`${compact ? "text-[10px]" : "text-xs"} text-[var(--site-primary)]`}>{t("fileUploader.dropHere")}</span>
              </>
            ) : (
              <>
                <Upload size={compact ? 16 : 24} />
                <span className={compact ? "text-[10px]" : "text-xs"}>{label}</span>
                {!compact && (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {multiple ? t("fileUploader.dragOrClick") : t("fileUploader.dragOrClickShort")}
                  </span>
                )}
              </>
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Quality warning */}
      <AnimatePresence>
        {qualityWarning && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
          >
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-400/80 flex-1">{qualityWarning}</p>
            <button
              onClick={() => setQualityWarning(null)}
              className="text-amber-400/40 hover:text-amber-400 transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload error */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <p className="text-[11px] text-red-400/80 flex-1">{uploadError}</p>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-400/40 hover:text-red-400 transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aspect ratio warning modal */}
      <AnimatePresence>
        {aspectWarning && cropAspect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAspectWarning(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <Crop size={18} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">
                    {t("fileUploader.wrongFormat")}
                  </h3>
                  <p className="text-[11px] text-[var(--text-tertiary)]">
                    {aspectWarning.width}x{aspectWarning.height} — {t("fileUploader.recommended", { aspect: formatAspectLabel(cropAspect) })}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                {t("fileUploader.wrongFormatDescription", { aspect: formatAspectLabel(cropAspect) })}
              </p>

              {/* Preview */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <Image src={aspectWarning.objectUrl} alt="Preview" fill sizes="(max-width: 640px) 90vw, 500px" className="object-contain" />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAspectCrop}
                  className="btn-warm flex-1 py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  <Crop size={14} />
                  {t("fileUploader.cropTo", { aspect: formatAspectLabel(cropAspect) })}
                </button>
                <button
                  onClick={handleAspectUploadAsIs}
                  className="flex-1 py-2.5 text-xs border border-[var(--border-default)] rounded-[0.75rem] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] transition-all"
                >
                  {t("fileUploader.uploadAsIs")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {cropSrc && cropAspect && (
          <ImageCropper
            imageSrc={cropSrc}
            aspect={cropAspect}
            onCrop={handleCropConfirm}
            onCancel={handleCropCancel}
          />
        )}
      </AnimatePresence>
    </>
  );
}
