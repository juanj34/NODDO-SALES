import { pick } from "@/lib/api-utils";
import { getAuthContext, getAccessibleProjectIds } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const proyectoId = searchParams.get("proyecto_id");
    const tipo = searchParams.get("tipo"); // optional: 'parqueadero' | 'deposito'

    if (!proyectoId) {
      return NextResponse.json({ error: "proyecto_id es requerido" }, { status: 400 });
    }

    const accessibleIds = await getAccessibleProjectIds(auth);
    if (accessibleIds && !accessibleIds.includes(proyectoId)) {
      return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
    }

    let query = auth.supabase
      .from("complementos")
      .select("*")
      .eq("proyecto_id", proyectoId)
      .order("orden");

    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

const COMPLEMENTO_FIELDS = [
  "proyecto_id", "torre_id", "unidad_id", "tipo", "subtipo",
  "identificador", "nivel", "area_m2", "precio", "estado", "notas", "orden",
];

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const body = await request.json();
    if (!body.proyecto_id || !body.identificador || !body.tipo) {
      return NextResponse.json(
        { error: "proyecto_id, identificador y tipo son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("complementos")
      .insert(pick(body, COMPLEMENTO_FIELDS))
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
