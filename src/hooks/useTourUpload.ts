"use client";

import { useState, useRef, useCallback } from "react";

type Status = "idle" | "extracting" | "uploading" | "complete" | "error";

const MIME_MAP: Record<string, string> = {
  html: "text/html",
  htm: "text/html",
  js: "application/javascript",
  mjs: "application/javascript",
  css: "text/css",
  json: "application/json",
  xml: "application/xml",
  svg: "image/svg+xml",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  eot: "application/vnd.ms-fontobject",
  otf: "font/otf",
  pdf: "application/pdf",
  txt: "text/plain",
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
};

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return MIME_MAP[ext] || "application/octet-stream";
}

const SKIP_PATTERNS = [
  "__MACOSX",
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
];

function shouldSkip(path: string): boolean {
  return SKIP_PATTERNS.some((p) => path.includes(p));
}

const CONCURRENT_UPLOADS = 6;

export interface TourUploadHook {
  status: Status;
  progress: number;
  filesUploaded: number;
  filesTotal: number;
  error: string | null;
  tourUrl: string | null;
  upload: (file: File, projectId: string) => Promise<void>;
  reset: () => void;
  cancel: () => void;
}

export function useTourUpload(): TourUploadHook {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [filesUploaded, setFilesUploaded] = useState(0);
  const [filesTotal, setFilesTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tourUrl, setTourUrl] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setFilesUploaded(0);
    setFilesTotal(0);
    setError(null);
    setTourUrl(null);
    cancelledRef.current = false;
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setStatus("idle");
    setProgress(0);
    setFilesUploaded(0);
    setFilesTotal(0);
  }, []);

  const upload = useCallback(async (file: File, projectId: string) => {
    cancelledRef.current = false;
    setError(null);
    setTourUrl(null);
    setStatus("extracting");
    setProgress(0);
    setFilesUploaded(0);
    setFilesTotal(0);

    try {
      // Validate file type
      if (
        !file.name.toLowerCase().endsWith(".zip") &&
        file.type !== "application/zip" &&
        file.type !== "application/x-zip-compressed"
      ) {
        throw new Error("El archivo debe ser un ZIP");
      }

      // Dynamic import JSZip (only loaded when needed)
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(file);

      // Collect file entries (skip directories and OS junk)
      const entries: { path: string; zipEntry: import("jszip").JSZipObject }[] = [];
      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;
        if (shouldSkip(relativePath)) return;
        entries.push({ path: relativePath, zipEntry });
      });

      if (entries.length === 0) {
        throw new Error("El ZIP está vacío");
      }

      // Detect and strip common root folder
      // (3DVista often wraps everything in a single folder)
      const firstSlashParts = entries.map((e) => {
        const idx = e.path.indexOf("/");
        return idx > 0 ? e.path.substring(0, idx) : null;
      });
      const commonRoot = firstSlashParts[0];
      const allSameRoot =
        commonRoot &&
        firstSlashParts.every((p) => p === commonRoot) &&
        entries.some((e) => {
          const stripped = e.path.substring(commonRoot.length + 1);
          return stripped === "index.htm" || stripped === "index.html";
        });

      const stripPrefix = allSameRoot ? commonRoot + "/" : "";

      // Apply prefix stripping
      const processedEntries = entries.map((e) => ({
        ...e,
        finalPath: stripPrefix ? e.path.replace(stripPrefix, "") : e.path,
      }));

      // Verify index.htm or index.html exists
      const hasIndex = processedEntries.some(
        (e) => e.finalPath === "index.htm" || e.finalPath === "index.html"
      );
      if (!hasIndex) {
        throw new Error(
          "No se encontró index.htm ni index.html en el ZIP. Asegúrate de exportar correctamente desde 3DVista."
        );
      }

      // Extract file data and build the file list for presigning
      const filesToUpload: {
        path: string;
        contentType: string;
        data: Uint8Array;
        size: number;
      }[] = [];

      for (const entry of processedEntries) {
        if (cancelledRef.current) return;
        const data = await entry.zipEntry.async("uint8array");
        filesToUpload.push({
          path: entry.finalPath,
          contentType: getMimeType(entry.finalPath),
          data,
          size: data.byteLength,
        });
      }

      if (cancelledRef.current) return;

      setFilesTotal(filesToUpload.length);
      setStatus("uploading");

      // Request presigned URLs
      const presignRes = await fetch("/api/tours/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          files: filesToUpload.map((f) => ({
            path: f.path,
            contentType: f.contentType,
            size: f.size,
          })),
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || "Error al obtener URLs de subida");
      }

      const { files: signedFiles, tourBaseUrl } = await presignRes.json();

      // Build upload queue
      const uploadMap = new Map<string, string>(
        signedFiles.map((sf: { path: string; uploadUrl: string }) => [
          sf.path,
          sf.uploadUrl,
        ])
      );

      let uploaded = 0;

      // Upload files with concurrency limit
      const queue = [...filesToUpload];

      async function worker() {
        while (queue.length > 0) {
          if (cancelledRef.current) return;
          const item = queue.shift();
          if (!item) break;

          const uploadUrl = uploadMap.get(item.path);
          if (!uploadUrl) continue;

          const res = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": item.contentType },
            body: new Blob([item.data.buffer as ArrayBuffer], { type: item.contentType }),
          });

          if (!res.ok) {
            throw new Error(`Error subiendo ${item.path}: ${res.status}`);
          }

          uploaded++;
          setFilesUploaded(uploaded);
          setProgress(Math.round((uploaded / filesToUpload.length) * 100));
        }
      }

      const workers = Array.from(
        { length: Math.min(CONCURRENT_UPLOADS, filesToUpload.length) },
        () => worker()
      );
      await Promise.all(workers);

      if (cancelledRef.current) return;

      setTourUrl(tourBaseUrl);
      setStatus("complete");
      setProgress(100);
    } catch (err) {
      if (cancelledRef.current) return;
      const message =
        err instanceof Error ? err.message : "Error al subir tour";
      setError(message);
      setStatus("error");
    }
  }, []);

  return {
    status,
    progress,
    filesUploaded,
    filesTotal,
    error,
    tourUrl,
    upload,
    reset,
    cancel,
  };
}
