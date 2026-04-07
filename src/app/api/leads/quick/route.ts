import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";

/**
 * POST /api/leads/quick
 * Dashboard-only authenticated endpoint to quickly save a client as a lead.
 * No reCAPTCHA, no rate limit, no emails — just a fast insert.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { supabase } = auth;
    const body = await request.json();

    const { proyecto_id, nombre, email, telefono } = body;
    if (!proyecto_id || !nombre || !email) {
      return NextResponse.json(
        { error: "proyecto_id, nombre y email son requeridos" },
        { status: 400 },
      );
    }

    const clean = (val: unknown, max: number) =>
      typeof val === "string" ? val.trim().slice(0, max) : null;

    const { data, error } = await supabase
      .from("leads")
      .insert({
        proyecto_id,
        nombre: clean(nombre, 200),
        email: clean(email, 320),
        telefono: clean(telefono, 30),
      })
      .select("id, nombre, email, telefono")
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 },
    );
  }
}
