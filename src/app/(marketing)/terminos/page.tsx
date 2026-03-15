"use client";

import {
  FileText,
  Shield,
  CreditCard,
  UserCheck,
  AlertTriangle,
  Ban,
  Copyright,
  Server,
  XCircle,
  RefreshCw,
  Scale,
  Mail,
} from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "aceptacion", title: "Aceptación de términos", icon: FileText },
  { id: "descripcion", title: "Descripción del Servicio", icon: Server },
  { id: "registro", title: "Registro y cuenta", icon: UserCheck },
  { id: "pagos", title: "Planes y pagos", icon: CreditCard },
  { id: "uso-aceptable", title: "Uso aceptable", icon: Shield },
  { id: "propiedad", title: "Propiedad intelectual", icon: Copyright },
  { id: "disponibilidad", title: "Disponibilidad y SLA", icon: Server },
  { id: "limitacion", title: "Limitación de responsabilidad", icon: AlertTriangle },
  { id: "indemnizacion", title: "Indemnización", icon: Scale },
  { id: "suspension", title: "Suspensión y terminación", icon: Ban },
  { id: "cancelacion", title: "Cancelación y reembolsos", icon: XCircle },
  { id: "modificaciones", title: "Modificaciones", icon: RefreshCw },
  { id: "legislacion", title: "Legislación aplicable", icon: Scale },
  { id: "contacto", title: "Contacto", icon: Mail },
];

export default function TerminosPage() {
  const [activeSection, setActiveSection] = useState<string>("aceptacion");

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light">
            <Scale className="w-5 h-5" style={{ color: "#b8973a" }} />
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
            Términos de Servicio
          </h1>
          <p
            className="text-base max-w-2xl mx-auto"
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            Condiciones generales de uso de la plataforma NODDO. Al utilizar nuestro servicio,
            usted acepta estos términos en su totalidad.
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
              {/* 1. Aceptación */}
              <section id="aceptacion" className="glass-card p-8 scroll-mt-24">
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
                      1. Aceptación de los términos
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
                    Al acceder y utilizar la plataforma NODDO (en adelante, &quot;el Servicio&quot;),
                    operada por{" "}
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>Antigravity SAS</strong>{" "}
                    (en adelante, &quot;la Empresa&quot;, &quot;nosotros&quot;, &quot;NODDO&quot;), usted (en adelante, &quot;el
                    Usuario&quot;, &quot;usted&quot;) acepta quedar vinculado por estos Términos de Servicio en
                    su totalidad.
                  </p>
                  <p>
                    Si no está de acuerdo con alguna parte de estos términos, no debe utilizar el
                    Servicio. El uso continuado del Servicio constituye aceptación de estos
                    términos y de cualquier modificación futura.
                  </p>
                  <p>
                    Estos términos deben leerse en conjunto con nuestra{" "}
                    <a
                      href="/privacidad"
                      className="underline"
                      style={{ color: "#b8973a" }}
                    >
                      Política de Privacidad
                    </a>
                    , que forma parte integral del acuerdo.
                  </p>
                </div>
              </section>

              {/* 2. Descripción */}
              <section id="descripcion" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Server className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      2. Descripción del Servicio
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
                    NODDO es una plataforma SaaS (Software as a Service) que permite a
                    constructoras e inmobiliarias crear micrositios digitales premium para la
                    comercialización de proyectos inmobiliarios.
                  </p>
                  <p>El Servicio incluye, entre otras funcionalidades:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Creación de micrositios web con dominio personalizado</li>
                    <li>Gestión de inventario de unidades inmobiliarias en tiempo real</li>
                    <li>Galería de imágenes, renders 3D, y planos arquitectónicos</li>
                    <li>Tours virtuales 360° (Matterport o similar)</li>
                    <li>Videos promocionales con hosting incluido</li>
                    <li>Mapas satelitales interactivos con puntos de interés (POIs)</li>
                    <li>Sistema de cotización automática</li>
                    <li>Captura y gestión de leads (prospectos)</li>
                    <li>Integración con CRM (GoHighLevel, HubSpot)</li>
                    <li>Analytics de visitantes y conversiones</li>
                    <li>Sistema de colaboradores con permisos limitados</li>
                    <li>Almacenamiento en la nube para assets multimedia</li>
                  </ul>
                  <p className="pt-3">
                    NODDO se reserva el derecho de añadir, modificar, o discontinuar
                    funcionalidades del Servicio con previo aviso de 30 días para cambios que
                    afecten funcionalidades principales.
                  </p>
                </div>
              </section>

              {/* 3. Registro */}
              <section id="registro" className="glass-card p-8 scroll-mt-24">
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
                      3. Registro y cuenta
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
                    Para utilizar el Servicio, debe crear una cuenta proporcionando información
                    veraz, precisa, y actualizada. Declara y garantiza que:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Tiene al menos 18 años de edad</li>
                    <li>Es una persona jurídica o natural con capacidad legal</li>
                    <li>Toda la información proporcionada es veraz y exacta</li>
                    <li>Actualizará su información en caso de cambios</li>
                  </ul>
                  <p className="pt-3">
                    Usted es responsable de:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                    <li>
                      Todas las actividades realizadas desde su cuenta, incluso si son realizadas
                      por terceros
                    </li>
                    <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                    <li>Cerrar sesión al finalizar cada uso del Servicio</li>
                  </ul>
                  <p className="pt-3">
                    NODDO no será responsable por pérdidas derivadas del uso no autorizado de su
                    cuenta. Usted puede ser responsable por pérdidas de NODDO o terceros causadas
                    por dicho uso no autorizado.
                  </p>
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Colaboradores:
                    </strong>{" "}
                    Puede invitar hasta 3 colaboradores por proyecto. Los colaboradores tienen
                    acceso limitado únicamente para modificar el estado de unidades. Usted es
                    responsable de las acciones realizadas por sus colaboradores.
                  </p>
                </div>
              </section>

              {/* 4. Pagos */}
              <section id="pagos" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <CreditCard className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      4. Planes, pagos y facturación
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
                    Los planes disponibles, sus funcionalidades, y precios están publicados en{" "}
                    <a
                      href="https://noddo.io/pricing"
                      className="underline"
                      style={{ color: "#b8973a" }}
                    >
                      noddo.io/pricing
                    </a>
                    .
                  </p>

                  <div className="space-y-2 pt-2">
                    <p>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Facturación recurrente:
                      </strong>{" "}
                      Los pagos son recurrentes según el ciclo de facturación seleccionado
                      (mensual o anual). Al suscribirse, autoriza cargos automáticos recurrentes a
                      su método de pago.
                    </p>
                    <p>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Procesamiento de pagos:
                      </strong>{" "}
                      Los pagos se procesan mediante proveedores de pago de terceros (Stripe u
                      otros). NODDO no almacena datos completos de tarjetas de crédito.
                    </p>
                    <p>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Falta de pago:
                      </strong>{" "}
                      La falta de pago puede resultar en la suspensión inmediata del Servicio. Si
                      el pago no se regulariza en 15 días, su cuenta será marcada para eliminación.
                    </p>
                    <p>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Cambios de precio:
                      </strong>{" "}
                      NODDO se reserva el derecho de modificar los precios con 60 días de
                      anticipación. Si no está de acuerdo con el nuevo precio, puede cancelar su
                      suscripción antes de que el cambio entre en vigor.
                    </p>
                    <p>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Impuestos:</strong> Los
                      precios no incluyen impuestos locales (IVA, retenciones). Los impuestos
                      aplicables se añadirán según la jurisdicción del Usuario.
                    </p>
                    <p>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Facturas:</strong> Se
                      emitirá factura electrónica por cada pago. Las facturas están disponibles en
                      el panel de administración.
                    </p>
                  </div>
                </div>
              </section>

              {/* 5. Uso aceptable */}
              <section id="uso-aceptable" className="glass-card p-8 scroll-mt-24">
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
                      5. Uso aceptable
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
                    El Usuario se compromete a utilizar el Servicio únicamente para fines
                    legítimos relacionados con la comercialización inmobiliaria y en cumplimiento
                    de todas las leyes aplicables.
                  </p>
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Queda estrictamente prohibido:
                    </strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Publicar contenido ilegal, difamatorio, fraudulento, obsceno, o que viole
                      derechos de terceros
                    </li>
                    <li>
                      Publicar información falsa o engañosa sobre proyectos inmobiliarios (precios
                      ficticios, áreas incorrectas, permisos inexistentes)
                    </li>
                    <li>
                      Usar el Servicio para esquemas piramidales, fraudes inmobiliarios, lavado de
                      activos, o actividades ilícitas
                    </li>
                    <li>
                      Intentar acceder, vulnerar, o probar la seguridad de cuentas de otros
                      usuarios
                    </li>
                    <li>Usar el Servicio para enviar spam, phishing, o comunicaciones masivas no solicitadas</li>
                    <li>
                      Realizar ingeniería inversa, descompilar, o intentar extraer el código fuente
                      de la plataforma
                    </li>
                    <li>
                      Usar scrapers, bots, o herramientas automatizadas sin autorización expresa
                    </li>
                    <li>
                      Sobrecargar intencionalmente la infraestructura (ataques DDoS, flooding)
                    </li>
                    <li>
                      Interferir con el uso del Servicio por otros usuarios
                    </li>
                    <li>
                      Revender, sublicenciar, o transferir su acceso al Servicio sin autorización
                      escrita
                    </li>
                    <li>
                      Usar el Servicio para competir directamente con NODDO (crear plataforma
                      similar)
                    </li>
                    <li>
                      Remover, ocultar, o modificar avisos de propiedad intelectual o marca
                      registrada de NODDO
                    </li>
                  </ul>
                  <p className="pt-3">
                    La violación de estas reglas puede resultar en suspensión o terminación
                    inmediata de la cuenta sin previo aviso y sin derecho a reembolso.
                  </p>
                </div>
              </section>

              {/* 6. Propiedad intelectual */}
              <section id="propiedad" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Copyright className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      6. Propiedad intelectual
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
                  <div>
                    <h3
                      className="font-medium mb-2"
                      style={{ color: "rgba(244,240,232,0.92)" }}
                    >
                      Su contenido
                    </h3>
                    <p>
                      El contenido que usted carga al Servicio (imágenes, renders, textos,
                      planos, videos, brochures) sigue siendo de su propiedad. NODDO no reclama
                      derechos de propiedad sobre su contenido.
                    </p>
                    <p className="mt-2">
                      Sin embargo, al cargar contenido al Servicio, usted otorga a NODDO una
                      licencia mundial, no exclusiva, libre de regalías, sublicenciable, y
                      transferible para:
                    </p>
                    <ul className="list-disc pl-6 mt-1 space-y-1">
                      <li>Mostrar dicho contenido en los micrositios generados</li>
                      <li>Almacenar y hacer copias de seguridad del contenido</li>
                      <li>
                        Procesar el contenido (redimensionar imágenes, comprimir videos,
                        optimización)
                      </li>
                      <li>
                        Usar capturas de pantalla o ejemplos anónimos en materiales promocionales
                        de NODDO (con su autorización previa)
                      </li>
                    </ul>
                    <p className="mt-2">
                      Usted declara y garantiza que posee todos los derechos sobre el contenido que
                      carga, o tiene las licencias necesarias para su uso. Usted indemnizará a
                      NODDO frente a reclamaciones de terceros por violación de derechos de autor,
                      marcas, o propiedad intelectual relacionadas con su contenido.
                    </p>
                  </div>

                  <div className="pt-3">
                    <h3
                      className="font-medium mb-2"
                      style={{ color: "rgba(244,240,232,0.92)" }}
                    >
                      Propiedad de NODDO
                    </h3>
                    <p>
                      La plataforma NODDO, incluyendo su diseño, código fuente, arquitectura,
                      interfaz de usuario, marca, logotipo, y toda la propiedad intelectual
                      asociada, son propiedad exclusiva de Antigravity SAS y están protegidos por
                      las leyes de propiedad intelectual de Colombia y tratados internacionales.
                    </p>
                    <p className="mt-2">
                      El uso del Servicio no le otorga ningún derecho de propiedad sobre la
                      plataforma. Usted recibe únicamente una licencia limitada, revocable, no
                      exclusiva, y no transferible para usar el Servicio según estos términos.
                    </p>
                  </div>
                </div>
              </section>

              {/* 7. Disponibilidad */}
              <section id="disponibilidad" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Server className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      7. Disponibilidad del Servicio y SLA
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
                    NODDO se esfuerza por mantener el Servicio disponible 24/7 con un objetivo de
                    uptime del 99.5% mensual (excluyendo mantenimientos programados).
                  </p>
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>Sin embargo</strong>, no
                    garantizamos disponibilidad ininterrumpida. Pueden ocurrir interrupciones por:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Mantenimiento programado (notificado con 48h de anticipación)</li>
                    <li>Actualizaciones de seguridad críticas (pueden ser sin previo aviso)</li>
                    <li>Fallos de infraestructura de terceros (Supabase, Vercel, Cloudflare)</li>
                    <li>Ataques DDoS o eventos de seguridad</li>
                    <li>Fuerza mayor, desastres naturales, pandemias, guerras, actos de gobierno</li>
                    <li>Problemas de conectividad de internet globales</li>
                  </ul>
                  <p className="pt-3">
                    NODDO no será responsable por pérdidas derivadas de la indisponibilidad del
                    Servicio. Los únicos recursos en caso de incumplimiento del SLA son créditos
                    de servicio según las políticas de compensación (disponibles previa solicitud).
                  </p>
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>Backups:</strong> NODDO
                    realiza copias de seguridad diarias automáticas con retención de 30 días. Sin
                    embargo, usted es responsable de mantener copias propias de su contenido
                    crítico.
                  </p>
                </div>
              </section>

              {/* 8. Limitación de responsabilidad */}
              <section id="limitacion" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <AlertTriangle className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      8. Limitación de responsabilidad
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
                      EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY:
                    </strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      El Servicio se proporciona &quot;TAL CUAL&quot; y &quot;SEGÚN DISPONIBILIDAD&quot;, sin
                      garantías de ningún tipo, expresas o implícitas.
                    </li>
                    <li>
                      NODDO no garantiza que el Servicio sea ininterrumpido, libre de errores,
                      seguro, o que cumpla con sus requisitos específicos.
                    </li>
                    <li>
                      NODDO NO SERÁ RESPONSABLE por daños indirectos, incidentales,
                      consecuentes, especiales, punitivos, o ejemplares derivados del uso o
                      imposibilidad de uso del Servicio, incluyendo pero no limitado a:
                      <ul className="list-circle pl-6 mt-1 space-y-1">
                        <li>Pérdida de ingresos, ventas, o ganancias esperadas</li>
                        <li>Pérdida de oportunidades de negocio o leads no capturados</li>
                        <li>Pérdida de datos o corrupción de archivos</li>
                        <li>Daños a la reputación o marca</li>
                        <li>Costos de adquisición de servicios sustitutos</li>
                      </ul>
                    </li>
                    <li>
                      La responsabilidad total y agregada de NODDO, por cualquier reclamación
                      relacionada con estos términos o el Servicio, estará limitada al monto total
                      pagado por el Usuario en los últimos{" "}
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>12 meses</strong>, o
                      USD $100, lo que sea mayor.
                    </li>
                  </ul>
                  <p className="pt-3">
                    Algunas jurisdicciones no permiten la exclusión de ciertas garantías o
                    limitación de responsabilidad por daños consecuentes. En tales jurisdicciones,
                    nuestra responsabilidad se limitará en la máxima medida permitida por la ley.
                  </p>
                </div>
              </section>

              {/* 9. Indemnización */}
              <section id="indemnizacion" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Scale className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      9. Indemnización
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
                    Usted acepta indemnizar, defender, y mantener indemne a Antigravity SAS, sus
                    afiliados, directores, empleados, agentes, y licenciantes, frente a cualquier
                    reclamación, pérdida, responsabilidad, daño, costo, o gasto (incluyendo
                    honorarios legales razonables) derivados de:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Su uso del Servicio</li>
                    <li>Violación de estos Términos de Servicio</li>
                    <li>
                      Violación de derechos de terceros, incluyendo derechos de autor, marcas,
                      secretos comerciales, o privacidad
                    </li>
                    <li>Contenido que usted carga al Servicio</li>
                    <li>Información fraudulenta o engañosa publicada en sus micrositios</li>
                    <li>Reclamaciones de compradores o terceros relacionadas con sus proyectos</li>
                    <li>Incumplimiento de leyes y regulaciones aplicables</li>
                  </ul>
                  <p className="pt-3">
                    NODDO se reserva el derecho de asumir la defensa y control exclusivo de
                    cualquier asunto sujeto a indemnización, en cuyo caso usted cooperará con NODDO
                    en la defensa de dicha reclamación.
                  </p>
                </div>
              </section>

              {/* 10. Suspensión */}
              <section id="suspension" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Ban className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      10. Suspensión y terminación
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
                    NODDO se reserva el derecho de suspender o terminar su acceso al Servicio,
                    inmediatamente y sin previo aviso, por cualquiera de las siguientes razones:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Violación de estos Términos de Servicio o la Política de Privacidad</li>
                    <li>Falta de pago o intento de fraude en pagos</li>
                    <li>
                      Conducta que NODDO considere, a su sola discreción, inapropiada, abusiva, o
                      dañina
                    </li>
                    <li>Solicitud de autoridades gubernamentales o por orden judicial</li>
                    <li>Actividades ilegales o sospecha razonable de fraude</li>
                    <li>Uso que ponga en riesgo la seguridad o estabilidad de la plataforma</li>
                    <li>Inactividad prolongada (más de 12 meses sin uso)</li>
                  </ul>
                  <p className="pt-3">
                    En caso de terminación:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Perderá inmediatamente el acceso al panel de administración y a los
                      micrositios
                    </li>
                    <li>Sus datos se conservarán por 30 días antes de eliminación permanente</li>
                    <li>
                      Puede solicitar una exportación de sus datos dentro de los 30 días posteriores
                      a la terminación
                    </li>
                    <li>No tendrá derecho a reembolso de pagos ya realizados</li>
                  </ul>
                  <p className="pt-3">
                    NODDO no será responsable ante usted ni terceros por la terminación de su
                    acceso al Servicio.
                  </p>
                </div>
              </section>

              {/* 11. Cancelación */}
              <section id="cancelacion" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <XCircle className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      11. Cancelación y reembolsos
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
                      Cancelación por el Usuario:
                    </strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Puede cancelar su suscripción en cualquier momento desde el panel de
                      administración
                    </li>
                    <li>
                      La cancelación es efectiva al final del período de facturación actual (no
                      habrá cargos futuros)
                    </li>
                    <li>Mantendrá acceso completo hasta el final del período pagado</li>
                    <li>
                      Después del período pagado, los micrositios se desactivarán y los datos se
                      conservarán por 30 días adicionales
                    </li>
                    <li>Puede reactivar su cuenta dentro de los 30 días sin pérdida de datos</li>
                  </ul>

                  <p className="pt-3">
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Política de reembolsos:
                    </strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Garantía de 14 días:
                      </strong>{" "}
                      Si cancela dentro de los primeros 14 días de su primera suscripción, le
                      reembolsaremos el 100% del pago (excepto cargos de procesamiento).
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Después de 14 días:
                      </strong>{" "}
                      NO hay reembolsos por meses/años parciales. La cancelación es efectiva al
                      final del período pagado.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Planes anuales:
                      </strong>{" "}
                      No hay reembolsos prorrateados si cancela antes de cumplir el año.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Excepciones:
                      </strong>{" "}
                      NODDO puede ofrecer reembolsos discrecionales en casos de fallas graves del
                      Servicio que afecten significativamente su uso (sujeto a evaluación caso por
                      caso).
                    </li>
                  </ul>

                  <p className="pt-3">
                    Los reembolsos se procesan mediante el mismo método de pago original y pueden
                    tardar 5-10 días hábiles en reflejarse.
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
                    <RefreshCw className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      12. Modificaciones a estos términos
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
                    NODDO se reserva el derecho de modificar estos términos en cualquier momento.
                  </p>
                  <p>
                    Cuando realicemos cambios significativos:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Publicaremos los términos actualizados en esta página con la fecha de &quot;Última
                      actualización&quot;
                    </li>
                    <li>
                      Le notificaremos por email con al menos{" "}
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>30 días</strong> de
                      anticipación
                    </li>
                    <li>
                      Mostraremos un aviso prominente en el panel de administración solicitando que
                      revise y acepte los nuevos términos
                    </li>
                  </ul>
                  <p className="pt-3">
                    Si no está de acuerdo con los términos modificados, debe cancelar su
                    suscripción antes de que los cambios entren en vigor. El uso continuado del
                    Servicio después de la fecha efectiva constituye aceptación de los nuevos
                    términos.
                  </p>
                  <p>
                    Cambios menores (correcciones tipográficas, aclaraciones que no afectan
                    derechos u obligaciones) pueden realizarse sin notificación previa.
                  </p>
                </div>
              </section>

              {/* 13. Legislación */}
              <section id="legislacion" className="glass-card p-8 scroll-mt-24">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
                  >
                    <Scale className="w-6 h-6" style={{ color: "#b8973a" }} />
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
                      13. Legislación aplicable y resolución de disputas
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
                    Estos términos se rigen e interpretan de acuerdo con las leyes de la{" "}
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      República de Colombia
                    </strong>
                    , sin perjuicio de sus disposiciones sobre conflicto de leyes.
                  </p>
                  <p>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Resolución de disputas:
                    </strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Negociación informal:
                      </strong>{" "}
                      Antes de iniciar cualquier procedimiento legal, las partes acuerdan intentar
                      resolver la disputa mediante negociación de buena fe durante al menos 30
                      días.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Jurisdicción:</strong>{" "}
                      Para cualquier controversia que no pueda resolverse de manera informal, las
                      partes se someten expresamente a la jurisdicción exclusiva de los tribunales
                      de Medellín, Colombia.
                    </li>
                    <li>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Arbitraje:</strong> Las
                      partes pueden acordar mutuamente someter la disputa a arbitraje bajo las
                      reglas de la Cámara de Comercio de Medellín.
                    </li>
                  </ul>
                  <p className="pt-3">
                    Usted renuncia expresamente a cualquier derecho a participar en demandas
                    colectivas (class actions) contra NODDO. Todas las reclamaciones deben
                    presentarse a título individual.
                  </p>
                </div>
              </section>

              {/* 14. Contacto */}
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
                      14. Contacto y soporte
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
                    Para consultas sobre estos términos, soporte técnico, facturación, o cualquier
                    asunto relacionado con el Servicio, contáctenos en:
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
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>Empresa:</strong>{" "}
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
                    Nuestro equipo de soporte responde consultas en horario laboral de Colombia
                    (Lunes a Viernes, 9:00 AM - 6:00 PM COT). Responderemos dentro de 24-48 horas
                    hábiles.
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
              ¿Tiene dudas sobre nuestros términos? Estamos aquí para ayudar.
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
