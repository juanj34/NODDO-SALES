import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getProyectoBySlug } from "@/lib/supabase/server-queries";
import { mockProyecto } from "@/data/mock";
import { SiteLayoutClient } from "./SiteLayoutClient";
import type { ProyectoCompleto } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

async function loadProyecto(slug: string): Promise<ProyectoCompleto | null> {
  // Try Supabase first, fallback to mock for demo
  try {
    const proyecto = await getProyectoBySlug(slug);
    if (proyecto) return proyecto;
  } catch {
    // Supabase not configured yet — fallback to mock
  }

  // Mock fallback
  if (slug === mockProyecto.slug) return mockProyecto;
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const proyecto = await loadProyecto(slug);

  if (!proyecto) {
    return { title: "Proyecto no encontrado" };
  }

  const title = `${proyecto.nombre} — ${proyecto.constructora_nombre || "Noddo"}`;
  const description = proyecto.descripcion || "";
  const ogImage = proyecto.og_image_url || proyecto.render_principal_url;
  const favicon = proyecto.favicon_url || proyecto.logo_url;

  return {
    title,
    description,
    // Favicon + Apple Touch Icon (per-project)
    ...(favicon
      ? { icons: { icon: favicon, apple: favicon } }
      : {}),
    // Open Graph — WhatsApp, Facebook, LinkedIn, Slack
    openGraph: {
      type: "website",
      title: proyecto.nombre,
      description,
      siteName: proyecto.constructora_nombre || "Noddo",
      ...(ogImage
        ? { images: [{ url: ogImage, width: 1200, height: 630 }] }
        : {}),
    },
    // Twitter Card
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: proyecto.nombre,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function SiteLayout({ params, children }: Props) {
  const { slug } = await params;
  const proyecto = await loadProyecto(slug);

  if (!proyecto) {
    notFound();
  }

  // Read header set by middleware for subdomain/custom domain routing
  const headersList = await headers();
  const basePathHeader = headersList.get("x-site-base-path");
  const basePath =
    basePathHeader !== null ? basePathHeader : `/sites/${slug}`;

  return (
    <SiteLayoutClient proyecto={proyecto} basePath={basePath}>
      {children}
    </SiteLayoutClient>
  );
}
