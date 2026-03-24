"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, Calendar, Tag } from "lucide-react";
import { articles, getRelatedArticles, type ArticleSection } from "@/data/articles";
import React from "react";
import { usePageView } from "@/hooks/usePageView";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

function renderSection(section: ArticleSection, index: number) {
  switch (section.type) {
    case "paragraph":
      return (
        <p
          key={index}
          className="text-[15px] leading-[1.9] mb-6"
          style={{ color: "rgba(244,240,232,0.75)" }}
        >
          {section.text}
        </p>
      );
    case "heading":
      return (
        <h2
          key={index}
          className="text-2xl md:text-3xl mt-10 mb-4"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontWeight: 400,
            color: "rgba(244,240,232,0.92)",
          }}
        >
          {section.text}
        </h2>
      );
    case "subheading":
      return (
        <h3
          key={index}
          className="text-lg md:text-xl mt-6 mb-3"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontWeight: 400,
            color: "rgba(244,240,232,0.85)",
          }}
        >
          {section.text}
        </h3>
      );
    case "list":
      return (
        <ul key={index} className="space-y-2 mb-6 pl-1">
          {section.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-[1.8]">
              <span
                className="mt-2.5 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: "#b8973a" }}
              />
              <span style={{ color: "rgba(244,240,232,0.70)" }}>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote
          key={index}
          className="my-8 pl-6 py-4 relative"
          style={{
            borderLeft: "3px solid #b8973a",
          }}
        >
          <p
            className="text-lg italic leading-[1.8]"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.85)",
            }}
          >
            &ldquo;{section.text}&rdquo;
          </p>
          {section.author && (
            <cite
              className="block mt-2 text-xs not-italic"
              style={{ color: "rgba(244,240,232,0.45)" }}
            >
              — {section.author}
            </cite>
          )}
        </blockquote>
      );
    case "callout":
      return (
        <div
          key={index}
          className="my-8 p-6 rounded-xl"
          style={{
            backgroundColor: "rgba(184, 151, 58, 0.08)",
            border: "1px solid rgba(184, 151, 58, 0.2)",
          }}
        >
          <p
            className="text-[14px] leading-[1.8]"
            style={{ color: "rgba(244,240,232,0.80)" }}
          >
            {section.text}
          </p>
        </div>
      );
    default:
      return null;
  }
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = articles.find((a) => a.id === slug);

  usePageView(article ? `Artículo: ${article.title}` : "Artículo no encontrado");

  if (!article) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 text-center">
        <h1
          className="text-4xl mb-4"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontWeight: 300,
            color: "rgba(244,240,232,0.92)",
          }}
        >
          Artículo no encontrado
        </h1>
        <Link
          href="/recursos"
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: "#b8973a" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Recursos
        </Link>
      </div>
    );
  }

  const Icon = article.icon;
  const related = getRelatedArticles(article.id);

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <Link
            href="/recursos"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] mb-10 hover:gap-3 transition-all duration-200"
            style={{
              fontFamily: "var(--font-syne)",
              fontWeight: 600,
              color: "rgba(244,240,232,0.45)",
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Todos los artículos
          </Link>
        </motion.div>

        {/* Article header */}
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-10"
        >
          {/* Category + meta */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: "rgba(184, 151, 58, 0.12)",
                border: "1px solid rgba(184, 151, 58, 0.2)",
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: article.color }} />
              <span
                className="text-[10px] uppercase tracking-[0.15em]"
                style={{
                  fontFamily: "var(--font-syne)",
                  fontWeight: 700,
                  color: "#b8973a",
                }}
              >
                {article.category}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" style={{ color: "rgba(244,240,232,0.35)" }} />
              <span
                className="text-xs"
                style={{ color: "rgba(244,240,232,0.35)" }}
              >
                {article.readTime}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: "rgba(244,240,232,0.35)" }} />
              <span
                className="text-xs"
                style={{ color: "rgba(244,240,232,0.35)" }}
              >
                {article.date}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl mb-5"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.92)",
              lineHeight: 1.15,
            }}
          >
            {article.title}
          </h1>

          {/* Excerpt */}
          <p
            className="text-lg leading-[1.7]"
            style={{ color: "rgba(244,240,232,0.55)" }}
          >
            {article.excerpt}
          </p>
        </motion.header>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease }}
          className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-12"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover"
          />
        </motion.div>

        {/* Article body */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease }}
        >
          {article.content.map((section, index) => renderSection(section, index))}
        </motion.article>

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease }}
          className="flex items-center gap-2 flex-wrap mt-12 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Tag className="w-4 h-4" style={{ color: "rgba(244,240,232,0.35)" }} />
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-lg text-xs"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "rgba(244,240,232,0.55)",
              }}
            >
              {tag}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mt-16"
        >
          <div
            className="glass-card p-10 text-center relative overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-3 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, #b8973a 1px, transparent 0)",
                backgroundSize: "30px 30px",
              }}
            />
            <h2
              className="text-3xl md:text-4xl mb-3 relative z-10"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              ¿Listo para vender{" "}
              <span style={{ fontStyle: "italic", color: "#b8973a" }}>
                diferente?
              </span>
            </h2>
            <p
              className="text-sm mb-6 max-w-lg mx-auto relative z-10"
              style={{ color: "rgba(244,240,232,0.55)" }}
            >
              Agenda una llamada de 30 minutos y te mostramos cómo NODDO puede
              transformar tu estrategia de ventas
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm transition-all duration-200 hover:scale-105 relative z-10"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                background:
                  "linear-gradient(135deg, #b8973a 0%, #d4b05a 100%)",
                color: "#0a0a0b",
                boxShadow: "0 0 30px rgba(184, 151, 58, 0.3)",
              }}
            >
              Agendar Llamada
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Related articles */}
        {related.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="mt-16"
          >
            <h3
              className="text-2xl mb-6"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 400,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              También te puede interesar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map((rel) => {
                const RelIcon = rel.icon;
                return (
                  <Link
                    key={rel.id}
                    href={`/recursos/${rel.id}`}
                    className="glass-card overflow-hidden group hover:bg-white/5 transition-all duration-300"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={rel.image}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <RelIcon
                          className="w-3.5 h-3.5"
                          style={{ color: rel.color }}
                        />
                        <span
                          className="text-[10px] uppercase tracking-wider"
                          style={{
                            fontFamily: "var(--font-syne)",
                            fontWeight: 600,
                            color: "rgba(244,240,232,0.55)",
                          }}
                        >
                          {rel.category}
                        </span>
                      </div>
                      <h4
                        className="text-xl"
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          fontWeight: 400,
                          color: "rgba(244,240,232,0.92)",
                        }}
                      >
                        {rel.title}
                      </h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
