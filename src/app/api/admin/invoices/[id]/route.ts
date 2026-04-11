import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const VALID_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"];

/** PUT /api/admin/invoices/[id] — Update invoice status or fields */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const updates: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Status inválido. Opciones: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }
    updates.status = body.status;
    if (body.status === "paid") {
      updates.paid_at = new Date().toISOString();
      if (body.payment_method) updates.payment_method = body.payment_method;
    }
  }

  if (body.amount !== undefined) updates.amount = body.amount;
  if (body.due_date !== undefined) updates.due_date = body.due_date;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.billing_period_start !== undefined) updates.billing_period_start = body.billing_period_start;
  if (body.billing_period_end !== undefined) updates.billing_period_end = body.billing_period_end;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("invoices")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log billing event
  if (body.status === "paid") {
    await admin.from("billing_events").insert({
      user_id: data.user_id,
      event_type: "payment_received",
      details: {
        invoice_id: id,
        invoice_number: data.invoice_number,
        amount: data.amount,
        payment_method: body.payment_method || null,
      },
    });
  }

  return NextResponse.json(data);
}
