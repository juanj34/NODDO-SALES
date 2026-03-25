import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const body = await request.json();
    const { categoria_id, imagenes } = body;

    if (!categoria_id || !Array.isArray(imagenes) || imagenes.length === 0) {
      return NextResponse.json(
        { error: "categoria_id e imagenes[] son requeridos" },
        { status: 400 }
      );
    }

    // Get current max orden for this category
    const { data: existing } = await auth.supabase
      .from("galeria_imagenes")
      .select("orden")
      .eq("categoria_id", categoria_id)
      .order("orden", { ascending: false })
      .limit(1);

    let nextOrden = (existing?.[0]?.orden ?? -1) + 1;

    const rows = imagenes.map(
      (img: { url: string; thumbnail_url?: string }) => ({
        categoria_id,
        url: img.url,
        thumbnail_url: img.thumbnail_url || null,
        orden: nextOrden++,
      })
    );

    const { data, error } = await auth.supabase
      .from("galeria_imagenes")
      .insert(rows)
      .select();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
