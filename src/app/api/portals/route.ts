import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { pick } from "@/lib/api-utils";
import { reportApiError } from "@/lib/error-reporter";
import { addDomainToVercel } from "@/lib/vercel";
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
    const denied = requirePermission(auth, "project.create");
    if (denied) return denied;

    // Check user has 2+ published projects
    const { count, error: countError } = await auth.supabase
      .from("proyectos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.adminUserId)
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
      .eq("user_id", auth.adminUserId)
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
      user_id: auth.adminUserId,
    };

    const { data, error } = await auth.supabase
      .from("constructora_portals")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Register subdomain with Vercel (best-effort)
    if (process.env.AUTH_BEARER_TOKEN && process.env.VERCEL_PROJECT_ID && data?.slug) {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "noddo.io";
      try {
        await addDomainToVercel(`${data.slug}.${rootDomain}`);
      } catch {
        // Non-blocking — domain saved in DB regardless
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    void reportApiError(err, { route: "/api/portals", statusCode: 500 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
