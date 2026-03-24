"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ComparisonStrip } from "@/components/marketing/ComparisonStrip";
import { TrustBar } from "@/components/marketing/TrustBar";
import { Testimonials } from "@/components/marketing/Testimonials";
import { ScrollFeatures } from "@/components/marketing/ScrollFeatures";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ProjectsShowcase } from "@/components/marketing/ProjectsShowcase";
import { CountersSection } from "@/components/marketing/CountersSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { FAQSection } from "@/components/marketing/FAQSection";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { SalesImpactSection } from "@/components/marketing/SalesImpactSection";
import { StickyCTA } from "@/components/marketing/StickyCTA";
import { useBooking } from "@/components/marketing/BookingProvider";
import { useTranslation } from "@/i18n";

export default function MarketingHomePage() {
  const { openBooking } = useBooking();
  const { t } = useTranslation("marketing");
  return (
    <div className="bg-[var(--mk-bg)] min-h-screen text-[var(--mk-text-secondary)] selection:bg-[rgba(184,151,58,0.30)] selection:text-[var(--mk-text-primary)]" style={{ overflowX: "clip" }}>
      {/* 1. HERO */}
      <HeroSection />

      {/* 2. TRUST BAR */}
      <TrustBar />

      {/* 3. PROBLEM — por qué necesitas esto */}
      <ProblemSection />

      {/* 4. HOW IT WORKS — simplicidad primero */}
      <HowItWorks />

      {/* 4. COMPARISON TABLE — por qué cambiar */}
      <ComparisonStrip />

      {/* 5. SCROLL FEATURES (deep dive) */}
      <ScrollFeatures />

      {/* 6. PROJECTS SHOWCASE — quiénes ya lo usan */}
      <ProjectsShowcase />

      {/* 7. SALES IMPACT — datos que prueban el cambio */}
      <SalesImpactSection />

      {/* 8. TESTIMONIALS — qué dicen */}
      <Testimonials />

      {/* 8. COUNTERS — refuerzo cuantitativo */}
      <CountersSection />

      {/* 10. PRICING */}
      <PricingSection />

      {/* 11. FAQ */}
      <FAQSection />

      {/* 12. FINAL CTA SECTION */}
      <section className="relative z-[1] py-20 sm:py-28 lg:py-48 px-4 sm:px-6 text-center border-t border-[var(--mk-border-rule)] overflow-hidden">
        {/* Decorative skyline — wireframe blueprint style */}
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none" style={{ opacity: 0.06 }}>
          <svg viewBox="0 0 1200 500" fill="none" className="w-full max-w-5xl" style={{ marginBottom: -1 }}>
            {/* Left small building */}
            <rect x="80" y="280" width="100" height="220" stroke="#b8973a" strokeWidth="0.8" />
            {[0,1,2,3,4,5].map(i => (
              <g key={`lb${i}`}>
                <rect x="92" y={292 + i * 34} width="14" height="20" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="114" y={292 + i * 34} width="14" height="20" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="136" y={292 + i * 34} width="14" height="20" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="158" y={292 + i * 34} width="14" height="20" stroke="#b8973a" strokeWidth="0.4" />
              </g>
            ))}
            <line x1="80" y1="280" x2="130" y2="258" stroke="#b8973a" strokeWidth="0.6" />
            <line x1="180" y1="280" x2="130" y2="258" stroke="#b8973a" strokeWidth="0.6" />

            {/* Left-mid tower */}
            <rect x="220" y="160" width="120" height="340" stroke="#b8973a" strokeWidth="0.8" />
            {[0,1,2,3,4,5,6,7,8].map(i => (
              <g key={`lm${i}`}>
                <rect x="232" y={174 + i * 36} width="16" height="22" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="258" y={174 + i * 36} width="16" height="22" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="284" y={174 + i * 36} width="16" height="22" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="312" y={174 + i * 36} width="16" height="22" stroke="#b8973a" strokeWidth="0.4" />
              </g>
            ))}
            {/* Antenna */}
            <line x1="280" y1="160" x2="280" y2="130" stroke="#b8973a" strokeWidth="0.6" />
            <line x1="272" y1="145" x2="288" y2="145" stroke="#b8973a" strokeWidth="0.4" />

            {/* Center main tower (tallest) */}
            <rect x="400" y="60" width="160" height="440" stroke="#b8973a" strokeWidth="1" />
            {/* Crown detail */}
            <rect x="410" y="60" width="140" height="12" stroke="#b8973a" strokeWidth="0.5" />
            <line x1="480" y1="60" x2="480" y2="28" stroke="#b8973a" strokeWidth="0.8" />
            <line x1="472" y1="38" x2="488" y2="38" stroke="#b8973a" strokeWidth="0.5" />
            <circle cx="480" cy="24" r="3" stroke="#b8973a" strokeWidth="0.5" />
            {/* Floor lines + windows */}
            {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
              <g key={`ct${i}`}>
                <line x1="400" y1={82 + i * 35} x2="560" y2={82 + i * 35} stroke="#b8973a" strokeWidth="0.25" />
                <rect x="414" y={86 + i * 35} width="18" height="22" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="442" y={86 + i * 35} width="18" height="22" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="470" y={86 + i * 35} width="18" height="22" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="498" y={86 + i * 35} width="18" height="22" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="526" y={86 + i * 35} width="18" height="22" stroke="#b8973a" strokeWidth="0.4" />
              </g>
            ))}
            {/* Entrance */}
            <rect x="455" y="460" width="50" height="40" stroke="#b8973a" strokeWidth="0.6" rx="25" />

            {/* Right-mid building */}
            <rect x="620" y="200" width="130" height="300" stroke="#b8973a" strokeWidth="0.8" />
            {[0,1,2,3,4,5,6,7].map(i => (
              <g key={`rm${i}`}>
                <rect x="634" y={214 + i * 34} width="14" height="20" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="658" y={214 + i * 34} width="14" height="20" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="682" y={214 + i * 34} width="14" height="20" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="706" y={214 + i * 34} width="14" height="20" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="724" y={214 + i * 34} width="14" height="20" stroke="#b8973a" strokeWidth="0.4" />
              </g>
            ))}
            {/* Setback top */}
            <rect x="640" y="180" width="90" height="20" stroke="#b8973a" strokeWidth="0.5" />

            {/* Right small building */}
            <rect x="800" y="310" width="90" height="190" stroke="#b8973a" strokeWidth="0.8" />
            {[0,1,2,3,4].map(i => (
              <g key={`rb${i}`}>
                <rect x="812" y={322 + i * 34} width="12" height="20" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="832" y={322 + i * 34} width="12" height="20" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="852" y={322 + i * 34} width="12" height="20" stroke="#b8973a" strokeWidth="0.4" />
                <rect x="870" y={322 + i * 34} width="12" height="20" stroke="#b8973a" strokeWidth="0.4" />
              </g>
            ))}

            {/* Far-right thin tower */}
            <rect x="940" y="240" width="60" height="260" stroke="#b8973a" strokeWidth="0.7" />
            {[0,1,2,3,4,5,6].map(i => (
              <g key={`fr${i}`}>
                <rect x="950" y={254 + i * 34} width="10" height="20" stroke="#b8973a" strokeWidth="0.35" />
                <rect x="968" y={254 + i * 34} width="10" height="20" stroke="#b8973a" strokeWidth="0.35" />
                <rect x="982" y={254 + i * 34} width="10" height="20" stroke="#b8973a" strokeWidth="0.35" />
              </g>
            ))}
            <line x1="970" y1="240" x2="970" y2="218" stroke="#b8973a" strokeWidth="0.5" />

            {/* Ground line */}
            <line x1="40" y1="500" x2="1160" y2="500" stroke="#b8973a" strokeWidth="0.5" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 max-w-5xl mx-auto"
        >
          <h2 className="font-heading text-[clamp(32px,7vw,80px)] font-light leading-[1.1] tracking-[-0.02em] mb-6">
            {t("finalCta.headingLine1")}
            <br />
            <em className="italic text-[var(--mk-accent-light)]">
              {t("finalCta.headingEmphasis")}
            </em>
          </h2>

          <p
            className="text-[16px] leading-[1.7] mb-12 max-w-2xl mx-auto"
            style={{ color: "rgba(244, 240, 232, 0.5)" }}
          >
            {t("finalCta.description")}
            <strong style={{ color: "var(--mk-text-primary)", fontWeight: 400 }}>{t("finalCta.descriptionBold")}</strong>
          </p>

          {/* Primary CTA with extra emphasis */}
          <div className="flex flex-col items-center gap-6 mb-10">
            <div className="relative">
              {/* Extra large pulsing glow ring */}
              <div
                className="absolute inset-0 rounded-[14px]"
                style={{
                  background: "transparent",
                  boxShadow: "0 0 0 0 rgba(184,151,58,0.8)",
                  animation: "pulse-ring-large 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
              <button
                onClick={openBooking}
                className="btn-mk-primary inline-flex items-center gap-3 relative z-[1] group"
                style={{ fontSize: 13, padding: "14px 36px", fontWeight: 700, letterSpacing: "0.04em" }}
              >
                <span>{t("finalCta.bookCall")}</span>
                <ArrowRight size={16} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Trust guarantees */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-[12px]" style={{ color: "rgba(244,240,232,0.4)" }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>✓</span>
              <span>{t("finalCta.trustCall")} <strong style={{ color: "var(--mk-text-primary)", fontWeight: 500 }}>{t("finalCta.trustCallBold")}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>✓</span>
              <span>{t("finalCta.trustConfig")} <strong style={{ color: "var(--mk-text-primary)", fontWeight: 500 }}>{t("finalCta.trustConfigBold")}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>✓</span>
              <span><strong style={{ color: "var(--mk-text-primary)", fontWeight: 500 }}>{t("finalCta.trustNoCommitment")}</strong></span>
            </div>
          </div>

          {/* Social proof avatars */}
          <div className="flex items-center justify-center gap-3 mt-10 pt-10" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center" style={{ marginLeft: -4 }}>
              {[
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces",
              ].map((photoUrl, i) => (
                <div
                  key={i}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "2px solid var(--mk-bg)",
                    marginLeft: i === 0 ? 0 : -12,
                    position: "relative",
                    zIndex: 6 - i,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(184,151,58,0.2)",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={photoUrl}
                    alt=""
                    width={36}
                    height={36}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="text-left">
              <div style={{ fontSize: 12, color: "var(--mk-text-primary)", fontWeight: 500 }}>
                {t("finalCta.socialDevelopers")}
              </div>
              <div style={{ fontSize: 11, color: "rgba(244,240,232,0.4)" }}>
                {t("finalCta.socialJoined")}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Animations */}
        <style jsx>{`
          @keyframes pulse-ring-large {
            0% {
              box-shadow: 0 0 0 0 rgba(184,151,58,0.8);
            }
            50% {
              box-shadow: 0 0 0 12px rgba(184,151,58,0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(184,151,58,0);
            }
          }
        `}</style>
      </section>

      {/* 13. STICKY CTA (fixed position) */}
      <StickyCTA />
    </div>
  );
}
