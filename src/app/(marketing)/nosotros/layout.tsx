import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros | NODDO - Revolucionando la Venta Inmobiliaria Digital",
  description: "NODDO nació para democratizar la tecnología de ventas inmobiliarias. Equipo con 10+ años en proptech. 34 proyectos activos, $150M+ en inventario gestionado.",
  keywords: ["equipo NODDO", "proptech Colombia", "startup inmobiliaria", "SaaS inmobiliario", "historia NODDO"],
  openGraph: {
    title: "Nosotros | NODDO",
    description: "Democratizando la tecnología de ventas inmobiliarias. De Medellín para el mundo.",
    url: "https://noddo.io/nosotros",
    siteName: "NODDO",
    images: [
      {
        url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "NODDO - Equipo y Misión",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nosotros | NODDO",
    description: "Revolucionando la venta inmobiliaria digital desde Medellín.",
    images: ["https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=630&fit=crop"],
  },
  alternates: {
    canonical: "https://noddo.io/nosotros",
  },
};

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
