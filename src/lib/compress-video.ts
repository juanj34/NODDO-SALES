import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

/** Only compress videos larger than 5 MB. */
const COMPRESS_THRESHOLD = 5 * 1024 * 1024;

/** Singleton — reuse across multiple compressions in the same session. */
let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<void> | null = null;

/** CDN base for the single-threaded build (no SharedArrayBuffer needed). */
const CORE_VERSION = "0.12.6";
const BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg;

  if (!loadPromise) {
    ffmpeg = new FFmpeg();
    loadPromise = (async () => {
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${BASE_URL}/ffmpeg-core.js`, "text/javascript"),
        toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
      ]);
      await ffmpeg!.load({ coreURL, wasmURL });
    })();
  }

  await loadPromise;
  return ffmpeg!;
}

/**
 * Compress a video file client-side using FFmpeg WASM before uploading.
 *
 * - Skips files already under 5 MB.
 * - Skips non-video files.
 * - Uses H.264 with CRF 28, strips audio (hero videos are muted).
 * - Scales down to max 1920px width if larger.
 * - On failure, returns the original file (graceful degradation).
 */
export async function compressVideo(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<File> {
  if (!file.type.startsWith("video/")) return file;
  if (file.size <= COMPRESS_THRESHOLD) return file;

  try {
    const ff = await getFFmpeg();

    ff.on("progress", ({ progress }) => {
      onProgress?.(Math.max(0, Math.min(1, progress)));
    });

    const inputName = "input" + getExtension(file.name);
    const outputName = "output.mp4";

    await ff.writeFile(inputName, await fetchFile(file));

    await ff.exec([
      "-i", inputName,
      "-c:v", "libx264",
      "-crf", "28",
      "-preset", "fast",
      "-an",                                    // strip audio (muted hero)
      "-vf", "scale='min(1920,iw)':-2",        // cap at 1920px width
      "-movflags", "+faststart",                // progressive loading
      "-y", outputName,
    ]);

    const data = await ff.readFile(outputName);
    // Copy to plain ArrayBuffer (readFile returns Uint8Array backed by ArrayBufferLike)
    const bytes = new Uint8Array(data as Uint8Array);
    const blob = new Blob([bytes.buffer], { type: "video/mp4" });

    // Clean up virtual filesystem
    await ff.deleteFile(inputName).catch(() => {});
    await ff.deleteFile(outputName).catch(() => {});

    // Only use compressed version if it's actually smaller
    if (blob.size >= file.size) return file;

    const compressedName = file.name.replace(/\.[^.]+$/, ".mp4");
    return new File([blob], compressedName, { type: "video/mp4" });
  } catch {
    // Graceful degradation — upload the original file
    console.warn("Video compression failed, uploading original");
    return file;
  }
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot) : ".mp4";
}
