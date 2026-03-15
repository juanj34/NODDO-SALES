"use client";

import { motion } from "framer-motion";
import { TrendingUp, Clock, DollarSign, Users, ArrowRight, Quote, CheckCircle2, Target } from "lucide-react";
import Link from "next/link";

const caseStudies = [
  {
    id: "torre-candelaria",
    client: "Arco Urbano",
    project: "Torre Candelaria",
    location: "Medellín, Colombia",
    units: 120,
    type: "Apartamentos premium",
    logo: "AU",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
    challenge: {
      title: "Vendían solo 2-3 unidades por mes con agencia tradicional",
      description: "Arco Urbano estaba pagando $12,000 USD a una agencia para un sitio web estático que tardó 5 meses en lanzar. El sitio era bonito pero completamente inútil para ventas: cambiar un precio requería abrir ticket de soporte, el inventario se actualizaba manualmente con PDFs, y los leads llegaban dispersos en emails sin rastreo de origen.",
      metrics: [
        "2-3 unidades vendidas/mes",
        "Costo de agencia: $12,000 USD",
        "5 meses de desarrollo",
        "Leads sin rastreo UTM",
      ],
    },
    solution: {
      title: "Implementaron NODDO con inventario en vivo + cotizador automático",
      description: "Migraron a NODDO en 3 días. Configuraron el Noddo Grid para mostrar disponibilidad en tiempo real por piso y vista. Activaron el cotizador automático que genera PDFs personalizados al instante. Integraron su CRM (GoHighLevel) para que cada lead cayera automáticamente en el pipeline de ventas con toda la información: nombre, email, WhatsApp, unidad de interés, y parámetros UTM de la campaña que lo trajo.",
      implementation: [
        {
          day: "Día 1",
          tasks: "Migración de contenido (renders, planos, textos) desde el sitio anterior",
        },
        {
          day: "Día 2",
          tasks: "Configuración del Noddo Grid (120 unidades), branding personalizado, dominio propio",
        },
        {
          day: "Día 3",
          tasks: "Integración GoHighLevel, capacitación del equipo de ventas, publicación en vivo",
        },
      ],
    },
    results: {
      title: "40% de unidades vendidas en 60 días",
      metrics: [
        {
          label: "Unidades vendidas",
          before: "2-3/mes",
          after: "48 en 60 días",
          change: "+1500%",
          icon: TrendingUp,
        },
        {
          label: "Leads capturados",
          before: "15/mes",
          after: "87/mes",
          change: "+480%",
          icon: Users,
        },
        {
          label: "Costo por lead",
          before: "$120",
          after: "$8",
          change: "-93%",
          icon: DollarSign,
        },
        {
          label: "Tiempo de implementación",
          before: "5 meses",
          after: "3 días",
          change: "-98%",
          icon: Clock,
        },
      ],
      quote: "Lanzamos Torre Candelaria en 3 días. Antes con la agencia nos tardamos 5 meses en tener algo parecido — y costó 12 veces más. Los leads que llegan ya saben qué piso y qué tipología quieren. Eso acelera el cierre brutal.",
      author: "Jorge Mora",
      role: "Director Comercial · Arco Urbano",
    },
  },
  {
    id: "conjunto-vertice",
    client: "Vértice Grupo",
    project: "4 Proyectos Simultáneos",
    location: "Bogotá, Cali, Barranquilla",
    units: 340,
    type: "Portafolio multi-proyecto",
    logo: "VG",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
    challenge: {
      title: "Manejaban 4 proyectos con equipos de marketing separados para cada uno",
      description: "Vértice Grupo tenía 4 proyectos activos en 3 ciudades diferentes. Cada proyecto tenía su propia agencia, su propio sitio web, y su propio equipo de marketing. Esto generaba: costos duplicados ($8,000 USD/mes en total), inconsistencia de marca, imposibilidad de comparar métricas entre proyectos, y cero visibilidad centralizada de leads.",
      metrics: [
        "4 agencias diferentes ($8k/mes total)",
        "Inconsistencia de marca",
        "Leads dispersos en 4 sistemas",
        "Sin analytics consolidados",
      ],
    },
    solution: {
      title: "Centralizaron los 4 proyectos en un solo dashboard NODDO",
      description: "Migraron los 4 proyectos a NODDO Studio. Cada proyecto mantiene su propio branding y dominio personalizado, pero todos se administran desde un solo dashboard. El equipo de ventas puede ver leads de todos los proyectos en una sola vista, comparar performance, y detectar qué campañas funcionan mejor. Los leads se integran automáticamente con su CRM central (HubSpot) etiquetados por proyecto.",
      implementation: [
        {
          day: "Semana 1",
          tasks: "Migración Proyecto 1 (Bogotá) + capacitación equipo comercial",
        },
        {
          day: "Semana 2",
          tasks: "Migración Proyecto 2 (Cali) + Proyecto 3 (Barranquilla)",
        },
        {
          day: "Semana 3",
          tasks: "Migración Proyecto 4 (Bogotá Norte) + integración HubSpot centralizada",
        },
      ],
    },
    results: {
      title: "Reducción de costos del 78% manteniendo 4 proyectos activos",
      metrics: [
        {
          label: "Costo mensual total",
          before: "$8,000/mes",
          after: "$1,760/mes",
          change: "-78%",
          icon: DollarSign,
        },
        {
          label: "Tiempo de gestión",
          before: "160h/mes",
          after: "40h/mes",
          change: "-75%",
          icon: Clock,
        },
        {
          label: "Leads totales",
          before: "120/mes",
          after: "340/mes",
          change: "+183%",
          icon: Users,
        },
        {
          label: "Tasa de conversión",
          before: "1.2%",
          after: "3.8%",
          change: "+217%",
          icon: TrendingUp,
        },
      ],
      quote: "Manejamos 4 proyectos simultáneos desde un solo dashboard. Antes necesitaba un equipo de marketing para cada uno. Ahora mi equipo de ventas tiene todo en tiempo real — leads, inventario, analytics — en un solo lugar. La visibilidad cambió el juego.",
      author: "Lorena Castaño",
      role: "Gerente General · Vértice Grupo",
    },
  },
  {
    id: "reserva-campestre",
    client: "Cimientos & Co",
    project: "Reserva Campestre",
    location: "Santa Marta, Colombia",
    units: 45,
    type: "Casas campestres",
    logo: "CC",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    challenge: {
      title: "La junta directiva rechazaba presupuestos digitales por falta de diferenciación",
      description: "Cimientos & Co había intentado 3 veces aprobar presupuesto para un sitio web del proyecto Reserva Campestre, pero la junta directiva lo rechazaba porque 'todos los sitios de casas campestres se ven iguales'. Necesitaban algo que los diferenciara visualmente y que justificara la inversión. Los brochures en PDF no estaban generando suficientes leads calificados.",
      metrics: [
        "3 propuestas rechazadas por la junta",
        "40-50 leads/mes con brochures PDF",
        "Tasa de calificación: 15%",
        "Sin forma de rastrear origen de leads",
      ],
    },
    solution: {
      title: "Implementaron el Noddo Grid interactivo que convenció a la junta",
      description: "La propuesta de valor fue el Noddo Grid: un plano interactivo del proyecto donde los compradores podían hacer clic en cada lote para ver disponibilidad, specs, precio, y renders específicos. Esto nunca lo habían visto en la competencia. La junta aprobó el presupuesto inmediatamente. Además, activaron cotizador automático y mapas satelitales con POIs de colegios, clubes y restaurantes cercanos.",
      implementation: [
        {
          day: "Día 1",
          tasks: "Configuración Noddo Grid (45 lotes) + carga de renders por lote",
        },
        {
          day: "Día 2",
          tasks: "Mapeo de 18 POIs relevantes (colegios, clubes, centros comerciales)",
        },
        {
          day: "Día 3",
          tasks: "Cotizador personalizado + branding + dominio propio + publicación",
        },
      ],
    },
    results: {
      title: "87% de leads llegan pre-calificados sabiendo qué lote quieren",
      metrics: [
        {
          label: "Leads mensuales",
          before: "40-50",
          after: "110-130",
          change: "+160%",
          icon: Users,
        },
        {
          label: "Tasa de calificación",
          before: "15%",
          after: "87%",
          change: "+480%",
          icon: Target,
        },
        {
          label: "Tiempo promedio de cierre",
          before: "45 días",
          after: "22 días",
          change: "-51%",
          icon: Clock,
        },
        {
          label: "Costo de adquisición (CAC)",
          before: "$850",
          after: "$280",
          change: "-67%",
          icon: DollarSign,
        },
      ],
      quote: "El Noddo Grid fue lo que convenció a nuestra junta. Los compradores pueden hacer clic en el masterplan y ver exactamente qué lotes quedan, con vista, precio, y renders. Eso no lo tiene ningún brochure del mercado. Los leads que llegan ya saben qué quieren — eso reduce fricción brutal.",
      author: "Ricardo Fuentes",
      role: "VP de Proyectos · Cimientos & Co",
    },
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function CasosDeEstudioPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light"
          >
            <TrendingUp className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Casos de Éxito
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="text-5xl md:text-7xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Historias de quienes
            <br />
            ya <span style={{ fontStyle: "italic", color: "#b8973a" }}>venden diferente</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="text-lg max-w-3xl mx-auto leading-relaxed"
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            Resultados reales de constructoras que dejaron atrás las agencias tradicionales. Datos
            duros, métricas verificables, ROI comprobado.
          </motion.p>
        </div>

        {/* Case Studies */}
        <div className="space-y-32">
          {caseStudies.map((study, index) => (
            <motion.article
              key={study.id}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.1, ease }}
              className="relative"
            >
              {/* Project header */}
              <div className="glass-card p-8 md:p-10 mb-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-16 h-16 flex items-center justify-center rounded-xl text-lg font-bold"
                        style={{
                          backgroundColor: "rgba(184, 151, 58, 0.15)",
                          border: "2px solid rgba(184, 151, 58, 0.3)",
                          color: "#b8973a",
                          fontFamily: "var(--font-syne)",
                        }}
                      >
                        {study.logo}
                      </div>
                      <div>
                        <h2
                          className="text-3xl md:text-4xl"
                          style={{
                            fontFamily: "var(--font-cormorant)",
                            fontWeight: 400,
                            color: "rgba(244,240,232,0.92)",
                          }}
                        >
                          {study.project}
                        </h2>
                        <p
                          className="text-sm"
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            fontWeight: 300,
                            color: "rgba(244,240,232,0.55)",
                          }}
                        >
                          {study.client} · {study.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div
                        className="px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                      >
                        <span
                          className="text-xs uppercase tracking-wider"
                          style={{
                            fontFamily: "var(--font-syne)",
                            fontWeight: 600,
                            color: "rgba(244,240,232,0.55)",
                          }}
                        >
                          {study.units} unidades · {study.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <img
                    src={study.image}
                    alt={study.project}
                    className="w-full md:w-80 h-48 object-cover rounded-xl"
                    style={{
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  />
                </div>
              </div>

              {/* Challenge */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="glass-card p-8">
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                      }}
                    >
                      <Target className="w-5 h-5" style={{ color: "#ef4444" }} />
                    </div>
                    <div>
                      <h3
                        className="text-xl mb-2"
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          fontWeight: 400,
                          color: "rgba(244,240,232,0.92)",
                        }}
                      >
                        El Desafío
                      </h3>
                      <p
                        className="text-base mb-2"
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          fontWeight: 400,
                          fontStyle: "italic",
                          color: "#ef4444",
                        }}
                      >
                        {study.challenge.title}
                      </p>
                    </div>
                  </div>

                  <p
                    className="text-sm leading-[1.8] mb-4"
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      fontWeight: 300,
                      color: "rgba(244,240,232,0.70)",
                    }}
                  >
                    {study.challenge.description}
                  </p>

                  <div className="space-y-2">
                    {study.challenge.metrics.map((metric) => (
                      <div
                        key={metric}
                        className="flex items-center gap-2 text-xs"
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          fontWeight: 300,
                          color: "rgba(244,240,232,0.55)",
                        }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "#ef4444" }}
                        />
                        {metric}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Solution */}
                <div className="glass-card p-8">
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{
                        backgroundColor: "rgba(184, 151, 58, 0.15)",
                        border: "1px solid rgba(184, 151, 58, 0.3)",
                      }}
                    >
                      <CheckCircle2 className="w-5 h-5" style={{ color: "#b8973a" }} />
                    </div>
                    <div>
                      <h3
                        className="text-xl mb-2"
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          fontWeight: 400,
                          color: "rgba(244,240,232,0.92)",
                        }}
                      >
                        La Solución
                      </h3>
                      <p
                        className="text-base mb-2"
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          fontWeight: 400,
                          fontStyle: "italic",
                          color: "#b8973a",
                        }}
                      >
                        {study.solution.title}
                      </p>
                    </div>
                  </div>

                  <p
                    className="text-sm leading-[1.8] mb-4"
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      fontWeight: 300,
                      color: "rgba(244,240,232,0.70)",
                    }}
                  >
                    {study.solution.description}
                  </p>

                  <div className="space-y-2">
                    {study.solution.implementation.map((step) => (
                      <div key={step.day} className="flex gap-3">
                        <span
                          className="shrink-0 text-xs font-bold tracking-wider"
                          style={{
                            fontFamily: "var(--font-syne)",
                            color: "#b8973a",
                          }}
                        >
                          {step.day}
                        </span>
                        <span
                          className="text-xs leading-[1.7]"
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            fontWeight: 300,
                            color: "rgba(244,240,232,0.55)",
                          }}
                        >
                          {step.tasks}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="glass-card p-8 md:p-10">
                <h3
                  className="text-2xl md:text-3xl mb-2"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 400,
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  Resultados
                </h3>
                <p
                  className="text-lg mb-8"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: "#b8973a",
                  }}
                >
                  {study.results.title}
                </p>

                {/* Metrics grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {study.results.metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div
                        key={metric.label}
                        className="p-6 rounded-xl"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                      >
                        <Icon className="w-6 h-6 mb-3" style={{ color: "#b8973a" }} />
                        <div
                          className="text-xs uppercase tracking-wider mb-2"
                          style={{
                            fontFamily: "var(--font-syne)",
                            fontWeight: 600,
                            color: "rgba(244,240,232,0.45)",
                          }}
                        >
                          {metric.label}
                        </div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span
                            className="text-2xl"
                            style={{
                              fontFamily: "var(--font-dm-mono)",
                              fontWeight: 400,
                              color: "rgba(244,240,232,0.92)",
                            }}
                          >
                            {metric.after}
                          </span>
                          <span
                            className="text-xs line-through"
                            style={{
                              fontFamily: "var(--font-dm-mono)",
                              fontWeight: 300,
                              color: "rgba(244,240,232,0.35)",
                            }}
                          >
                            {metric.before}
                          </span>
                        </div>
                        <div
                          className="text-sm font-bold"
                          style={{
                            fontFamily: "var(--font-syne)",
                            color: metric.change.startsWith("-") ? "#10b981" : "#b8973a",
                          }}
                        >
                          {metric.change}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Testimonial quote */}
                <div
                  className="p-6 rounded-xl relative"
                  style={{
                    backgroundColor: "rgba(184, 151, 58, 0.05)",
                    border: "1px solid rgba(184, 151, 58, 0.15)",
                  }}
                >
                  <Quote
                    className="absolute top-4 left-4 w-10 h-10 opacity-20"
                    style={{ color: "#b8973a" }}
                  />
                  <p
                    className="text-base leading-[1.9] italic mb-4 pl-8"
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      fontWeight: 300,
                      color: "rgba(244,240,232,0.85)",
                    }}
                  >
                    {study.results.quote}
                  </p>
                  <div className="flex items-center gap-3 pl-8">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: "rgba(184, 151, 58, 0.15)",
                        border: "2px solid rgba(184, 151, 58, 0.3)",
                        color: "#b8973a",
                        fontFamily: "var(--font-syne)",
                      }}
                    >
                      {study.results.author.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{
                          fontFamily: "var(--font-syne)",
                          color: "rgba(244,240,232,0.92)",
                        }}
                      >
                        {study.results.author}
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          fontWeight: 300,
                          color: "rgba(244,240,232,0.55)",
                        }}
                      >
                        {study.results.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mt-20"
        >
          <div className="glass-card p-12 text-center">
            <h2
              className="text-3xl md:text-4xl mb-4"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              ¿Listo para tener{" "}
              <span style={{ fontStyle: "italic", color: "#b8973a" }}>tu caso de éxito?</span>
            </h2>
            <p
              className="text-base mb-8 max-w-2xl mx-auto"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.55)",
              }}
            >
              Agenda una demo de 30 minutos y te mostramos cómo NODDO puede transformar tu
              estrategia de ventas digitales
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 hover:scale-105"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                background: "linear-gradient(135deg, #b8973a 0%, #d4b05a 100%)",
                color: "#0a0a0b",
                boxShadow: "0 0 30px rgba(184, 151, 58, 0.3)",
              }}
            >
              Agendar Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
