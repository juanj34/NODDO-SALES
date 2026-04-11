import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estado del Servicio | NODDO",
  description: "Monitorea el estado actual de los servicios de NODDO. Uptime, incidentes y mantenimiento programado.",
  openGraph: {
    title: "Estado del Servicio | NODDO",
    description: "Estado actual de la plataforma NODDO.",
    url: "https://noddo.io/estado",
    siteName: "NODDO",
    locale: "es_ES",
    type: "website",
  },
  alternates: {
    canonical: "https://noddo.io/estado",
  },
  robots: { index: true, follow: true },
};

export default function EstadoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
