import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALL_FEATURES } from "@/lib/feature-flags";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Get all projects
  const { data: projects, error } = await admin
    .from("proyectos")
    .select("id, nombre, slug, subdomain, estado, user_id, render_principal_url, constructora_nombre, created_at, storage_tours_bytes, storage_videos_bytes, storage_media_bytes, storage_limit_bytes")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user emails
  const userIds = [...new Set((projects ?? []).map((p) => p.user_id))];
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000, page: 1 });
  const emailMap = new Map<string, string>();
  for (const u of authData?.users ?? []) {
    emailMap.set(u.id, u.email ?? "");
  }

  // Get unit counts per project
  const { data: units } = await admin.from("unidades").select("proyecto_id");
  const unitCounts = new Map<string, number>();
  for (const u of units ?? []) {
    unitCounts.set(u.proyecto_id, (unitCounts.get(u.proyecto_id) || 0) + 1);
  }

  // Get lead counts per project
  const { data: leads } = await admin.from("leads").select("proyecto_id");
  const leadCounts = new Map<string, number>();
  for (const l of leads ?? []) {
    leadCounts.set(l.proyecto_id, (leadCounts.get(l.proyecto_id) || 0) + 1);
  }

  // Get feature flags per project
  const { data: allFeatures } = await admin
    .from("project_features")
    .select("proyecto_id, feature, enabled");

  const featuresMap = new Map<string, Record<string, boolean>>();
  for (const row of allFeatures ?? []) {
    if (!featuresMap.has(row.proyecto_id)) {
      const defaults: Record<string, boolean> = {};
      for (const f of ALL_FEATURES) defaults[f] = false;
      featuresMap.set(row.proyecto_id, defaults);
    }
    featuresMap.get(row.proyecto_id)![row.feature] = row.enabled;
  }

  const result = (projects ?? []).map((p) => {
    // Build default features map if none exist
    const features = featuresMap.get(p.id) ?? Object.fromEntries(ALL_FEATURES.map((f) => [f, false]));
    return {
      ...p,
      ownerEmail: emailMap.get(p.user_id) || "",
      unitCount: unitCounts.get(p.id) || 0,
      leadCount: leadCounts.get(p.id) || 0,
      features,
    };
  });

  return NextResponse.json(result);
}
