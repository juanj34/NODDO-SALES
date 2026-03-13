import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { PlatformAlert } from "@/types";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const alerts: PlatformAlert[] = [];

  // 1. New signups in last 24h
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000, page: 1 });
  const newSignups = (authData?.users ?? []).filter(
    (u) => new Date(u.created_at).getTime() >= yesterday.getTime()
  );
  if (newSignups.length > 0) {
    alerts.push({
      id: "new-signups",
      type: "new_signups",
      severity: "info",
      message: `${newSignups.length} nuevo${newSignups.length > 1 ? "s" : ""} registro${newSignups.length > 1 ? "s" : ""} en las últimas 24 horas`,
      details: { count: newSignups.length, emails: newSignups.map((u) => u.email).slice(0, 5) },
      created_at: now.toISOString(),
    });
  }

  // 2. Projects approaching storage limit (>80%)
  const { data: projects } = await admin
    .from("proyectos")
    .select("id, nombre, storage_tours_bytes, storage_videos_bytes, storage_media_bytes, storage_limit_bytes");

  const storageWarnings: { nombre: string; pct: number }[] = [];
  for (const p of projects ?? []) {
    const used = (p.storage_tours_bytes || 0) + (p.storage_videos_bytes || 0) + (p.storage_media_bytes || 0);
    const limit = p.storage_limit_bytes || 5368709120;
    const pct = Math.round((used / limit) * 100);
    if (pct >= 80) {
      storageWarnings.push({ nombre: p.nombre, pct });
    }
  }
  if (storageWarnings.length > 0) {
    alerts.push({
      id: "storage-warning",
      type: "storage_warning",
      severity: storageWarnings.some((s) => s.pct >= 95) ? "critical" : "warning",
      message: `${storageWarnings.length} proyecto${storageWarnings.length > 1 ? "s" : ""} con almacenamiento >80%`,
      details: { projects: storageWarnings.slice(0, 5) },
      created_at: now.toISOString(),
    });
  }

  // 3. Lead spike (leads today > 3x 7-day daily average)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [weekLeadsRes, todayLeadsRes] = await Promise.all([
    admin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString()),
    admin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
  ]);

  const weekLeads = weekLeadsRes.count ?? 0;
  const todayLeads = todayLeadsRes.count ?? 0;
  const dailyAvg = weekLeads / 7;
  if (dailyAvg > 0 && todayLeads > dailyAvg * 3) {
    alerts.push({
      id: "lead-spike",
      type: "lead_spike",
      severity: "info",
      message: `Pico de leads: ${todayLeads} hoy vs promedio de ${Math.round(dailyAvg)}/día`,
      details: { todayLeads, dailyAvg: Math.round(dailyAvg) },
      created_at: now.toISOString(),
    });
  }

  // 4. Expired trial plans
  const { data: expiredPlans } = await admin
    .from("user_plans")
    .select("user_id")
    .eq("plan", "trial")
    .lt("expires_at", now.toISOString());

  if (expiredPlans && expiredPlans.length > 0) {
    alerts.push({
      id: "trial-expired",
      type: "trial_expired",
      severity: "warning",
      message: `${expiredPlans.length} usuario${expiredPlans.length > 1 ? "s" : ""} con trial expirado`,
      details: { count: expiredPlans.length },
      created_at: now.toISOString(),
    });
  }

  return NextResponse.json(alerts);
}
