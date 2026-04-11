import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seguridad | NODDO — Protección de Datos Inmobiliarios",
  description: "NODDO usa cifrado de extremo a extremo, infraestructura en la nube certificada y cumple con normativas de protección de datos. Tu información está segura.",
  keywords: ["seguridad NODDO", "protección datos inmobiliarios", "GDPR inmobiliario", "seguridad SaaS"],
  openGraph: {
    title: "Seguridad | NODDO",
    description: "Infraestructura segura, cifrado y cumplimiento normativo para tus datos inmobiliarios.",
    url: "https://noddo.io/seguridad",
    siteName: "NODDO",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seguridad | NODDO",
    description: "Protección de datos de nivel enterprise para constructoras.",
  },
  alternates: {
    canonical: "https://noddo.io/seguridad",
  },
};

export default function SeguridadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
