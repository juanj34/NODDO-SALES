import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";

/* ── GET /api/user/profile — Fetch current user's profile (auto-create if missing) ── */

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Upsert: create profile if it doesn't exist
  const { data, error } = await admin
    .from("user_profiles")
    .upsert(
      { user_id: auth.user.id, nombre: "", apellido: "" },
      { onConflict: "user_id", ignoreDuplicates: true }
    )
    .select("user_id, nombre, apellido, telefono, avatar_url")
    .single();

  if (error) {
    // If upsert returned conflict without returning, fetch directly
    const { data: existing } = await admin
      .from("user_profiles")
      .select("user_id, nombre, apellido, telefono, avatar_url")
      .eq("user_id", auth.user.id)
      .single();

    if (existing) {
      return NextResponse.json(existing);
    }
    console.error("[profile] Error:", error);
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
  }

  return NextResponse.json(data);
}

/* ── PUT /api/user/profile — Update profile fields ── */

export async function PUT(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { nombre, apellido, telefono } = body as {
    nombre?: string;
    apellido?: string;
    telefono?: string | null;
  };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (nombre !== undefined) updates.nombre = nombre.trim().slice(0, 100);
  if (apellido !== undefined) updates.apellido = apellido.trim().slice(0, 100);
  if (telefono !== undefined) updates.telefono = telefono ? telefono.trim().slice(0, 30) : null;

  const admin = createAdminClient();

  // Ensure profile exists first
  await admin
    .from("user_profiles")
    .upsert(
      { user_id: auth.user.id, nombre: "", apellido: "" },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

  const { data, error } = await admin
    .from("user_profiles")
    .update(updates)
    .eq("user_id", auth.user.id)
    .select("user_id, nombre, apellido, telefono, avatar_url")
    .single();

  if (error) {
    console.error("[profile] Update error:", error);
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }

  return NextResponse.json(data);
}

/* ── POST /api/user/profile — Avatar upload ── */

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No se encontró archivo" }, { status: 400 });
  }

  // Validate file
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "Archivo demasiado grande (máx 2MB)" }, { status: 400 });
  }
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Formato no soportado (JPG, PNG, WebP)" }, { status: 400 });
  }

  const admin = createAdminClient();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `avatars/${auth.user.id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Supabase Storage
  const { error: uploadErr } = await admin.storage
    .from("uploads")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadErr) {
    console.error("[profile] Avatar upload error:", uploadErr);
    return NextResponse.json({ error: "Error al subir avatar" }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("uploads").getPublicUrl(path);
  const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  // Ensure profile exists and update avatar_url
  await admin
    .from("user_profiles")
    .upsert(
      { user_id: auth.user.id, nombre: "", apellido: "" },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

  const { data, error } = await admin
    .from("user_profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("user_id", auth.user.id)
    .select("user_id, nombre, apellido, telefono, avatar_url")
    .single();

  if (error) {
    console.error("[profile] Avatar URL update error:", error);
    return NextResponse.json({ error: "Error al actualizar avatar" }, { status: 500 });
  }

  return NextResponse.json(data);
}
