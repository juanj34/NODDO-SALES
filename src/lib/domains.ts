const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

export interface DomainInfo {
  type: "platform" | "subdomain" | "custom_domain";
  slug?: string;
  domain?: string;
}

/**
 * Parse hostname to determine routing context.
 * - "localhost" or ROOT_DOMAIN → platform (landing + dashboard)
 * - "xxx.ROOT_DOMAIN" → subdomain microsite
 * - anything else → custom domain microsite
 */
export function parseDomain(hostname: string): DomainInfo {
  // Strip port for comparison
  const host = hostname.split(":")[0];
  const rootWithoutPort = ROOT_DOMAIN.split(":")[0];

  // localhost or main domain
  if (
    host === "localhost" ||
    host === rootWithoutPort ||
    host === `www.${rootWithoutPort}`
  ) {
    return { type: "platform" };
  }

  // Subdomain of main domain (e.g., alto-de-yeguas.nodesites.com)
  if (host.endsWith(`.${rootWithoutPort}`)) {
    const subdomain = host.replace(`.${rootWithoutPort}`, "");
    // Ignore www subdomain
    if (subdomain === "www") {
      return { type: "platform" };
    }
    return { type: "subdomain", slug: subdomain };
  }

  // Everything else is a custom domain
  return { type: "custom_domain", domain: hostname };
}

/**
 * Resolve a custom domain to a project slug via direct Supabase REST call.
 * Designed for Edge middleware — no cookie-based client needed.
 */
export async function resolveCustomDomainToSlug(
  domain: string
): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/proyectos?custom_domain=eq.${encodeURIComponent(domain)}&domain_verified=eq.true&estado=eq.publicado&select=slug&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const data = await res.json();
    return data?.[0]?.slug || null;
  } catch {
    return null;
  }
}
