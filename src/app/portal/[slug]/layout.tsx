import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPortalBySlug } from "@/lib/supabase/server-queries";
import { NoddoBadge } from "@/components/site/NoddoBadge";
import type { ConstructoraPortal } from "@/types";

interface PortalProject {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  render_principal_url: string | null;
  hero_video_url: string | null;
  logo_url: string | null;
  constructora_nombre: string | null;
  constructora_logo_url: string | null;
  estado: string;
  subdomain: string | null;
  tipo_proyecto: string | null;
  plan: string;
}

export interface PortalData extends ConstructoraPortal {
  projects: PortalProject[];
}

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

const loadPortal = cache(async (slug: string): Promise<PortalData | null> => {
  try {
    return (await getPortalBySlug(slug)) as PortalData | null;
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const portal = await loadPortal(slug);

  if (!portal) {
    return { title: "Portal no encontrado" };
  }

  const title = portal.nombre;
  const description =
    portal.descripcion || `Descubre los proyectos de ${portal.nombre}`;
  const ogImage = portal.projects[0]?.render_principal_url ?? undefined;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      siteName: portal.nombre,
      locale: "es_CO",
      ...(ogImage
        ? {
            images: [
              { url: ogImage, width: 1200, height: 630, alt: portal.nombre },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function PortalLayout({ params, children }: Props) {
  const { slug } = await params;
  const portal = await loadPortal(slug);

  if (!portal) {
    notFound();
  }

  const primaryColor = portal.color_primario || "#b8973a";

  // Organization schema
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: portal.nombre,
    ...(portal.logo_url ? { logo: portal.logo_url } : {}),
    ...(portal.descripcion ? { description: portal.descripcion } : {}),
  };

  return (
    <div
      style={
        {
          "--site-primary": primaryColor,
          "--site-primary-rgb": hexToRgb(primaryColor),
        } as React.CSSProperties
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      {/* Clone children with portal data via server-side props */}
      {typeof children === "object" && children !== null
        ? // Next.js passes page as children -- we re-render the page component with portal
          // Using a wrapper div that stores the data for the client page to read
          children
        : children}
      <NoddoBadge />
    </div>
  );
}

/** Convert hex color to "r, g, b" string for rgba() usage */
function hexToRgb(hex: string): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "184, 151, 58";
  return `${r}, ${g}, ${b}`;
}
