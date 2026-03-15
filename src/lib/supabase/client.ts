import { createBrowserClient } from "@supabase/ssr";

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // During build (when env vars are missing), return a mock client to prevent errors
  // This is safe because client components won't actually execute during SSG
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a mock client that won't be used (only for build-time)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return null as any;
  }

  if (!cached) {
    cached = createBrowserClient(url, key);
  }
  return cached;
}
