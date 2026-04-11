import type { Metadata } from "next";
import Script from "next/script";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { CustomCursor } from "@/components/marketing/CustomCursor";
import { BookingProvider } from "@/components/marketing/BookingProvider";
import { BookingModal } from "@/components/marketing/BookingModal";
import { ContactProvider } from "@/components/marketing/ContactProvider";
import { ContactModal } from "@/components/marketing/ContactModal";
import { GHLTracker } from "@/components/marketing/GHLTracker";
import { CookieConsent } from "@/components/common/CookieConsent";

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

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing min-h-screen relative">
      {/* Meta Pixel */}
      {META_PIXEL_ID && (
        <Script
          id="meta-pixel"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`,
          }}
        />
      )}
      {META_PIXEL_ID && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      )}

      {/* Google Tag Manager */}
      {GTM_ID && (
        <>
          <Script
            id="gtm-script"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="GTM"
            />
          </noscript>
        </>
      )}

      {/* Gold grid lines background */}
      <div className="fixed inset-0 bg-grid-lines pointer-events-none z-[2]" />

      {/* Noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[100] opacity-50"
        style={{ backgroundImage: `url("${noiseDataUri}")` }}
      />

      {/* Organization JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "NODDO",
            url: "https://noddo.io",
            logo: "https://noddo.io/LOGO_FAVICON-GOL.svg",
            description: "Plataforma SaaS de micrositios inmobiliarios para constructoras. Sala de ventas digital con inventario en vivo, cotizador y leads calificados.",
            foundingDate: "2024",
            contactPoint: {
              "@type": "ContactPoint",
              email: "hola@noddo.io",
              contactType: "sales",
              availableLanguage: ["Spanish", "English"],
            },
            sameAs: [],
            areaServed: {
              "@type": "GeoCircle",
              geoMidpoint: { "@type": "GeoCoordinates", latitude: 6.25, longitude: -75.57 },
              geoRadius: "10000 km",
            },
          }),
        }}
      />

      <BookingProvider>
        <ContactProvider>
          <CustomCursor />
          <GHLTracker />
          <MarketingNav />
          <main className="relative z-[1]">{children}</main>
          <MarketingFooter />
          <BookingModal />
          <ContactModal />
          <CookieConsent />
        </ContactProvider>
      </BookingProvider>
    </div>
  );
}
