"use client";

import { Shield, Lock, Database, Eye, FileText, Mail, Globe, UserCheck } from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "responsable", title: "Responsable del tratamiento", icon: Building },
  { id: "datos", title: "Datos que recopilamos", icon: Database },
  { id: "finalidad", title: "Finalidad del tratamiento", icon: Eye },
  { id: "base-legal", title: "Base legal", icon: FileText },
  { id: "terceros", title: "Compartir con terceros", icon: Globe },
  { id: "derechos", title: "Derechos del titular", icon: UserCheck },
  { id: "seguridad", title: "Seguridad", icon: Lock },
  { id: "retencion", title: "Retención de datos", icon: Database },
  { id: "cookies", title: "Cookies y tracking", icon: Eye },
  { id: "internacional", title: "Transferencia internacional", icon: Globe },
  { id: "menores", title: "Menores de edad", icon: Shield },
  { id: "modificaciones", title: "Modificaciones", icon: FileText },
  { id: "contacto", title: "Contacto", icon: Mail },
];

function Building(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

export default function PrivacidadPage() {
  const [activeSection, setActiveSection] = useState<string>("responsable");

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light">
            <Shield className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Legal
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
            Política de Privacidad
          </h1>
          <p
            className="text-base max-w-2xl mx-auto"
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            En NODDO protegemos sus datos personales con medidas de seguridad de nivel empresarial
            y cumplimiento total de la Ley 1581 de 2012 de Colombia.
          </p>
          <p
            className="text-xs mt-4"
            style={{
              fontFamily: "var(--font-dm-mono)",
              color: "rgba(244,240,232,0.35)",
            }}
          >
            Última actualización: 14 de marzo de 2026
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Table of Contents - Sticky Sidebar */}
          <aside className="lg:col-span-3">
            <nav className="glass-card p-6 sticky top-24">
              <h2
                className="text-sm uppercase tracking-[0.15em] mb-4"
                style={{
                  fontFamily: "var(--font-syne)",
                  fontWeight: 700,
                  color: "rgba(244,240,232,0.55)",
                }}
              >
                Contenido
              </h2>
              <ul className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        onClick={() => setActiveSection(section.id)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200"
                        style={{
                          backgroundColor: isActive
                            ? "rgba(184, 151, 58, 0.12)"
                            : "transparent",
                          borderLeft: isActive
                            ? "2px solid #b8973a"
                            : "2px solid transparent",
                          color: isActive
                            ? "rgba(244,240,232,0.92)"
                            : "rgba(244,240,232,0.55)",
                          fontFamily: "var(--font-dm-mono)",
                          fontSize: "0.75rem",
                          fontWeight: 300,
                        }}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-1">{section.title}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <main className="lg:col-span-9">
            <div className="space-y-6">
              {/* 1. Responsable */}
              <section id="responsable" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Building className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      1. Responsable del tratamiento
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Antigravity SAS
                    </strong>
                    , identificada con NIT [por definir], con domicilio en Medellín, Colombia,
                    es la responsable del tratamiento de los datos personales recopilados a
                    través de la plataforma NODDO (
                    <a
                      href="https://noddo.io"
                      className="underline"
                      style={{ color: "#b8973a" }}
                    >
                      noddo.io
                    </a>
                    ).
                  </p>
                  <p>
                    Correo de contacto para ejercicio de derechos:{" "}
                    <a
                      href="mailto:hola@noddo.io"
                      className="underline"
                      style={{ color: "#b8973a" }}
                    >
                      hola@noddo.io
                    </a>
                  </p>
                </div>
              </section>

              {/* 2. Datos que recopilamos */}
              <section id="datos" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Database className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      2. Datos que recopilamos
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-4 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>Recopilamos los siguientes tipos de datos personales:</p>

                  <div className="space-y-3">
                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        Datos de registro y autenticación
                      </h3>
                      <p>
                        Nombre completo, email, contraseña (encriptada con bcrypt), teléfono
                        (opcional), empresa, cargo. Si utiliza Google OAuth, recibimos su
                        nombre, email y foto de perfil de Google.
                      </p>
                    </div>

                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        Datos de contacto (leads de proyectos inmobiliarios)
                      </h3>
                      <p>
                        Nombre, email, teléfono, país, mensaje, tipología de interés, parámetros
                        UTM (utm_source, utm_medium, utm_campaign), IP (anonimizada), timestamp.
                      </p>
                    </div>

                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        Datos de uso y analytics
                      </h3>
                      <p>
                        Páginas visitadas, tiempo de permanencia, dispositivo, navegador, sistema
                        operativo, resolución de pantalla, referrer, eventos de interacción
                        (clics en CTAs, descargas de brochure, reproducciones de video), datos
                        de sesión. Usamos Meta Pixel y Google Tag Manager para seguimiento.
                      </p>
                    </div>

                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        Datos de proyecto cargados por el usuario
                      </h3>
                      <p>
                        Imágenes, renders 3D, videos, planos, brochures PDF, textos
                        descriptivos, precios, especificaciones técnicas, coordenadas GPS de
                        ubicación del proyecto, logotipo de la constructora, datos de unidades
                        (inventario inmobiliario).
                      </p>
                    </div>

                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        Datos de facturación y pago
                      </h3>
                      <p>
                        Nombre de empresa, NIT/RUT, dirección de facturación, método de pago
                        (procesado por Stripe o pasarela de pago). NODDO no almacena datos de
                        tarjetas de crédito.
                      </p>
                    </div>

                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        Datos de colaboradores
                      </h3>
                      <p>
                        Email, nombre y permisos de colaboradores invitados (hasta 3 por
                        proyecto). Los colaboradores tienen acceso limitado solo a cambiar el
                        estado de unidades.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Finalidad */}
              <section id="finalidad" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Eye className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      3. Finalidad del tratamiento
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>Los datos personales se utilizan para:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Gestionar su cuenta y prestar el Servicio contratado</li>
                    <li>
                      Transmitir datos de leads en tiempo real al administrador del proyecto
                      inmobiliario correspondiente y a sistemas CRM externos (GoHighLevel, HubSpot)
                    </li>
                    <li>
                      Enviar notificaciones transaccionales (nuevos leads, cotizaciones, alertas
                      de inventario, recordatorios de pago)
                    </li>
                    <li>
                      Procesar pagos y emitir facturas (mediante procesadores de pago de terceros)
                    </li>
                    <li>
                      Mejorar el Servicio mediante análisis de uso agregado, A/B testing, y
                      detección de patrones de comportamiento
                    </li>
                    <li>
                      Proveer soporte técnico y atención al cliente (mediante tickets, chat, email)
                    </li>
                    <li>
                      Cumplir con obligaciones legales (retención de registros contables, fiscales,
                      respuestas a autoridades)
                    </li>
                    <li>
                      Detectar y prevenir fraude, abuso del Servicio, y accesos no autorizados
                    </li>
                    <li>
                      Enviar comunicaciones de marketing sobre nuevas funcionalidades (puede
                      darse de baja en cualquier momento)
                    </li>
                  </ul>
                </div>
              </section>

              {/* 4. Base legal */}
              <section id="base-legal" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <FileText className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      4. Base legal del tratamiento
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>El tratamiento de datos se realiza con base en:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Ejecución del contrato:
                      </strong>{" "}
                      El procesamiento de sus datos es necesario para prestar el Servicio que ha
                      contratado.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Consentimiento informado:
                      </strong>{" "}
                      Al enviar formularios de contacto, agendar demos, o suscribirse a
                      comunicaciones, usted otorga consentimiento expreso.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Interés legítimo:
                      </strong>{" "}
                      Para análisis de uso agregado, mejora del Servicio, detección de fraude, y
                      seguridad de la plataforma.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Obligación legal:
                      </strong>{" "}
                      Cumplimiento de normativas fiscales, contables, y respuesta a solicitudes de
                      autoridades competentes.
                    </li>
                  </ul>
                  <p className="pt-3">
                    En cumplimiento de la{" "}
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Ley 1581 de 2012
                    </strong>{" "}
                    de Colombia y su decreto reglamentario 1377 de 2013 (Régimen General de
                    Protección de Datos Personales).
                  </p>
                </div>
              </section>

              {/* 5. Terceros */}
              <section id="terceros" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Globe className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      5. Compartir datos con terceros
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-4 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    Los datos de leads se comparten con el administrador del proyecto inmobiliario
                    donde el visitante envió el formulario. Esto es esencial para el
                    funcionamiento del Servicio.
                  </p>
                  <p>
                    Adicionalmente, utilizamos los siguientes proveedores de servicio (data
                    processors):
                  </p>

                  <div className="space-y-2 pl-4">
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Supabase (EE.UU.)
                      </strong>{" "}
                      — Base de datos PostgreSQL, autenticación, almacenamiento de archivos. Datos
                      encriptados en tránsito y en reposo.
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Vercel (EE.UU.)
                      </strong>{" "}
                      — Hosting de la aplicación web, CDN global para entrega rápida de contenido.
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Cloudflare R2 & Stream (global)
                      </strong>{" "}
                      — Almacenamiento de tours 360°, videos de alta resolución, y assets pesados.
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Resend (EE.UU.)
                      </strong>{" "}
                      — Envío de emails transaccionales (notificaciones de leads, recuperación de
                      contraseña).
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Mapbox (EE.UU.)
                      </strong>{" "}
                      — Mapas satelitales interactivos (no se envían datos personales, solo
                      coordenadas de proyectos).
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Sentry (EE.UU.)
                      </strong>{" "}
                      — Monitoreo de errores y performance. Datos anonimizados, sin PII.
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Meta Pixel (Facebook/Meta)
                      </strong>{" "}
                      — Tracking de conversiones y remarketing. Puede deshabilitarse bloqueando
                      scripts de terceros.
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Google Tag Manager / Analytics
                      </strong>{" "}
                      — Análisis de tráfico web y comportamiento de usuarios. IP anonimizada.
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        GoHighLevel (GHL)
                      </strong>{" "}
                      — Integración CRM opcional. Si el administrador del proyecto habilita la
                      integración, los leads se envían a su cuenta GHL en tiempo real.
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Stripe</strong> —
                      Procesamiento de pagos (datos de tarjeta no pasan por servidores de NODDO).
                    </div>
                  </div>

                  <p className="pt-3">
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      NO vendemos, alquilamos ni compartimos datos personales con fines
                      publicitarios o de marketing de terceros.
                    </strong>{" "}
                    Todos los proveedores listados operan bajo acuerdos de procesamiento de datos
                    (DPA) y cumplen con estándares internacionales de seguridad.
                  </p>
                </div>
              </section>

              {/* 6. Derechos */}
              <section id="derechos" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <UserCheck className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      6. Derechos del titular
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>De acuerdo con la Ley 1581 de 2012, usted tiene derecho a:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Conocer, actualizar y rectificar
                      </strong>{" "}
                      sus datos personales. Puede hacerlo desde la configuración de su cuenta o
                      escribiéndonos.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Solicitar prueba de la autorización
                      </strong>{" "}
                      otorgada para el tratamiento de datos.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Ser informado del uso
                      </strong>{" "}
                      dado a sus datos personales.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Revocar la autorización y/o solicitar la supresión
                      </strong>{" "}
                      de sus datos (sujeto a obligaciones legales de retención).
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Acceder gratuitamente
                      </strong>{" "}
                      a los datos objeto de tratamiento.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Presentar quejas
                      </strong>{" "}
                      ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la
                      ley.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Portabilidad de datos
                      </strong>{" "}
                      — Puede solicitar una exportación completa de sus datos en formato JSON.
                    </li>
                  </ul>
                  <p className="pt-3">
                    Para ejercer estos derechos, escriba a{" "}
                    <a
                      href="mailto:hola@noddo.io"
                      className="underline"
                      style={{ color: "#b8973a" }}
                    >
                      hola@noddo.io
                    </a>{" "}
                    con el asunto "Ejercicio de derechos ARCO". Responderemos en un plazo máximo
                    de <strong style={{ color: "rgba(244,240,232,0.92)" }}>15 días hábiles</strong>.
                  </p>
                </div>
              </section>

              {/* 7. Seguridad */}
              <section id="seguridad" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Lock className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      7. Seguridad de los datos
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    Implementamos medidas técnicas y organizativas de nivel empresarial para
                    proteger sus datos:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Encriptación en tránsito
                      </strong>{" "}
                      — Todas las comunicaciones usan HTTPS/TLS 1.3.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Encriptación en reposo
                      </strong>{" "}
                      — Contraseñas con bcrypt, datos sensibles con AES-256.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Row Level Security (RLS)
                      </strong>{" "}
                      — Control de acceso a nivel de fila en base de datos.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Control de acceso basado en roles (RBAC)
                      </strong>{" "}
                      — Administradores, colaboradores y usuarios públicos con permisos separados.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Auditoría y logging
                      </strong>{" "}
                      — Registro de accesos, cambios sensibles, y eventos de seguridad.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Backups automáticos
                      </strong>{" "}
                      — Copias de seguridad diarias con retención de 30 días.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Monitoreo 24/7
                      </strong>{" "}
                      — Detección de anomalías, intentos de acceso no autorizado, y ataques DDoS.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Autenticación multifactor (MFA)
                      </strong>{" "}
                      — Disponible opcionalmente para administradores.
                    </li>
                  </ul>
                  <p className="pt-3">
                    A pesar de estas medidas, ningún sistema es 100% seguro. En caso de brecha de
                    seguridad que afecte datos personales, notificaremos a los usuarios afectados
                    dentro de 72 horas y a la SIC según lo establece la ley.
                  </p>
                </div>
              </section>

              {/* 8. Retención */}
              <section id="retencion" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Database className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      8. Retención de datos
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>Los períodos de retención varían según el tipo de dato:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Datos de cuenta:
                      </strong>{" "}
                      Se conservan mientras la suscripción esté activa y 30 días adicionales tras
                      la cancelación (para permitir reactivación).
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Datos de leads:</strong>{" "}
                      Se conservan mientras el proyecto esté activo. Tras desactivación del
                      proyecto, se mantienen 90 días antes de eliminación permanente.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Datos de facturación:
                      </strong>{" "}
                      Se conservan por 10 años en cumplimiento de obligaciones fiscales colombianas
                      (Estatuto Tributario Art. 632).
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Datos de analytics:
                      </strong>{" "}
                      Se conservan de forma agregada y anonimizada indefinidamente para análisis
                      estadístico.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Logs de acceso:</strong>{" "}
                      Se conservan por 6 meses para auditoría de seguridad.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Backups:</strong>{" "}
                      Los backups automáticos se conservan por 30 días, luego se eliminan
                      permanentemente.
                    </li>
                  </ul>
                </div>
              </section>

              {/* 9. Cookies */}
              <section id="cookies" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Eye className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      9. Cookies y tecnologías de tracking
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-4 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>NODDO utiliza las siguientes cookies y tecnologías de tracking:</p>

                  <div className="space-y-3">
                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        Cookies esenciales (no se pueden desactivar)
                      </h3>
                      <p>
                        Sesión de autenticación (Supabase), preferencias de usuario, protección
                        CSRF. Estas cookies son necesarias para el funcionamiento del Servicio.
                      </p>
                    </div>

                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        Meta Pixel (Facebook)
                      </h3>
                      <p>
                        Rastreo de conversiones, remarketing, y optimización de campañas
                        publicitarias. Puede bloquearse mediante extensiones anti-tracking o
                        configuración de privacidad del navegador.
                      </p>
                    </div>

                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        Google Tag Manager / Google Analytics
                      </h3>
                      <p>
                        Análisis de tráfico web, comportamiento de usuarios, embudo de conversión.
                        Configurado con IP anonimizada. Puede bloquearse mediante{" "}
                        <a
                          href="https://tools.google.com/dlpage/gaoptout"
                          className="underline"
                          style={{ color: "#b8973a" }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Google Analytics Opt-out Browser Add-on
                        </a>
                        .
                      </p>
                    </div>

                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        Analytics propios (sin cookies)
                      </h3>
                      <p>
                        Sistema de analytics server-side que no usa cookies de terceros. Rastrea
                        pageviews, eventos, y conversiones de forma respetuosa con la privacidad.
                      </p>
                    </div>
                  </div>

                  <p className="pt-3">
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      NO utilizamos cookies de seguimiento publicitario invasivo.
                    </strong>{" "}
                    Puede controlar las cookies desde la configuración de su navegador. Bloquear
                    cookies esenciales puede afectar la funcionalidad del Servicio.
                  </p>
                </div>
              </section>

              {/* 10. Internacional */}
              <section id="internacional" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Globe className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      10. Transferencia internacional de datos
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    Sus datos pueden ser procesados en servidores ubicados fuera de Colombia,
                    principalmente en Estados Unidos y Europa, a través de nuestros proveedores de
                    infraestructura (Supabase, Vercel, Cloudflare).
                  </p>
                  <p>
                    Estos proveedores cumplen con estándares de seguridad equivalentes o superiores
                    a los exigidos por la legislación colombiana. Las transferencias se realizan
                    bajo contratos de procesamiento de datos (DPA) que garantizan:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Tratamiento conforme a nuestras instrucciones</li>
                    <li>Medidas de seguridad técnicas y organizativas apropiadas</li>
                    <li>Confidencialidad de los datos</li>
                    <li>Eliminación o devolución de datos al finalizar el servicio</li>
                    <li>
                      Asistencia en caso de ejercicio de derechos por parte de los titulares
                    </li>
                  </ul>
                  <p className="pt-3">
                    Al utilizar el Servicio, usted autoriza expresamente estas transferencias
                    internacionales de datos.
                  </p>
                </div>
              </section>

              {/* 11. Menores */}
              <section id="menores" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Shield className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      11. Menores de edad
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    NODDO no está dirigido a menores de 18 años. No recopilamos intencionalmente
                    datos de menores. Si detectamos que un menor de edad ha proporcionado datos
                    personales sin autorización parental, eliminaremos esos datos de nuestros
                    sistemas.
                  </p>
                  <p>
                    Si usted es padre/madre/tutor y descubre que su hijo menor ha proporcionado
                    datos a NODDO, contáctenos inmediatamente en{" "}
                    <a
                      href="mailto:hola@noddo.io"
                      className="underline"
                      style={{ color: "#b8973a" }}
                    >
                      hola@noddo.io
                    </a>
                    .
                  </p>
                </div>
              </section>

              {/* 12. Modificaciones */}
              <section id="modificaciones" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <FileText className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      12. Modificaciones a esta política
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-3 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    Esta política puede ser actualizada periódicamente para reflejar cambios en
                    nuestras prácticas de datos, nuevas funcionalidades, o requisitos legales.
                  </p>
                  <p>
                    Publicaremos los cambios en esta página y actualizaremos la fecha de "Última
                    actualización" al inicio del documento. Si los cambios son significativos
                    (nuevos usos de datos, nuevos terceros), notificaremos por email con al menos
                    30 días de anticipación.
                  </p>
                  <p>
                    Le recomendamos revisar esta política periódicamente para mantenerse informado
                    sobre cómo protegemos sus datos.
                  </p>
                </div>
              </section>

              {/* 13. Contacto */}
              <section id="contacto" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Mail className="w-6 h-6" style={{ color: "#b8973a" }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 400,
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      13. Contacto
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-4 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  <p>
                    Para cualquier consulta relacionada con esta política, el tratamiento de sus
                    datos personales, o el ejercicio de sus derechos, contáctenos en:
                  </p>
                  <div className="pl-4 space-y-2">
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Email:</strong>{" "}
                      <a
                        href="mailto:hola@noddo.io"
                        className="underline"
                        style={{ color: "#b8973a" }}
                      >
                        hola@noddo.io
                      </a>
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Responsable de protección de datos:
                      </strong>{" "}
                      Antigravity SAS
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Ubicación:</strong>{" "}
                      Medellín, Colombia
                    </div>
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Sitio web:</strong>{" "}
                      <a
                        href="https://noddo.io"
                        className="underline"
                        style={{ color: "#b8973a" }}
                      >
                        noddo.io
                      </a>
                    </div>
                  </div>
                  <p className="pt-3">
                    Responderemos a su solicitud en un plazo máximo de{" "}
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>15 días hábiles</strong> de
                    acuerdo con la Ley 1581 de 2012.
                  </p>
                </div>
              </section>
            </div>
          </main>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <p
              className="text-sm mb-4"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.70)",
              }}
            >
              ¿Tiene dudas sobre nuestro tratamiento de datos? Estamos aquí para ayudar.
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
              <Mail className="w-4 h-4" />
              Contáctenos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
