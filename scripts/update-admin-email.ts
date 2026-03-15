import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const TOKEN = process.env.VERCEL_API_TOKEN || process.env.AUTH_BEARER_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;
const CORRECT_EMAIL = "juanjaramillo34@gmail.com";

async function main() {
  console.log("📧 Actualizando email de administrador...\n");

  // Obtener variables existentes
  const listUrl = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  const { envs } = await listRes.json();
  const adminEmailEnv = envs.find((e: { key: string }) => e.key === "ADMIN_EMAIL");

  if (adminEmailEnv) {
    // Actualizar
    console.log(`📝 Actualizando ADMIN_EMAIL a: ${CORRECT_EMAIL}`);
    const updateUrl = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${adminEmailEnv.id}?teamId=${TEAM_ID}`;
    const updateRes = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: CORRECT_EMAIL }),
    });

    if (updateRes.ok) {
      console.log(`✅ ADMIN_EMAIL actualizado en Vercel\n`);
    } else {
      console.error("❌ Error:", await updateRes.text());
      process.exit(1);
    }
  } else {
    // Crear si no existe
    console.log(`➕ Creando ADMIN_EMAIL: ${CORRECT_EMAIL}`);
    const createUrl = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;
    const createRes = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: "ADMIN_EMAIL",
        value: CORRECT_EMAIL,
        type: "plain",
        target: ["production", "preview", "development"],
      }),
    });

    if (createRes.ok) {
      console.log(`✅ ADMIN_EMAIL creado en Vercel\n`);
    } else {
      console.error("❌ Error:", await createRes.text());
      process.exit(1);
    }
  }

  console.log("=".repeat(60));
  console.log("✅ EMAIL ACTUALIZADO");
  console.log("=".repeat(60));
  console.log(`\n📧 Nuevo email: ${CORRECT_EMAIL}`);
  console.log("\n📬 Recibirás los reportes semanales en este email");
  console.log("⏳ Deploy automático en progreso para aplicar cambios...\n");
}

main();
