import { getAuthContext, getAccessibleProjectIds, requirePermission } from "@/lib/auth-context";
import { pick } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity-logger";
import { reportApiError } from "@/lib/error-reporter";
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
    void reportApiError(err, { route: "/api/proyectos", statusCode: 500 });
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
      .from("proyectos")
      .select("id")
      .eq("slug", slug)
      .single();

    if (slugExists) {
      return NextResponse.json(
        { error: "Este nombre ya está en uso" },
        { status: 409 }
      );
    }

    // Check subdomain uniqueness (someone may have manually set their subdomain to this value)
    const { data: subdomainExists } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("subdomain", slug)
      .single();

    if (subdomainExists) {
      return NextResponse.json(
        { error: "Este subdominio ya está en uso" },
        { status: 409 }
      );
    }

    const insertData = {
      ...pick(body, ["nombre", "slug", "descripcion", "estado"]),
      user_id: auth.adminUserId,
      subdomain: slug,
    };

    const { data, error } = await auth.supabase
      .from("proyectos")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    logActivity({
      userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
      proyectoId: data.id, proyectoNombre: data.nombre,
      actionType: "project.create", actionCategory: "project",
      entityType: "proyecto", entityId: data.id,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    void reportApiError(err, { route: "/api/proyectos", statusCode: 500 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
