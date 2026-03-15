"use client";

import { HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    category: "Primeros Pasos",
    questions: [
      {
        q: "¿Qué es NODDO exactamente?",
        a: "NODDO es una plataforma SaaS que permite a constructoras e inmobiliarias crear micrositios digitales premium para sus proyectos. No es un simple generador de páginas — es una sala de ventas digital completa con inventario en vivo, cotizador automático, captura de leads con CRM integrado, y analytics en tiempo real.",
      },
      {
        q: "¿Cuánto tiempo toma lanzar un proyecto?",
        a: "Entre 1 y 3 días. Si tienes tu contenido listo (renders, planos, textos), puedes publicar en menos de 24 horas. Muchos clientes lanzan el mismo día con ayuda de nuestro equipo de onboarding. El proceso es: Día 1 — Cargar contenido. Día 2 — Configurar inventario y branding. Día 3 — Publicación.",
      },
      {
        q: "¿Necesito conocimientos técnicos o un equipo IT?",
        a: "No. Si sabes usar Excel y subir archivos a Drive, puedes usar NODDO. La interfaz es punto-y-click, sin código. Nuestro equipo de onboarding te guía en el primer proyecto paso a paso.",
      },
      {
        q: "¿Puedo migrar mi contenido existente?",
        a: "Sí. Podemos importar tu inventario desde Excel/Google Sheets. Las imágenes se suben por lotes arrastrando carpetas. Si ya tienes un sitio, podemos ayudarte a migrar el contenido en el onboarding.",
      },
      {
        q: "¿Qué pasa con mi sitio si cancelo o pauso el servicio?",
        a: "Tienes acceso hasta el final del período pagado. Después, el sitio se desactiva pero tus datos se conservan por 30 días por seguridad. Puedes exportar toda tu información (leads, analytics, contenido) en cualquier momento antes de la eliminación definitiva.",
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
        q: "¿Cuánto cuesta NODDO? ¿Cuál es el precio exacto?",
        a: "Tenemos 3 planes: Proyecto ($149/mes, 1 proyecto, 200 unidades), Studio ($349/mes, 3 proyectos, unidades ilimitadas, dominio propio, CRM), y Enterprise (personalizado, white-label, múltiples marcas). Todos los precios incluyen TODO — no hay costos ocultos.",
      },
      {
        q: "¿Hay período de prueba gratis o demo?",
        a: "Ofrecemos garantía de reembolso de 14 días — mejor que un trial porque ya tienes acceso completo a todas las funcionalidades. Si no estás satisfecho en las primeras 2 semanas, te devolvemos el 100% sin preguntas. También puedes ver un proyecto demo en vivo antes de contratar.",
      },
      {
        q: "¿Qué incluyen los precios? ¿Hay costos ocultos?",
        a: "Todo incluido: hosting ilimitado, bandwidth sin medición, almacenamiento de imágenes/videos, SSL automático, dominio .noddo.io (o personalizado en Studio+), analytics en tiempo real, captura de leads ilimitada, soporte por email, actualizaciones automáticas. Cero costos ocultos. Cero cargos por tráfico o visitantes.",
      },
      {
        q: "¿Puedo cambiar de plan después o hacer downgrade?",
        a: "Sí, en cualquier momento. Upgrade: pagas la diferencia prorrateada y aplica inmediatamente. Downgrade: el cambio aplica al próximo ciclo de facturación. Nunca pierdes datos ni configuración al cambiar de plan — todo se conserva.",
      },
      {
        q: "¿Hay descuento por pago anual o por múltiples proyectos?",
        a: "Sí, 20% de descuento en planes anuales (ahorras 2.4 meses). Si pagas por adelantado, el ahorro es inmediato. También ofrecemos descuentos a partir de 5+ proyectos — contáctanos para pricing personalizado.",
      },
      {
        q: "¿Qué pasa si mi proyecto crece y supero el límite de unidades?",
        a: "En el plan Proyecto (200 unidades), si creces, te avisamos antes del límite. Puedes hacer upgrade a Studio (unidades ilimitadas) y pagas solo la diferencia prorrateada. Nunca bloqueamos tu sitio por crecer — siempre hay una ruta clara.",
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
    category: "Leads, CRM y Ventas",
    questions: [
      {
        q: "¿Cómo recibo los leads? ¿Dónde llegan?",
        a: "Tienes 3 opciones: (1) Email instantáneo cada vez que alguien llena el formulario, (2) Panel de administración con todos los leads, filtros, búsqueda y exportación, (3) Webhook automático a tu CRM (GoHighLevel, HubSpot, Salesforce, Zapier, Make). Puedes activar las 3 simultáneamente.",
      },
      {
        q: "¿Puedo ver de dónde vienen mis leads? ¿Rastrean campañas?",
        a: "Sí, cada lead captura automáticamente parámetros UTM (utm_source, utm_medium, utm_campaign, utm_content, utm_term) para que sepas exactamente qué campaña, anuncio o post generó ese lead. También rastreamos navegador, dispositivo, ciudad, y tiempo en sitio antes de convertir.",
      },
      {
        q: "¿Se integra con mi CRM existente?",
        a: "Sí. Planes Studio y Enterprise incluyen integración directa con GoHighLevel, HubSpot, y Salesforce mediante webhooks. Los leads se envían en tiempo real con toda la información. Para otros CRMs, puedes usar Zapier o Make (webhooks genéricos).",
      },
      {
        q: "¿El formulario de contacto incluye WhatsApp?",
        a: "Sí. Todos los microsites tienen botón flotante de WhatsApp que abre conversación directa con el número de contacto del proyecto. El mensaje se pre-llena automáticamente con información del proyecto y unidad de interés para facilitar la conversación.",
      },
      {
        q: "¿Puedo hacer seguimiento a mis leads dentro de NODDO?",
        a: "Sí. El panel de leads incluye: búsqueda, filtros por fecha/proyecto/estado, notas internas, etiquetas, exportación a CSV/Excel, y vista de historial completo de cada contacto. No reemplaza un CRM completo, pero es útil para seguimiento básico.",
      },
      {
        q: "¿Puedo A/B test diferentes versiones del sitio?",
        a: "Próximamente. Por ahora, puedes crear versiones (snapshots) de tu proyecto y restaurarlas si quieres volver atrás. A/B testing nativo con métricas automáticas está en nuestro roadmap Q2 2026.",
      },
    ],
  },
  {
    category: "Seguridad y Datos",
    questions: [
      {
        q: "¿Dónde se almacenan mis datos? ¿Son seguros?",
        a: "En servidores de Supabase (PostgreSQL) ubicados en Estados Unidos, con backups automáticos diarios y replicación en múltiples zonas. Videos y tours pesados van a Cloudflare R2 (CDN global). Todo encriptado en tránsito (HTTPS/TLS 1.3) y en reposo (AES-256).",
      },
      {
        q: "¿Puedo exportar mis datos en cualquier momento?",
        a: "Sí, siempre. Puedes exportar leads (CSV/Excel), contenido (JSON), analytics (CSV), e imágenes (ZIP) desde el panel de administración. Nunca retenemos tus datos como rehenes — son tuyos y puedes llevártelos cuando quieras.",
      },
      {
        q: "¿Cumplen con GDPR y leyes de protección de datos?",
        a: "Sí. Somos compatibles con GDPR, CCPA, y LOPD. Tenemos política de privacidad clara, consentimientos explícitos, y procesos de eliminación bajo demanda. Los datos de leads solo se usan para tu gestión comercial — nunca los vendemos ni compartimos con terceros.",
      },
      {
        q: "¿Hacen backups de mi contenido automáticamente?",
        a: "Sí. Backups automáticos diarios con retención de 30 días. Si borras algo por error, podemos restaurarlo. También puedes crear snapshots manuales antes de cambios importantes y restaurarlos cuando quieras.",
      },
      {
        q: "¿Qué tan seguro es el sitio contra hackeos o ataques?",
        a: "Muy seguro. Usamos infraestructura enterprise de Vercel + Supabase con: protección DDoS automática, WAF (Web Application Firewall), rate limiting, autenticación robusta, y monitoreo 24/7. Actualizamos dependencias semanalmente. No almacenamos datos de pago — eso va directo a Stripe (PCI-DSS Level 1).",
      },
    ],
  },
  {
    category: "Personalización y Marca",
    questions: [
      {
        q: "¿Puedo personalizar colores, fuentes y diseño?",
        a: "Sí. Cada proyecto tiene configuración de branding: colores primarios/secundarios, fuentes (elegir de biblioteca o subir propias), logos, y estilos de botones. En Enterprise, podemos hacer personalizaciones de diseño más profundas bajo pedido.",
      },
      {
        q: "¿Sirve para múltiples proyectos con diferentes marcas?",
        a: "Sí. Cada proyecto es independiente con su propio branding, dominio, y configuración. Perfecto si manejas múltiples proyectos o si eres agencia/inmobiliaria con varios clientes. En Enterprise, puedes white-label completo y manejar submarcas.",
      },
      {
        q: "¿Puedo agregar mi pixel de Facebook/Google Ads?",
        a: "Sí. Puedes insertar scripts personalizados (Facebook Pixel, Google Tag Manager, Google Analytics, LinkedIn Insight Tag, etc.) desde el panel de configuración. Los eventos de conversión se rastrean automáticamente.",
      },
      {
        q: "¿El sitio se adapta a móviles y tablets?",
        a: "Totalmente responsive. Más del 70% de visitantes inmobiliarios vienen de móvil. Los microsites están optimizados mobile-first: carga rápida en 4G, touch-friendly, formularios simples, imágenes optimizadas. Se ve perfecto en iPhone, Android, iPad, desktop.",
      },
    ],
  },
  {
    category: "Casos de Uso",
    questions: [
      {
        q: "¿NODDO sirve solo para apartamentos o también para casas/lotes/comercial?",
        a: "Sirve para cualquier tipo de proyecto inmobiliario: apartamentos, casas, townhouses, lotes urbanizados, oficinas, locales comerciales, bodegas, proyectos mixtos. La plataforma se adapta al tipo de unidad — puedes configurar specs personalizadas para cada tipo.",
      },
      {
        q: "¿Funciona para proyectos fuera de Colombia?",
        a: "Sí. Tenemos clientes activos en Colombia, México, Perú, Ecuador, Panamá, y Miami. La plataforma soporta múltiples monedas (COP, USD, MXN, PEN, etc.), idiomas (español, inglés, portugués), y configuraciones fiscales. El soporte es en español en horario americano.",
      },
      {
        q: "¿Puedo usarlo para preventa antes de tener renders finales?",
        a: "Sí. Muchos clientes lanzan en fase de preventa con renders preliminares, planos arquitectónicos, y descripciones. Puedes ir actualizando el contenido a medida que avanza el proyecto — renders definitivos, fotos de obra, videos de avance, tours 360° cuando estén listos.",
      },
      {
        q: "¿Sirve para proyectos pequeños (menos de 20 unidades)?",
        a: "Perfectamente. No hay mínimo de unidades. Tenemos clientes con proyectos de 8 casas hasta torres de 400+ apartamentos. El plan Proyecto (hasta 200 unidades) es ideal para proyectos pequeños y medianos.",
      },
    ],
  },
  {
    category: "Soporte y Capacitación",
    questions: [
      {
        q: "¿Qué tipo de soporte ofrecen y en qué horario?",
        a: "Soporte por email (hola@noddo.io) con respuesta en 24-48 horas hábiles (lunes a viernes, 9am-6pm COT). Para planes Enterprise, ofrecemos soporte prioritario con respuesta <4 horas, WhatsApp directo, y onboarding dedicado con videollamadas.",
      },
      {
        q: "¿Hay documentación o tutoriales?",
        a: "Sí. Tenemos centro de ayuda con guías escritas y video tutorials para las tareas más comunes: subir contenido, configurar inventario, personalizar branding, conectar dominio, exportar leads. La documentación se actualiza continuamente.",
      },
      {
        q: "¿Ofrecen capacitación para mi equipo de ventas?",
        a: "Sí. Todos los clientes nuevos reciben onboarding call de 30-45 minutos donde te guiamos en la creación de tu primer proyecto paso a paso. Para equipos grandes (5+ personas), ofrecemos sesiones de capacitación grupal personalizadas (disponible en Enterprise).",
      },
      {
        q: "¿Qué pasa si hay un problema técnico o el sitio cae?",
        a: "Tenemos monitoreo 24/7 con Sentry y alertas automáticas. Si algo falla, lo sabemos antes que tú. SLA objetivo: 99.5% uptime. En caso de incidente, puedes ver el estado en tiempo real en noddo.io/estado. Planes Enterprise tienen SLA garantizado de 99.9%.",
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
