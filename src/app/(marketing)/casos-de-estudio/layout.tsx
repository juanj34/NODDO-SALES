import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Casos de Estudio | NODDO - Resultados Reales de Constructoras",
  description: "Descubre cómo constructoras venden 40% más rápido con NODDO. Casos reales con datos: Torre Candelaria vendió 48 unidades en 60 días, -93% costo por lead.",
  keywords: ["casos de éxito inmobiliario", "ROI marketing inmobiliario", "resultados constructoras", "venta apartamentos online", "testimonios NODDO"],
  openGraph: {
    title: "Casos de Estudio | NODDO",
    description: "Resultados reales: +480% leads, -93% costo por lead, 40% vendido en 60 días. Datos verificables de constructoras que usan NODDO.",
    url: "https://noddo.io/casos-de-estudio",
    siteName: "NODDO",
    images: [
      {
        url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "NODDO Casos de Estudio - Resultados Reales",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Casos de Estudio | NODDO",
    description: "Constructoras vendiendo 40% más rápido. Casos reales con métricas verificables.",
    images: ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=630&fit=crop"],
  },
  alternates: {
    canonical: "https://noddo.io/casos-de-estudio",
  },
};

export default function CasosDeEstudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
