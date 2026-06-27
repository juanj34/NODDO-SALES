import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { THEMES, type Theme } from "@/lib/theme/constants";

/**
 * Persist the user's theme to their profile for cross-device sync.
 * The cookie (set client-side) is the SSR source of truth; this is best-effort.
 * Logged-out callers get a 200 no-op so the client never has to special-case it.
 */
export async function POST(req: Request) {
  const { theme } = (await req.json().catch(() => ({}))) as { theme?: string };
  if (!THEMES.includes(theme as Theme)) {
    return NextResponse.json({ error: "invalid theme" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 200 });

  await supabase
    .from("user_profiles")
    .upsert({ id: user.id, theme }, { onConflict: "id" });

  return NextResponse.json({ ok: true });
}
