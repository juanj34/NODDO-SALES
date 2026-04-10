/**
 * Weekly Digest Email - Sends a weekly lead summary to each opted-in admin
 * Runs every Monday at 14:00 UTC
 * Endpoint: /api/cron/weekly-digest
 *
 * Triggered by: Vercel Cron (configured in vercel.json)
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailWrapper, detailTable, ctaButton, escapeHtml } from "@/lib/email";

// Lazy initialization
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Vercel Cron authorization
 */
function isAuthorizedCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

interface WeeklyRecipient {
  userId: string;
  email: string;
  locale: "es" | "en";
  projectIds: string[];
  projectNames: Record<string, string>; // id -> nombre
}

/**
 * Email copy in both languages
 */
const COPY = {
  es: {
    subject: "NODDO \u2014 Resumen Semanal",
    heading: "Resumen Semanal",
    newLeads: "Nuevos leads esta semana",
    totalLeads: "Total de leads (7 dias)",
    mostPopular: "Proyecto mas popular",
    recentLeads: "Leads recientes",
    noProject: "Sin proyecto",
    goToDashboard: "Ir a tu Dashboard",
    viewLeads: "Ver todos los Leads",
    footer: "Recibes este email porque tienes habilitado el resumen semanal.",
    disableLink: "Desactivar en Cuenta &rarr; Notificaciones",
    leadRow: (name: string, project: string, date: string) =>
      `${name} &mdash; ${project} (${date})`,
  },
  en: {
    subject: "NODDO \u2014 Weekly Summary",
    heading: "Weekly Summary",
    newLeads: "New leads this week",
    totalLeads: "Total leads (7 days)",
    mostPopular: "Most popular project",
    recentLeads: "Recent leads",
    noProject: "No project",
    goToDashboard: "Go to Dashboard",
    viewLeads: "View all Leads",
    footer: "You receive this email because you have the weekly digest enabled.",
    disableLink: "Disable in Account &rarr; Notifications",
    leadRow: (name: string, project: string, date: string) =>
      `${name} &mdash; ${project} (${date})`,
  },
};

/**
 * Get all admins who have weekly digest enabled
 */
async function getWeeklyRecipients(): Promise<WeeklyRecipient[]> {
  const supabase = createAdminClient();

  // Get all admin users (those who own at least one project)
  const { data: projectOwners } = await supabase
    .from("proyectos")
    .select("user_id, id, nombre");

  if (!projectOwners?.length) return [];

  const uniqueOwnerIds = [...new Set(projectOwners.map((p) => p.user_id))];

  // Check which owners have weekly digest enabled (or no config = default enabled)
  const { data: configs } = await supabase
    .from("email_report_config")
    .select("user_id, weekly_digest_enabled, email_override")
    .in("user_id", uniqueOwnerIds);

  const configMap = new Map(
    (configs || []).map((c) => [c.user_id, c])
  );

  // Filter: include if no config (default=enabled) or weekly_digest_enabled !== false
  const enabledOwnerIds = uniqueOwnerIds.filter((uid) => {
    const cfg = configMap.get(uid);
    return !cfg || cfg.weekly_digest_enabled !== false;
  });

  if (enabledOwnerIds.length === 0) return [];

  // Get locale preferences for all enabled owners
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, locale")
    .in("id", enabledOwnerIds);

  const localeMap = new Map(
    (profiles || []).map((p) => [p.id, p.locale as "es" | "en"])
  );

  // Build recipient list
  const recipients: WeeklyRecipient[] = [];

  for (const userId of enabledOwnerIds) {
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    if (!userData?.user?.email) continue;

    const cfg = configMap.get(userId);
    const email = cfg?.email_override || userData.user.email;
    const locale = localeMap.get(userId) || "es";

    // Get this admin's projects
    const userProjects = projectOwners.filter((p) => p.user_id === userId);
    if (userProjects.length === 0) continue;

    const projectNames: Record<string, string> = {};
    for (const p of userProjects) {
      projectNames[p.id] = p.nombre;
    }

    recipients.push({
      userId,
      email,
      locale,
      projectIds: userProjects.map((p) => p.id),
      projectNames,
    });
  }

  return recipients;
}

interface WeeklyLeadData {
  nombre: string;
  email: string;
  proyecto_id: string;
  created_at: string;
}

interface WeeklyMetrics {
  totalLeads: number;
  leadsByProject: Record<string, number>;
  mostPopularProject: { id: string; name: string; count: number } | null;
  recentLeads: WeeklyLeadData[];
}

/**
 * Get lead metrics for a specific admin's projects (last 7 days)
 */
async function getWeeklyMetrics(
  projectIds: string[],
  projectNames: Record<string, string>,
): Promise<WeeklyMetrics> {
  const supabase = createAdminClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get all leads in the last 7 days for this admin's projects
  const { data: leads } = await supabase
    .from("leads")
    .select("nombre, email, proyecto_id, created_at")
    .in("proyecto_id", projectIds)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(200);

  const allLeads = (leads || []) as WeeklyLeadData[];
  const totalLeads = allLeads.length;

  // Group by project
  const leadsByProject: Record<string, number> = {};
  for (const lead of allLeads) {
    const pid = lead.proyecto_id;
    leadsByProject[pid] = (leadsByProject[pid] || 0) + 1;
  }

  // Find most popular project
  let mostPopularProject: WeeklyMetrics["mostPopularProject"] = null;
  let maxCount = 0;
  for (const [pid, count] of Object.entries(leadsByProject)) {
    if (count > maxCount) {
      maxCount = count;
      mostPopularProject = {
        id: pid,
        name: projectNames[pid] || "—",
        count,
      };
    }
  }

  // Recent leads (up to 10)
  const recentLeads = allLeads.slice(0, 10);

  return { totalLeads, leadsByProject, mostPopularProject, recentLeads };
}

/**
 * Generate personalized weekly digest HTML email
 */
function generateWeeklyEmailHTML(
  metrics: WeeklyMetrics,
  projectNames: Record<string, string>,
  dateRange: string,
  locale: "es" | "en",
): string {
  const c = COPY[locale];

  // Key metrics table
  const metricRows: { label: string; value: string; highlight?: boolean }[] = [
    { label: c.newLeads, value: String(metrics.totalLeads), highlight: true },
  ];

  if (metrics.mostPopularProject) {
    metricRows.push({
      label: c.mostPopular,
      value: `${metrics.mostPopularProject.name} (${metrics.mostPopularProject.count})`,
    });
  }

  // Per-project breakdown
  for (const [pid, count] of Object.entries(metrics.leadsByProject)) {
    const name = projectNames[pid] || pid;
    metricRows.push({ label: name, value: String(count) });
  }

  // Recent leads list (up to 10)
  const dateFmt = locale === "en" ? "en-US" : "es-CO";
  let recentLeadsHtml = "";
  if (metrics.recentLeads.length > 0) {
    const leadItems = metrics.recentLeads
      .map((lead) => {
        const projName = projectNames[lead.proyecto_id] || c.noProject;
        const dateStr = new Date(lead.created_at).toLocaleDateString(dateFmt, {
          day: "numeric",
          month: "short",
        });
        return `<tr>
          <td style="padding:6px 16px;font-size:12px;color:#f4f0e8;font-family:'Courier New',Courier,monospace;">
            ${escapeHtml(lead.nombre)}
          </td>
          <td style="padding:6px 16px;font-size:11px;color:#5a5550;">
            ${escapeHtml(projName)}
          </td>
          <td style="padding:6px 16px;font-size:11px;color:#5a5550;text-align:right;">
            ${dateStr}
          </td>
        </tr>`;
      })
      .join("");

    recentLeadsHtml = `<tr><td style="padding:0 24px 8px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#b8973a;font-weight:600;">${c.recentLeads}</p>
    </td></tr>
    <tr><td style="padding:0 24px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1a1a;border:1px solid #222222;border-radius:12px;overflow:hidden;">
        ${leadItems}
      </table>
    </td></tr>`;
  }

  const bodyHtml = `
    ${detailTable(metricRows)}
    ${recentLeadsHtml}
    ${ctaButton("https://noddo.io/leads", c.viewLeads)}
  `;

  return emailWrapper(c.heading, dateRange, bodyHtml, locale);
}

/**
 * POST handler for manual trigger (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[weekly-digest] Generating weekly digests");

    // Get all opted-in admins
    const recipients = await getWeeklyRecipients();

    if (recipients.length === 0) {
      console.log("[weekly-digest] No recipients with weekly digest enabled");
      return NextResponse.json({ success: true, message: "No recipients", sent: 0 });
    }

    console.log(`[weekly-digest] Sending to ${recipients.length} recipient(s)`);

    const resend = getResend();
    const supabase = createAdminClient();
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of recipients) {
      try {
        const metrics = await getWeeklyMetrics(
          recipient.projectIds,
          recipient.projectNames,
        );

        // Skip if no leads in the period
        if (metrics.totalLeads === 0) {
          console.log(`[weekly-digest] Skipping ${recipient.email} — no leads this week`);
          results.push({ email: recipient.email, success: true, error: "skipped_no_leads" });
          continue;
        }

        // Format date range
        const dateFmt = recipient.locale === "en" ? "en-US" : "es-CO";
        const now = new Date();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const dateRange = `${weekAgo.toLocaleDateString(dateFmt, { day: "numeric", month: "short" })} – ${now.toLocaleDateString(dateFmt, { day: "numeric", month: "short", year: "numeric" })}`;

        const c = COPY[recipient.locale];

        const htmlContent = generateWeeklyEmailHTML(
          metrics,
          recipient.projectNames,
          dateRange,
          recipient.locale,
        );

        const { error } = await resend.emails.send({
          from: "NODDO <analytics@noddo.io>",
          to: [recipient.email],
          subject: `${c.subject} (${dateRange})`,
          html: htmlContent,
          headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
        });

        if (error) {
          console.error(`[weekly-digest] Error sending to ${recipient.email}:`, error);
          results.push({ email: recipient.email, success: false, error: String(error) });
        } else {
          results.push({ email: recipient.email, success: true });

          // Update last_weekly_sent
          await supabase
            .from("email_report_config")
            .upsert(
              { user_id: recipient.userId, last_weekly_sent: new Date().toISOString(), updated_at: new Date().toISOString() },
              { onConflict: "user_id" }
            );
        }
      } catch (err) {
        console.error(`[weekly-digest] Error processing ${recipient.email}:`, err);
        results.push({ email: recipient.email, success: false, error: String(err) });
      }
    }

    const sent = results.filter((r) => r.success && r.error !== "skipped_no_leads").length;
    const skipped = results.filter((r) => r.error === "skipped_no_leads").length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`[weekly-digest] Done: ${sent} sent, ${skipped} skipped (no leads), ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Weekly digest: ${sent} sent, ${skipped} skipped`,
      sent,
      skipped,
      failed,
      results,
    });
  } catch (error) {
    console.error("[weekly-digest] Error in weekly digest cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Vercel Cron uses GET by default
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
