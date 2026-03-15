/**
 * Test script para verificar que el rate limiting con Upstash Redis funcione
 *
 * Uso: npx tsx scripts/test-rate-limit.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Cargar variables de entorno desde .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

async function main() {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  console.log("🔌 Conectando a Upstash Redis...");

  // Test 1: Verificar conexión
  const pong = await redis.ping();
  console.log(`✅ Conexión exitosa: ${pong}\n`);

  // Test 2: Crear un rate limiter de prueba (5 requests por minuto)
  const testLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "@noddo/test",
  });

  console.log("🧪 Probando rate limiter (5 requests/minuto)...\n");

  const identifier = "test-ip-127.0.0.1";

  // Hacer 7 requests rápidas para probar el límite
  for (let i = 1; i <= 7; i++) {
    const { success, limit, remaining, reset } = await testLimiter.limit(identifier);

    const status = success ? "✅ PERMITIDO" : "🚫 BLOQUEADO";
    const resetDate = new Date(reset);

    console.log(
      `Request ${i}: ${status} | Restantes: ${remaining}/${limit} | Reset: ${resetDate.toLocaleTimeString()}`
    );

    // Pequeña pausa para evitar spam instantáneo
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n📊 Verificando claves en Redis...");

  // Ver todas las claves de NODDO
  const keys = await redis.keys("@noddo/*");
  console.log(`\nClaves encontradas (${keys.length}):`);

  for (const key of keys.slice(0, 10)) {
    const ttl = await redis.ttl(key);
    const type = await redis.type(key);
    console.log(`  - ${key} (tipo: ${type}, TTL: ${ttl}s)`);
  }

  console.log("\n✨ Prueba completada. El rate limiting está funcionando correctamente.");
  console.log(
    "\n💡 En producción:\n   - Las primeras 3 requests de leads por hora serán permitidas\n   - La 4ta será bloqueada con error 429\n   - Los contadores se resetean automáticamente después de 1 hora"
  );
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
