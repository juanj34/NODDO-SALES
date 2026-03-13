"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
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
import { StickyCTA } from "@/components/marketing/StickyCTA";
import { useBooking } from "@/components/marketing/BookingProvider";

export default function MarketingHomePage() {
  const { openBooking } = useBooking();
  return (
    <div className="bg-[var(--mk-bg)] min-h-screen text-[var(--mk-text-secondary)] selection:bg-[rgba(184,151,58,0.30)] selection:text-[var(--mk-text-primary)]" style={{ overflowX: "clip" }}>
      {/* 1. HERO */}
      <HeroSection />

      {/* 2. TRUST BAR */}
      <TrustBar />

      {/* 3. HOW IT WORKS — simplicidad primero */}
      <HowItWorks />

      {/* 4. COMPARISON TABLE — por qué cambiar */}
      <ComparisonStrip />

      {/* 5. SCROLL FEATURES (deep dive) — visitante ya motivado */}
      <ScrollFeatures />

      {/* 6. PROJECTS SHOWCASE — quiénes ya lo usan */}
      <ProjectsShowcase />

      {/* 7. TESTIMONIALS — qué dicen */}
      <Testimonials />

      {/* 8. COUNTERS — refuerzo cuantitativo */}
      <CountersSection />

      {/* 10. PRICING */}
      <PricingSection />

      {/* 11. FAQ */}
      <FAQSection />

      {/* 12. CTA SECTION */}
      <section className="relative z-[1] py-36 lg:py-40 px-6 text-center border-t border-[var(--mk-border-rule)] overflow-hidden">
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
          className="relative z-10"
        >
          <h2 className="font-heading text-[clamp(48px,6vw,96px)] font-light leading-[1.1] tracking-[-0.02em] mb-6">
            Tu edificio merece
            <br />
            mostrarse{" "}
            <em className="italic text-[var(--mk-accent-light)]">
              como lo que es.
            </em>
          </h2>
          <p
            className="text-[15px] mb-12 tracking-[0.05em]"
            style={{ color: "rgba(244, 240, 232, 0.4)" }}
          >
            Sin agencia. Sin código. Sin esperar.
          </p>
          <div className="flex gap-5 justify-center">
            <button
              onClick={openBooking}
              className="btn-mk-primary text-xs py-4 px-10 inline-flex items-center gap-2.5"
            >
              Agendar Demo
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
            <Link
              href="/sites/alto-de-yeguas"
              className="btn-mk-outline text-xs py-4 px-10 inline-flex items-center gap-2.5"
            >
              Demo en Vivo
              <ExternalLink size={13} strokeWidth={2} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* 13. STICKY CTA (fixed position) */}
      <StickyCTA />
    </div>
  );
}
