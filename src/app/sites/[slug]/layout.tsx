import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getProyectoBySlug } from "@/lib/supabase/cached-queries";
import { SiteLayoutClient } from "./SiteLayoutClient";
import { ReCaptchaProvider } from "@/components/site/ReCaptchaProvider";
import type { ProyectoCompleto } from "@/types";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "noddo.io";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

async function loadProyecto(slug: string): Promise<ProyectoCompleto | null> {
  // Load from Supabase only (no mock fallback)
  try {
    const proyecto = await getProyectoBySlug(slug);
    return proyecto;
  } catch {
    return null;
  }
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

  const title = `${proyecto.nombre} — ${proyecto.constructora_nombre || "NODDO"}`;
  const description = proyecto.descripcion || "";
  const ogImage = proyecto.og_image_url || proyecto.render_principal_url;
  const favicon = proyecto.favicon_url || proyecto.logo_url;

  // Canonical URL
  const subdomain = proyecto.subdomain || proyecto.slug;
  const canonicalUrl =
    proyecto.custom_domain && proyecto.domain_verified
      ? `https://${proyecto.custom_domain}`
      : ROOT_DOMAIN.includes("localhost")
        ? `http://localhost:3000/sites/${proyecto.slug}`
        : `https://${subdomain}.noddo.io`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    // Favicon + Apple Touch Icon (per-project)
    ...(favicon
      ? { icons: { icon: favicon, apple: favicon } }
      : {}),
    // Open Graph — WhatsApp, Facebook, LinkedIn, Slack
    openGraph: {
      type: "website",
      title: proyecto.nombre,
      description,
      siteName: proyecto.constructora_nombre || "NODDO",
      url: canonicalUrl,
      locale: "es_CO",
      ...(ogImage
        ? { images: [{ url: ogImage, width: 1200, height: 630, alt: proyecto.nombre }] }
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

  // JSON-LD structured data
  const subdomain = proyecto.subdomain || proyecto.slug;
  const siteUrl =
    proyecto.custom_domain && proyecto.domain_verified
      ? `https://${proyecto.custom_domain}`
      : ROOT_DOMAIN.includes("localhost")
        ? `http://localhost:3000/sites/${proyecto.slug}`
        : `https://${subdomain}.noddo.io`;

  // Rich Schema.org structured data for real estate
  const realEstateSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: proyecto.nombre,
    description: proyecto.descripcion || undefined,
    url: siteUrl,
    ...(proyecto.render_principal_url
      ? { image: proyecto.render_principal_url }
      : {}),
    ...(proyecto.ubicacion_lat && proyecto.ubicacion_lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: proyecto.ubicacion_lat,
            longitude: proyecto.ubicacion_lng,
          },
        }
      : {}),
    address: proyecto.ubicacion_direccion
      ? {
          "@type": "PostalAddress",
          streetAddress: proyecto.ubicacion_direccion,
          addressCountry: "CO",
        }
      : undefined,
    ...(proyecto.constructora_nombre
      ? {
          provider: {
            "@type": "Organization",
            name: proyecto.constructora_nombre,
            ...(proyecto.constructora_website
              ? { url: proyecto.constructora_website }
              : {}),
          },
        }
      : {}),
  };

  // Breadcrumb schema for navigation
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://noddo.io",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: proyecto.nombre,
        item: siteUrl,
      },
    ],
  };

  const jsonLd = [realEstateSchema, breadcrumbSchema];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReCaptchaProvider>
        <SiteLayoutClient proyecto={proyecto} basePath={basePath}>
          {children}
        </SiteLayoutClient>
      </ReCaptchaProvider>
    </>
  );
}
