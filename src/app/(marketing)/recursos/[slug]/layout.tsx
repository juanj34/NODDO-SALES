import { Metadata } from "next";
import { articles } from "@/data/articles";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.id === slug);

  if (!article) {
    return { title: "Artículo no encontrado | NODDO" };
  }

  return {
    title: `${article.title} | NODDO`,
    description: article.excerpt,
    keywords: article.tags,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `https://noddo.io/recursos/${article.id}`,
      siteName: "NODDO",
      images: [
        {
          url: article.image.replace("w=800&h=600", "w=1200&h=630"),
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      locale: "es_ES",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.image.replace("w=800&h=600", "w=1200&h=630")],
    },
    alternates: {
      canonical: `https://noddo.io/recursos/${article.id}`,
    },
  };
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
