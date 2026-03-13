import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { linkPendingCollaborator } from "@/lib/auth-context";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawRedirect = searchParams.get("redirect") || "/proyectos";
  // Prevent open redirect: only allow relative paths starting with /
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
    ? rawRedirect
    : "/proyectos";

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
      if (user) {
        await linkPendingCollaborator(supabase, user);
      }

      // Recovery flow: redirect to new password page
      if (redirect === "/nueva-contrasena") {
        return NextResponse.redirect(`${origin}/nueva-contrasena`);
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
