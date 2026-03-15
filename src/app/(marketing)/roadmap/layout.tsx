import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap | NODDO - Hacia Dónde Vamos",
  description: "Roadmap público de NODDO: features recién lanzadas, en desarrollo (A/B testing, WhatsApp API), y próximamente (app móvil, tours VR). Transparencia total.",
  keywords: ["roadmap NODDO", "features en desarrollo", "A/B testing", "WhatsApp Business API", "app móvil inmobiliaria", "tours VR"],
  openGraph: {
    title: "Roadmap | NODDO",
    description: "Transparencia total: features lanzadas, en desarrollo, y planeadas. Vota por las que más te interesan.",
    url: "https://noddo.io/roadmap",
    siteName: "NODDO",
    images: [
      {
        url: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "NODDO Roadmap - Features en Desarrollo",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roadmap | NODDO",
    description: "Features en desarrollo: A/B testing, WhatsApp API, analytics AI. Vota por las próximas.",
    images: ["https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=630&fit=crop"],
  },
  alternates: {
    canonical: "https://noddo.io/roadmap",
  },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
