import { Metadata } from "next";
import { caseStudies } from "@/data/case-studies";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const study = caseStudies.find((cs) => cs.id === id);

  if (!study) {
    return { title: "Caso de estudio no encontrado | NODDO" };
  }

  const title = `${study.project} — ${study.client} | NODDO`;
  const description = `Cómo ${study.client} logró ${study.results.title.toLowerCase()} con NODDO. ${study.units} unidades en ${study.location}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://noddo.io/casos-de-estudio/${study.id}`,
      siteName: "NODDO",
      images: [
        {
          url: study.image.replace("w=800&h=600", "w=1200&h=630"),
          width: 1200,
          height: 630,
          alt: `${study.project} — ${study.client}`,
        },
      ],
      locale: "es_ES",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [study.image.replace("w=800&h=600", "w=1200&h=630")],
    },
    alternates: {
      canonical: `https://noddo.io/casos-de-estudio/${study.id}`,
    },
  };
}

export default function CaseStudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
