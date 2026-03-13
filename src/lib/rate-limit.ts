interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMaps = new Map<string, Map<string, RateLimitEntry>>();

function getMap(namespace: string): Map<string, RateLimitEntry> {
  let map = rateLimitMaps.get(namespace);
  if (!map) {
    map = new Map();
    rateLimitMaps.set(namespace, map);
  }
  return map;
}

export function isRateLimited(
  namespace: string,
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const map = getMap(namespace);
  const now = Date.now();
  const entry = map.get(key);

  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Clean up stale entries every 5 minutes
if (typeof globalThis !== "undefined") {
  const cleanup = () => {
    const now = Date.now();
    for (const [, map] of rateLimitMaps) {
      for (const [key, entry] of map) {
        if (now > entry.resetAt) map.delete(key);
      }
    }
  };
  setInterval(cleanup, 5 * 60_000).unref?.();
}
