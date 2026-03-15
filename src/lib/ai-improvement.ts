import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const CACHE_TTL = 60 * 60 * 24; // 24 hours
const CACHE_PREFIX = "noddo:ai-improve:";

/**
 * Get cached improvement result
 * Returns null if not found or Redis unavailable
 */
export async function getCachedImprovement(
  cacheKey: string
): Promise<string | null> {
  if (!redis) return null;
  try {
    const cached = await redis.get<string>(`${CACHE_PREFIX}${cacheKey}`);
    return cached;
  } catch (err) {
    console.error("Redis cache get error:", err);
    return null;
  }
}

/**
 * Cache improvement result for 24h
 */
export async function cacheImprovement(
  cacheKey: string,
  improved: string
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(`${CACHE_PREFIX}${cacheKey}`, improved, { ex: CACHE_TTL });
  } catch (err) {
    console.error("Redis cache set error:", err);
    // Don't throw — cache failure shouldn't break the feature
  }
}
