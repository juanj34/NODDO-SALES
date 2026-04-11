import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Precios | NODDO — Planes para Constructoras",
  description: "Planes desde $199/mes por proyecto. Micrositio completo, inventario en vivo, leads calificados. Sin costos ocultos. Compara Básico vs Pro.",
  keywords: ["precios NODDO", "planes micrositio inmobiliario", "SaaS inmobiliario precio", "sala de ventas digital costo"],
  openGraph: {
    title: "Precios | NODDO — Planes para Constructoras",
    description: "Planes desde $199/mes por proyecto. Micrositio completo, inventario en vivo, leads calificados.",
    url: "https://noddo.io/pricing",
    siteName: "NODDO",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Precios | NODDO",
    description: "Planes desde $199/mes. Micrositio inmobiliario profesional sin agencia.",
  },
  alternates: {
    canonical: "https://noddo.io/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
