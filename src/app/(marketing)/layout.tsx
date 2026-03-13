import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { CustomCursor } from "@/components/marketing/CustomCursor";
import { BookingProvider } from "@/components/marketing/BookingProvider";
import { BookingModal } from "@/components/marketing/BookingModal";

export const metadata: Metadata = {
  title: "NODDO — Sala de Ventas Digital para Constructoras",
  description:
    "Crea un showroom inmobiliario interactivo en 1 día. Fachada interactiva, inventario en vivo, leads calificados. Sin agencia, sin código, sin esperar.",
  openGraph: {
    title: "NODDO — Sala de Ventas Digital para Constructoras",
    description:
      "Showroom inmobiliario interactivo con fachada clicable, planos y leads automáticos. Publicado en 1 día.",
    type: "website",
    siteName: "NODDO",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "NODDO — Sala de Ventas Digital",
    description:
      "Showroom inmobiliario interactivo. Sin agencia, sin código, sin esperar.",
  },
  robots: { index: true, follow: true },
};

const noiseDataUri =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing min-h-screen relative">
      {/* Gold grid lines background */}
      <div className="fixed inset-0 bg-grid-lines pointer-events-none z-[2]" />

      {/* Noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[100] opacity-50"
        style={{ backgroundImage: `url("${noiseDataUri}")` }}
      />

      <BookingProvider>
        <CustomCursor />
        <MarketingNav />
        <main className="relative z-[1]">{children}</main>
        <MarketingFooter />
        <BookingModal />
      </BookingProvider>
    </div>
  );
}
