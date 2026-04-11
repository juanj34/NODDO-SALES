import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInvoiceNumber, getDefaultBillingPeriod } from "@/lib/invoice-utils";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/admin/invoices — List all invoices with optional filters */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const userId = url.searchParams.get("user_id");
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  let query = admin
    .from("invoices")
    .select("*, proyectos(nombre, slug)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (userId) query = query.eq("user_id", userId);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with user emails
  const userIds = [...new Set((data ?? []).map((d) => d.user_id))];
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000, page: 1 });
  const emailMap = new Map<string, string>();
  for (const u of authData?.users ?? []) {
    emailMap.set(u.id, u.email ?? "");
  }

  const enriched = (data ?? []).map((inv) => ({
    ...inv,
    user_email: emailMap.get(inv.user_id) || "",
    proyecto_nombre: inv.proyectos?.nombre || null,
  }));

  return NextResponse.json({ invoices: enriched, total: count ?? enriched.length });
}

/** POST /api/admin/invoices — Create a new invoice */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { user_id, proyecto_id, plan, amount, currency, notes } = body as {
    user_id: string;
    proyecto_id?: string;
    plan: string;
    amount: number;
    currency?: string;
    notes?: string;
  };

  if (!user_id || !plan || amount === undefined) {
    return NextResponse.json(
      { error: "user_id, plan, y amount son requeridos" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const invoiceNumber = await generateInvoiceNumber(admin);
  const billing = getDefaultBillingPeriod();

  const { data, error } = await admin.from("invoices").insert({
    user_id,
    proyecto_id: proyecto_id || null,
    invoice_number: invoiceNumber,
    plan,
    amount,
    currency: currency || "USD",
    status: "draft",
    billing_period_start: billing.billing_period_start,
    billing_period_end: billing.billing_period_end,
    due_date: billing.due_date,
    notes: notes || null,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log billing event
  await admin.from("billing_events").insert({
    user_id,
    event_type: "invoice_created",
    details: { invoice_id: data.id, invoice_number: invoiceNumber, amount, plan },
  });

  return NextResponse.json(data, { status: 201 });
}
