import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

    const { count } = await auth.supabase
      .from("webhook_logs")
      .select("*", { count: "exact", head: true })
      .eq("proyecto_id", id);

    const { data, error } = await auth.supabase
      .from("webhook_logs")
      .select("*")
      .eq("proyecto_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ data: data || [], total: count || 0, limit, offset });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
