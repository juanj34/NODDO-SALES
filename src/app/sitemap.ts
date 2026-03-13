import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "noddo.io";
const BASE_URL = ROOT_DOMAIN.includes("localhost")
  ? `http://${ROOT_DOMAIN}`
  : `https://${ROOT_DOMAIN}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Fetch published projects
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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

    for (const project of projects || []) {
      const subdomain = project.subdomain || project.slug;
      const projectBase = ROOT_DOMAIN.includes("localhost")
        ? `http://localhost:3000/sites/${project.slug}`
        : `https://${subdomain}.noddo.io`;

      for (const page of micrositePages) {
        entries.push({
          url: `${projectBase}${page}`,
          lastModified: project.updated_at ? new Date(project.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: page === "" ? 0.9 : 0.6,
        });
      }

      // Custom domain (if verified)
      if (project.custom_domain && project.domain_verified) {
        for (const page of micrositePages) {
          entries.push({
            url: `https://${project.custom_domain}${page}`,
            lastModified: project.updated_at ? new Date(project.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: page === "" ? 0.9 : 0.6,
          });
        }
      }
    }
  } catch {
    // If DB is unavailable, return static entries only
  }

  return entries;
}
