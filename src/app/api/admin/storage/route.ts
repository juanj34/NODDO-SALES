import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: projects, error } = await admin
    .from("proyectos")
    .select(
      "id, nombre, slug, user_id, storage_tours_bytes, storage_videos_bytes, storage_media_bytes, storage_limit_bytes"
    )
    .order("storage_tours_bytes", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get owner emails
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000, page: 1 });
  const emailMap = new Map<string, string>();
  for (const u of authData?.users ?? []) {
    emailMap.set(u.id, u.email ?? "");
  }

  let totalTours = 0;
  let totalVideos = 0;
  let totalMedia = 0;
  let totalLimit = 0;

  const projectStorage = (projects ?? []).map((p) => {
    const tours = p.storage_tours_bytes || 0;
    const videos = p.storage_videos_bytes || 0;
    const media = p.storage_media_bytes || 0;
    const limit = p.storage_limit_bytes || 5368709120;
    const total = tours + videos + media;

    totalTours += tours;
    totalVideos += videos;
    totalMedia += media;
    totalLimit += limit;

    return {
      id: p.id,
      nombre: p.nombre,
      slug: p.slug,
      ownerEmail: emailMap.get(p.user_id) || "",
      tours_bytes: tours,
      videos_bytes: videos,
      media_bytes: media,
      total_bytes: total,
      limit_bytes: limit,
      pct_used: limit > 0 ? Math.round((total / limit) * 100) : 0,
    };
  });

  // Sort by total usage descending, take top 20
  projectStorage.sort((a, b) => b.total_bytes - a.total_bytes);

  return NextResponse.json({
    summary: {
      total_bytes: totalTours + totalVideos + totalMedia,
      tours_bytes: totalTours,
      videos_bytes: totalVideos,
      media_bytes: totalMedia,
      total_limit_bytes: totalLimit,
      pct_used: totalLimit > 0
        ? Math.round(((totalTours + totalVideos + totalMedia) / totalLimit) * 100)
        : 0,
    },
    projects: projectStorage.slice(0, 20),
  });
}
