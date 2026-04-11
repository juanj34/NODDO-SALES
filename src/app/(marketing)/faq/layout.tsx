import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes | NODDO — Sala de Ventas Digital",
  description: "Resuelve tus dudas sobre NODDO: cómo funciona, cuánto cuesta, tiempos de implementación, integraciones disponibles y más.",
  keywords: ["FAQ NODDO", "preguntas frecuentes micrositio inmobiliario", "sala de ventas digital FAQ"],
  openGraph: {
    title: "Preguntas Frecuentes | NODDO",
    description: "Todo lo que necesitas saber sobre NODDO. Preguntas y respuestas sobre planes, implementación e integraciones.",
    url: "https://noddo.io/faq",
    siteName: "NODDO",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ | NODDO",
    description: "Preguntas frecuentes sobre micrositios inmobiliarios NODDO.",
  },
  alternates: {
    canonical: "https://noddo.io/faq",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Qué es NODDO exactamente?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "NODDO es una plataforma SaaS que permite a constructoras e inmobiliarias crear micrositios digitales premium para sus proyectos. Es una sala de ventas digital completa con inventario en vivo, cotizador automático, captura de leads con CRM integrado, y analytics en tiempo real.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cuánto tiempo toma lanzar un proyecto?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Entre 1 y 3 días. Si tienes tu contenido listo (renders, planos, textos), puedes publicar en menos de 24 horas.",
      },
    },
    {
      "@type": "Question",
      name: "¿Necesito conocimientos técnicos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Si sabes usar Excel y subir archivos a Drive, puedes usar NODDO. La interfaz es punto-y-click, sin código. Nuestro equipo de onboarding te guía en el primer proyecto paso a paso.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cuánto cuesta NODDO?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Plan Básico desde $199 USD/mes por proyecto. Plan Pro desde $249 USD/mes con cotizador integrado, correos personalizados y estadísticas avanzadas. Sin costos ocultos ni contratos de permanencia.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo conectar mi propio dominio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Puedes usar dominios personalizados (ej: torreazul.com) en lugar del subdominio de NODDO. La configuración DNS es guiada.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo actualizar inventario en tiempo real?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Tienes un panel de administración donde cambias estado de unidades (disponible, reservada, vendida) en 2 clicks. Los cambios se reflejan instantáneamente en el microsite.",
      },
    },
  ],
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
