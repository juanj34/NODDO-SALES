import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({
      users: [],
      projects: [],
      leads: [],
    });
  }

  const admin = createAdminClient();
  const query = `%${q.trim()}%`;

  // Ejecutar búsquedas en paralelo
  const [usersData, projectsData, leadsData] = await Promise.all([
    // Buscar usuarios por email
    admin.auth.admin.listUsers({ perPage: 1000, page: 1 }),
    // Buscar proyectos por nombre o slug
    admin
      .from("proyectos")
      .select("id, nombre, slug, estado, render_principal_url")
      .or(`nombre.ilike.${query},slug.ilike.${query}`)
      .limit(5)
      .order("created_at", { ascending: false }),
    // Buscar leads por nombre o email
    admin
      .from("leads")
      .select("id, nombre, email, proyecto_id, proyectos(nombre)")
      .or(`nombre.ilike.${query},email.ilike.${query}`)
      .limit(5)
      .order("created_at", { ascending: false }),
  ]);

  // Filtrar usuarios por email que contenga el query
  const users = (usersData.data?.users ?? [])
    .filter((u) => u.email?.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 5)
    .map((u) => ({
      id: u.id,
      email: u.email,
      last_sign_in_at: u.last_sign_in_at,
    }));

  return NextResponse.json({
    users,
    projects: projectsData.data ?? [],
    leads: leadsData.data ?? [],
  });
}
