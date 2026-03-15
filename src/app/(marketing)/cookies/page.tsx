"use client";

import { Cookie, Shield, Eye, Settings, X, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "que-son", title: "¿Qué son las cookies?", icon: Cookie },
  { id: "como-usamos", title: "Cómo usamos cookies", icon: Eye },
  { id: "tipos", title: "Tipos de cookies", icon: Settings },
  { id: "terceros", title: "Cookies de terceros", icon: Shield },
  { id: "control", title: "Control de cookies", icon: Settings },
  { id: "cambios", title: "Cambios a esta política", icon: Cookie },
  { id: "contacto", title: "Contacto", icon: Mail },
];

export default function CookiesPage() {
  const [activeSection, setActiveSection] = useState<string>("que-son");

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light">
            <Cookie className="w-5 h-5" style={{ color: "#b8973a" }} />
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
            Política de Cookies
          </h1>
          <p
            className="text-base max-w-2xl mx-auto"
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            Información sobre las cookies que utiliza NODDO, su propósito, y cómo puede
            controlarlas para proteger su privacidad.
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
          {/* Sidebar */}
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
              {/* 1. Qué son */}
              <section id="que-son" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Cookie className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      1. ¿Qué son las cookies?
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
                    Las cookies son pequeños archivos de texto que los sitios web almacenan en su
                    dispositivo (ordenador, tablet, smartphone) cuando los visita. Se utilizan
                    ampliamente para hacer que los sitios web funcionen de manera eficiente y para
                    proporcionar información a los propietarios del sitio.
                  </p>
                  <p>
                    Las cookies permiten que un sitio web reconozca su dispositivo, recuerde sus
                    preferencias, y mejore su experiencia de navegación. Sin embargo, respetamos su
                    derecho a controlar qué cookies se almacenan.
                  </p>
                </div>
              </section>

              {/* 2. Cómo usamos */}
              <section id="como-usamos" className="glass-card p-8 scroll-mt-24">
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
                      2. Cómo usamos las cookies
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
                  <p>NODDO utiliza cookies para:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Mantener su sesión activa
                      </strong>{" "}
                      — Para que no tenga que iniciar sesión cada vez que visite el panel de
                      administración
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Recordar sus preferencias
                      </strong>{" "}
                      — Idioma, zona horaria, configuración del dashboard
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Proteger contra ataques CSRF
                      </strong>{" "}
                      — Tokens de seguridad para prevenir falsificación de solicitudes
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Analizar cómo usa el Servicio
                      </strong>{" "}
                      — Para mejorar funcionalidades y detectar problemas
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Medir conversiones de marketing
                      </strong>{" "}
                      — Para optimizar campañas publicitarias y entender qué funciona
                    </li>
                  </ul>
                </div>
              </section>

              {/* 3. Tipos */}
              <section id="tipos" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Settings className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      3. Tipos de cookies que utilizamos
                    </h2>
                  </div>
                </div>
                <div
                  className="space-y-6 text-sm leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  {/* Esenciales */}
                  <div className="glass-light p-6 rounded-xl">
                    <div className="flex items-start gap-3 mb-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: "#b8973a" }} />
                      <div>
                        <h3
                          className="font-medium mb-2"
                          style={{ color: "rgba(244,240,232,0.92)" }}
                        >
                          Cookies Esenciales (Obligatorias)
                        </h3>
                        <p className="mb-2">
                          Estas cookies son necesarias para el funcionamiento básico del sitio. No
                          se pueden desactivar.
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr
                            className="border-b"
                            style={{ borderColor: "rgba(244,240,232,0.1)" }}
                          >
                            <th
                              className="text-left py-2 px-3"
                              style={{ color: "rgba(244,240,232,0.92)" }}
                            >
                              Cookie
                            </th>
                            <th
                              className="text-left py-2 px-3"
                              style={{ color: "rgba(244,240,232,0.92)" }}
                            >
                              Propósito
                            </th>
                            <th
                              className="text-left py-2 px-3"
                              style={{ color: "rgba(244,240,232,0.92)" }}
                            >
                              Duración
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            className="border-b"
                            style={{ borderColor: "rgba(244,240,232,0.05)" }}
                          >
                            <td className="py-2 px-3">sb-access-token</td>
                            <td className="py-2 px-3">Sesión de autenticación Supabase</td>
                            <td className="py-2 px-3">1 hora</td>
                          </tr>
                          <tr
                            className="border-b"
                            style={{ borderColor: "rgba(244,240,232,0.05)" }}
                          >
                            <td className="py-2 px-3">sb-refresh-token</td>
                            <td className="py-2 px-3">Renovación automática de sesión</td>
                            <td className="py-2 px-3">30 días</td>
                          </tr>
                          <tr
                            className="border-b"
                            style={{ borderColor: "rgba(244,240,232,0.05)" }}
                          >
                            <td className="py-2 px-3">csrf_token</td>
                            <td className="py-2 px-3">Protección contra CSRF</td>
                            <td className="py-2 px-3">Sesión</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3">noddo_prefs</td>
                            <td className="py-2 px-3">Preferencias de usuario (idioma, tema)</td>
                            <td className="py-2 px-3">1 año</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="glass-light p-6 rounded-xl">
                    <div className="flex items-start gap-3 mb-3">
                      <Eye className="w-5 h-5 mt-0.5" style={{ color: "#b8973a" }} />
                      <div>
                        <h3
                          className="font-medium mb-2"
                          style={{ color: "rgba(244,240,232,0.92)" }}
                        >
                          Cookies de Analytics (Opcionales)
                        </h3>
                        <p className="mb-2">
                          Nos ayudan a entender cómo los visitantes usan el sitio para mejorar la
                          experiencia.
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr
                            className="border-b"
                            style={{ borderColor: "rgba(244,240,232,0.1)" }}
                          >
                            <th
                              className="text-left py-2 px-3"
                              style={{ color: "rgba(244,240,232,0.92)" }}
                            >
                              Cookie
                            </th>
                            <th
                              className="text-left py-2 px-3"
                              style={{ color: "rgba(244,240,232,0.92)" }}
                            >
                              Propósito
                            </th>
                            <th
                              className="text-left py-2 px-3"
                              style={{ color: "rgba(244,240,232,0.92)" }}
                            >
                              Duración
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            className="border-b"
                            style={{ borderColor: "rgba(244,240,232,0.05)" }}
                          >
                            <td className="py-2 px-3">_ga</td>
                            <td className="py-2 px-3">Google Analytics - ID de usuario único</td>
                            <td className="py-2 px-3">2 años</td>
                          </tr>
                          <tr
                            className="border-b"
                            style={{ borderColor: "rgba(244,240,232,0.05)" }}
                          >
                            <td className="py-2 px-3">_ga_*</td>
                            <td className="py-2 px-3">Google Analytics - Estado de sesión</td>
                            <td className="py-2 px-3">2 años</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3">noddo_analytics</td>
                            <td className="py-2 px-3">Analytics propios (sin PII)</td>
                            <td className="py-2 px-3">1 año</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Marketing */}
                  <div className="glass-light p-6 rounded-xl">
                    <div className="flex items-start gap-3 mb-3">
                      <Shield className="w-5 h-5 mt-0.5" style={{ color: "#b8973a" }} />
                      <div>
                        <h3
                          className="font-medium mb-2"
                          style={{ color: "rgba(244,240,232,0.92)" }}
                        >
                          Cookies de Marketing (Opcionales)
                        </h3>
                        <p className="mb-2">
                          Se utilizan para rastrear conversiones y mostrar anuncios relevantes.
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr
                            className="border-b"
                            style={{ borderColor: "rgba(244,240,232,0.1)" }}
                          >
                            <th
                              className="text-left py-2 px-3"
                              style={{ color: "rgba(244,240,232,0.92)" }}
                            >
                              Cookie
                            </th>
                            <th
                              className="text-left py-2 px-3"
                              style={{ color: "rgba(244,240,232,0.92)" }}
                            >
                              Propósito
                            </th>
                            <th
                              className="text-left py-2 px-3"
                              style={{ color: "rgba(244,240,232,0.92)" }}
                            >
                              Duración
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            className="border-b"
                            style={{ borderColor: "rgba(244,240,232,0.05)" }}
                          >
                            <td className="py-2 px-3">_fbp</td>
                            <td className="py-2 px-3">Meta Pixel - Tracking conversiones FB/IG</td>
                            <td className="py-2 px-3">3 meses</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3">_fbc</td>
                            <td className="py-2 px-3">Meta Pixel - Click ID de anuncio</td>
                            <td className="py-2 px-3">3 meses</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. Terceros */}
              <section id="terceros" className="glass-card p-8 scroll-mt-24">
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
                      4. Cookies de terceros
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
                    Algunos servicios de terceros que utilizamos pueden colocar sus propias cookies
                    en su dispositivo:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Google Analytics
                      </strong>{" "}
                      — Análisis de tráfico web. Puede deshabilitarlo con el{" "}
                      <a
                        href="https://tools.google.com/dlpage/gaoptout"
                        className="underline"
                        style={{ color: "#b8973a" }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        complemento de exclusión de Google Analytics
                      </a>
                      .
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Meta Pixel</strong> —
                      Rastreo de conversiones de Facebook/Instagram. Configurable desde las
                      preferencias de su cuenta de Facebook.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Google Tag Manager
                      </strong>{" "}
                      — Gestión centralizada de tags de marketing (no almacena datos por sí mismo).
                    </li>
                  </ul>
                  <p className="pt-3">
                    Estas cookies de terceros están sujetas a las políticas de privacidad de sus
                    respectivos proveedores. NODDO no tiene control sobre estas cookies.
                  </p>
                </div>
              </section>

              {/* 5. Control */}
              <section id="control" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Settings className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      5. Cómo controlar las cookies
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
                  <p>Usted tiene el control total sobre las cookies que se almacenan:</p>

                  <div className="space-y-3">
                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        1. Configuración del navegador
                      </h3>
                      <p>
                        Todos los navegadores modernos permiten controlar cookies. Puede bloquear
                        todas las cookies, aceptar solo las de sitios confiables, o eliminar las
                        existentes. Consulte la ayuda de su navegador:
                      </p>
                      <ul className="list-disc pl-6 mt-1 space-y-1">
                        <li>
                          <a
                            href="https://support.google.com/chrome/answer/95647"
                            className="underline"
                            style={{ color: "#b8973a" }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Google Chrome
                          </a>
                        </li>
                        <li>
                          <a
                            href="https://support.mozilla.org/es/kb/impedir-que-los-sitios-web-guarden-sus-preferencia"
                            className="underline"
                            style={{ color: "#b8973a" }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Mozilla Firefox
                          </a>
                        </li>
                        <li>
                          <a
                            href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                            className="underline"
                            style={{ color: "#b8973a" }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Safari
                          </a>
                        </li>
                        <li>
                          <a
                            href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                            className="underline"
                            style={{ color: "#b8973a" }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Microsoft Edge
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        2. Herramientas de privacidad
                      </h3>
                      <p>
                        Puede usar extensiones de navegador como Privacy Badger, uBlock Origin, o
                        Ghostery para bloquear cookies de rastreo automáticamente.
                      </p>
                    </div>

                    <div className="pl-4 border-l-2" style={{ borderColor: "#b8973a" }}>
                      <h3
                        className="font-medium mb-1"
                        style={{ color: "rgba(244,240,232,0.92)" }}
                      >
                        3. Do Not Track (DNT)
                      </h3>
                      <p>
                        Si activa la señal "Do Not Track" en su navegador, respetaremos esa
                        preferencia y no cargaremos cookies de analytics ni marketing (solo las
                        esenciales).
                      </p>
                    </div>
                  </div>

                  <div
                    className="mt-6 p-4 rounded-lg"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.08)" }}
                  >
                    <div className="flex items-start gap-3">
                      <X
                        className="w-5 h-5 mt-0.5 shrink-0"
                        style={{ color: "rgba(244,240,232,0.55)" }}
                      />
                      <p>
                        <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                          Importante:
                        </strong>{" "}
                        Si bloquea las cookies esenciales, algunas funcionalidades del Servicio no
                        funcionarán correctamente. No podrá mantener su sesión activa ni guardar
                        preferencias.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 6. Cambios */}
              <section id="cambios" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Cookie className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      6. Cambios a esta política
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
                    Podemos actualizar esta Política de Cookies periódicamente para reflejar cambios
                    en las cookies que utilizamos o por razones operacionales, legales, o
                    regulatorias.
                  </p>
                  <p>
                    Le recomendamos revisar esta página ocasionalmente para estar informado sobre
                    cómo usamos las cookies. La fecha de "Última actualización" al inicio del
                    documento indica cuándo fue modificada por última vez.
                  </p>
                </div>
              </section>

              {/* 7. Contacto */}
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
                      7. Contacto
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
                    Si tiene preguntas sobre esta Política de Cookies o cómo usamos las cookies,
                    contáctenos en:
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
                  </div>
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
              ¿Preguntas sobre cookies? Estamos aquí para ayudar.
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
