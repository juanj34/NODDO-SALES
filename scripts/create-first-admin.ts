#!/usr/bin/env tsx
/**
 * Script para crear el primer Platform Admin
 *
 * USO:
 *   npx tsx scripts/create-first-admin.ts tu-email@ejemplo.com "Tu Nombre"
 *
 * IMPORTANTE:
 * - Primero debes crear un usuario en Supabase Auth (desde /login)
 * - Luego ejecuta este script con el mismo email
 * - Después podrás acceder a /admin como superusuario
 */

import { createClient } from "@supabase/supabase-js";

async function createFirstPlatformAdmin() {
  const email = process.argv[2];
  const nombre = process.argv[3] || "Admin Principal";

  if (!email) {
    console.error("❌ Error: Debes proporcionar un email");
    console.log("\nUso:");
    console.log('  npx tsx scripts/create-first-admin.ts tu-email@ejemplo.com "Tu Nombre"\n');
    process.exit(1);
  }

  // Validar que las env vars existan
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Error: Variables de entorno faltantes");
    console.log("\nAsegúrate de tener configurado en .env.local:");
    console.log("  NEXT_PUBLIC_SUPABASE_URL");
    console.log("  SUPABASE_SERVICE_ROLE_KEY\n");
    process.exit(1);
  }

  // Crear cliente admin (service role bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("🔍 Buscando usuario con email:", email);

  // Buscar el usuario por email
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Error al listar usuarios:", listError.message);
    process.exit(1);
  }

  const user = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.error("❌ Error: No se encontró ningún usuario con ese email");
    console.log("\n💡 Solución:");
    console.log("  1. Ve a http://localhost:3000/login");
    console.log("  2. Crea una cuenta con ese email");
    console.log("  3. Vuelve a ejecutar este script\n");
    process.exit(1);
  }

  console.log("✅ Usuario encontrado:", user.id);
  console.log("   Email:", user.email);
  console.log("   Creado:", user.created_at);

  // Verificar si ya es platform admin
  const { data: existing } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    console.log("⚠️  Este usuario ya es Platform Admin");
    console.log("\n✅ Puedes acceder a:");
    console.log("   🔗 http://localhost:3000/admin\n");
    process.exit(0);
  }

  console.log("📝 Creando Platform Admin...");

  // Insertar en platform_admins
  const { data: inserted, error: insertError } = await supabase
    .from("platform_admins")
    .insert({
      user_id: user.id,
      email: user.email,
      nombre: nombre,
    })
    .select()
    .single();

  if (insertError) {
    console.error("❌ Error al crear Platform Admin:", insertError.message);
    process.exit(1);
  }

  console.log("✅ Platform Admin creado exitosamente!");
  console.log("\n📋 Detalles:");
  console.log("   ID:", inserted.id);
  console.log("   Email:", inserted.email);
  console.log("   Nombre:", inserted.nombre);
  console.log("   User ID:", inserted.user_id);
  console.log("\n🎉 Ahora puedes acceder al panel de administración:");
  console.log("   🔗 http://localhost:3000/admin");
  console.log("\n🔐 Credenciales:");
  console.log("   Email:", email);
  console.log("   Contraseña: [la que usaste al registrarte]\n");
}

// Cargar variables de entorno
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

createFirstPlatformAdmin().catch((error) => {
  console.error("❌ Error inesperado:", error);
  process.exit(1);
});
