"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ArrowRight,
  Quote,
  CheckCircle2,
  Target,
} from "lucide-react";
import Link from "next/link";
import { caseStudies } from "@/data/case-studies";
import { usePageView } from "@/hooks/usePageView";
import { useTranslation } from "@/i18n";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function CasosDeEstudioPage() {
  const { t } = useTranslation("marketing");
  usePageView("Casos de Estudio");

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
              {t("caseStudies.badge")}
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
            {t("caseStudies.titleLine1")}
            <br />
            {t("caseStudies.titleLine2")}
            <span style={{ fontStyle: "italic", color: "#b8973a" }}>
              {t("caseStudies.titleEmphasis")}
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
            {t("caseStudies.description")}
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

                  <Image
                    src={study.image}
                    alt=""
                    width={400}
                    height={300}
                    className="w-full md:w-80 h-48 object-cover rounded-xl"
                    style={{
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  />
                </div>
              </div>

              {/* Challenge + Solution */}
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
                      <Target
                        className="w-5 h-5"
                        style={{ color: "#ef4444" }}
                      />
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
                        {t("caseStudies.challenge")}
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
                      <CheckCircle2
                        className="w-5 h-5"
                        style={{ color: "#b8973a" }}
                      />
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
                        {t("caseStudies.solution")}
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
                  {t("caseStudies.results")}
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

                {/* Testimonial quote */}
                <div
                  className="p-6 rounded-xl relative mb-6"
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

                {/* Ver Caso Completo link */}
                <Link
                  href={`/casos-de-estudio/${study.id}`}
                  className="inline-flex items-center gap-2 text-sm transition-all duration-200 hover:gap-3"
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 700,
                    color: "#b8973a",
                  }}
                >
                  {t("caseStudies.viewFullCase")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
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
              {t("caseStudies.ctaTitleLine1")}
              <span style={{ fontStyle: "italic", color: "#b8973a" }}>
                {t("caseStudies.ctaTitleEmphasis")}
              </span>
            </h2>
            <p
              className="text-base mb-8 max-w-2xl mx-auto"
              style={{
                fontWeight: 300,
                color: "rgba(244,240,232,0.55)",
              }}
            >
              {t("caseStudies.ctaDescription")}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 hover:scale-105"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                background:
                  "linear-gradient(135deg, #b8973a 0%, #d4b05a 100%)",
                color: "#0a0a0b",
                boxShadow: "0 0 30px rgba(184, 151, 58, 0.3)",
              }}
            >
              {t("caseStudies.ctaButton")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
