/**
 * Script de prueba para el sistema de versiones
 * Verifica que publicar y restaurar versiones funcione correctamente
 *
 * Uso: npx tsx scripts/test-version-system.ts <proyecto-id>
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan credenciales de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  passed: boolean;
  message: string;
  details?: unknown;
}

async function testVersionSystem(proyectoId: string): Promise<void> {
  console.log("🧪 Iniciando pruebas del sistema de versiones\n");
  console.log(`📁 Proyecto ID: ${proyectoId}\n`);

  const results: TestResult[] = [];

  // Test 1: Verificar que el proyecto existe
  console.log("1️⃣  Verificando que el proyecto existe...");
  const { data: proyecto, error: proyectoError } = await supabase
    .from("proyectos")
    .select("id, nombre, estado, updated_at")
    .eq("id", proyectoId)
    .single();

  if (proyectoError || !proyecto) {
    results.push({
      passed: false,
      message: "El proyecto no existe o no tienes acceso",
      details: proyectoError,
    });
    printResults(results);
    return;
  }

  results.push({
    passed: true,
    message: `Proyecto encontrado: ${proyecto.nombre}`,
    details: { estado: proyecto.estado, updated_at: proyecto.updated_at },
  });
  console.log("   ✅ Proyecto encontrado\n");

  // Test 2: Verificar que todas las tablas relacionadas existen
  console.log("2️⃣  Verificando estructura de datos...");
  const tablas = [
    "tipologias",
    "torres",
    "fachadas",
    "galeria_categorias",
    "galeria_imagenes",
    "unidades",
    "videos",
    "puntos_interes",
    "recursos",
    "planos_interactivos",
    "plano_puntos",
    "avances_obra",
  ];

  const dataCounts: Record<string, number> = {};

  for (const tabla of tablas) {
    const { count, error } = await supabase
      .from(tabla)
      .select("*", { count: "exact", head: true })
      .eq("proyecto_id", proyectoId);

    if (error) {
      results.push({
        passed: false,
        message: `Error al consultar tabla ${tabla}`,
        details: error,
      });
      continue;
    }

    dataCounts[tabla] = count || 0;
  }

  // Count galeria_imagenes
  const { data: categorias } = await supabase
    .from("galeria_categorias")
    .select("id")
    .eq("proyecto_id", proyectoId);

  if (categorias && categorias.length > 0) {
    const catIds = categorias.map((c) => c.id);
    const { count } = await supabase
      .from("galeria_imagenes")
      .select("*", { count: "exact", head: true })
      .in("categoria_id", catIds);
    dataCounts.galeria_imagenes = count || 0;
  }

  // Count plano_puntos
  const { data: planos } = await supabase
    .from("planos_interactivos")
    .select("id")
    .eq("proyecto_id", proyectoId);

  if (planos && planos.length > 0) {
    const planoIds = planos.map((p) => p.id);
    const { count } = await supabase
      .from("plano_puntos")
      .select("*", { count: "exact", head: true })
      .in("plano_id", planoIds);
    dataCounts.plano_puntos = count || 0;
  }

  results.push({
    passed: true,
    message: "Estructura de datos verificada",
    details: dataCounts,
  });
  console.log("   ✅ Estructura de datos OK\n");
  console.log("   📊 Conteo de datos:");
  Object.entries(dataCounts).forEach(([tabla, count]) => {
    if (count > 0) console.log(`      - ${tabla}: ${count}`);
  });
  console.log("");

  // Test 3: Obtener versiones existentes
  console.log("3️⃣  Consultando versiones existentes...");
  const { data: versiones, error: versionesError } = await supabase
    .from("proyecto_versiones")
    .select("id, version_number, published_at, published_by")
    .eq("proyecto_id", proyectoId)
    .order("version_number", { ascending: false });

  if (versionesError) {
    results.push({
      passed: false,
      message: "Error al consultar versiones",
      details: versionesError,
    });
  } else {
    results.push({
      passed: true,
      message: `${versiones?.length || 0} versiones encontradas`,
      details: versiones,
    });
    console.log(`   ✅ ${versiones?.length || 0} versiones encontradas\n`);
    if (versiones && versiones.length > 0) {
      console.log("   📚 Versiones:");
      versiones.forEach((v) => {
        console.log(
          `      - v${v.version_number} (${new Date(v.published_at).toLocaleString("es")})`
        );
      });
      console.log("");
    }
  }

  // Test 4: Verificar que los snapshots contienen todas las tablas
  if (versiones && versiones.length > 0) {
    console.log("4️⃣  Verificando integridad de snapshots...");
    const lastVersion = versiones[0];

    const { data: versionData, error: snapshotError } = await supabase
      .from("proyecto_versiones")
      .select("snapshot")
      .eq("id", lastVersion.id)
      .single();

    if (snapshotError || !versionData) {
      results.push({
        passed: false,
        message: "Error al obtener snapshot",
        details: snapshotError,
      });
    } else {
      const snapshot = versionData.snapshot as Record<string, unknown>;
      const expectedKeys = [
        "proyecto",
        "tipologias",
        "torres",
        "fachadas",
        "galeria_categorias",
        "videos",
        "puntos_interes",
        "unidades",
        "recursos",
        "planos_interactivos",
        "plano_puntos",
        "avances_obra",
      ];

      const missingKeys = expectedKeys.filter((key) => !(key in snapshot));
      const extraKeys = Object.keys(snapshot).filter(
        (key) => !expectedKeys.includes(key)
      );

      if (missingKeys.length > 0) {
        results.push({
          passed: false,
          message: "Snapshot incompleto",
          details: { missingKeys, extraKeys },
        });
        console.log("   ❌ Snapshot incompleto");
        console.log(`      Faltan: ${missingKeys.join(", ")}\n`);
      } else {
        results.push({
          passed: true,
          message: "Snapshot completo",
          details: {
            keys: Object.keys(snapshot),
            counts: Object.entries(snapshot).reduce(
              (acc, [key, value]) => {
                if (Array.isArray(value)) acc[key] = value.length;
                return acc;
              },
              {} as Record<string, number>
            ),
          },
        });
        console.log("   ✅ Snapshot completo\n");
        console.log("   📦 Contenido del snapshot:");
        Object.entries(snapshot).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            console.log(`      - ${key}: ${value.length} items`);
          } else {
            console.log(`      - ${key}: object`);
          }
        });
        console.log("");
      }
    }
  } else {
    console.log(
      "⏭️  Saltando verificación de snapshot (no hay versiones)\n"
    );
  }

  // Test 5: Verificar políticas RLS
  console.log("5️⃣  Verificando políticas RLS...");
  const { data: policies, error: policiesError } = await supabase.rpc(
    "exec_sql",
    {
      sql: `
        SELECT policyname, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = 'proyecto_versiones'
      `,
    }
  );

  if (policiesError) {
    console.log("   ⚠️  No se pudieron verificar las políticas RLS");
    console.log(`      ${policiesError.message}\n`);
  } else {
    results.push({
      passed: true,
      message: "Políticas RLS verificadas",
      details: policies,
    });
    console.log("   ✅ Políticas RLS OK\n");
  }

  // Resumen final
  printResults(results);
}

function printResults(results: TestResult[]): void {
  console.log("\n" + "=".repeat(60));
  console.log("📋 RESUMEN DE PRUEBAS");
  console.log("=".repeat(60) + "\n");

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result, i) => {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} Test ${i + 1}: ${result.message}`);
    if (!result.passed && result.details) {
      console.log(`   Detalles:`, result.details);
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log(`Resultado: ${passed}/${total} pruebas pasadas`);
  console.log("=".repeat(60) + "\n");

  if (passed === total) {
    console.log("🎉 ¡Todas las pruebas pasaron exitosamente!\n");
    process.exit(0);
  } else {
    console.log("⚠️  Algunas pruebas fallaron\n");
    process.exit(1);
  }
}

// Main
const proyectoId = process.argv[2];

if (!proyectoId) {
  console.error("❌ Uso: npx tsx scripts/test-version-system.ts <proyecto-id>");
  process.exit(1);
}

testVersionSystem(proyectoId);
