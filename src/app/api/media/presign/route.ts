import { getAuthContext, requirePermission, type AuthContext } from "@/lib/auth-context";
import { getPresignedMediaUploadUrl, ensureMediaBucketCors } from "@/lib/r2";
import { reportApiError } from "@/lib/error-reporter";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export async function POST(request: NextRequest) {
  let auth: AuthContext | null = null;
  let reqBody: Record<string, unknown> | null = null;

  try {
    auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "upload.files");
    if (denied) return denied;

    reqBody = await request.json();
    const { folder, fileName, contentType, size } = reqBody as {
      folder: string;
      fileName: string;
      contentType: string;
      size: number;
    };

    if (!folder || !fileName || !contentType || !size) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: folder, fileName, contentType, size" },
        { status: 400 }
      );
    }

    // Path traversal protection
    if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
      return NextResponse.json(
        { error: "Nombre de archivo inválido" },
        { status: 400 }
      );
    }

    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo excede el límite de 500MB (${(size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    await ensureMediaBucketCors();

    const result = await getPresignedMediaUploadUrl(
      auth.user.id,
      folder,
      fileName,
      contentType,
      size,
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("[media/presign] Error:", err);
    void reportApiError(err, {
      route: "/api/media/presign",
      method: "POST",
      statusCode: 500,
      user: auth ? { id: auth.user.id, email: auth.user.email, role: auth.role } : null,
      metadata: { folder: reqBody?.folder, fileName: reqBody?.fileName },
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al generar URL" },
      { status: 500 }
    );
  }
}
