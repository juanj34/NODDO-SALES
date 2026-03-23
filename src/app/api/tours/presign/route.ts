import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";
import { checkFeature } from "@/lib/feature-flags";
import { checkFeatureAccess } from "@/lib/feature-access";
import { getPresignedUploadUrls, type FileToSign } from "@/lib/r2";

const MAX_FILES = 100_000;
const MAX_TOTAL_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();
    const { proyecto_id, files, total_tour_bytes, tipologia_id } = body as {
      proyecto_id: string;
      files: FileToSign[];
      total_tour_bytes?: number;
      tipologia_id?: string;
    };

    if (!proyecto_id || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "proyecto_id y files son requeridos" },
        { status: 400 }
      );
    }

    // Check plan-based access first
    const planAccess = await checkFeatureAccess(auth.supabase, auth.adminUserId, "tour_360");
    if (!planAccess.allowed) {
      return NextResponse.json(
        {
          error: `Tours 360° requieren plan ${planAccess.requiredPlan}`,
          upgrade_required: true,
          current_plan: planAccess.currentPlan,
          required_plan: planAccess.requiredPlan,
        },
        { status: 403 }
      );
    }

    // Check feature flag
    const tourEnabled = await checkFeature(auth.supabase, proyecto_id, "tour_360");
    if (!tourEnabled) {
      return NextResponse.json(
        { error: "Tour 360 no está habilitado para este proyecto" },
        { status: 403 }
      );
    }

    // Verify project ownership
    const { data: proyecto, error: projErr } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("id", proyecto_id)
      .eq("user_id", auth.user.id)
      .single();

    if (projErr || !proyecto) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Validate limits
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_FILES} archivos por tour` },
        { status: 400 }
      );
    }

    let totalSize = 0;
    for (const file of files) {
      // Sanitize path — reject traversal and absolute paths
      if (
        !file.path ||
        file.path.includes("..") ||
        file.path.startsWith("/") ||
        file.path.startsWith("\\")
      ) {
        return NextResponse.json(
          { error: `Ruta inválida: ${file.path}` },
          { status: 400 }
        );
      }
      totalSize += file.size || 0;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: "El tour excede el tamaño máximo de 5GB" },
        { status: 400 }
      );
    }

    const subpath = tipologia_id ? `tipologias/${tipologia_id}` : undefined;
    const result = await getPresignedUploadUrls(proyecto_id, files, subpath);

    // Track tour storage size (only when client sends the total across all batches)
    if (typeof total_tour_bytes === "number" && total_tour_bytes > 0) {
      await auth.supabase
        .from("proyectos")
        .update({ storage_tours_bytes: total_tour_bytes })
        .eq("id", proyecto_id);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[tours/presign] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al generar URLs" },
      { status: 500 }
    );
  }
}
