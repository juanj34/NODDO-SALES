import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recursos | NODDO - Guías de Marketing Inmobiliario Digital",
  description: "Aprende a vender apartamentos online: guías, análisis, mejores prácticas. Cómo calcular ROI, evitar errores comunes, y lanzar proyectos en 3 días.",
  keywords: ["marketing inmobiliario digital", "vender apartamentos online", "ROI inmobiliario", "guía constructoras", "inventario en tiempo real", "leads inmobiliarios"],
  openGraph: {
    title: "Recursos | NODDO",
    description: "Guías prácticas y análisis para vender apartamentos online más rápido. Aprende de expertos y casos reales.",
    url: "https://noddo.io/recursos",
    siteName: "NODDO",
    images: [
      {
        url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "NODDO Recursos - Guías de Marketing Inmobiliario",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recursos | NODDO",
    description: "Guías, análisis y mejores prácticas de marketing inmobiliario digital.",
    images: ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=630&fit=crop"],
  },
  alternates: {
    canonical: "https://noddo.io/recursos",
  },
};

export default function RecursosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
