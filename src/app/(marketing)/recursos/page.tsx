"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, ArrowRight, TrendingUp, Target, Lightbulb, CheckSquare, DollarSign } from "lucide-react";
import Link from "next/link";
import { usePageView } from "@/hooks/usePageView";

const articles = [
  {
    id: "guia-vender-apartamentos-online-2026",
    title: "Guía completa: Cómo vender apartamentos online en 2026",
    excerpt: "Todo lo que necesitas saber para digitalizar tu estrategia de ventas inmobiliarias. Desde inventario en vivo hasta automatización de leads.",
    category: "Guías",
    readTime: "12 min",
    date: "15 Mar 2026",
    icon: BookOpen,
    color: "#b8973a",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
    tags: ["Marketing Digital", "Ventas", "Estrategia"],
  },
  {
    id: "10-errores-sitios-web-constructoras",
    title: "10 errores que cometen las constructoras en sus sitios web",
    excerpt: "PDFs estáticos, inventario desactualizado, formularios sin rastreo... Identificamos los errores más comunes y cómo evitarlos.",
    category: "Mejores Prácticas",
    readTime: "8 min",
    date: "12 Mar 2026",
    icon: Target,
    color: "#d4b05a",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop",
    tags: ["UX", "Conversión", "Errores Comunes"],
  },
  {
    id: "inventario-tiempo-real-vs-pdfs",
    title: "Por qué el inventario en tiempo real vende más que PDFs estáticos",
    excerpt: "Análisis con datos: proyectos con inventario interactivo convierten 3.2x más que los que usan PDFs. Casos reales + métricas.",
    category: "Análisis",
    readTime: "10 min",
    date: "8 Mar 2026",
    icon: TrendingUp,
    color: "#a07e2e",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
    tags: ["Inventario", "Conversión", "Datos"],
  },
  {
    id: "calcular-roi-marketing-inmobiliario",
    title: "Cómo calcular el ROI de tu marketing inmobiliario digital",
    excerpt: "Framework paso a paso para medir retorno de inversión: costo por lead, tasa de conversión, CAC, LTV. Incluye plantilla Excel gratuita.",
    category: "Finanzas",
    readTime: "15 min",
    date: "5 Mar 2026",
    icon: DollarSign,
    color: "#10b981",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
    tags: ["ROI", "Métricas", "Finanzas"],
  },
  {
    id: "checklist-lanzar-proyecto-3-dias",
    title: "Checklist: Lanzar un proyecto inmobiliario en 3 días",
    excerpt: "Guía accionable para lanzar tu microsite premium en tiempo récord. Desde preparación de contenido hasta publicación en vivo.",
    category: "Checklist",
    readTime: "6 min",
    date: "1 Mar 2026",
    icon: CheckSquare,
    color: "#b8973a",
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop",
    tags: ["Onboarding", "Checklist", "Guía Rápida"],
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function RecursosPage() {
  usePageView("Recursos");

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Decorative book SVG */}
        <div className="absolute top-20 left-10 opacity-5 pointer-events-none hidden lg:block">
          <svg width="150" height="200" viewBox="0 0 150 200" fill="none">
            {/* Book */}
            <rect x="30" y="20" width="90" height="160" stroke="#b8973a" strokeWidth="1.5" />
            <rect x="30" y="20" width="90" height="160" fill="rgba(184, 151, 58, 0.05)" />
            {/* Spine */}
            <rect x="30" y="20" width="10" height="160" stroke="#b8973a" strokeWidth="1" />
            {/* Pages */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="45"
                y1={40 + i * 30}
                x2="110"
                y2={40 + i * 30}
                stroke="#b8973a"
                strokeWidth="0.5"
                opacity="0.4"
              />
            ))}
            {/* Bookmark */}
            <path d="M80 20 L80 60 L85 55 L90 60 L90 20" stroke="#b8973a" strokeWidth="0.8" />
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
            <BookOpen className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Centro de Recursos
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
            Aprende a vender
            <br />
            <span style={{ fontStyle: "italic", color: "#b8973a" }}>
              mejor y más rápido
            </span>
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
            Guías prácticas, análisis de datos, y mejores prácticas del sector inmobiliario digital.
            Aprende de expertos y casos reales.
          </motion.p>
        </div>

        {/* Featured article (first one) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mb-16"
        >
          <div className="glass-card overflow-hidden group hover:bg-white/5 transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative h-64 lg:h-auto overflow-hidden">
                <img
                  src={articles[0].image}
                  alt={articles[0].title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 700,
                    backgroundColor: "rgba(184, 151, 58, 0.95)",
                    color: "#0a0a0b",
                  }}
                >
                  ⭐ Destacado
                </div>
              </div>

              <div className="p-8 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  {React.createElement(articles[0].icon, {
                    className: "w-5 h-5",
                    style: { color: articles[0].color },
                  })}
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontWeight: 600,
                      color: "rgba(244,240,232,0.55)",
                    }}
                  >
                    {articles[0].category}
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      fontWeight: 300,
                      color: "rgba(244,240,232,0.35)",
                    }}
                  >
                    • {articles[0].readTime}
                  </span>
                </div>

                <h2
                  className="text-3xl md:text-4xl mb-4"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 400,
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  {articles[0].title}
                </h2>

                <p
                  className="text-base leading-[1.8] mb-6"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  {articles[0].excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {articles[0].tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-lg text-xs"
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        fontWeight: 400,
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        color: "rgba(244,240,232,0.55)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 self-start"
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #b8973a 0%, #d4b05a 100%)",
                    color: "#0a0a0b",
                  }}
                >
                  Leer Artículo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Articles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.slice(1).map((article, index) => {
            const Icon = article.icon;
            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: index * 0.1, ease }}
                className="glass-card overflow-hidden group hover:bg-white/5 transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-4 h-4" style={{ color: article.color }} />
                    <span
                      className="text-xs uppercase tracking-wider"
                      style={{
                        fontFamily: "var(--font-syne)",
                        fontWeight: 600,
                        color: "rgba(244,240,232,0.55)",
                      }}
                    >
                      {article.category}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        fontWeight: 300,
                        color: "rgba(244,240,232,0.35)",
                      }}
                    >
                      • {article.readTime}
                    </span>
                  </div>

                  <h3
                    className="text-2xl mb-3"
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontWeight: 400,
                      color: "rgba(244,240,232,0.92)",
                    }}
                  >
                    {article.title}
                  </h3>

                  <p
                    className="text-sm leading-[1.7] mb-4"
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      fontWeight: 300,
                      color: "rgba(244,240,232,0.70)",
                    }}
                  >
                    {article.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px]"
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          fontWeight: 400,
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          color: "rgba(244,240,232,0.45)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    className="inline-flex items-center gap-2 text-sm transition-all duration-200 group/btn"
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontWeight: 600,
                      color: "#b8973a",
                    }}
                  >
                    Leer más
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1"
                    />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mt-20"
        >
          <div className="glass-card p-12 text-center relative overflow-hidden">
            {/* Decorative pattern */}
            <div
              className="absolute inset-0 opacity-3 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, #b8973a 1px, transparent 0)`,
                backgroundSize: "30px 30px",
              }}
            />

            <Lightbulb
              className="w-12 h-12 mx-auto mb-6 relative z-10"
              style={{
                color: "#b8973a",
                filter: "drop-shadow(0 0 20px rgba(184, 151, 58, 0.3))",
              }}
            />

            <h2
              className="text-3xl md:text-4xl mb-4 relative z-10"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              No te pierdas{" "}
              <span style={{ fontStyle: "italic", color: "#b8973a" }}>nada</span>
            </h2>

            <p
              className="text-base mb-8 max-w-2xl mx-auto relative z-10"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.55)",
              }}
            >
              Recibe en tu email artículos nuevos, casos de estudio, y updates del producto. Una
              vez al mes, sin spam.
            </p>

            <form className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto relative z-10">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 px-6 py-4 rounded-xl input-glass text-sm"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "rgba(244,240,232,0.92)",
                }}
              />
              <button
                type="submit"
                className="px-8 py-4 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 shrink-0"
                style={{
                  fontFamily: "var(--font-syne)",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #b8973a 0%, #d4b05a 100%)",
                  color: "#0a0a0b",
                }}
              >
                Suscribirme
              </button>
            </form>

            <p
              className="text-xs mt-4 relative z-10"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.35)",
              }}
            >
              Puedes cancelar cuando quieras. Cero spam, lo prometemos.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
