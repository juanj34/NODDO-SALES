"use client";

import { motion } from "framer-motion";
import { Rocket, CheckCircle2, Clock, Lightbulb, ArrowRight, Sparkles } from "lucide-react";

const roadmapItems = [
  {
    status: "completed",
    title: "Recién Lanzado",
    icon: CheckCircle2,
    color: "#10b981",
    items: [
      {
        name: "Multi-step forms con trust signals",
        description: "Formularios de contacto en múltiples pasos con badges de confianza, progreso visual, y validación en tiempo real",
        date: "Marzo 2026",
        impact: "high",
      },
      {
        name: "Cotizador automático en PDF",
        description: "Genera cotizaciones personalizadas en PDF con branding del proyecto, specs de la unidad, precios, y formas de pago",
        date: "Marzo 2026",
        impact: "high",
      },
      {
        name: "Sistema de colaboradores",
        description: "Invita hasta 3 colaboradores (asesores de ventas) con permisos limitados para actualizar solo inventario",
        date: "Febrero 2026",
        impact: "medium",
      },
      {
        name: "Analytics dashboard mejorado",
        description: "Dashboard de analytics con métricas de conversión, fuentes de tráfico, y mapas de calor de clicks",
        date: "Febrero 2026",
        impact: "medium",
      },
      {
        name: "Notificaciones de leads instantáneas",
        description: "Emails automáticos al capturar lead + daily digest con resumen de actividad",
        date: "Enero 2026",
        impact: "high",
      },
    ],
  },
  {
    status: "in-progress",
    title: "En Desarrollo (Q2 2026)",
    icon: Rocket,
    color: "#b8973a",
    items: [
      {
        name: "A/B Testing nativo",
        description: "Prueba diferentes versiones de tu microsite: textos, CTAs, colores, layouts. Métricas automáticas para detectar qué convierte mejor",
        eta: "Abril 2026",
        impact: "high",
        progress: 65,
      },
      {
        name: "WhatsApp Business API",
        description: "Integración oficial con WhatsApp Business: envía mensajes automatizados, templates aprobados, y chatbot básico para calificación de leads",
        eta: "Mayo 2026",
        impact: "high",
        progress: 40,
      },
      {
        name: "Analytics predictivos con AI",
        description: "Predicción de probabilidad de venta por unidad, recomendaciones de pricing dinámico, y forecasting de conversión",
        eta: "Junio 2026",
        impact: "medium",
        progress: 25,
      },
      {
        name: "Editor visual de páginas",
        description: "Drag-and-drop para personalizar layout de secciones sin código. Biblioteca de bloques pre-diseñados",
        eta: "Junio 2026",
        impact: "medium",
        progress: 50,
      },
    ],
  },
  {
    status: "planned",
    title: "Próximamente (Q3-Q4 2026)",
    icon: Clock,
    color: "#d4b05a",
    items: [
      {
        name: "App móvil nativa (iOS + Android)",
        description: "App para el equipo de ventas: gestión de leads on-the-go, escaneo de QR para vincular visitantes a unidades, modo offline",
        eta: "Q3 2026",
        impact: "high",
      },
      {
        name: "Tours VR (Oculus/Meta Quest)",
        description: "Soporte para recorridos en realidad virtual compatibles con visores Oculus, Meta Quest, y Google Cardboard",
        eta: "Q3 2026",
        impact: "medium",
      },
      {
        name: "Integración Salesforce nativa",
        description: "Connector bidireccional oficial con Salesforce: sincroniza leads, oportunidades, y custom objects sin Zapier",
        eta: "Q4 2026",
        impact: "high",
      },
      {
        name: "Marketplace de templates",
        description: "Biblioteca de templates pre-diseñados por tipo de proyecto: apartamentos, casas, lotes, comercial, mixed-use",
        eta: "Q4 2026",
        impact: "low",
      },
      {
        name: "Comparador de unidades",
        description: "Herramienta para que compradores comparen hasta 4 unidades lado a lado: specs, precio, renders, disponibilidad",
        eta: "Q4 2026",
        impact: "medium",
      },
    ],
  },
  {
    status: "considering",
    title: "En Consideración (Votación de Usuarios)",
    icon: Lightbulb,
    color: "#a07e2e",
    items: [
      {
        name: "Financiamiento simulado",
        description: "Calculadora de crédito hipotecario integrada con bancos: simula cuota mensual, tasa de interés, y requisitos de aprobación",
        votes: 47,
      },
      {
        name: "Live chat con IA",
        description: "Chatbot entrenado con info del proyecto que responde preguntas comunes 24/7, califica leads, y agenda citas",
        votes: 38,
      },
      {
        name: "Reservas online con pago",
        description: "Sistema de reservas online: paga % inicial con Stripe, genera contrato digital, y bloquea unidad temporalmente",
        votes: 32,
      },
      {
        name: "Galería 360° interactiva",
        description: "Fotos 360° navegables (tipo Google Street View) para recorrer departamentos terminados o modelo",
        votes: 28,
      },
      {
        name: "Reportes personalizados",
        description: "Genera reportes en PDF/Excel con métricas custom, filtros avanzados, y branding del proyecto",
        votes: 19,
      },
    ],
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function RoadmapPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Decorative rocket SVG */}
        <div className="absolute top-20 right-10 opacity-5 pointer-events-none hidden lg:block">
          <svg width="200" height="300" viewBox="0 0 200 300" fill="none">
            {/* Rocket body */}
            <path
              d="M100 20 L100 200 L120 220 L100 240 L80 220 Z"
              stroke="#b8973a"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Window */}
            <circle cx="100" cy="80" r="20" stroke="#b8973a" strokeWidth="1" />
            <circle cx="100" cy="80" r="12" stroke="#b8973a" strokeWidth="0.5" opacity="0.5" />
            {/* Fins */}
            <path d="M80 180 L50 220 L80 200 Z" stroke="#b8973a" strokeWidth="1" />
            <path d="M120 180 L150 220 L120 200 Z" stroke="#b8973a" strokeWidth="1" />
            {/* Flame */}
            <path
              d="M85 240 Q90 260 100 280 Q110 260 115 240"
              stroke="#b8973a"
              strokeWidth="0.8"
              strokeDasharray="2 2"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light"
          >
            <Sparkles className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Roadmap
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
            Hacia dónde vamos
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
            Transparencia total. Aquí puedes ver qué estamos construyendo, qué acabamos de lanzar,
            y qué features estamos considerando basados en feedback de usuarios.
          </motion.p>
        </div>

        {/* Roadmap sections */}
        <div className="space-y-16">
          {roadmapItems.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <motion.section
                key={section.status}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: sectionIndex * 0.1, ease }}
              >
                {/* Section header */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: `${section.color}15`,
                      border: `1px solid ${section.color}30`,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: section.color }} />
                  </div>
                  <h2
                    className="text-3xl"
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontWeight: 400,
                      color: "rgba(244,240,232,0.92)",
                    }}
                  >
                    {section.title}
                  </h2>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.5, delay: itemIndex * 0.05, ease }}
                      className="glass-card p-6 hover:bg-white/5 transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <h3
                              className="text-xl"
                              style={{
                                fontFamily: "var(--font-cormorant)",
                                fontWeight: 400,
                                color: "rgba(244,240,232,0.92)",
                              }}
                            >
                              {item.name}
                            </h3>
                            {"impact" in item && (
                              <span
                                className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider"
                                style={{
                                  fontFamily: "var(--font-syne)",
                                  fontWeight: 700,
                                  backgroundColor:
                                    item.impact === "high"
                                      ? "rgba(184, 151, 58, 0.15)"
                                      : item.impact === "medium"
                                      ? "rgba(255, 255, 255, 0.05)"
                                      : "rgba(255, 255, 255, 0.03)",
                                  color:
                                    item.impact === "high"
                                      ? "#b8973a"
                                      : "rgba(244,240,232,0.45)",
                                }}
                              >
                                {item.impact} impact
                              </span>
                            )}
                          </div>

                          <p
                            className="text-sm leading-[1.8] mb-3"
                            style={{
                              fontFamily: "var(--font-dm-mono)",
                              fontWeight: 300,
                              color: "rgba(244,240,232,0.70)",
                            }}
                          >
                            {item.description}
                          </p>

                          {/* Progress bar for in-progress items */}
                          {"progress" in item && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className="text-xs"
                                  style={{
                                    fontFamily: "var(--font-dm-mono)",
                                    fontWeight: 300,
                                    color: "rgba(244,240,232,0.55)",
                                  }}
                                >
                                  Progreso
                                </span>
                                <span
                                  className="text-xs font-bold"
                                  style={{
                                    fontFamily: "var(--font-syne)",
                                    color: "#b8973a",
                                  }}
                                >
                                  {item.progress}%
                                </span>
                              </div>
                              <div
                                className="h-2 rounded-full overflow-hidden"
                                style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                              >
                                <div
                                  className="h-full transition-all duration-500"
                                  style={{
                                    width: `${item.progress}%`,
                                    background: "linear-gradient(90deg, #b8973a 0%, #d4b05a 100%)",
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Votes for considering items */}
                          {"votes" in item && (
                            <div className="flex items-center gap-2 mt-3">
                              <span
                                className="text-xs"
                                style={{
                                  fontFamily: "var(--font-dm-mono)",
                                  fontWeight: 300,
                                  color: "rgba(244,240,232,0.55)",
                                }}
                              >
                                {item.votes} votos de usuarios
                              </span>
                              <button
                                className="ml-2 px-3 py-1 rounded-lg text-xs transition-all duration-200 hover:scale-105"
                                style={{
                                  fontFamily: "var(--font-syne)",
                                  fontWeight: 600,
                                  backgroundColor: "rgba(184, 151, 58, 0.15)",
                                  color: "#b8973a",
                                  border: "1px solid rgba(184, 151, 58, 0.3)",
                                }}
                              >
                                👍 Votar
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Date/ETA badge */}
                        <div
                          className="shrink-0 px-4 py-2 rounded-lg text-center"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          <div
                            className="text-[10px] uppercase tracking-wider mb-1"
                            style={{
                              fontFamily: "var(--font-syne)",
                              fontWeight: 600,
                              color: "rgba(244,240,232,0.45)",
                            }}
                          >
                            {"date" in item ? "Lanzado" : "eta" in item ? "ETA" : "Propuesto"}
                          </div>
                          <div
                            className="text-sm"
                            style={{
                              fontFamily: "var(--font-dm-mono)",
                              fontWeight: 400,
                              color: section.color,
                            }}
                          >
                            {"date" in item ? item.date : "eta" in item ? item.eta : "-"}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            );
          })}
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
            <Lightbulb
              className="w-14 h-14 mx-auto mb-6"
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
              ¿Tienes una idea?{" "}
              <span style={{ fontStyle: "italic", color: "#b8973a" }}>Cuéntanos</span>
            </h2>
            <p
              className="text-base mb-8 max-w-2xl mx-auto"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.55)",
              }}
            >
              Escuchamos activamente a nuestros usuarios. Si tienes una idea de feature o mejora,
              escríbenos. Las mejores propuestas entran al roadmap.
            </p>
            <a
              href="mailto:hola@noddo.io?subject=Sugerencia de Feature"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 hover:scale-105"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                background: "linear-gradient(135deg, #b8973a 0%, #d4b05a 100%)",
                color: "#0a0a0b",
                boxShadow: "0 0 30px rgba(184, 151, 58, 0.3)",
              }}
            >
              Proponer Feature
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
