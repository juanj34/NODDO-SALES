import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Get all leads with project info
  const { data: leads, error } = await admin
    .from("leads")
    .select("*, proyectos(nombre, slug, user_id)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get owner emails
  const userIds = [
    ...new Set((leads ?? []).map((l) => (l.proyectos as { user_id: string } | null)?.user_id).filter(Boolean)),
  ];
  const emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000, page: 1 });
    for (const u of authData?.users ?? []) {
      emailMap.set(u.id, u.email ?? "");
    }
  }

  const result = (leads ?? []).map((l) => {
    const proj = l.proyectos as { nombre: string; slug: string; user_id: string } | null;
    return {
      id: l.id,
      nombre: l.nombre ?? "",
      email: l.email ?? "",
      telefono: l.telefono ?? "",
      mensaje: l.mensaje ?? "",
      created_at: l.created_at,
      utm_source: l.utm_source ?? null,
      utm_medium: l.utm_medium ?? null,
      utm_campaign: l.utm_campaign ?? null,
      projectName: proj?.nombre ?? "",
      projectSlug: proj?.slug ?? "",
      ownerEmail: proj ? emailMap.get(proj.user_id) ?? "" : "",
    };
  });

  return NextResponse.json(result);
}
