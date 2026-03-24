"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Quote,
  CheckCircle2,
  Target,
  MapPin,
  Building2,
  Wrench,
  Lightbulb,
} from "lucide-react";
import { caseStudies, getOtherCaseStudies } from "@/data/case-studies";
import { usePageView } from "@/hooks/usePageView";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function CaseStudyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const study = caseStudies.find((cs) => cs.id === id);

  usePageView(study ? `Caso: ${study.project}` : "Caso no encontrado");

  if (!study) {
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
          Caso de estudio no encontrado
        </h1>
        <Link
          href="/casos-de-estudio"
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: "#b8973a" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Casos de Estudio
        </Link>
      </div>
    );
  }

  const others = getOtherCaseStudies(study.id);

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <Link
            href="/casos-de-estudio"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] mb-10 hover:gap-3 transition-all duration-200"
            style={{
              fontFamily: "var(--font-syne)",
              fontWeight: 600,
              color: "rgba(244,240,232,0.45)",
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Todos los casos
          </Link>
        </motion.div>

        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-12"
        >
          <div className="glass-card overflow-hidden">
            <div className="relative h-64 md:h-80">
              <Image
                src={study.image}
                alt={study.project}
                fill
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.4) 50%, transparent 100%)",
                }}
              />
              {/* Logo badge */}
              <div
                className="absolute top-6 left-6 w-16 h-16 flex items-center justify-center rounded-xl text-lg font-bold"
                style={{
                  backgroundColor: "rgba(184, 151, 58, 0.15)",
                  border: "2px solid rgba(184, 151, 58, 0.3)",
                  color: "#b8973a",
                  fontFamily: "var(--font-syne)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {study.logo}
              </div>
              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h1
                  className="text-4xl md:text-5xl lg:text-6xl mb-2"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.92)",
                    lineHeight: 1.1,
                  }}
                >
                  {study.project}
                </h1>
                <p
                  className="text-base"
                  style={{ color: "rgba(244,240,232,0.55)" }}
                >
                  {study.client} · {study.location}
                </p>
              </div>
            </div>

            {/* Stats strip */}
            <div
              className="grid grid-cols-3 divide-x divide-[rgba(255,255,255,0.06)]"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="p-5 text-center">
                <Building2
                  className="w-4 h-4 mx-auto mb-1"
                  style={{ color: "#b8973a" }}
                />
                <div
                  className="text-lg font-bold"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  {study.units}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 600,
                    color: "rgba(244,240,232,0.35)",
                  }}
                >
                  Unidades
                </div>
              </div>
              <div className="p-5 text-center">
                <MapPin
                  className="w-4 h-4 mx-auto mb-1"
                  style={{ color: "#b8973a" }}
                />
                <div
                  className="text-lg font-bold"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  {study.location.split(",")[0]}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 600,
                    color: "rgba(244,240,232,0.35)",
                  }}
                >
                  Ciudad
                </div>
              </div>
              <div className="p-5 text-center">
                <Wrench
                  className="w-4 h-4 mx-auto mb-1"
                  style={{ color: "#b8973a" }}
                />
                <div
                  className="text-lg font-bold"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  {study.type}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 600,
                    color: "rgba(244,240,232,0.35)",
                  }}
                >
                  Tipo
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* About Client */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mb-12"
        >
          <h2
            className="text-2xl md:text-3xl mb-4"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Sobre{" "}
            <span style={{ fontStyle: "italic", color: "#b8973a" }}>
              {study.client}
            </span>
          </h2>
          <p
            className="text-[15px] leading-[1.9]"
            style={{ color: "rgba(244,240,232,0.70)" }}
          >
            {study.extended.aboutClient}
          </p>
        </motion.section>

        {/* Challenge + Solution */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
        >
          {/* Challenge */}
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
                  className="text-xl mb-1"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 400,
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  El Desafío
                </h3>
                <p
                  className="text-base"
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
              className="text-sm leading-[1.8] mb-5"
              style={{ fontWeight: 300, color: "rgba(244,240,232,0.70)" }}
            >
              {study.challenge.description}
            </p>
            <div className="space-y-2">
              {study.challenge.metrics.map((metric) => (
                <div
                  key={metric}
                  className="flex items-center gap-2 text-xs"
                  style={{ fontWeight: 300, color: "rgba(244,240,232,0.55)" }}
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
                <CheckCircle2
                  className="w-5 h-5"
                  style={{ color: "#b8973a" }}
                />
              </div>
              <div>
                <h3
                  className="text-xl mb-1"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 400,
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  La Solución
                </h3>
                <p
                  className="text-base"
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
              className="text-sm leading-[1.8] mb-5"
              style={{ fontWeight: 300, color: "rgba(244,240,232,0.70)" }}
            >
              {study.solution.description}
            </p>
            <div className="space-y-2">
              {study.solution.implementation.map((step) => (
                <div key={step.day} className="flex gap-3">
                  <span
                    className="shrink-0 text-xs font-bold tracking-wider"
                    style={{ fontFamily: "var(--font-syne)", color: "#b8973a" }}
                  >
                    {step.day}
                  </span>
                  <span
                    className="text-xs leading-[1.7]"
                    style={{
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
        </motion.section>

        {/* Tools Used */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mb-12"
        >
          <h2
            className="text-2xl md:text-3xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Herramientas{" "}
            <span style={{ fontStyle: "italic", color: "#b8973a" }}>
              utilizadas
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {study.extended.toolsUsed.map((tool) => (
              <div
                key={tool.name}
                className="p-5 rounded-xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Wrench
                  className="w-4 h-4 mb-2"
                  style={{ color: "#b8973a" }}
                />
                <h4
                  className="text-sm font-bold mb-1"
                  style={{
                    fontFamily: "var(--font-syne)",
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  {tool.name}
                </h4>
                <p
                  className="text-xs leading-[1.7]"
                  style={{ color: "rgba(244,240,232,0.55)" }}
                >
                  {tool.description}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Detailed Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mb-12"
        >
          <h2
            className="text-2xl md:text-3xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Timeline de{" "}
            <span style={{ fontStyle: "italic", color: "#b8973a" }}>
              implementación
            </span>
          </h2>
          <div className="space-y-0">
            {study.extended.detailedTimeline.map((phase, index) => (
              <div key={phase.phase} className="relative flex gap-6">
                {/* Timeline line */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-3 h-3 rounded-full z-10"
                    style={{
                      backgroundColor: "#b8973a",
                      boxShadow: "0 0 12px rgba(184,151,58,0.4)",
                    }}
                  />
                  {index < study.extended.detailedTimeline.length - 1 && (
                    <div
                      className="w-px flex-1"
                      style={{ backgroundColor: "rgba(184,151,58,0.2)" }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8">
                  <div className="flex items-baseline gap-3 mb-2">
                    <h4
                      className="text-sm font-bold"
                      style={{
                        fontFamily: "var(--font-syne)",
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      {phase.phase}
                    </h4>
                    <span
                      className="text-[10px] uppercase tracking-wider"
                      style={{
                        fontFamily: "var(--font-syne)",
                        fontWeight: 600,
                        color: "#b8973a",
                      }}
                    >
                      {phase.duration}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {phase.details.map((detail, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs leading-[1.7]"
                        style={{ color: "rgba(244,240,232,0.55)" }}
                      >
                        <span
                          className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                          style={{ backgroundColor: "rgba(244,240,232,0.25)" }}
                        />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Results */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mb-12"
        >
          <div className="glass-card p-8 md:p-10">
            <h2
              className="text-2xl md:text-3xl mb-2"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 400,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Resultados
            </h2>
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
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Icon
                      className="w-6 h-6 mb-3"
                      style={{ color: "#b8973a" }}
                    />
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
                          fontWeight: 400,
                          color: "rgba(244,240,232,0.92)",
                        }}
                      >
                        {metric.after}
                      </span>
                      <span
                        className="text-xs line-through"
                        style={{
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
                        color: metric.change.startsWith("-")
                          ? "#10b981"
                          : "#b8973a",
                      }}
                    >
                      {metric.change}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main quote */}
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
                  {study.results.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
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
        </motion.section>

        {/* Key Takeaways */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mb-12"
        >
          <h2
            className="text-2xl md:text-3xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Conclusiones{" "}
            <span style={{ fontStyle: "italic", color: "#b8973a" }}>clave</span>
          </h2>
          <div className="space-y-3">
            {study.extended.keyTakeaways.map((takeaway, i) => (
              <div
                key={i}
                className="flex gap-3 p-4 rounded-xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Lightbulb
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: "#b8973a" }}
                />
                <p
                  className="text-sm leading-[1.7]"
                  style={{ color: "rgba(244,240,232,0.70)" }}
                >
                  {takeaway}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Additional Testimonials */}
        {study.extended.additionalQuotes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="mb-12"
          >
            <h2
              className="text-2xl md:text-3xl mb-6"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 400,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Más{" "}
              <span style={{ fontStyle: "italic", color: "#b8973a" }}>
                voces del equipo
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {study.extended.additionalQuotes.map((q) => (
                <div
                  key={q.author}
                  className="p-6 rounded-xl relative"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Quote
                    className="w-6 h-6 mb-3 opacity-30"
                    style={{ color: "#b8973a" }}
                  />
                  <p
                    className="text-sm italic leading-[1.8] mb-4"
                    style={{ color: "rgba(244,240,232,0.75)" }}
                  >
                    &ldquo;{q.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: "rgba(184, 151, 58, 0.15)",
                        border: "1px solid rgba(184, 151, 58, 0.3)",
                        color: "#b8973a",
                        fontFamily: "var(--font-syne)",
                      }}
                    >
                      {q.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p
                        className="text-xs font-bold"
                        style={{
                          fontFamily: "var(--font-syne)",
                          color: "rgba(244,240,232,0.92)",
                        }}
                      >
                        {q.author}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: "rgba(244,240,232,0.45)" }}
                      >
                        {q.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Gallery */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mb-12"
        >
          <h2
            className="text-2xl md:text-3xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Galería del{" "}
            <span style={{ fontStyle: "italic", color: "#b8973a" }}>
              proyecto
            </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {study.extended.galleryImages.map((img, i) => (
              <div
                key={i}
                className="relative aspect-[3/2] rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Image
                  src={img}
                  alt={`${study.project} - imagen ${i + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mb-12"
        >
          <div className="glass-card p-10 text-center">
            <h2
              className="text-3xl md:text-4xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              ¿Listo para tener{" "}
              <span style={{ fontStyle: "italic", color: "#b8973a" }}>
                tu caso de éxito?
              </span>
            </h2>
            <p
              className="text-sm mb-6 max-w-2xl mx-auto"
              style={{ color: "rgba(244,240,232,0.55)" }}
            >
              Agenda una llamada de 30 minutos y te mostramos cómo NODDO puede
              transformar tu estrategia de ventas
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm transition-all duration-200 hover:scale-105"
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

        {/* Other case studies */}
        {others.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
          >
            <h3
              className="text-2xl mb-6"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 400,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Más casos de éxito
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {others.map((other) => (
                <Link
                  key={other.id}
                  href={`/casos-de-estudio/${other.id}`}
                  className="glass-card overflow-hidden group hover:bg-white/5 transition-all duration-300"
                >
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={other.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-8 h-8 flex items-center justify-center rounded text-[10px] font-bold"
                        style={{
                          backgroundColor: "rgba(184, 151, 58, 0.15)",
                          border: "1px solid rgba(184, 151, 58, 0.3)",
                          color: "#b8973a",
                          fontFamily: "var(--font-syne)",
                        }}
                      >
                        {other.logo}
                      </div>
                      <div>
                        <h4
                          className="text-lg"
                          style={{
                            fontFamily: "var(--font-cormorant)",
                            fontWeight: 400,
                            color: "rgba(244,240,232,0.92)",
                          }}
                        >
                          {other.project}
                        </h4>
                        <p
                          className="text-[10px]"
                          style={{ color: "rgba(244,240,232,0.45)" }}
                        >
                          {other.client} · {other.location}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
