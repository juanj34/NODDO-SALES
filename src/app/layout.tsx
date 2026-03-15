import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Mono, Inter, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LanguageProvider } from "@/i18n";
import { ReactQueryProvider } from "@/lib/react-query";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  preload: true,
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://noddo.io"),
  title: "NODDO — Micrositios Inmobiliarios",
  description:
    "Genera micrositios de venta inmobiliaria tipo sala de ventas digital para tus proyectos.",
  openGraph: {
    title: "NODDO — Sala de Ventas Digital para Constructoras",
    description:
      "Showroom inmobiliario interactivo con fachada clicable, planos y leads automáticos. Publicado en 1 día.",
    url: "https://noddo.io",
    siteName: "NODDO",
    images: [
      {
        url: "/og-image.jpg", // 1200x630
        width: 1200,
        height: 630,
        alt: "NODDO — Showroom Digital Inmobiliario",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NODDO — Sala de Ventas Digital",
    description:
      "Showroom inmobiliario interactivo. Sin agencia, sin código, sin esperar.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${cormorant.variable} ${dmMono.variable} ${inter.variable} ${syne.variable} antialiased`}
      >
        <ReactQueryProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ReactQueryProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
