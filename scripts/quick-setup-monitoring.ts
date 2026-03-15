import { execSync } from "child_process";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const TOKEN = process.env.VERCEL_API_TOKEN || process.env.AUTH_BEARER_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

async function main() {
  console.log("🔧 Configurando monitoreo semanal...\n");

  // Generar secret
  const secret = execSync("openssl rand -base64 32", { encoding: "utf-8" }).trim();

  // Obtener variables existentes
  const listUrl = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  const { envs } = await listRes.json();
  const cronSecretEnv = envs.find((e: { key: string }) => e.key === "CRON_SECRET");

  if (cronSecretEnv) {
    // Actualizar
    console.log("📝 Actualizando CRON_SECRET...");
    const updateUrl = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${cronSecretEnv.id}?teamId=${TEAM_ID}`;
    const updateRes = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: secret }),
    });

    if (updateRes.ok) {
      console.log(`✅ CRON_SECRET actualizado\n`);
    } else {
      console.error("❌ Error:", await updateRes.text());
      process.exit(1);
    }
  } else {
    // Crear
    console.log("➕ Creando CRON_SECRET...");
    const createUrl = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;
    const createRes = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: "CRON_SECRET",
        value: secret,
        type: "encrypted",
        target: ["production", "preview"],
      }),
    });

    if (createRes.ok) {
      console.log(`✅ CRON_SECRET creado\n`);
    } else {
      console.error("❌ Error:", await createRes.text());
      process.exit(1);
    }
  }

  console.log("=".repeat(60));
  console.log("✅ SISTEMA DE MONITOREO CONFIGURADO");
  console.log("=".repeat(60));
  console.log(`\n📧 Recibirás reportes semanales en: ${process.env.ADMIN_EMAIL || "juanj34@gmail.com"}`);
  console.log("📅 Cada lunes a las 8:00 AM (hora Colombia)");
  console.log("\n🔐 CRON_SECRET configurado en Vercel (encriptado)");
  console.log("\n🧪 Para probar ahora:");
  console.log(`   curl -X GET "https://noddo.io/api/cron/weekly-resource-report" \\`);
  console.log(`     -H "Authorization: Bearer ${secret}"`);
  console.log("\n⏳ Deploy automático en progreso...");
  console.log("\n🎉 Todo configurado automáticamente. No necesitas hacer nada más.\n");
}

main();
