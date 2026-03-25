import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { uploadFileToR2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("proyecto_id") as string | null;
    const path = formData.get("path") as string | null;
    const contentType = formData.get("contentType") as string | null;
    const tipologiaId = formData.get("tipologia_id") as string | null;

    if (!file || !projectId || !path) {
      return NextResponse.json(
        { error: "file, proyecto_id y path son requeridos" },
        { status: 400 }
      );
    }

    // Sanitize path
    if (path.includes("..") || path.startsWith("/") || path.startsWith("\\")) {
      return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
    }

    // Verify project ownership
    const { data: proyecto } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", auth.user.id)
      .single();

    if (!proyecto) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fullPath = tipologiaId ? `tipologias/${tipologiaId}/${path}` : path;
    await uploadFileToR2(projectId, fullPath, buffer, contentType || file.type);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tours/upload-file] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al subir archivo" },
      { status: 500 }
    );
  }
}
