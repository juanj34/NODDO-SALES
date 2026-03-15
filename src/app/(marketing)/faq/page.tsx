"use client";

import { HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "¿Qué es NODDO exactamente?",
        a: "NODDO es una plataforma SaaS que permite a constructoras e inmobiliarias crear micrositios digitales premium para sus proyectos. No es un simple generador de páginas — es una sala de ventas digital completa con inventario en vivo, cotizador automático, captura de leads con CRM integrado, y analytics en tiempo real.",
      },
      {
        q: "¿Cuánto tiempo toma lanzar un proyecto?",
        a: "Entre 1 y 3 días. El proceso típico: Día 1 — Carga tu contenido (renders, planos, textos). Día 2 — Configura inventario y personaliza branding. Día 3 — Revisión final y publicación. Si tienes todo listo (imágenes, textos, videos), puedes lanzar en menos de 24 horas.",
      },
      {
        q: "¿Necesito conocimientos técnicos?",
        a: "No. Si sabes usar Excel y subir archivos a Dropbox, puedes usar NODDO. La interfaz es punto-y-click, sin código. Nuestro equipo de onboarding te guía en el primer proyecto.",
      },
      {
        q: "¿Qué pasa con mi sitio si cancelo?",
        a: "Tienes acceso hasta el final del período pagado. Después, el sitio se desactiva pero tus datos se conservan por 30 días. Puedes exportar toda tu información (leads, analytics, contenido) antes de que se elimine permanentemente.",
      },
    ],
  },
  {
    category: "Funcionalidades",
    questions: [
      {
        q: "¿Puedo conectar mi propio dominio?",
        a: "Sí. Puedes usar dominios personalizados (ej: torreazul.com) en lugar del subdominio de NODDO (torreazul.noddo.io). La configuración DNS es guiada — te decimos exactamente qué registros crear.",
      },
      {
        q: "¿Cómo funciona la integración con CRM?",
        a: "Integramos con GoHighLevel y HubSpot mediante webhooks. Cada lead capturado en tu microsite se envía automáticamente a tu CRM en tiempo real con toda la información: nombre, email, teléfono, unidad de interés, parámetros UTM para rastrear fuente.",
      },
      {
        q: "¿Puedo actualizar inventario en tiempo real?",
        a: "Sí. Tienes un panel de administración donde cambias estado de unidades (disponible, reservada, vendida) en 2 clicks. Los cambios se reflejan instantáneamente en el microsite. También puedes invitar hasta 3 colaboradores (ej: asesores de ventas) con permisos limitados solo para actualizar inventario.",
      },
      {
        q: "¿Soporta tours virtuales 360°?",
        a: "Sí. Puedes embeber tours de Matterport o subir tours 360° propios. Los almacenamos en Cloudflare Stream (streaming optimizado) o puedes usar URL externa.",
      },
      {
        q: "¿Puedo tener múltiples proyectos?",
        a: "Sí. Cada plan incluye cierto número de proyectos activos. Si necesitas más, puedes actualizar tu plan o pagar proyectos adicionales a la carta.",
      },
    ],
  },
  {
    category: "Precios y Planes",
    questions: [
      {
        q: "¿Hay período de prueba gratis?",
        a: "Ofrecemos garantía de reembolso de 14 días. Si no estás satisfecho en las primeras 2 semanas, te devolvemos el 100% sin preguntas. Es mejor que un trial — ya tienes acceso completo a todas las funcionalidades.",
      },
      {
        q: "¿Qué incluyen los precios?",
        a: "Todo: hosting ilimitado, bandwidth, almacenamiento de imágenes/videos, SSL, dominio personalizado, analytics, captura de leads sin límite, soporte por email, actualizaciones continuas. No hay costos ocultos ni cargos por tráfico.",
      },
      {
        q: "¿Puedo cambiar de plan después?",
        a: "Sí. Puedes upgrade o downgrade en cualquier momento. Si haces upgrade, pagas la diferencia prorrateada. Si haces downgrade, el cambio aplica al próximo ciclo de facturación.",
      },
      {
        q: "¿Hay descuento por pago anual?",
        a: "Sí, 20% de descuento en planes anuales. Si pagas el año completo por adelantado, ahorras el equivalente a 2.4 meses.",
      },
    ],
  },
  {
    category: "Técnico",
    questions: [
      {
        q: "¿Dónde se almacenan mis datos?",
        a: "En servidores de Supabase (PostgreSQL) ubicados en Estados Unidos, con backups automáticos diarios. Los videos y tours pesados van a Cloudflare R2 (CDN global). Todo encriptado en tránsito (HTTPS) y en reposo (AES-256).",
      },
      {
        q: "¿Qué tan rápido carga el sitio?",
        a: "Muy rápido. Usamos Next.js 16 con Turbopack, CDN global de Vercel, imágenes optimizadas automáticamente (WebP, lazy loading), y caching agresivo. Tiempo de carga típico: <2 segundos en móvil 4G.",
      },
      {
        q: "¿Es responsive / mobile-first?",
        a: "Totalmente. Más del 70% de visitantes inmobiliarios vienen de móvil. Los microsites están optimizados para pantallas pequeñas primero, luego escritorio. Todo funciona perfectamente en iPhone, Android, tablets.",
      },
      {
        q: "¿Qué pasa si hay un problema técnico?",
        a: "Tenemos monitoreo 24/7 con Sentry y alertas automáticas. Si algo falla, lo sabemos antes que tú. SLA objetivo: 99.5% uptime. En caso de incident, puedes ver el estado en tiempo real en noddo.io/estado.",
      },
      {
        q: "¿Hacen backups de mi contenido?",
        a: "Sí. Backups automáticos diarios con retención de 30 días. Si borras algo por error, podemos restaurarlo. También puedes exportar todos tus datos en cualquier momento (JSON, CSV).",
      },
    ],
  },
  {
    category: "Leads y Ventas",
    questions: [
      {
        q: "¿Cómo recibo los leads?",
        a: "Tienes 3 opciones: (1) Email instantáneo cada vez que alguien llena el formulario, (2) Panel de administración con todos los leads, filtros, y exportación, (3) Webhook a tu CRM (GoHighLevel, HubSpot, Zapier, Make).",
      },
      {
        q: "¿Puedo ver de dónde vienen mis leads?",
        a: "Sí. Cada lead captura automáticamente parámetros UTM (utm_source, utm_medium, utm_campaign) para que sepas qué campaña de marketing generó ese lead. También tenemos analytics de tráfico: pageviews, tiempo en sitio, tasa de conversión.",
      },
      {
        q: "¿El formulario de contacto permite WhatsApp?",
        a: "Sí. Todos los microsites tienen botón flotante de WhatsApp que abre conversación directa con el número de contacto del proyecto. El mensaje se pre-llena con info del proyecto y unidad de interés.",
      },
      {
        q: "¿Puedo A/B test diferentes versiones?",
        a: "Próximamente. Por ahora, puedes crear versiones (snapshots) de tu proyecto y restaurarlas si quieres volver a una versión anterior. A/B testing nativo está en nuestro roadmap Q2 2026.",
      },
    ],
  },
  {
    category: "Soporte",
    questions: [
      {
        q: "¿Qué tipo de soporte ofrecen?",
        a: "Email support (hola@noddo.io) con respuesta en 24-48 horas hábiles. Para planes Enterprise, ofrecemos soporte prioritario con respuesta <4 horas y onboarding dedicado.",
      },
      {
        q: "¿Hay documentación?",
        a: "Sí, aunque aún está en construcción. Tenemos video tutorials para las tareas más comunes. Si tienes dudas, nuestro equipo de soporte te responde rápido.",
      },
      {
        q: "¿Ofrecen capacitación?",
        a: "Sí. Todos los clientes nuevos reciben onboarding call de 30-45 minutos donde te guiamos en la creación de tu primer proyecto paso a paso. Es opcional pero altamente recomendado.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleQuestion = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light">
            <HelpCircle className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Ayuda
            </span>
          </div>
          <h1
            className="text-5xl md:text-6xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Preguntas Frecuentes
          </h1>
          <p
            className="text-base max-w-2xl mx-auto"
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            Todo lo que necesitas saber sobre NODDO. Si no encuentras tu respuesta, escríbenos a{" "}
            <a href="mailto:hola@noddo.io" className="underline" style={{ color: "#b8973a" }}>
              hola@noddo.io
            </a>
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqs.map((category, catIndex) => (
            <section key={catIndex}>
              <h2
                className="text-2xl mb-6"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === key;
                  return (
                    <div key={qIndex} className="glass-card overflow-hidden">
                      <button
                        onClick={() => toggleQuestion(catIndex, qIndex)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left transition-all duration-200 hover:bg-white/5"
                      >
                        <span
                          className="text-base font-medium pr-4"
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            fontWeight: 400,
                            color: "rgba(244,240,232,0.92)",
                          }}
                        >
                          {faq.q}
                        </span>
                        <ChevronDown
                          className="w-5 h-5 shrink-0 transition-transform duration-200"
                          style={{
                            color: "#b8973a",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </button>
                      <div
                        className="overflow-hidden transition-all duration-200"
                        style={{
                          maxHeight: isOpen ? "500px" : "0",
                        }}
                      >
                        <div className="px-6 pb-5 pt-2">
                          <p
                            className="text-sm leading-[1.8]"
                            style={{
                              fontFamily: "var(--font-dm-mono)",
                              fontWeight: 300,
                              color: "rgba(244,240,232,0.70)",
                            }}
                          >
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="glass-card p-10">
            <h2
              className="text-2xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              ¿No encontraste lo que buscabas?
            </h2>
            <p
              className="text-sm mb-6"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.55)",
              }}
            >
              Nuestro equipo está listo para ayudarte
            </p>
            <a
              href="mailto:hola@noddo.io"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                background: "linear-gradient(135deg, #b8973a 0%, #d4b05a 100%)",
                color: "#0a0a0b",
              }}
            >
              Contáctanos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
