import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "noddo.io";
const BASE_URL = ROOT_DOMAIN.includes("localhost")
  ? `http://${ROOT_DOMAIN}`
  : `https://${ROOT_DOMAIN}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  /* ── Marketing pages (priority: high) ────────────────────────────── */
  const marketingPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/nosotros`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/casos-de-estudio`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/recursos`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/integraciones`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/solicitar-demo`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/roadmap`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/seguridad`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/ayuda`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/estado`, lastModified: now, changeFrequency: "daily", priority: 0.4 },
    { url: `${BASE_URL}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terminos`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  /* ── Dynamic content pages ───────────────────────────────────────── */
  const dynamicPages: MetadataRoute.Sitemap = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Case studies
    const { data: caseStudies } = await supabase
      .from("case_studies")
      .select("slug, updated_at")
      .eq("published", true);

    for (const cs of caseStudies ?? []) {
      dynamicPages.push({
        url: `${BASE_URL}/casos-de-estudio/${cs.slug}`,
        lastModified: cs.updated_at ? new Date(cs.updated_at) : now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    // Resources / blog articles
    const { data: articles } = await supabase
      .from("resources")
      .select("slug, updated_at")
      .eq("published", true);

    for (const article of articles ?? []) {
      dynamicPages.push({
        url: `${BASE_URL}/recursos/${article.slug}`,
        lastModified: article.updated_at ? new Date(article.updated_at) : now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    // Published project microsites (on subdomains — these get their own sitemap entries)
    const { data: projects } = await supabase
      .from("proyectos")
      .select("slug, subdomain, custom_domain, domain_verified, updated_at")
      .eq("estado", "publicado");

    const micrositePages = [
      "",
      "/tipologias",
      "/galeria",
      "/ubicacion",
      "/videos",
      "/contacto",
      "/explorar",
      "/inventario",
      "/implantaciones",
      "/recursos",
      "/avances",
    ];

    for (const project of projects ?? []) {
      const subdomain = project.subdomain || project.slug;
      const projectBase = ROOT_DOMAIN.includes("localhost")
        ? `http://localhost:3000/sites/${project.slug}`
        : `https://${subdomain}.noddo.io`;

      for (const page of micrositePages) {
        dynamicPages.push({
          url: `${projectBase}${page}`,
          lastModified: project.updated_at ? new Date(project.updated_at) : now,
          changeFrequency: "weekly",
          priority: page === "" ? 0.9 : 0.6,
        });
      }

      // Custom domain (if verified)
      if (project.custom_domain && project.domain_verified) {
        for (const page of micrositePages) {
          dynamicPages.push({
            url: `https://${project.custom_domain}${page}`,
            lastModified: project.updated_at ? new Date(project.updated_at) : now,
            changeFrequency: "weekly",
            priority: page === "" ? 0.9 : 0.6,
          });
        }
      }
    }
  } catch {
    // If DB is unavailable, return static entries only
  }

  return [...marketingPages, ...dynamicPages];
}
