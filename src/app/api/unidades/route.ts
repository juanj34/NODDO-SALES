import { pick } from "@/lib/api-utils";
import { getAuthContext, getAccessibleProjectIds } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const proyectoId = searchParams.get("proyecto_id");

    if (!proyectoId) {
      return NextResponse.json({ error: "proyecto_id es requerido" }, { status: 400 });
    }

    // Verify project access for collaborators
    const accessibleIds = await getAccessibleProjectIds(auth);
    if (accessibleIds && !accessibleIds.includes(proyectoId)) {
      return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
    }

    const { data, error } = await auth.supabase
      .from("unidades")
      .select("*, tipologia:tipologias(nombre), torre:torres(nombre)")
      .eq("proyecto_id", proyectoId)
      .order("piso", { ascending: false })
      .order("identificador");

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const body = await request.json();
    if (!body.proyecto_id || !body.identificador) {
      return NextResponse.json(
        { error: "proyecto_id e identificador son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("unidades")
      .insert(pick(body, ["proyecto_id", "tipologia_id", "identificador", "piso", "area_m2", "precio", "estado", "habitaciones", "banos", "orientacion", "vista", "notas", "fachada_id", "fachada_x", "fachada_y", "torre_id", "orden"]))
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
