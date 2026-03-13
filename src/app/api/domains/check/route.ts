import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const subdomain = request.nextUrl.searchParams.get("subdomain");
    if (!subdomain) {
      return NextResponse.json(
        { error: "subdomain es requerido" },
        { status: 400 }
      );
    }

    const clean = subdomain
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/(^-|-$)/g, "");

    if (!clean) {
      return NextResponse.json({ available: false });
    }

    // Check against both slug and subdomain columns
    const { data: bySlug } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("slug", clean)
      .limit(1)
      .maybeSingle();

    if (bySlug) {
      return NextResponse.json({ available: false });
    }

    const { data: bySubdomain } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("subdomain", clean)
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ available: !bySubdomain });
  } catch {
    return NextResponse.json({ available: false });
  }
}
