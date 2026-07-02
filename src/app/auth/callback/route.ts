import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { linkPendingCollaborator } from "@/lib/auth-context";
import { sendWelcomeEmail, getUserLocale } from "@/lib/email";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorCode = searchParams.get("error_code");
  const rawRedirect = searchParams.get("redirect") || "/dashboard";
  // Prevent open redirect: only allow relative paths starting with /
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
    ? rawRedirect
    : "/dashboard";

  // Signups are disabled at the Supabase level (invite-only platform).
  // Surface that clearly instead of a generic auth error.
  if (errorCode === "signup_disabled") {
    return NextResponse.redirect(`${origin}/login?error=signup_disabled`);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: CookieOptions;
            }[]
          ) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // ignore
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Link pending collaborator invitations by email
      const { data: { user } } = await supabase.auth.getUser();
      let justLinkedCollaborator = false;
      if (user) {
        justLinkedCollaborator = await linkPendingCollaborator(user);

        // Send welcome email for new users (created within last 5 min).
        // Collaborators already get their role-specific welcome from
        // linkPendingCollaborator — don't double-send the admin welcome.
        const createdAt = new Date(user.created_at).getTime();
        const isNewUser = Date.now() - createdAt < 5 * 60 * 1000;
        if (isNewUser && user.email && !justLinkedCollaborator) {
          // Fetch user plan to include in welcome email
          const { data: userPlan } = await supabase
            .from("user_plans")
            .select("plan")
            .eq("user_id", user.id)
            .single();

          const userLocale = await getUserLocale(supabase, user.id);
          sendWelcomeEmail({
            email: user.email,
            name: user.user_metadata?.full_name || user.email.split("@")[0],
            plan: userPlan?.plan as "basic" | "premium" | "enterprise" | undefined,
            locale: userLocale,
          }).catch(() => {});
        }
      }

      // Recovery flow: redirect to new password page
      if (redirect === "/nueva-contrasena") {
        return NextResponse.redirect(`${origin}/nueva-contrasena`);
      }

      // Freshly linked collaborator → onboarding (set name/password)
      if (justLinkedCollaborator) {
        return NextResponse.redirect(`${origin}/invitacion`);
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // If recovery redirect failed, send to nueva-contrasena with error
  if (redirect === "/nueva-contrasena") {
    return NextResponse.redirect(`${origin}/nueva-contrasena?error=invalid_link`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
