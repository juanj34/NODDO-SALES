"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function Testimonials() {
  const { t } = useTranslation("marketing");

  const testimonials = [
    {
      quote: t("testimonials.items.t0quote"),
      name: t("testimonials.items.t0name"),
      initials: "JM",
      role: t("testimonials.items.t0role"),
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    {
      quote: t("testimonials.items.t1quote"),
      name: t("testimonials.items.t1name"),
      initials: "LC",
      role: t("testimonials.items.t1role"),
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    },
    {
      quote: t("testimonials.items.t2quote"),
      name: t("testimonials.items.t2name"),
      initials: "RF",
      role: t("testimonials.items.t2role"),
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    },
  ];

  return (
    <section className="py-24 lg:py-32 relative z-[1] border-t border-[var(--mk-border-rule)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="mk-section-label mb-6"
        >
          {t("testimonials.label")}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="mk-section-heading mb-16"
        >
          {t("testimonials.headingLine1")}<br />
          <em>{t("testimonials.headingEmphasis")}</em>
        </motion.h2>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(255,255,255,0.04)]">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease }}
              className="bg-[var(--mk-bg)] p-8 lg:p-10 flex flex-col relative"
            >
              {/* Stars */}
              <div
                className="absolute"
                style={{
                  top: 36,
                  right: 36,
                  color: "var(--mk-accent)",
                  fontSize: 10,
                  letterSpacing: 2,
                }}
              >
                ★★★★★
              </div>

              {/* Quote mark */}
              <span
                className="font-heading block mb-4"
                style={{
                  fontSize: 80,
                  fontWeight: 300,
                  lineHeight: 0.6,
                  color: "rgba(184,151,58,0.15)",
                }}
              >
                &ldquo;
              </span>

              {/* Quote text */}
              <p
                className="text-[14px] leading-[1.9] mb-7 flex-1 italic"
                style={{ color: "rgba(244, 240, 232, 0.6)" }}
              >
                {item.quote}
              </p>

              {/* Divider */}
              <div
                className="mb-5"
                style={{
                  width: 32,
                  height: 1,
                  background: "rgba(184,151,58,0.3)",
                }}
              />

              {/* Author */}
              <div className="flex items-center gap-3.5">
                {/* Avatar */}
                <Image
                  src={item.avatar}
                  alt={item.name}
                  width={42}
                  height={42}
                  className="flex-shrink-0 rounded-full object-cover"
                  style={{
                    width: 42,
                    height: 42,
                    border: "2px solid rgba(184,151,58,0.2)",
                  }}
                />
                <div>
                  <p className="font-ui text-[12px] font-bold tracking-[0.06em] text-[var(--mk-text-primary)] mb-0.5">
                    {item.name}
                  </p>
                  <p
                    className="text-[10px] tracking-[0.1em]"
                    style={{ color: "rgba(244, 240, 232, 0.3)" }}
                  >
                    {item.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
