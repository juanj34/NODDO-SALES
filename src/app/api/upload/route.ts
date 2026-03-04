import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "media";
    const folder = (formData.get("folder") as string) || "";

    if (!file) {
      return NextResponse.json(
        { error: "Archivo requerido" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop();
    const fileName = `${folder ? folder + "/" : ""}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl, path: fileName });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al subir" },
      { status: 500 }
    );
  }
}
