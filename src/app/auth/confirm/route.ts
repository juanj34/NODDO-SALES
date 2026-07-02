import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { linkPendingCollaborator } from "@/lib/auth-context";

/**
 * Email OTP confirmation endpoint (SSR pattern).
 * Invite/magiclink emails link here with ?token_hash=...&type=invite&next=/invitacion.
 * Verifies the token server-side (sets the session cookies) and redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") || "/invitacion";
  // Prevent open redirect: only allow relative paths starting with /
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//")
    ? rawNext
    : "/invitacion";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      // Link the pending collaborator invitation right away so the
      // onboarding page already knows the role and inviting admin.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await linkPendingCollaborator(user);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=invite_invalid`);
}
