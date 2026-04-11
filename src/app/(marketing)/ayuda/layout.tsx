import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centro de Ayuda | NODDO — Guías y Tutoriales",
  description:
    "Guías paso a paso para cada función de NODDO. Aprende a crear y gestionar tu micrositio inmobiliario premium.",
  openGraph: {
    title: "Centro de Ayuda | NODDO",
    description:
      "Guías paso a paso para crear y gestionar tu micrositio inmobiliario con NODDO.",
    url: "https://noddo.io/ayuda",
    siteName: "NODDO",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Centro de Ayuda | NODDO",
    description: "Tutoriales y guías para tu micrositio inmobiliario.",
  },
  alternates: {
    canonical: "https://noddo.io/ayuda",
  },
};

export default function AyudaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
