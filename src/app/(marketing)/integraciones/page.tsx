"use client";

import { motion } from "framer-motion";
import { Plug, Zap, Globe, BarChart3, Send, Webhook, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePageView } from "@/hooks/usePageView";

const integrations = [
  {
    category: "CRM y Ventas",
    icon: Send,
    color: "#b8973a",
    items: [
      {
        name: "HubSpot",
        description: "Sincroniza leads automáticamente con email, teléfono, UTM y unidad de interés",
        available: "Studio, Enterprise",
        logo: "HB",
        features: ["Sincronización automática", "Campos personalizados", "Webhooks en tiempo real"],
      },
      {
        name: "GoHighLevel",
        description: "Crea contactos y oportunidades en tu pipeline de ventas automáticamente",
        available: "Studio, Enterprise",
        logo: "GHL",
        features: ["Pipeline automático", "SMS y email triggers", "Seguimiento de conversiones"],
      },
      {
        name: "Salesforce",
        description: "Integración enterprise con sincronización bidireccional de leads y proyectos",
        available: "Enterprise",
        logo: "SF",
        features: ["Sincronización bidireccional", "Custom objects", "API completa"],
      },
    ],
  },
  {
    category: "Analytics y Tracking",
    icon: BarChart3,
    color: "#d4b05a",
    items: [
      {
        name: "Google Analytics 4",
        description: "Rastrea pageviews, conversiones, embudos y comportamiento de usuarios",
        available: "Todos los planes",
        logo: "GA",
        features: ["Event tracking", "Custom dimensions", "Ecommerce tracking"],
      },
      {
        name: "Facebook Pixel",
        description: "Retargeting de visitantes interesados en unidades específicas",
        available: "Todos los planes",
        logo: "FB",
        features: ["Conversiones personalizadas", "Audiences dinámicas", "Atribución de anuncios"],
      },
      {
        name: "Google Tag Manager",
        description: "Gestiona todos tus scripts de marketing desde un solo lugar",
        available: "Todos los planes",
        logo: "GTM",
        features: ["Gestión de tags", "Triggers personalizados", "Variables dinámicas"],
      },
      {
        name: "LinkedIn Insight",
        description: "Atribución B2B para campañas LinkedIn y seguimiento de conversiones",
        available: "Studio, Enterprise",
        logo: "LI",
        features: ["Conversión tracking", "Matched audiences", "Demographics"],
      },
    ],
  },
  {
    category: "Automatización",
    icon: Zap,
    color: "#a07e2e",
    items: [
      {
        name: "Zapier",
        description: "Conecta NODDO con 5000+ apps (Gmail, Sheets, Slack, Notion, etc.)",
        available: "Studio, Enterprise",
        logo: "ZP",
        features: ["5000+ integraciones", "Multi-step zaps", "Filtros y paths"],
      },
      {
        name: "Make (Integromat)",
        description: "Flujos de trabajo complejos con lógica condicional avanzada",
        available: "Studio, Enterprise",
        logo: "MK",
        features: ["Scenarios complejos", "Error handling", "Data transformations"],
      },
      {
        name: "Webhooks",
        description: "Integra con cualquier sistema custom mediante webhooks HTTP",
        available: "Todos los planes",
        logo: "WH",
        features: ["REST API", "Payload personalizado", "Retry automático"],
      },
    ],
  },
  {
    category: "Infraestructura",
    icon: Globe,
    color: "#b8973a",
    items: [
      {
        name: "Vercel",
        description: "Hosting global con edge caching y 99.99% uptime",
        available: "Incluido",
        logo: "VR",
        features: ["Edge network", "Auto-scaling", "SOC 2 Type II"],
        certified: true,
      },
      {
        name: "Supabase",
        description: "PostgreSQL managed con RLS, backups automáticos y replicación",
        available: "Incluido",
        logo: "SB",
        features: ["PostgreSQL", "Row Level Security", "ISO 27001"],
        certified: true,
      },
      {
        name: "Cloudflare",
        description: "CDN global, protección DDoS y Web Application Firewall",
        available: "Incluido",
        logo: "CF",
        features: ["DDoS protection", "WAF", "CDN global"],
        certified: true,
      },
      {
        name: "Mapbox",
        description: "Mapas satelitales interactivos con POIs personalizados",
        available: "Incluido",
        logo: "MB",
        features: ["Satellite imagery", "Custom markers", "Geocoding"],
      },
    ],
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function IntegracionesPage() {
  usePageView("Integraciones");

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Decorative connection lines SVG */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.04 }}>
          <svg width="100%" height="800" viewBox="0 0 1400 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Central hub */}
            <circle cx="700" cy="400" r="60" stroke="#b8973a" strokeWidth="1.5" />
            <circle cx="700" cy="400" r="40" stroke="#b8973a" strokeWidth="0.8" opacity="0.5" />

            {/* Radiating connections */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 700 + Math.cos(rad) * 60;
              const y1 = 400 + Math.sin(rad) * 60;
              const x2 = 700 + Math.cos(rad) * 300;
              const y2 = 400 + Math.sin(rad) * 300;
              return (
                <g key={angle}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b8973a" strokeWidth="0.5" strokeDasharray="4 4" />
                  <circle cx={x2} cy={y2} r="20" stroke="#b8973a" strokeWidth="0.8" />
                  <circle cx={x2} cy={y2} r="12" stroke="#b8973a" strokeWidth="0.4" opacity="0.3" />
                </g>
              );
            })}

            {/* Grid pattern */}
            {Array.from({ length: 20 }).map((_, i) => (
              <g key={`grid-${i}`} opacity="0.1">
                <line x1={i * 70} y1="0" x2={i * 70} y2="800" stroke="#b8973a" strokeWidth="0.3" />
                <line x1="0" y1={i * 40} x2="1400" y2={i * 40} stroke="#b8973a" strokeWidth="0.3" />
              </g>
            ))}
          </svg>
        </div>

        {/* Header */}
        <div className="text-center mb-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light"
          >
            <Plug className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Integraciones
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
            NODDO se integra con
            <br />
            <span style={{ fontStyle: "italic", color: "#b8973a" }}>
              las herramientas que ya usas
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="text-lg max-w-3xl mx-auto leading-relaxed"
            style={{
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            Conecta tu CRM, analytics y herramientas de marketing en minutos. Sin configuración
            técnica. Sin código. Solo selecciona, conecta y listo.
          </motion.p>
        </div>

        {/* Integration Categories */}
        <div className="space-y-16 relative z-10">
          {integrations.map((category, catIndex) => {
            const Icon = category.icon;
            return (
              <motion.section
                key={category.category}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: catIndex * 0.1, ease }}
              >
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: `${category.color}15`,
                      border: `1px solid ${category.color}30`,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: category.color }} />
                  </div>
                  <h2
                    className="text-3xl"
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontWeight: 400,
                      color: "rgba(244,240,232,0.92)",
                    }}
                  >
                    {category.category}
                  </h2>
                </div>

                {/* Integration Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.5, delay: itemIndex * 0.08, ease }}
                      className="glass-card p-6 hover:bg-white/5 transition-all duration-300 relative overflow-hidden group"
                    >
                      {/* Glow effect on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 50% 50%, ${category.color}10, transparent 70%)`,
                        }}
                      />

                      {/* Logo badge */}
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div
                          className="w-14 h-14 flex items-center justify-center rounded-xl text-xs font-bold"
                          style={{
                            backgroundColor: "rgba(184, 151, 58, 0.12)",
                            border: "1px solid rgba(184, 151, 58, 0.2)",
                            color: "#b8973a",
                            fontFamily: "var(--font-syne)",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {item.logo}
                        </div>
                        {item.certified && (
                          <div
                            className="px-2 py-1 rounded text-[9px] tracking-wider"
                            style={{
                              backgroundColor: "rgba(184, 151, 58, 0.15)",
                              color: "#b8973a",
                              fontFamily: "var(--font-syne)",
                              fontWeight: 700,
                            }}
                          >
                            CERTIFIED
                          </div>
                        )}
                      </div>

                      {/* Integration name */}
                      <h3
                        className="text-xl mb-2"
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          fontWeight: 400,
                          color: "rgba(244,240,232,0.92)",
                        }}
                      >
                        {item.name}
                      </h3>

                      {/* Description */}
                      <p
                        className="text-sm leading-[1.8] mb-4"
                        style={{
                          fontWeight: 300,
                          color: "rgba(244,240,232,0.55)",
                        }}
                      >
                        {item.description}
                      </p>

                      {/* Features list */}
                      <ul className="space-y-2 mb-4">
                        {item.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle2
                              className="w-4 h-4 mt-0.5 shrink-0"
                              style={{ color: category.color }}
                            />
                            <span
                              className="text-xs leading-[1.6]"
                              style={{
                                fontWeight: 300,
                                color: "rgba(244,240,232,0.70)",
                              }}
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Availability badge */}
                      <div
                        className="inline-block px-3 py-1.5 rounded-lg text-[10px] tracking-[0.1em]"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          color: "rgba(244,240,232,0.55)",
                          fontFamily: "var(--font-syne)",
                          fontWeight: 600,
                        }}
                      >
                        {item.available}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mt-20 relative z-10"
        >
          <div className="glass-card p-12 text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, #b8973a 1px, transparent 0)`,
                backgroundSize: "40px 40px",
              }}
            />

            <Webhook
              className="w-16 h-16 mx-auto mb-6"
              style={{
                color: "#b8973a",
                filter: "drop-shadow(0 0 20px rgba(184, 151, 58, 0.3))",
              }}
            />

            <h2
              className="text-3xl md:text-4xl mb-4"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              ¿Necesitas una integración{" "}
              <span style={{ fontStyle: "italic", color: "#b8973a" }}>personalizada?</span>
            </h2>

            <p
              className="text-base mb-8 max-w-2xl mx-auto"
              style={{
                fontWeight: 300,
                color: "rgba(244,240,232,0.55)",
              }}
            >
              Nuestro equipo puede crear integraciones custom para clientes Enterprise. Webhooks
              avanzados, sincronización bidireccional, y conectores a medida.
            </p>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 hover:scale-105"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                background: "linear-gradient(135deg, #b8973a 0%, #d4b05a 100%)",
                color: "#0a0a0b",
                boxShadow: "0 0 30px rgba(184, 151, 58, 0.3)",
              }}
            >
              Ver Planes Enterprise
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
