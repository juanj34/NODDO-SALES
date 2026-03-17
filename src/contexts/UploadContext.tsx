"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Check, AlertCircle, Loader2 } from "lucide-react";

interface UploadTask {
  id: string;
  file: File;
  status: "queued" | "uploading" | "complete" | "error";
  progress: number;
  error?: string;
  result?: string; // URL when complete
}

interface UploadContextValue {
  /** Add files to the upload queue */
  queueUploads: (files: File[], onComplete: (results: string[]) => void, folder: string) => void;
  /** Active uploads */
  uploads: UploadTask[];
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function useUploads() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUploads must be used within UploadProvider");
  return ctx;
}

/**
 * Global upload manager that handles background uploads.
 * Uploads are queued and processed in the background without blocking UI.
 */
export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [callbacks, setCallbacks] = useState<Map<string, (results: string[]) => void>>(
    new Map()
  );

  const queueUploads = useCallback(
    (files: File[], onComplete: (results: string[]) => void, folder: string) => {
      const batchId = crypto.randomUUID();
      const tasks: UploadTask[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "queued",
        progress: 0,
      }));

      // Store callback for this batch
      setCallbacks((prev) => new Map(prev).set(batchId, onComplete));

      // Add to queue
      setUploads((prev) => [...prev, ...tasks]);

      // Start processing immediately
      processTasks(tasks, folder, batchId);
    },
    []
  );

  const processTasks = async (
    tasks: UploadTask[],
    folder: string,
    batchId: string
  ) => {
    const results: string[] = [];

    for (const task of tasks) {
      try {
        // Update status to uploading
        setUploads((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: "uploading" } : t))
        );

        // Upload via API
        const formData = new FormData();
        formData.append("file", task.file);
        formData.append("bucket", "media");
        formData.append("folder", folder);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Upload failed");
        }

        const { url } = await res.json();

        // Mark as complete
        setUploads((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: "complete", progress: 100, result: url }
              : t
          )
        );

        results.push(url);

        // Remove after 2s
        setTimeout(() => {
          setUploads((prev) => prev.filter((t) => t.id !== task.id));
        }, 2000);
      } catch (error) {
        // Mark as error
        setUploads((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: "error",
                  error: error instanceof Error ? error.message : "Error desconocido",
                }
              : t
          )
        );

        // Remove after 5s
        setTimeout(() => {
          setUploads((prev) => prev.filter((t) => t.id !== task.id));
        }, 5000);
      }
    }

    // Call completion callback
    const callback = callbacks.get(batchId);
    if (callback) {
      callback(results);
      setCallbacks((prev) => {
        const next = new Map(prev);
        next.delete(batchId);
        return next;
      });
    }
  };

  return (
    <UploadContext.Provider value={{ queueUploads, uploads }}>
      {children}
      <FloatingUploadIndicator uploads={uploads} />
    </UploadContext.Provider>
  );
}

/**
 * Floating indicator that shows active uploads in the bottom-right corner.
 * Non-blocking, can be dismissed.
 */
function FloatingUploadIndicator({ uploads }: { uploads: UploadTask[] }) {
  const [dismissed, setDismissed] = useState(false);

  const activeUploads = uploads.filter((u) => u.status !== "complete");
  const hasActive = activeUploads.length > 0;

  // Reset dismissed state when new uploads start
  if (hasActive && dismissed) {
    setDismissed(false);
  }

  if (!hasActive || dismissed) return null;

  const uploading = activeUploads.filter((u) => u.status === "uploading").length;
  const queued = activeUploads.filter((u) => u.status === "queued").length;
  const errors = activeUploads.filter((u) => u.status === "error").length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-4 right-4 z-50 w-72"
      >
        <div className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
            <Loader2 size={14} className="animate-spin text-[var(--site-primary)]" />
            <span className="text-xs font-medium text-[var(--text-secondary)] flex-1">
              {errors > 0
                ? `${errors} error${errors > 1 ? "es" : ""}`
                : `Subiendo ${uploading + queued} archivo${
                    uploading + queued > 1 ? "s" : ""
                  }`}
            </span>
            <button
              onClick={() => setDismissed(true)}
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Upload list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {activeUploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--surface-3)] transition-colors"
              >
                <div className="shrink-0">
                  {upload.status === "uploading" && (
                    <Loader2 size={12} className="animate-spin text-[var(--site-primary)]" />
                  )}
                  {upload.status === "queued" && (
                    <Upload size={12} className="text-[var(--text-muted)]" />
                  )}
                  {upload.status === "complete" && (
                    <Check size={12} className="text-[var(--site-primary)]" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle size={12} className="text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">
                    {upload.file.name}
                  </p>
                  {upload.error && (
                    <p className="text-[9px] text-red-400 truncate">{upload.error}</p>
                  )}
                </div>
                <div className="text-[9px] text-[var(--text-muted)] tabular-nums">
                  {(upload.file.size / 1024).toFixed(0)}KB
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
