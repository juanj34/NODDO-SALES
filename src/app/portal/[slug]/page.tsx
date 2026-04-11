import { cache } from "react";
import { notFound } from "next/navigation";
import { getPortalBySlug } from "@/lib/supabase/server-queries";
import { PortalSlider } from "@/components/portal/PortalSlider";
import { PortalGrid } from "@/components/portal/PortalGrid";
import type { PortalData } from "./layout";

interface Props {
  params: Promise<{ slug: string }>;
}

const loadPortal = cache(async (slug: string): Promise<PortalData | null> => {
  try {
    return (await getPortalBySlug(slug)) as PortalData | null;
  } catch {
    return null;
  }
});

export default async function PortalPage({ params }: Props) {
  const { slug } = await params;
  const portal = await loadPortal(slug);

  if (!portal) {
    notFound();
  }

  if (portal.layout === "slider") {
    return <PortalSlider portal={portal} />;
  }

  return <PortalGrid portal={portal} />;
}
