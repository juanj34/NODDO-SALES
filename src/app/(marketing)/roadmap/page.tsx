"use client";

import { motion } from "framer-motion";
import { Rocket, CheckCircle2, Clock, Lightbulb, ArrowRight, Sparkles } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import { useTranslation } from "@/i18n";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function RoadmapPage() {
  usePageView("Roadmap");
  const { t } = useTranslation("marketing");

  const roadmapItems = [
    {
      status: "completed",
      title: t("roadmap.sections.completedTitle"),
      icon: CheckCircle2,
      color: "#10b981",
      items: [
        {
          name: t("roadmap.items.i0name"),
          description: t("roadmap.items.i0desc"),
          date: t("roadmap.items.i0date"),
          impact: "high" as const,
        },
        {
          name: t("roadmap.items.i1name"),
          description: t("roadmap.items.i1desc"),
          date: t("roadmap.items.i1date"),
          impact: "high" as const,
        },
        {
          name: t("roadmap.items.i2name"),
          description: t("roadmap.items.i2desc"),
          date: t("roadmap.items.i2date"),
          impact: "medium" as const,
        },
        {
          name: t("roadmap.items.i3name"),
          description: t("roadmap.items.i3desc"),
          date: t("roadmap.items.i3date"),
          impact: "medium" as const,
        },
        {
          name: t("roadmap.items.i4name"),
          description: t("roadmap.items.i4desc"),
          date: t("roadmap.items.i4date"),
          impact: "high" as const,
        },
      ],
    },
    {
      status: "in-progress",
      title: t("roadmap.sections.inProgressTitle"),
      icon: Rocket,
      color: "#b8973a",
      items: [
        {
          name: t("roadmap.items.i5name"),
          description: t("roadmap.items.i5desc"),
          eta: t("roadmap.items.i5eta"),
          impact: "high" as const,
          progress: 65,
        },
        {
          name: t("roadmap.items.i6name"),
          description: t("roadmap.items.i6desc"),
          eta: t("roadmap.items.i6eta"),
          impact: "high" as const,
          progress: 40,
        },
        {
          name: t("roadmap.items.i7name"),
          description: t("roadmap.items.i7desc"),
          eta: t("roadmap.items.i7eta"),
          impact: "medium" as const,
          progress: 25,
        },
        {
          name: t("roadmap.items.i8name"),
          description: t("roadmap.items.i8desc"),
          eta: t("roadmap.items.i8eta"),
          impact: "medium" as const,
          progress: 50,
        },
      ],
    },
    {
      status: "planned",
      title: t("roadmap.sections.plannedTitle"),
      icon: Clock,
      color: "#d4b05a",
      items: [
        {
          name: t("roadmap.items.i9name"),
          description: t("roadmap.items.i9desc"),
          eta: t("roadmap.items.i9eta"),
          impact: "high" as const,
        },
        {
          name: t("roadmap.items.i10name"),
          description: t("roadmap.items.i10desc"),
          eta: t("roadmap.items.i10eta"),
          impact: "medium" as const,
        },
        {
          name: t("roadmap.items.i11name"),
          description: t("roadmap.items.i11desc"),
          eta: t("roadmap.items.i11eta"),
          impact: "high" as const,
        },
        {
          name: t("roadmap.items.i12name"),
          description: t("roadmap.items.i12desc"),
          eta: t("roadmap.items.i12eta"),
          impact: "low" as const,
        },
        {
          name: t("roadmap.items.i13name"),
          description: t("roadmap.items.i13desc"),
          eta: t("roadmap.items.i13eta"),
          impact: "medium" as const,
        },
      ],
    },
    {
      status: "considering",
      title: t("roadmap.sections.consideringTitle"),
      icon: Lightbulb,
      color: "#a07e2e",
      items: [
        {
          name: t("roadmap.items.i14name"),
          description: t("roadmap.items.i14desc"),
          votes: 47,
        },
        {
          name: t("roadmap.items.i15name"),
          description: t("roadmap.items.i15desc"),
          votes: 38,
        },
        {
          name: t("roadmap.items.i16name"),
          description: t("roadmap.items.i16desc"),
          votes: 32,
        },
        {
          name: t("roadmap.items.i17name"),
          description: t("roadmap.items.i17desc"),
          votes: 28,
        },
        {
          name: t("roadmap.items.i18name"),
          description: t("roadmap.items.i18desc"),
          votes: 19,
        },
      ],
    },
  ];

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
              {t("roadmap.badge")}
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
            {t("roadmap.title")}
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
            {t("roadmap.description")}
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
                                    fontWeight: 300,
                                    color: "rgba(244,240,232,0.55)",
                                  }}
                                >
                                  {t("roadmap.progress")}
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
                                  fontWeight: 300,
                                  color: "rgba(244,240,232,0.55)",
                                }}
                              >
                                {item.votes} {t("roadmap.votes")}
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
                                👍 {t("roadmap.voteButton")}
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
                            {"date" in item ? t("roadmap.dateLaunched") : "eta" in item ? t("roadmap.dateEta") : t("roadmap.dateProposed")}
                          </div>
                          <div
                            className="text-sm"
                            style={{
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
              {t("roadmap.ctaTitleLine1")}{" "}
              <span style={{ fontStyle: "italic", color: "#b8973a" }}>{t("roadmap.ctaTitleEmphasis")}</span>
            </h2>
            <p
              className="text-base mb-8 max-w-2xl mx-auto"
              style={{
                fontWeight: 300,
                color: "rgba(244,240,232,0.55)",
              }}
            >
              {t("roadmap.ctaDescription")}
            </p>
            <a
              href="mailto:hola@noddo.io?subject=Feature Suggestion"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 hover:scale-105"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                background: "linear-gradient(135deg, #b8973a 0%, #d4b05a 100%)",
                color: "#0a0a0b",
                boxShadow: "0 0 30px rgba(184, 151, 58, 0.3)",
              }}
            >
              {t("roadmap.ctaButton")}
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
