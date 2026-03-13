import { getAuthContext, getAccessibleProjectIds } from "@/lib/auth-context";
import { pick } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let query = auth.supabase
      .from("proyectos")
      .select("*")
      .eq("user_id", auth.adminUserId)
      .order("created_at", { ascending: false });

    const accessibleIds = await getAccessibleProjectIds(auth);
    if (accessibleIds) {
      query = query.in("id", accessibleIds);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
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
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores pueden crear proyectos" }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, slug } = body;

    if (!nombre || !slug) {
      return NextResponse.json(
        { error: "Nombre y slug son requeridos" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const { data: existing } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Este slug ya está en uso" },
        { status: 409 }
      );
    }

    const insertData = {
      ...pick(body, ["nombre", "slug", "descripcion", "estado"]),
      user_id: auth.user.id,
      subdomain: slug,
    };

    const { data, error } = await auth.supabase
      .from("proyectos")
      .insert(insertData)
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
