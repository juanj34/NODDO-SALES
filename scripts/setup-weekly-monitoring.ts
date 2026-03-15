/**
 * Script para configurar automáticamente el sistema de monitoreo semanal
 * Configura variables de entorno en Vercel y genera el CRON_SECRET
 */

import { execSync } from "child_process";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN || process.env.AUTH_BEARER_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "juanjaramillo34@gmail.com";

if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
  console.error("❌ Faltan credenciales de Vercel en .env.local");
  process.exit(1);
}

interface EnvVar {
  key: string;
  value: string;
  type: "encrypted" | "plain";
  target: ("production" | "preview" | "development")[];
}

async function setVercelEnvVar(envVar: EnvVar): Promise<void> {
  const url = VERCEL_TEAM_ID
    ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`
    : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(envVar),
    });

    if (!response.ok) {
      const error = await response.json();

      // Si el error es que ya existe, intentar actualizar
      if (error.error?.code === "ENV_ALREADY_EXISTS") {
        console.log(`   ⚠️  ${envVar.key} ya existe, actualizando...`);
        await updateVercelEnvVar(envVar);
        return;
      }

      throw new Error(`Error ${response.status}: ${JSON.stringify(error)}`);
    }

    console.log(`   ✅ ${envVar.key} configurado`);
  } catch (error) {
    console.error(`   ❌ Error configurando ${envVar.key}:`, error);
    throw error;
  }
}

async function updateVercelEnvVar(envVar: EnvVar): Promise<void> {
  // Primero obtener la lista de variables para encontrar el ID
  const listUrl = VERCEL_TEAM_ID
    ? `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`
    : `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env`;

  const listResponse = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });

  if (!listResponse.ok) {
    throw new Error(`Error obteniendo variables: ${await listResponse.text()}`);
  }

  const { envs } = await listResponse.json();
  const existing = envs.find((env: { key: string }) => env.key === envVar.key);

  if (!existing) {
    // Si no existe, crear nueva
    await setVercelEnvVar(envVar);
    return;
  }

  // Actualizar existente
  const updateUrl = VERCEL_TEAM_ID
    ? `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${existing.id}?teamId=${VERCEL_TEAM_ID}`
    : `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${existing.id}`;

  const response = await fetch(updateUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      value: envVar.value,
      target: envVar.target,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error actualizando: ${await response.text()}`);
  }

  console.log(`   ✅ ${envVar.key} actualizado`);
}

async function main() {
  console.log("🔧 Configurando sistema de monitoreo semanal...\n");

  // 1. Generar CRON_SECRET
  console.log("1️⃣  Generando CRON_SECRET...");
  let cronSecret: string;
  try {
    cronSecret = execSync("openssl rand -base64 32", { encoding: "utf-8" }).trim();
    console.log(`   ✅ CRON_SECRET generado: ${cronSecret.substring(0, 20)}...`);
  } catch (error) {
    console.error("   ❌ Error generando secret, usando fallback");
    cronSecret = Buffer.from(Date.now().toString() + Math.random().toString()).toString("base64");
  }

  // 2. Configurar variables en Vercel
  console.log("\n2️⃣  Configurando variables de entorno en Vercel...");

  const envVars: EnvVar[] = [
    {
      key: "CRON_SECRET",
      value: cronSecret,
      type: "encrypted",
      target: ["production", "preview"],
    },
    {
      key: "ADMIN_EMAIL",
      value: ADMIN_EMAIL,
      type: "plain",
      target: ["production", "preview", "development"],
    },
  ];

  // Agregar Upstash API si existe
  if (process.env.UPSTASH_API_TOKEN) {
    envVars.push({
      key: "UPSTASH_API_TOKEN",
      value: process.env.UPSTASH_API_TOKEN,
      type: "encrypted",
      target: ["production", "preview"],
    });
  }

  if (process.env.UPSTASH_EMAIL) {
    envVars.push({
      key: "UPSTASH_EMAIL",
      value: process.env.UPSTASH_EMAIL,
      type: "plain",
      target: ["production", "preview"],
    });
  }

  for (const envVar of envVars) {
    await setVercelEnvVar(envVar);
  }

  // 3. Trigger redeploy
  console.log("\n3️⃣  Triggering redeploy para aplicar cambios...");

  const deployUrl = VERCEL_TEAM_ID
    ? `https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM_ID}`
    : `https://api.vercel.com/v13/deployments`;

  const deployResponse = await fetch(deployUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "noddo",
      project: VERCEL_PROJECT_ID,
      target: "production",
      gitSource: {
        type: "github",
        ref: "main",
        repoId: "NODDO-SALES",
      },
    }),
  });

  if (deployResponse.ok) {
    const deploy = await deployResponse.json();
    console.log(`   ✅ Deploy iniciado: ${deploy.url}`);
  } else {
    console.log("   ⚠️  Deploy manual requerido (auto-deploy puede estar deshabilitado)");
  }

  // 4. Resumen
  console.log("\n" + "=".repeat(60));
  console.log("✅ CONFIGURACIÓN COMPLETADA");
  console.log("=".repeat(60));
  console.log("\n📧 Reportes semanales configurados:");
  console.log(`   • Destinatario: ${ADMIN_EMAIL}`);
  console.log(`   • Frecuencia: Todos los lunes a las 8:00 AM (Colombia)`);
  console.log(`   • Endpoint: /api/cron/weekly-resource-report`);

  console.log("\n🔐 Seguridad:");
  console.log(`   • CRON_SECRET: ${cronSecret.substring(0, 20)}... (encriptado en Vercel)`);

  console.log("\n🧪 Para probar ahora:");
  console.log(`   curl -X GET "https://noddo.io/api/cron/weekly-resource-report" \\`);
  console.log(`     -H "Authorization: Bearer ${cronSecret}"`);

  console.log("\n⏳ El primer reporte automático llegará el próximo lunes a las 8 AM");
  console.log("\n🎉 ¡Todo listo! No necesitas hacer nada más.\n");
}

main().catch((error) => {
  console.error("\n❌ Error en configuración:", error);
  process.exit(1);
});
