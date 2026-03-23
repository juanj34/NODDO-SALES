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

const CONCURRENT_UPLOADS = 12;
const PRESIGN_BATCH_SIZE = 3000;

/** Detect and strip common root folder from paths */
function stripCommonRoot(
  paths: string[]
): { stripped: string[]; prefix: string } {
  const firstParts = paths.map((p) => {
    const idx = p.indexOf("/");
    return idx > 0 ? p.substring(0, idx) : null;
  });
  const commonRoot = firstParts[0];
  const allSameRoot =
    commonRoot &&
    firstParts.every((p) => p === commonRoot) &&
    paths.some((p) => {
      const s = p.substring(commonRoot.length + 1);
      return s === "index.htm" || s === "index.html";
    });

  const prefix = allSameRoot ? commonRoot + "/" : "";
  return {
    stripped: prefix
      ? paths.map((p) => p.replace(prefix, ""))
      : paths,
    prefix,
  };
}

interface FileToUpload {
  path: string;
  contentType: string;
  file: File;
  size: number;
}

/** Read all files from a dropped DataTransferItemList that contains a folder */
export async function readDroppedFolder(
  items: DataTransferItemList
): Promise<{ file: File; path: string }[] | null> {
  // Find the first directory entry
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry?.isDirectory) {
      const results: { file: File; path: string }[] = [];
      await readDirectoryRecursive(
        entry as FileSystemDirectoryEntry,
        "",
        results
      );
      return results;
    }
  }
  return null;
}

async function readDirectoryRecursive(
  dirEntry: FileSystemDirectoryEntry,
  basePath: string,
  results: { file: File; path: string }[]
): Promise<void> {
  const entries = await readAllEntries(dirEntry.createReader());
  for (const entry of entries) {
    const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;
    if (entry.isFile) {
      const file = await fileFromEntry(entry as FileSystemFileEntry);
      results.push({ file, path: entryPath });
    } else if (entry.isDirectory) {
      await readDirectoryRecursive(
        entry as FileSystemDirectoryEntry,
        entryPath,
        results
      );
    }
  }
}

function readAllEntries(
  reader: FileSystemDirectoryReader
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    function readBatch() {
      reader.readEntries((entries) => {
        if (entries.length === 0) {
          resolve(all);
        } else {
          all.push(...entries);
          readBatch();
        }
      }, reject);
    }
    readBatch();
  });
}

function fileFromEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

/** Pick a folder using the File System Access API (no scary browser dialog) */
export async function pickFolderNative(): Promise<
  { file: File; path: string }[] | null
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showDirectoryPicker = (window as any).showDirectoryPicker as
    | (() => Promise<FileSystemDirectoryHandle>)
    | undefined;
  if (!showDirectoryPicker) return null;

  try {
    const dirHandle = await showDirectoryPicker();
    const results: { file: File; path: string }[] = [];
    await readHandleRecursive(dirHandle, "", results);
    return results;
  } catch (err) {
    // User cancelled the picker
    if (err instanceof DOMException && err.name === "AbortError") return null;
    throw err;
  }
}

async function readHandleRecursive(
  dirHandle: FileSystemDirectoryHandle,
  basePath: string,
  results: { file: File; path: string }[]
): Promise<void> {
  // @ts-expect-error entries() is available on FileSystemDirectoryHandle
  for await (const [name, handle] of dirHandle.entries()) {
    const entryPath = basePath ? `${basePath}/${name}` : name;
    if (handle.kind === "file") {
      const file = await (handle as FileSystemFileHandle).getFile();
      results.push({ file, path: entryPath });
    } else if (handle.kind === "directory") {
      await readHandleRecursive(
        handle as FileSystemDirectoryHandle,
        entryPath,
        results
      );
    }
  }
}

/** Check if the File System Access API is available */
export function hasNativeFolderPicker(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export interface TourUploadHook {
  status: Status;
  progress: number;
  filesUploaded: number;
  filesTotal: number;
  error: string | null;
  tourUrl: string | null;
  upload: (file: File, projectId: string, tipologiaId?: string) => Promise<void>;
  uploadFolder: (files: FileList | { file: File; path: string }[], projectId: string, tipologiaId?: string) => Promise<void>;
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

  /** Shared: validate + upload files through server proxy */
  const presignAndUpload = useCallback(
    async (filesToUpload: FileToUpload[], projectId: string, tipologiaId?: string) => {
      setFilesTotal(filesToUpload.length);
      setStatus("uploading");

      const totalTourBytes = filesToUpload.reduce((sum, f) => sum + f.size, 0);

      // Validate permissions and get tourBaseUrl with a single presign call
      const firstBatch = filesToUpload.slice(0, Math.min(PRESIGN_BATCH_SIZE, filesToUpload.length));
      const presignBody: Record<string, unknown> = {
        proyecto_id: projectId,
        files: firstBatch.map((f) => ({
          path: f.path,
          contentType: f.contentType,
          size: f.size,
        })),
        total_tour_bytes: totalTourBytes,
      };
      if (tipologiaId) presignBody.tipologia_id = tipologiaId;

      const presignRes = await fetch("/api/tours/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presignBody),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || "Error al validar permisos");
      }

      const { tourBaseUrl } = await presignRes.json();

      if (cancelledRef.current) return;

      // Upload files through our API proxy (avoids R2 CORS issues)
      let uploaded = 0;
      const queue = [...filesToUpload];

      async function worker() {
        while (queue.length > 0) {
          if (cancelledRef.current) return;
          const item = queue.shift();
          if (!item) break;

          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("proyecto_id", projectId);
          formData.append("path", item.path);
          formData.append("contentType", item.contentType);
          if (tipologiaId) formData.append("tipologia_id", tipologiaId);

          const res = await fetch("/api/tours/upload-file", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({ error: "Upload failed" }));
            throw new Error(data.error || `Error subiendo ${item.path}: ${res.status}`);
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
    },
    []
  );

  /** Upload from ZIP file */
  const upload = useCallback(
    async (file: File, projectId: string, tipologiaId?: string) => {
      cancelledRef.current = false;
      setError(null);
      setTourUrl(null);
      setStatus("extracting");
      setProgress(0);
      setFilesUploaded(0);
      setFilesTotal(0);

      try {
        if (
          !file.name.toLowerCase().endsWith(".zip") &&
          file.type !== "application/zip" &&
          file.type !== "application/x-zip-compressed"
        ) {
          throw new Error("El archivo debe ser un ZIP");
        }

        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(file);

        const entries: {
          path: string;
          zipEntry: import("jszip").JSZipObject;
        }[] = [];
        zip.forEach((relativePath, zipEntry) => {
          if (zipEntry.dir) return;
          if (shouldSkip(relativePath)) return;
          entries.push({ path: relativePath, zipEntry });
        });

        if (entries.length === 0) {
          throw new Error("El ZIP está vacío");
        }

        const rawPaths = entries.map((e) => e.path);
        const { stripped } = stripCommonRoot(rawPaths);

        const finalEntries = entries.map((e, i) => ({
          ...e,
          finalPath: stripped[i],
        }));

        const hasIndex = finalEntries.some(
          (e) => e.finalPath === "index.htm" || e.finalPath === "index.html"
        );
        if (!hasIndex) {
          throw new Error(
            "No se encontró index.htm ni index.html en el ZIP. Asegúrate de exportar correctamente."
          );
        }

        const filesToUpload: FileToUpload[] = [];
        for (const entry of finalEntries) {
          if (cancelledRef.current) return;
          const data = await entry.zipEntry.async("uint8array");
          // Slice the exact bytes (data.buffer may be larger than the actual data)
          const slice = (data.buffer as ArrayBuffer).slice(
            data.byteOffset,
            data.byteOffset + data.byteLength
          );
          const f = new File(
            [slice],
            entry.finalPath.split("/").pop() || entry.finalPath,
            { type: getMimeType(entry.finalPath) }
          );
          filesToUpload.push({
            path: entry.finalPath,
            contentType: getMimeType(entry.finalPath),
            file: f,
            size: f.size,
          });
        }

        if (cancelledRef.current) return;

        await presignAndUpload(filesToUpload, projectId, tipologiaId);
      } catch (err) {
        if (cancelledRef.current) return;
        const message =
          err instanceof Error ? err.message : "Error al subir tour";
        setError(message);
        setStatus("error");
      }
    },
    [presignAndUpload]
  );

  /** Upload from folder (webkitdirectory FileList or pre-read entries) */
  const uploadFolder = useCallback(
    async (
      input: FileList | { file: File; path: string }[],
      projectId: string,
      tipologiaId?: string
    ) => {
      cancelledRef.current = false;
      setError(null);
      setTourUrl(null);
      setStatus("extracting");
      setProgress(0);
      setFilesUploaded(0);
      setFilesTotal(0);

      try {
        // Normalize input to { file, path }[]
        let rawFiles: { file: File; path: string }[];

        if (input instanceof FileList) {
          rawFiles = [];
          for (let i = 0; i < input.length; i++) {
            const f = input[i];
            // webkitRelativePath is "FolderName/subfolder/file.jpg"
            const path = f.webkitRelativePath || f.name;
            rawFiles.push({ file: f, path });
          }
        } else {
          rawFiles = input;
        }

        // Filter OS junk
        rawFiles = rawFiles.filter((f) => !shouldSkip(f.path));

        if (rawFiles.length === 0) {
          throw new Error("La carpeta está vacía");
        }

        // Strip common root folder
        const rawPaths = rawFiles.map((f) => f.path);
        const { stripped } = stripCommonRoot(rawPaths);

        const processedFiles = rawFiles.map((f, i) => ({
          ...f,
          finalPath: stripped[i],
        }));

        // Validate index exists
        const hasIndex = processedFiles.some(
          (f) =>
            f.finalPath === "index.htm" || f.finalPath === "index.html"
        );
        if (!hasIndex) {
          throw new Error(
            "No se encontró index.htm ni index.html en la carpeta. Asegúrate de seleccionar la carpeta exportada correcta."
          );
        }

        if (cancelledRef.current) return;

        const filesToUpload: FileToUpload[] = processedFiles.map((f) => ({
          path: f.finalPath,
          contentType: getMimeType(f.finalPath),
          file: f.file,
          size: f.file.size,
        }));

        await presignAndUpload(filesToUpload, projectId, tipologiaId);
      } catch (err) {
        if (cancelledRef.current) return;
        const message =
          err instanceof Error ? err.message : "Error al subir tour";
        setError(message);
        setStatus("error");
      }
    },
    [presignAndUpload]
  );

  return {
    status,
    progress,
    filesUploaded,
    filesTotal,
    error,
    tourUrl,
    upload,
    uploadFolder,
    reset,
    cancel,
  };
}
