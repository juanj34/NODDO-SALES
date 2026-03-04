import type { Metadata } from "next";
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

  return {
    title: `${proyecto.nombre} — ${proyecto.constructora_nombre || "NodeSites"}`,
    description: proyecto.descripcion || "",
    openGraph: {
      title: proyecto.nombre,
      description: proyecto.descripcion || "",
      images: proyecto.render_principal_url
        ? [{ url: proyecto.render_principal_url }]
        : [],
    },
  };
}

export default async function SiteLayout({ params, children }: Props) {
  const { slug } = await params;
  const proyecto = await loadProyecto(slug);

  if (!proyecto) {
    notFound();
  }

  return (
    <SiteLayoutClient proyecto={proyecto}>
      {children}
    </SiteLayoutClient>
  );
}
