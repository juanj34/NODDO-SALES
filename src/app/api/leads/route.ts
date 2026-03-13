import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLeadNotification } from "@/lib/email";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 leads per minute per IP
    const ip = getClientIp(request);
    if (isRateLimited("leads", ip, 5, 60_000)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
        { status: 429 }
      );
    }

    // POST is public — no auth needed for lead creation
    const supabase = await createClient();
    const body = await request.json();

    const { nombre, email, proyecto_id } = body;

    if (!nombre || !email || !proyecto_id) {
      return NextResponse.json(
        { error: "Nombre, email y proyecto son requeridos" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      );
    }

    // Truncate string fields to prevent abuse
    const clean = (val: unknown, max: number) =>
      typeof val === "string" ? val.slice(0, max) : null;

    const { data, error } = await supabase
      .from("leads")
      .insert({
        proyecto_id: body.proyecto_id,
        nombre: clean(body.nombre, 200),
        email: clean(body.email, 320),
        telefono: clean(body.telefono, 30),
        pais: clean(body.pais, 100),
        tipologia_interes: clean(body.tipologia_interes, 200),
        mensaje: clean(body.mensaje, 2000),
        utm_source: clean(body.utm_source, 200),
        utm_medium: clean(body.utm_medium, 200),
        utm_campaign: clean(body.utm_campaign, 200),
      })
      .select()
      .single();

    if (error) throw error;

    // Send email notification to project admin (non-blocking)
    sendLeadNotificationAsync(body.proyecto_id, {
      leadName: body.nombre,
      leadEmail: body.email,
      leadPhone: body.telefono || null,
      leadTypology: body.tipologia_interes || null,
      leadMessage: body.mensaje || null,
      leadCountry: body.pais || null,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

async function sendLeadNotificationAsync(
  projectId: string,
  leadData: {
    leadName: string;
    leadEmail: string;
    leadPhone?: string | null;
    leadTypology?: string | null;
    leadMessage?: string | null;
    leadCountry?: string | null;
  }
) {
  try {
    const adminSupabase = createAdminClient();

    // Fetch project name and owner
    const { data: proyecto } = await adminSupabase
      .from("proyectos")
      .select("nombre, user_id")
      .eq("id", projectId)
      .single();

    if (!proyecto) return;

    // Fetch admin email
    const { data: userData } = await adminSupabase.auth.admin.getUserById(proyecto.user_id);
    if (!userData?.user?.email) return;

    await sendLeadNotification({
      adminEmail: userData.user.email,
      projectName: proyecto.nombre,
      ...leadData,
    });
  } catch (err) {
    console.error("[leads] Error sending notification:", err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    // Both admin and collaborator can access leads

    const { searchParams } = new URL(request.url);
    const tipologia = searchParams.get("tipologia");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;

    // Get user's projects (use adminUserId for filtering)
    const { data: proyectos } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("user_id", auth.adminUserId);

    if (!proyectos?.length) {
      return NextResponse.json({ data: [], total: 0, page, limit });
    }

    const projectIds = proyectos.map((p) => p.id);

    // Count query (same filters, no data)
    let countQuery = auth.supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .in("proyecto_id", projectIds);

    if (tipologia) countQuery = countQuery.eq("tipologia_interes", tipologia);
    if (search) countQuery = countQuery.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`);

    const { count } = await countQuery;

    // Data query with pagination
    let query = auth.supabase
      .from("leads")
      .select("*")
      .in("proyecto_id", projectIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (tipologia) {
      query = query.eq("tipologia_interes", tipologia);
    }
    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data || [], total: count || 0, page, limit });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
