"use client";

import { useState, useRef, useCallback } from "react";

type Status = "idle" | "requesting" | "uploading" | "processing" | "ready" | "error";

const ACCEPTED_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv", ".avi"];
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const POLL_INTERVAL = 5000;

export interface VideoUploadHook {
  status: Status;
  progress: number;
  error: string | null;
  videoId: string | null;
  streamUid: string | null;
  upload: (file: File, projectId: string) => Promise<void>;
  reset: () => void;
  cancel: () => void;
}

export function useVideoUpload(): VideoUploadHook {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [streamUid, setStreamUid] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setStatus("idle");
    setProgress(0);
    setError(null);
    setVideoId(null);
    setStreamUid(null);
    cancelledRef.current = false;
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
  }, [stopPolling]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stopPolling();
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setStatus("idle");
    setProgress(0);
  }, [stopPolling]);

  const upload = useCallback(async (file: File, projectId: string) => {
    cancelledRef.current = false;
    setError(null);
    setVideoId(null);
    setStreamUid(null);
    setProgress(0);

    try {
      // Validate file
      const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        throw new Error(
          `Formato no soportado. Formatos aceptados: ${ACCEPTED_EXTENSIONS.join(", ")}`
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("El archivo excede el tamaño máximo de 2GB");
      }

      // Step 1: Request direct upload URL
      setStatus("requesting");
      const presignRes = await fetch("/api/videos/stream/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          filename: file.name,
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || "Error al crear upload");
      }

      const { video_id, upload_url, stream_uid } = await presignRes.json();
      setVideoId(video_id);
      setStreamUid(stream_uid);

      if (cancelledRef.current) return;

      // Step 2: Upload file directly to Cloudflare Stream
      setStatus("uploading");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Error al subir video: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Error de red al subir video"));
        xhr.onabort = () => reject(new Error("Subida cancelada"));

        const formData = new FormData();
        formData.append("file", file);

        xhr.open("POST", upload_url);
        xhr.send(formData);
      });

      if (cancelledRef.current) return;

      // Step 3: Poll for processing status
      setStatus("processing");
      setProgress(0);

      await new Promise<void>((resolve, reject) => {
        pollRef.current = setInterval(async () => {
          if (cancelledRef.current) {
            stopPolling();
            return;
          }

          try {
            const statusRes = await fetch(
              `/api/videos/stream/status/${stream_uid}`
            );
            if (!statusRes.ok) {
              stopPolling();
              reject(new Error("Error al verificar estado del video"));
              return;
            }

            const data = await statusRes.json();

            if (data.pct_complete) {
              setProgress(parseInt(data.pct_complete, 10));
            }

            if (data.ready) {
              stopPolling();
              resolve();
            } else if (data.state === "error") {
              stopPolling();
              reject(
                new Error(data.error_reason || "Error al procesar video")
              );
            }
          } catch {
            stopPolling();
            reject(new Error("Error de conexión"));
          }
        }, POLL_INTERVAL);
      });

      if (cancelledRef.current) return;

      setStatus("ready");
      setProgress(100);
    } catch (err) {
      if (cancelledRef.current) return;
      const message =
        err instanceof Error ? err.message : "Error al subir video";
      setError(message);
      setStatus("error");
    }
  }, [stopPolling]);

  return {
    status,
    progress,
    error,
    videoId,
    streamUid,
    upload,
    reset,
    cancel,
  };
}
