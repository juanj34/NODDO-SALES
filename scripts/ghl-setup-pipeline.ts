/**
 * GHL Pipeline Setup Script — Run once to create the NODDO sales pipeline in GoHighLevel.
 *
 * Usage:
 *   GHL_PIT_TOKEN=xxx GHL_LOCATION_ID=xxx npx tsx scripts/ghl-setup-pipeline.ts
 *
 * This script will:
 * 1. Create the "NODDO Sales" pipeline with 7 stages
 * 2. Create custom contact fields
 * 3. Output the IDs to add to your .env files
 */

const GHL_BASE = "https://services.leadconnectorhq.com";

const GHL_PIT_TOKEN = process.env.GHL_PIT_TOKEN;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

if (!GHL_PIT_TOKEN || !GHL_LOCATION_ID) {
  console.error("❌ Required environment variables:");
  console.error("   GHL_PIT_TOKEN=your_token");
  console.error("   GHL_LOCATION_ID=your_location_id");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${GHL_PIT_TOKEN}`,
  Version: "2021-07-28",
  "Content-Type": "application/json",
  Accept: "application/json",
};

interface StageConfig {
  key: string;
  name: string;
  position: number;
}

const STAGES: StageConfig[] = [
  { key: "nuevo_prospecto", name: "Nuevo Prospecto", position: 0 },
  { key: "demo_agendado", name: "Demo Agendado", position: 1 },
  { key: "demo_realizado", name: "Demo Realizado", position: 2 },
  { key: "propuesta_enviada", name: "Propuesta Enviada", position: 3 },
  { key: "negociacion", name: "En Negociación", position: 4 },
  { key: "cerrado_ganado", name: "Cerrado Ganado", position: 5 },
  { key: "cerrado_perdido", name: "Cerrado Perdido", position: 6 },
];

interface CustomFieldConfig {
  name: string;
  dataType: string;
  placeholder?: string;
}

const CUSTOM_FIELDS: CustomFieldConfig[] = [
  { name: "plan_interes", dataType: "TEXT", placeholder: "Proyecto / Studio / Enterprise" },
  { name: "pagina_origen", dataType: "TEXT", placeholder: "URL de origen" },
  { name: "num_proyectos", dataType: "TEXT", placeholder: "Cantidad de proyectos" },
  { name: "pais", dataType: "TEXT", placeholder: "País" },
];

async function ghlFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...((options.headers as Record<string, string>) || {}) },
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`❌ API Error (${res.status}):`, JSON.stringify(data, null, 2));
    throw new Error(`GHL API error: ${res.status}`);
  }

  return data;
}

async function main() {
  console.log("🚀 Setting up NODDO Sales Pipeline in GoHighLevel...\n");

  // ─── Step 1: Create Pipeline ─────────────────────────────────────────

  console.log("📊 Creating pipeline...");

  const pipelineRes = await ghlFetch("/opportunities/pipelines", {
    method: "POST",
    body: JSON.stringify({
      locationId: GHL_LOCATION_ID,
      name: "NODDO Sales",
      stages: STAGES.map((s) => ({
        name: s.name,
        position: s.position,
      })),
    }),
  });

  const pipeline = pipelineRes.pipeline || pipelineRes;
  const pipelineId = pipeline.id;

  if (!pipelineId) {
    console.error("❌ Failed to create pipeline:", JSON.stringify(pipelineRes));
    process.exit(1);
  }

  console.log(`✅ Pipeline created: ${pipelineId}`);

  // Map stage IDs
  const stageMap: Record<string, string> = {};
  const pipelineStages = pipeline.stages || [];

  for (const stage of pipelineStages) {
    const config = STAGES.find((s) => s.name === stage.name);
    if (config) {
      stageMap[config.key] = stage.id;
      console.log(`   Stage: ${config.key} → ${stage.id}`);
    }
  }

  // ─── Step 2: Create Custom Fields ────────────────────────────────────

  console.log("\n📝 Creating custom fields...");

  for (const field of CUSTOM_FIELDS) {
    try {
      const fieldRes = await ghlFetch("/locations/" + GHL_LOCATION_ID + "/customFields", {
        method: "POST",
        body: JSON.stringify({
          name: field.name,
          dataType: field.dataType,
          placeholder: field.placeholder || "",
          model: "contact",
        }),
      });

      const fieldId = fieldRes.customField?.id || fieldRes.id;
      console.log(`   ✅ ${field.name} → ${fieldId}`);
    } catch {
      console.log(`   ⚠️ ${field.name} — may already exist, skipping`);
    }
  }

  // ─── Step 3: Output env vars ─────────────────────────────────────────

  console.log("\n" + "─".repeat(60));
  console.log("📋 Add these to your .env.local and Supabase Edge Function secrets:\n");
  console.log(`GHL_PIPELINE_ID=${pipelineId}`);

  for (const [key, id] of Object.entries(stageMap)) {
    console.log(`GHL_STAGE_${key.toUpperCase()}=${id}`);
  }

  console.log(`\n# Also set for client-side (Next.js public env):`);
  console.log(`NEXT_PUBLIC_GHL_STAGE_NUEVO_PROSPECTO=${stageMap.nuevo_prospecto || ""}`);

  console.log("\n" + "─".repeat(60));
  console.log("\n✅ Pipeline setup complete!");
  console.log("   1. Copy the env vars above to .env.local");
  console.log("   2. Set the same vars in Supabase Dashboard → Edge Functions → Secrets");
  console.log("   3. Redeploy edge functions: npx supabase functions deploy");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
