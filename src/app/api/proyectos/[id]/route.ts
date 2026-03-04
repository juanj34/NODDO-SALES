import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: proyecto, error } = await supabase
      .from("proyectos")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !proyecto) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Fetch related data
    const [
      { data: tipologias },
      { data: categorias },
      { data: videos },
    ] = await Promise.all([
      supabase
        .from("tipologias")
        .select("*")
        .eq("proyecto_id", id)
        .order("orden"),
      supabase
        .from("galeria_categorias")
        .select("*")
        .eq("proyecto_id", id)
        .order("orden"),
      supabase
        .from("videos")
        .select("*")
        .eq("proyecto_id", id)
        .order("orden"),
    ]);

    // Fetch images per category
    const categoriasConImagenes = await Promise.all(
      (categorias || []).map(async (cat) => {
        const { data: imagenes } = await supabase
          .from("galeria_imagenes")
          .select("*")
          .eq("categoria_id", cat.id)
          .order("orden");
        return { ...cat, imagenes: imagenes || [] };
      })
    );

    return NextResponse.json({
      ...proyecto,
      tipologias: tipologias || [],
      galeria_categorias: categoriasConImagenes,
      videos: videos || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("proyectos")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { error } = await supabase
      .from("proyectos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
