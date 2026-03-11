import imageCompression from "browser-image-compression";

/** Threshold above which client-side compression kicks in (4 MB). */
const COMPRESS_THRESHOLD = 4 * 1024 * 1024;

/** Target max file size after compression (4 MB). */
const MAX_SIZE_MB = 4;

/**
 * Max dimension — the server further down-scales to 1920 px, so we keep
 * 4K here to preserve quality for large renders.
 */
const MAX_DIMENSION = 3840;

/**
 * Compress an image file client-side before uploading.
 *
 * - Skips files already under 4 MB.
 * - Skips non-image files (videos, PDFs, etc.).
 * - Runs in a Web Worker so the UI stays responsive.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= COMPRESS_THRESHOLD) return file;

  const compressed = await imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.85,
  });

  return compressed;
}
