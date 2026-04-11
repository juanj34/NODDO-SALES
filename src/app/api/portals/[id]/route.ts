import { getAuthContext } from "@/lib/auth-context";
import { pick } from "@/lib/api-utils";
import { reportApiError } from "@/lib/error-reporter";
import { addDomainToVercel, removeDomainFromVercel } from "@/lib/vercel";
import { NextRequest, NextResponse } from "next/server";

const PORTAL_FIELDS = [
  "nombre", "slug", "logo_url", "descripcion", "color_primario",
  "layout", "custom_domain", "proyecto_ids", "hero_video_url", "metadata",
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: portal, error } = await auth.supabase
      .from("constructora_portals")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (error || !portal) {
      return NextResponse.json(
        { error: "Portal no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(portal);
  } catch (err) {
    void reportApiError(err, { route: "/api/portals/[id]", statusCode: 500 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();

    // Get current portal to detect slug changes
    const { data: current } = await auth.supabase
      .from("constructora_portals")
      .select("slug")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!current) {
      return NextResponse.json({ error: "Portal no encontrado" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      ...pick(body, PORTAL_FIELDS),
      updated_at: new Date().toISOString(),
    };

    // If slug is changing, check uniqueness
    if (body.slug !== undefined) {
      const { data: slugExists } = await auth.supabase
        .from("constructora_portals")
        .select("id")
        .eq("slug", body.slug)
        .neq("id", id)
        .maybeSingle();

      if (slugExists) {
        return NextResponse.json(
          { error: "Este slug ya está en uso" },
          { status: 409 }
        );
      }
    }

    const { data, error } = await auth.supabase
      .from("constructora_portals")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select()
      .single();

    if (error) throw error;

    // Register new subdomain with Vercel if slug changed (best-effort)
    if (process.env.AUTH_BEARER_TOKEN && process.env.VERCEL_PROJECT_ID) {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "noddo.io";
      const oldSlug = current.slug as string;
      const newSlug = data?.slug as string;
      try {
        if (newSlug && newSlug !== oldSlug) {
          await removeDomainFromVercel(`${oldSlug}.${rootDomain}`);
          await addDomainToVercel(`${newSlug}.${rootDomain}`);
        }
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json(data);
  } catch (err) {
    void reportApiError(err, { route: "/api/portals/[id]", statusCode: 500 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    // Get slug before deleting to remove domain from Vercel
    const { data: portal } = await auth.supabase
      .from("constructora_portals")
      .select("slug")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    const { error } = await auth.supabase
      .from("constructora_portals")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    // Remove subdomain from Vercel (best-effort)
    if (process.env.AUTH_BEARER_TOKEN && process.env.VERCEL_PROJECT_ID && portal?.slug) {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "noddo.io";
      try {
        await removeDomainFromVercel(`${portal.slug}.${rootDomain}`);
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    void reportApiError(err, { route: "/api/portals/[id]", statusCode: 500 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
