/**
 * Invoice utility functions for billing management.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generate a sequential invoice number in the format NODDO-{YEAR}-{SEQUENCE}.
 * Example: NODDO-2026-0001, NODDO-2026-0002, etc.
 */
export async function generateInvoiceNumber(supabase: SupabaseClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `NODDO-${year}-`;

  // Find the highest existing invoice number for this year
  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .like("invoice_number", `${prefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextSeq = 1;
  if (data?.invoice_number) {
    const lastSeq = parseInt(data.invoice_number.replace(prefix, ""), 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

/** Format a currency amount for display */
export function formatInvoiceAmount(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Get the default billing period (1 month from a given start date) */
export function getDefaultBillingPeriod(startDate?: Date): {
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
} {
  const start = startDate ?? new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const due = new Date(start);
  due.setDate(due.getDate() + 15); // 15 days to pay

  return {
    billing_period_start: start.toISOString(),
    billing_period_end: end.toISOString(),
    due_date: due.toISOString(),
  };
}
