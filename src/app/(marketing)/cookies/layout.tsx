import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies | NODDO",
  description: "Política de uso de cookies de NODDO. Conoce qué cookies utilizamos y cómo gestionarlas.",
  alternates: {
    canonical: "https://noddo.io/cookies",
  },
  robots: { index: true, follow: true },
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
