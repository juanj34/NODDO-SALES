import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/tiff",
  "image/bmp",
]);

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
]);

const AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
]);

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB (post client-side compression)
const MAX_AUDIO_SIZE = 15 * 1024 * 1024; // 15MB

const MAX_OPTIMIZED_WIDTH = 1920;
const OPTIMIZED_QUALITY = 80;
const THUMB_WIDTH = 400;
const THUMB_QUALITY = 70;

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "media";
    const folder = (formData.get("folder") as string) || "";

    if (!file) {
      return NextResponse.json(
        { error: "Archivo requerido" },
        { status: 400 }
      );
    }

    const isImage = IMAGE_TYPES.has(file.type);
    const isVideo = VIDEO_TYPES.has(file.type);
    const isAudio = AUDIO_TYPES.has(file.type);

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: `El video excede el limite de 50MB (${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    if (isAudio && file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: `El audio excede el limite de 15MB (${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `La imagen excede el limite de 10MB (${(file.size / 1024 / 1024).toFixed(1)}MB). Intenta con una imagen más pequeña.` },
        { status: 400 }
      );
    }

    const prefix = folder ? folder + "/" : "";
    const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Extract proyecto_id from folder path (e.g. "proyectos/UUID/galeria/slug")
    const folderMatch = folder.match(/^proyectos\/([a-f0-9-]+)/i);
    const proyectoId = folderMatch?.[1] || null;

    // Non-image files: upload as-is (PDFs, etc.)
    if (!isImage) {
      const ext = file.name.split(".").pop() || "bin";
      const fileName = `${prefix}${baseName}.${ext}`;

      const { error: uploadError } = await auth.supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Increment storage counter
      if (proyectoId) {
        auth.supabase.rpc("increment_storage_media_bytes", {
          p_id: proyectoId,
          p_bytes: file.size,
        }).then();
      }

      const {
        data: { publicUrl },
      } = auth.supabase.storage.from(bucket).getPublicUrl(fileName);

      return NextResponse.json({ url: publicUrl, path: fileName });
    }

    // Image processing with Sharp
    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    const origWidth = metadata.width || 0;
    const origHeight = metadata.height || 0;

    // Generate optimized WebP
    const optimizedFileName = `${prefix}${baseName}.webp`;
    const optimized = await sharp(buffer)
      .resize({
        width: Math.min(origWidth, MAX_OPTIMIZED_WIDTH),
        withoutEnlargement: true,
      })
      .webp({ quality: OPTIMIZED_QUALITY })
      .toBuffer();

    const { error: optError } = await auth.supabase.storage
      .from(bucket)
      .upload(optimizedFileName, optimized, {
        upsert: true,
        contentType: "image/webp",
      });
    if (optError) throw optError;

    // Generate thumbnail WebP
    const thumbFileName = `${prefix}thumbs/${baseName}.webp`;
    const thumbnail = await sharp(buffer)
      .resize({
        width: THUMB_WIDTH,
        withoutEnlargement: true,
      })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer();

    const { error: thumbError } = await auth.supabase.storage
      .from(bucket)
      .upload(thumbFileName, thumbnail, {
        upsert: true,
        contentType: "image/webp",
      });
    if (thumbError) throw thumbError;

    // Get public URLs
    const {
      data: { publicUrl: optimizedUrl },
    } = auth.supabase.storage.from(bucket).getPublicUrl(optimizedFileName);

    const {
      data: { publicUrl: thumbnailUrl },
    } = auth.supabase.storage.from(bucket).getPublicUrl(thumbFileName);

    // Increment storage counter (optimized + thumbnail)
    if (proyectoId) {
      auth.supabase.rpc("increment_storage_media_bytes", {
        p_id: proyectoId,
        p_bytes: optimized.length + thumbnail.length,
      }).then();
    }

    // Calculate optimized dimensions
    const scale = origWidth > MAX_OPTIMIZED_WIDTH
      ? MAX_OPTIMIZED_WIDTH / origWidth
      : 1;
    const finalWidth = Math.round(origWidth * scale);
    const finalHeight = Math.round(origHeight * scale);

    return NextResponse.json({
      url: optimizedUrl,
      thumbnail_url: thumbnailUrl,
      width: finalWidth,
      height: finalHeight,
      original_width: origWidth,
      original_height: origHeight,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al subir" },
      { status: 500 }
    );
  }
}
