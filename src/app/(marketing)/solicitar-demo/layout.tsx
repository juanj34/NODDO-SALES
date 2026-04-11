import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solicitar Demo | NODDO — Ve la Plataforma en Acción",
  description: "Agenda una demo personalizada de NODDO. Te mostramos cómo crear un micrositio inmobiliario profesional en menos de 1 hora.",
  keywords: ["demo NODDO", "probar micrositio inmobiliario", "demo sala de ventas digital"],
  openGraph: {
    title: "Solicitar Demo | NODDO",
    description: "Agenda una demo y ve cómo NODDO transforma la venta de tus proyectos inmobiliarios.",
    url: "https://noddo.io/solicitar-demo",
    siteName: "NODDO",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solicitar Demo | NODDO",
    description: "Agenda tu demo personalizada de NODDO.",
  },
  alternates: {
    canonical: "https://noddo.io/solicitar-demo",
  },
};

export default function SolicitarDemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
