import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentReminderEmail, sendPaymentOverdueEmail } from "@/lib/email";
import { formatInvoiceAmount } from "@/lib/invoice-utils";

/**
 * Cron: Daily billing reminders (10 AM Colombia = 15:00 UTC)
 *
 * 1. Invoices with status "sent" due within 7 days → send reminder
 * 2. Invoices with status "sent" past due → mark overdue + send notification
 */
export async function GET(request: NextRequest) {
  // Auth check
  if (process.env.NODE_ENV !== "development") {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000);

  let remindersSent = 0;
  let overdueMarked = 0;

  // Get user emails
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000, page: 1 });
  const emailMap = new Map<string, string>();
  for (const u of authData?.users ?? []) {
    emailMap.set(u.id, u.email ?? "");
  }

  // 1. Find invoices due within 7 days (still "sent" status)
  const { data: dueSoon } = await admin
    .from("invoices")
    .select("*")
    .eq("status", "sent")
    .gte("due_date", now.toISOString())
    .lte("due_date", sevenDaysFromNow.toISOString());

  for (const inv of dueSoon ?? []) {
    const email = emailMap.get(inv.user_id);
    if (!email) continue;

    await sendPaymentReminderEmail({
      toEmail: email,
      invoiceNumber: inv.invoice_number,
      amount: formatInvoiceAmount(inv.amount, inv.currency),
      dueDate: new Date(inv.due_date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }),
    });

    await admin.from("billing_events").insert({
      user_id: inv.user_id,
      event_type: "reminder_sent",
      details: { invoice_id: inv.id, invoice_number: inv.invoice_number },
    });

    remindersSent++;
  }

  // 2. Find overdue invoices (past due_date, still "sent")
  const { data: overdue } = await admin
    .from("invoices")
    .select("*")
    .eq("status", "sent")
    .lt("due_date", now.toISOString());

  for (const inv of overdue ?? []) {
    // Update status to overdue
    await admin.from("invoices").update({ status: "overdue" }).eq("id", inv.id);

    const email = emailMap.get(inv.user_id);
    if (!email) continue;

    await sendPaymentOverdueEmail({
      toEmail: email,
      invoiceNumber: inv.invoice_number,
      amount: formatInvoiceAmount(inv.amount, inv.currency),
      dueDate: new Date(inv.due_date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }),
    });

    await admin.from("billing_events").insert({
      user_id: inv.user_id,
      event_type: "overdue_notification",
      details: { invoice_id: inv.id, invoice_number: inv.invoice_number },
    });

    overdueMarked++;
  }

  return NextResponse.json({
    ok: true,
    remindersSent,
    overdueMarked,
    timestamp: now.toISOString(),
  });
}
