import { getAuthContext } from "@/lib/auth-context";
import { pick } from "@/lib/api-utils";
import { reportApiError } from "@/lib/error-reporter";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data, error } = await auth.supabase
      .from("constructora_portals")
      .select("*")
      .eq("user_id", auth.adminUserId)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    void reportApiError(err, { route: "/api/portals", statusCode: 500 });
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
      return NextResponse.json(
        { error: "Solo administradores pueden crear portales" },
        { status: 403 }
      );
    }

    // Check user has 2+ published projects
    const { count, error: countError } = await auth.supabase
      .from("proyectos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.user.id)
      .eq("estado", "publicado");

    if (countError) throw countError;

    if ((count ?? 0) < 2) {
      return NextResponse.json(
        { error: "Necesitas al menos 2 proyectos publicados para crear un portal" },
        { status: 400 }
      );
    }

    // Check user doesn't already have a portal
    const { data: existing } = await auth.supabase
      .from("constructora_portals")
      .select("id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Ya tienes un portal creado" },
        { status: 409 }
      );
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
    const { data: slugExists } = await auth.supabase
      .from("constructora_portals")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugExists) {
      return NextResponse.json(
        { error: "Este slug ya está en uso" },
        { status: 409 }
      );
    }

    const insertData = {
      ...pick(body, [
        "nombre", "slug", "logo_url", "descripcion", "color_primario",
        "layout", "custom_domain", "proyecto_ids", "hero_video_url", "metadata",
      ]),
      user_id: auth.user.id,
    };

    const { data, error } = await auth.supabase
      .from("constructora_portals")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    void reportApiError(err, { route: "/api/portals", statusCode: 500 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
