import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { nombre, email, proyecto_id } = body;

    if (!nombre || !email || !proyecto_id) {
      return NextResponse.json(
        { error: "Nombre, email y proyecto son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("leads")
      .insert({
        proyecto_id: body.proyecto_id,
        nombre: body.nombre,
        email: body.email,
        telefono: body.telefono || null,
        pais: body.pais || null,
        tipologia_interes: body.tipologia_interes || null,
        mensaje: body.mensaje || null,
        utm_source: body.utm_source || null,
        utm_medium: body.utm_medium || null,
        utm_campaign: body.utm_campaign || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipologia = searchParams.get("tipologia");
    const search = searchParams.get("search");

    // Get user's projects
    const { data: proyectos } = await supabase
      .from("proyectos")
      .select("id")
      .eq("user_id", user.id);

    if (!proyectos?.length) {
      return NextResponse.json([]);
    }

    const projectIds = proyectos.map((p) => p.id);

    let query = supabase
      .from("leads")
      .select("*")
      .in("proyecto_id", projectIds)
      .order("created_at", { ascending: false });

    if (tipologia) {
      query = query.eq("tipologia_interes", tipologia);
    }
    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
