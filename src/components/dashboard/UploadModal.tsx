"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Loader2, FolderOpen, Image as ImageIcon, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage } from "@/lib/compress-image";
import { CloseButton } from "@/components/ui/CloseButton";
import { useTranslation } from "@/i18n";

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  categoryId: string;
  projectId: string;
  folder: string;
  onUploaded: () => void;
}

export function UploadModal({
  isOpen,
  onClose,
  categoryName,
  categoryId,
  projectId,
  folder,
  onUploaded,
}: UploadModalProps) {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [compressProgress, setCompressProgress] = useState({ done: 0, total: 0 });
  const [failedCount, setFailedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const { t } = useTranslation("editor");

  // Cleanup object URLs on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setStagedFiles([]);
      setUploadProgress({ done: 0, total: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ESC to close (blocked during upload/compress)
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !uploading && !compressing) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, uploading, compressing, onClose]);

  const addFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    const newStaged: StagedFile[] = imageFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setStagedFiles((prev) => [...prev, ...newStaged]);
  }, []);

  const removeStaged = useCallback((id: string) => {
    setStagedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleUploadAll = async () => {
    if (stagedFiles.length === 0) return;
    setFailedCount(0);

    // Phase 1: Compress all images client-side
    setCompressing(true);
    setCompressProgress({ done: 0, total: stagedFiles.length });
    const compressedFiles: { staged: StagedFile; file: File }[] = [];

    for (const staged of stagedFiles) {
      try {
        const compressed = await compressImage(staged.file);
        compressedFiles.push({ staged, file: compressed });
      } catch {
        compressedFiles.push({ staged, file: staged.file });
      }
      setCompressProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }
    setCompressing(false);

    // Phase 2: Upload compressed files
    setUploading(true);
    setUploadProgress({ done: 0, total: compressedFiles.length });

    const uploaded: { url: string; thumbnail_url?: string }[] = [];
    let failed = 0;

    for (const { file } of compressedFiles) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "media");
        formData.append("folder", folder);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const result = await res.json();
          uploaded.push({
            url: result.url,
            thumbnail_url: result.thumbnail_url,
          });
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }

    // Batch insert into DB
    if (uploaded.length > 0) {
      await fetch("/api/galeria/imagenes/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria_id: categoryId,
          imagenes: uploaded,
        }),
      });
    }

    setUploading(false);

    if (failed > 0) {
      setFailedCount(failed);
      // Keep modal open so user sees the error
    } else {
      onUploaded();
      onClose();
    }

    if (uploaded.length > 0) {
      onUploaded();
    }
  };

  // Drag handlers
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
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xl)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <Upload size={16} className="text-[var(--site-primary)]" />
              <h3 className="text-sm font-medium text-white">
                {t("uploadModal.uploadTo", { name: categoryName })}
              </h3>
            </div>
            <CloseButton onClick={onClose} variant="subtle" size={16} />
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                isDragging
                  ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.08)]"
                  : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                {isDragging ? (
                  <>
                    <ImageIcon size={28} className="text-[var(--site-primary)]" />
                    <span className="text-sm text-[var(--site-primary)]">
                      {t("uploadModal.dropHere")}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-[var(--surface-3)] border border-[var(--border-subtle)] flex items-center justify-center">
                      <Upload size={20} className="text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {t("uploadModal.dragImagesHere")}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{t("uploadModal.or")}</p>
                    </div>
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="flex items-center gap-1.5 px-4 py-2 border border-[var(--border-default)] bg-[var(--surface-2)] rounded-[0.625rem] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-all"
                    >
                      <FolderOpen size={14} />
                      {t("uploadModal.openExplorer")}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Staged file previews */}
            {stagedFiles.length > 0 && (
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-2">
                  {stagedFiles.length === 1
                    ? t("uploadModal.imageReady", { count: String(stagedFiles.length) })
                    : t("uploadModal.imagesReady", { count: String(stagedFiles.length) })}
                </p>
                <div className="grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto">
                  {stagedFiles.map((staged) => (
                    <div
                      key={staged.id}
                      className="relative aspect-video rounded-lg overflow-hidden bg-[var(--surface-2)] group"
                    >
                      <img
                        src={staged.previewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {!uploading && !compressing && (
                        <button
                          onClick={() => removeStaged(staged.id)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compress progress */}
            {compressing && (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface-2)] rounded-lg border border-[var(--border-subtle)]">
                <Loader2 size={14} className="animate-spin text-[var(--site-primary)]" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--text-secondary)]">
                      {t("uploadModal.optimizingCount", { done: String(compressProgress.done), total: String(compressProgress.total) })}
                    </span>
                    <span className="text-[var(--text-tertiary)]">
                      {compressProgress.done}/{compressProgress.total}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--site-primary)] rounded-full transition-all duration-300"
                      style={{
                        width: `${compressProgress.total > 0 ? (compressProgress.done / compressProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Upload progress */}
            {uploading && (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface-2)] rounded-lg border border-[var(--border-subtle)]">
                <Loader2 size={14} className="animate-spin text-[var(--site-primary)]" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--text-secondary)]">
                      {t("uploadModal.uploadingCount", { done: String(uploadProgress.done), total: String(uploadProgress.total) })}
                    </span>
                    <span className="text-[var(--text-tertiary)]">
                      {uploadProgress.done}/{uploadProgress.total}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--site-primary)] rounded-full transition-all duration-300"
                      style={{
                        width: `${uploadProgress.total > 0 ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Failed uploads warning */}
            {failedCount > 0 && !uploading && !compressing && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <p className="text-[11px] text-red-400/80 flex-1">
                  {t("uploadModal.failedCount", { count: String(failedCount) })}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-0)]">
            <button
              onClick={onClose}
              disabled={uploading || compressing}
              className="flex items-center gap-1.5 px-4 py-2 border border-[var(--border-default)] bg-[var(--surface-2)] rounded-[0.625rem] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-all disabled:opacity-40"
            >
              {t("uploadModal.cancel")}
            </button>
            <button
              onClick={handleUploadAll}
              disabled={uploading || compressing || stagedFiles.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--site-primary)] text-[#141414] rounded-[0.625rem] text-xs font-semibold hover:brightness-110 hover:shadow-[0_4px_16px_rgba(var(--site-primary-rgb),0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {compressing || uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {compressing
                ? t("uploadModal.optimizing")
                : uploading
                ? t("uploadModal.uploading")
                : stagedFiles.length > 0
                  ? t("uploadModal.addCount", { count: String(stagedFiles.length) })
                  : t("uploadModal.add")}
            </button>
          </div>
        </motion.div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </motion.div>
    </AnimatePresence>
  );
}
