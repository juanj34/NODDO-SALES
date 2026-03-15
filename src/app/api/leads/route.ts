import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLeadNotification, sendLeadConfirmation } from "@/lib/email";
import { leadLimiter, checkRateLimit, rateLimitExceeded } from "@/lib/rate-limit";
import { getWebhookConfig, dispatchWebhook } from "@/lib/webhooks";
import { verifyRecaptcha, getRecaptchaToken } from "@/lib/recaptcha";
import type { WebhookPayload } from "@/lib/webhooks";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 leads per hour per IP (via Upstash Redis)
    const { success, headers } = await checkRateLimit(request, leadLimiter);
    if (!success) {
      return rateLimitExceeded(headers);
    }

    // POST is public — no auth needed for lead creation
    const supabase = await createClient();
    const body = await request.json();

    // Verify reCAPTCHA token
    const recaptchaToken = getRecaptchaToken(body);
    const isHuman = await verifyRecaptcha(recaptchaToken || "", "lead_submit", 0.5);
    if (!isHuman) {
      return NextResponse.json(
        { error: "Verificación de seguridad fallida. Por favor intenta de nuevo." },
        { status: 403 }
      );
    }

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

    // Dispatch webhook (fire-and-forget)
    fireLeadWebhook(body.proyecto_id, data);

    // Send confirmation email to lead (non-blocking)
    sendLeadConfirmationAsync(body.proyecto_id, body.nombre, body.email);

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

async function sendLeadConfirmationAsync(projectId: string, name: string, email: string) {
  try {
    const adminSupabase = createAdminClient();
    const { data: proyecto } = await adminSupabase
      .from("proyectos")
      .select("nombre")
      .eq("id", projectId)
      .single();
    if (!proyecto) return;

    await sendLeadConfirmation({
      email,
      name,
      projectName: proyecto.nombre,
    });
  } catch (err) {
    console.error("[leads] Error sending lead confirmation:", err);
  }
}

async function fireLeadWebhook(projectId: string, lead: Record<string, unknown>) {
  try {
    const wh = await getWebhookConfig(projectId, "lead.created");
    if (!wh) return;

    const payload: WebhookPayload = {
      event: "lead.created",
      timestamp: new Date().toISOString(),
      proyecto_id: projectId,
      proyecto_nombre: wh.projectName,
      data: {
        id: lead.id,
        nombre: lead.nombre,
        email: lead.email,
        telefono: lead.telefono ?? null,
        pais: lead.pais ?? null,
        tipologia_interes: lead.tipologia_interes ?? null,
        mensaje: lead.mensaje ?? null,
        utm_source: lead.utm_source ?? null,
        utm_medium: lead.utm_medium ?? null,
        utm_campaign: lead.utm_campaign ?? null,
        status: lead.status ?? "nuevo",
        created_at: lead.created_at,
      },
    };
    dispatchWebhook(projectId, wh.config, payload);
  } catch (err) {
    console.error("[leads] Webhook error:", err);
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
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const proyectoIdFilter = searchParams.get("proyecto_id");
    const source = searchParams.get("source");
    const sort = searchParams.get("sort") || "newest";
    const includeStats = searchParams.get("include_stats") === "true";
    const includeCotizCount = searchParams.get("include_cotizacion_count") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;

    // Get user's projects with names (use adminUserId for filtering)
    const { data: proyectos } = await auth.supabase
      .from("proyectos")
      .select("id, nombre")
      .eq("user_id", auth.adminUserId);

    if (!proyectos?.length) {
      const emptyResponse: Record<string, unknown> = { data: [], total: 0, page, limit };
      if (includeStats) {
        emptyResponse.stats = { total_all: 0, this_month: 0, with_cotizaciones: 0, by_status: {} };
        emptyResponse.projects = [];
      }
      return NextResponse.json(emptyResponse);
    }

    const projectNameMap = new Map(proyectos.map((p) => [p.id, p.nombre]));
    let activeProjectIds = proyectos.map((p) => p.id);

    // If filtering by specific project, verify ownership
    if (proyectoIdFilter) {
      if (!activeProjectIds.includes(proyectoIdFilter)) {
        return NextResponse.json({ error: "Proyecto no autorizado" }, { status: 403 });
      }
      activeProjectIds = [proyectoIdFilter];
    }

    // Build shared filter function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyFilters = (q: any) => {
      let filtered = q.in("proyecto_id", activeProjectIds);
      if (tipologia) filtered = filtered.eq("tipologia_interes", tipologia);
      if (status) filtered = filtered.eq("status", status);
      if (source) filtered = filtered.eq("utm_source", source);
      if (dateFrom) filtered = filtered.gte("created_at", dateFrom + "T00:00:00");
      if (dateTo) filtered = filtered.lte("created_at", dateTo + "T23:59:59");
      if (search) {
        filtered = filtered.or(
          `nombre.ilike.%${search}%,email.ilike.%${search}%,telefono.ilike.%${search}%`
        );
      }
      return filtered;
    };

    // Count query
    const { count } = await applyFilters(
      auth.supabase.from("leads").select("*", { count: "exact", head: true })
    );

    // Data query with pagination
    const { data, error } = await applyFilters(
      auth.supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: sort === "oldest" })
        .range(offset, offset + limit - 1)
    );

    if (error) throw error;

    const leads = data || [];

    // Enrich leads with proyecto_nombre
    const enrichedLeads = leads.map((l: Record<string, unknown>) => ({
      ...l,
      proyecto_nombre: projectNameMap.get(l.proyecto_id as string) || "",
      cotizaciones_count: 0,
    }));

    // Fetch cotizaciones counts for leads on this page
    if (includeCotizCount && enrichedLeads.length > 0) {
      const emails = [...new Set(enrichedLeads.map((l: Record<string, unknown>) => l.email as string))];
      const { data: cotizRows } = await auth.supabase
        .from("cotizaciones")
        .select("email, proyecto_id")
        .in("proyecto_id", activeProjectIds)
        .in("email", emails);

      if (cotizRows) {
        const countMap = new Map<string, number>();
        for (const c of cotizRows) {
          const key = `${c.email}__${c.proyecto_id}`;
          countMap.set(key, (countMap.get(key) || 0) + 1);
        }
        for (const lead of enrichedLeads) {
          const key = `${lead.email}__${lead.proyecto_id}`;
          lead.cotizaciones_count = countMap.get(key) || 0;
        }
      }
    }

    const response: Record<string, unknown> = {
      data: enrichedLeads,
      total: count || 0,
      page,
      limit,
    };

    // Compute stats if requested
    if (includeStats) {
      const allProjectIds = proyectos.map((p) => p.id);

      // Total all leads (no filters)
      const { count: totalAll } = await auth.supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .in("proyecto_id", allProjectIds);

      // This month
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);
      const { count: thisMonth } = await auth.supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .in("proyecto_id", allProjectIds)
        .gte("created_at", firstOfMonth.toISOString());

      // Leads with cotizaciones (distinct emails in cotizaciones that exist in leads)
      const { data: cotizEmails } = await auth.supabase
        .from("cotizaciones")
        .select("email, proyecto_id")
        .in("proyecto_id", allProjectIds);

      const uniqueCotizPairs = new Set<string>();
      if (cotizEmails) {
        for (const c of cotizEmails) {
          uniqueCotizPairs.add(`${c.email}__${c.proyecto_id}`);
        }
      }

      // Count leads matching those pairs
      // Since we can't do a join easily, get all lead emails in a single query
      const { data: allLeadPairs } = await auth.supabase
        .from("leads")
        .select("email, proyecto_id")
        .in("proyecto_id", allProjectIds);

      let withCotizaciones = 0;
      const seenPairs = new Set<string>();
      if (allLeadPairs) {
        for (const l of allLeadPairs) {
          const key = `${l.email}__${l.proyecto_id}`;
          if (uniqueCotizPairs.has(key) && !seenPairs.has(key)) {
            withCotizaciones++;
            seenPairs.add(key);
          }
        }
      }

      // By status counts
      const statuses = ["nuevo", "contactado", "calificado", "cerrado"];
      const byStatus: Record<string, number> = {};
      await Promise.all(
        statuses.map(async (s) => {
          const { count: c } = await auth.supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .in("proyecto_id", allProjectIds)
            .eq("status", s);
          byStatus[s] = c || 0;
        })
      );

      response.stats = {
        total_all: totalAll || 0,
        this_month: thisMonth || 0,
        with_cotizaciones: withCotizaciones,
        by_status: byStatus,
      };
      response.projects = proyectos.map((p) => ({ id: p.id, nombre: p.nombre }));
    }

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
