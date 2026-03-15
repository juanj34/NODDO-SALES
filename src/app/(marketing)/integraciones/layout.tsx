import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integraciones | NODDO - Conecta tu CRM, Analytics y Marketing",
  description: "NODDO se integra con HubSpot, Salesforce, GoHighLevel, Google Analytics, Facebook Pixel, Zapier y más. Conecta tu stack tecnológico en minutos sin código.",
  keywords: ["integraciones CRM", "HubSpot", "Salesforce", "GoHighLevel", "Google Analytics", "Zapier", "webhooks", "API inmobiliaria"],
  openGraph: {
    title: "Integraciones | NODDO",
    description: "Conecta NODDO con las herramientas que ya usas. CRM, analytics, marketing y más de 5000 apps vía Zapier.",
    url: "https://noddo.io/integraciones",
    siteName: "NODDO",
    images: [
      {
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "NODDO Integraciones - Conecta tu CRM y herramientas",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Integraciones | NODDO",
    description: "Conecta tu CRM, analytics y herramientas de marketing en minutos. Sin código.",
    images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop"],
  },
  alternates: {
    canonical: "https://noddo.io/integraciones",
  },
};

export default function IntegracionesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
