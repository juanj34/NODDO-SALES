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

    const cleanEmail = clean(email, 320)!;

    // Check for existing lead with same email + proyecto_id
    const { data: existing } = await supabase
      .from("leads")
      .select("id, nombre, email, telefono")
      .eq("proyecto_id", proyecto_id)
      .eq("email", cleanEmail)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Update missing fields only (don't overwrite existing data)
      const updates: Record<string, string | null> = {};
      if (!existing.nombre && nombre) updates.nombre = clean(nombre, 200);
      if (!existing.telefono && telefono) updates.telefono = clean(telefono, 30);

      if (Object.keys(updates).length > 0) {
        await supabase.from("leads").update(updates).eq("id", existing.id);
      }
      return NextResponse.json({ ...existing, ...updates }, { status: 200 });
    }

    const { data, error } = await supabase
      .from("leads")
      .insert({
        proyecto_id,
        nombre: clean(nombre, 200),
        email: cleanEmail,
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
