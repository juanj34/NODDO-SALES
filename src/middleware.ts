import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from 'next-intl/middleware';
import { parseDomain, resolveCustomDomainToSlug } from "@/lib/domains";
import { locales, defaultLocale } from '@/i18n/config';

// Create next-intl middleware for ALL routes
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // ALWAYS prefix with locale (required for [locale] routing)
  localeDetection: true, // Auto-detect from Accept-Language header
});

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "localhost:3000";
  const { pathname } = request.nextUrl;
  const domainInfo = parseDomain(hostname);

  // Detect locale from cookie or Accept-Language header
  let locale = request.cookies.get('noddo-lang')?.value || defaultLocale;
  if (!locales.includes(locale as any)) {
    // Fallback: parse Accept-Language header
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].trim().toLowerCase());
      const preferredLocale = languages.find(lang =>
        locales.includes(lang.split('-')[0] as any)
      );
      if (preferredLocale) {
        locale = preferredLocale.split('-')[0];
      }
    }
  }

  // ─── Subdomain or Custom Domain → rewrite to /sites/[slug] ───
  if (domainInfo.type === "subdomain" || domainInfo.type === "custom_domain") {
    // Let API and auth routes pass through without rewriting
    if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
      return NextResponse.next();
    }

    // Don't rewrite /sites/ paths (already correct)
    if (pathname.startsWith("/sites/")) {
      return NextResponse.next();
    }

    // Don't rewrite Next.js internals
    if (pathname.startsWith("/_next/") || pathname === "/favicon.ico") {
      return NextResponse.next();
    }

    let slug: string | undefined;

    if (domainInfo.type === "subdomain") {
      slug = domainInfo.slug;
    } else {
      // Custom domain: resolve to slug via DB lookup
      slug = (await resolveCustomDomainToSlug(domainInfo.domain!)) ?? undefined;
    }

    if (!slug) {
      // Unknown domain — redirect to main platform
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
      const protocol = rootDomain.includes("localhost") ? "http" : "https";
      return NextResponse.redirect(new URL(`${protocol}://${rootDomain}`));
    }

    // Rewrite: / → /sites/slug, /galeria → /sites/slug/galeria, etc.
    const rewritePath =
      pathname === "/" ? `/sites/${slug}` : `/sites/${slug}${pathname}`;
    const url = request.nextUrl.clone();
    url.pathname = rewritePath;

    // Set headers so the site layout knows to use root-relative links and locale
    const response = NextResponse.rewrite(url, {
      request: {
        headers: new Headers(request.headers),
      },
    });
    response.headers.set("x-site-base-path", "");
    response.headers.set("x-noddo-locale", locale);
    return response;
  }

  // ─── Platform (main domain) ───

  // Only run auth check on routes that need it
  const isDashboardRoute =
    pathname === "/dashboard" ||
    pathname === "/proyectos" ||
    pathname.startsWith("/editor") ||
    pathname === "/leads" ||
    pathname === "/equipo" ||
    pathname === "/ayuda" ||
    pathname === "/cuenta" ||
    pathname === "/disponibilidad" ||
    pathname === "/cotizador" ||
    pathname === "/cotizaciones" ||
    pathname === "/analytics" ||
    pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/login";

  if (!isDashboardRoute && !isLoginRoute) {
    // Check if this is a marketing page that should use i18n routing
    const isMarketingRoute =
      !pathname.startsWith('/sites/') &&
      !pathname.startsWith('/api/') &&
      !pathname.startsWith('/auth/') &&
      !pathname.startsWith('/_next/') &&
      pathname !== '/favicon.ico';

    if (isMarketingRoute) {
      // Use next-intl middleware for marketing pages
      return intlMiddleware(request);
    }

    // Other public routes (API, sites, etc.) — pass through with locale header
    const response = NextResponse.next();
    response.headers.set('x-noddo-locale', locale);
    return response;
  }

  // Auth check needed — create Supabase client
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isDashboardRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Block banned users from dashboard
  if (isDashboardRoute && user) {
    const bannedUntil = (user as unknown as { banned_until?: string }).banned_until;
    if (bannedUntil && new Date(bannedUntil) > new Date()) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Platform admin routes — verify role
  if (pathname.startsWith("/admin") && user) {
    const { data: platformAdmin } = await supabase
      .from("platform_admins")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!platformAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isLoginRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Set locale header for dashboard routes
  response.headers.set('x-noddo-locale', locale);

  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
  ],
};
