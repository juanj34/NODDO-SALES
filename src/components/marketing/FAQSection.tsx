"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { t } = useTranslation("marketing");

  const faqs = [
    { q: t("faq.items.q0"), a: t("faq.items.a0") },
    { q: t("faq.items.q1"), a: t("faq.items.a1") },
    { q: t("faq.items.q2"), a: t("faq.items.a2") },
    { q: t("faq.items.q3"), a: t("faq.items.a3") },
    { q: t("faq.items.q4"), a: t("faq.items.a4") },
    { q: t("faq.items.q5"), a: t("faq.items.a5") },
  ];

  return (
    <section className="relative z-[1] py-28 lg:py-40 px-6 lg:px-20 border-t border-[var(--mk-border-rule)]">
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div className="mk-section-label mb-6">{t("faq.label")}</div>

        <h2 className="mk-section-heading mb-16">
          {t("faq.heading")}<br />
          <em>{t("faq.headingEmphasis")}</em>
        </h2>

        <div>
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease }}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Question */}
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                aria-expanded={openIdx === i}
                className="flex items-center justify-between w-full text-left gap-5 font-ui font-semibold py-6 tracking-wide transition-colors"
                style={{
                  fontSize: "clamp(14px, 1.5vw, 15px)",
                  color: openIdx === i ? "var(--mk-text-primary)" : "rgba(244,240,232,0.65)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span>{faq.q}</span>
                <span
                  aria-hidden="true"
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 24,
                    height: 24,
                    border: `1px solid ${openIdx === i ? "var(--mk-accent)" : "rgba(255,255,255,0.12)"}`,
                    fontSize: 12,
                    color: openIdx === i ? "var(--mk-accent)" : "rgba(244,240,232,0.35)",
                    transition: "transform 0.3s, border-color 0.2s, color 0.2s",
                    transform: openIdx === i ? "rotate(45deg)" : "none",
                  }}
                >
                  +
                </span>
              </button>

              {/* Answer */}
              <div
                style={{
                  maxHeight: openIdx === i ? 300 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.4s ease, padding 0.3s ease",
                  paddingBottom: openIdx === i ? 24 : 0,
                  fontSize: 14,
                  lineHeight: 1.9,
                  color: "rgba(244,240,232,0.55)",
                }}
              >
                {faq.a}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
