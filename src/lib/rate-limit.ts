import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting configuration using Upstash Redis
 *
 * SETUP REQUIRED:
 * 1. Create free Upstash Redis at https://console.upstash.com/
 * 2. Add these env vars to Vercel:
 *    UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *    UPSTASH_REDIS_REST_TOKEN=AXXXxxx
 *
 * If env vars are missing, rate limiting is disabled (dev mode).
 */

// Lazy initialization - only create when needed (avoids build-time errors)
function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Rate limiters by use case
 */

// API endpoints - 100 requests per 10 seconds per IP
export const apiLimiter = (() => {
  const redis = getRedis();
  return redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "10 s"),
        analytics: true,
        prefix: "@noddo/api",
      })
    : null;
})();

// Auth endpoints (login, signup) - 5 requests per minute per IP
export const authLimiter = (() => {
  const redis = getRedis();
  return redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
        prefix: "@noddo/auth",
      })
    : null;
})();

// Lead submissions - 3 per hour per IP (prevent spam)
export const leadLimiter = (() => {
  const redis = getRedis();
  return redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        analytics: true,
        prefix: "@noddo/lead",
      })
    : null;
})();

// Upload endpoints - 20 uploads per minute per user
export const uploadLimiter = (() => {
  const redis = getRedis();
  return redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        analytics: true,
        prefix: "@noddo/upload",
      })
    : null;
})();

// Email sending - 10 emails per hour per user
export const emailLimiter = (() => {
  const redis = getRedis();
  return redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        analytics: true,
        prefix: "@noddo/email",
      })
    : null;
})();

// AI text improvement - 50 requests per 24h per user
export const aiImprovementLimiter = (() => {
  const redis = getRedis();
  return redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, "24 h"),
        analytics: true,
        prefix: "@noddo/ai-improve",
      })
    : null;
})();

// Global AI rate limit - 100 AI calls per 24h per user (all features combined)
export const aiGlobalLimiter = (() => {
  const redis = getRedis();
  return redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "24 h"),
        analytics: true,
        prefix: "@noddo/ai-global",
      })
    : null;
})();

/**
 * Helper to apply rate limiting in API routes
 */
export async function checkRateLimit(
  req: Request,
  limiter: typeof apiLimiter
): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  headers: Record<string, string>;
}> {
  if (!limiter) {
    return { success: true, headers: {} };
  }

  const identifier = getIdentifier(req);
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  return {
    success,
    limit,
    remaining,
    reset,
    headers: {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
    },
  };
}

function getIdentifier(req: Request): string {
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    try {
      const token = authHeader.replace("Bearer ", "");
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.sub) return `user:${payload.sub}`;
    } catch {}
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return `ip:${forwardedFor.split(",")[0].trim()}`;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return `ip:${realIp}`;
  }

  return "ip:anonymous";
}

export function rateLimitExceeded(headers: Record<string, string>) {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );
}

/**
 * Legacy helper functions for backward compatibility
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export async function isRateLimited(
  req: Request,
  limiter: typeof apiLimiter
): Promise<boolean> {
  if (!limiter) {
    return false;
  }

  const identifier = getIdentifier(req);
  const { success } = await limiter.limit(identifier);

  return !success;
}
