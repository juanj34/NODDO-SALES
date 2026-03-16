import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centro de Ayuda — NODDO",
  description:
    "Guías paso a paso para cada función de NODDO. Aprende a crear y gestionar tu micrositio inmobiliario premium.",
  openGraph: {
    title: "Centro de Ayuda — NODDO",
    description:
      "Guías paso a paso para cada función de NODDO. Aprende a crear y gestionar tu micrositio inmobiliario premium.",
  },
};

export default function AyudaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
