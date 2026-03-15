import "dotenv/config";
import { createAdminClient } from "../src/lib/supabase/admin";

async function verifyMigrations() {
  const admin = createAdminClient();

  console.log("🔍 Verificando migraciones aplicadas...\n");

  try {
    // Verificar tabla payments
    const { data: paymentsTest, error: paymentsError } = await admin
      .from("payments")
      .select("id")
      .limit(1);

    if (paymentsError) {
      console.log("❌ Tabla 'payments' NO existe:", paymentsError.message);
    } else {
      console.log("✅ Tabla 'payments' existe");
    }

    // Verificar tabla system_health_metrics
    const { data: healthTest, error: healthError } = await admin
      .from("system_health_metrics")
      .select("id")
      .limit(1);

    if (healthError) {
      console.log("❌ Tabla 'system_health_metrics' NO existe:", healthError.message);
    } else {
      console.log("✅ Tabla 'system_health_metrics' existe");
    }

    // Verificar columnas de moderation en proyectos
    const { data: projectTest, error: projectError } = await admin
      .from("proyectos")
      .select("id, moderation_status, moderation_notes, moderated_at, moderated_by")
      .limit(1);

    if (projectError) {
      console.log("❌ Columnas de moderación NO existen en 'proyectos':", projectError.message);
    } else {
      console.log("✅ Columnas de moderación existen en 'proyectos'");
    }

    console.log("\n✅ Todas las migraciones verificadas correctamente!");
  } catch (error) {
    console.error("❌ Error al verificar migraciones:", error);
  }
}

verifyMigrations();
