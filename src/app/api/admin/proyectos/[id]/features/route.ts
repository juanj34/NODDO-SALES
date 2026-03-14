import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { ALL_FEATURES, type ProjectFeature } from "@/lib/feature-flags";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: projectId } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("project_features")
    .select("feature, enabled")
    .eq("proyecto_id", projectId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build full features map (missing = false)
  const features: Record<string, boolean> = {};
  for (const f of ALL_FEATURES) {
    features[f] = false;
  }
  for (const row of data ?? []) {
    if (row.feature in features) {
      features[row.feature] = row.enabled;
    }
  }

  return NextResponse.json(features);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: projectId } = await params;
  const body = await request.json();
  const { features } = body as { features: Partial<Record<ProjectFeature, boolean>> };

  if (!features || typeof features !== "object") {
    return NextResponse.json({ error: "features requerido" }, { status: 400 });
  }

  // Validate feature names
  const validFeatures = new Set<string>(ALL_FEATURES);
  const rows = Object.entries(features)
    .filter(([key]) => validFeatures.has(key))
    .map(([feature, enabled]) => ({
      proyecto_id: projectId,
      feature,
      enabled: enabled ?? false,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "No features válidas" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("project_features")
    .upsert(rows, { onConflict: "proyecto_id,feature" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: auth.user.id,
    adminEmail: auth.user.email,
    action: "features_updated",
    targetType: "project",
    targetId: projectId,
    details: { features },
  });

  return NextResponse.json({ ok: true });
}
