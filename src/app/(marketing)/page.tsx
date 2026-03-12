"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { HeroSection } from "@/components/marketing/HeroSection";
import { BentoGrid } from "@/components/marketing/BentoGrid";
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

      {/* 3. SCROLL FEATURES (6-step explainer) */}
      <ScrollFeatures />

      {/* 4. HOW IT WORKS (3-step) */}
      <HowItWorks />

      {/* 5. PROJECTS SHOWCASE (slideshow) */}
      <ProjectsShowcase />

      {/* 6. COUNTERS (4 animated stats) */}
      <CountersSection />

      {/* 7. FEATURES GRID (BentoGrid) */}
      <BentoGrid />

      {/* 8. TESTIMONIALS */}
      <Testimonials />

      {/* 9. COMPARISON TABLE */}
      <ComparisonStrip />

      {/* 10. PRICING */}
      <PricingSection />

      {/* 11. FAQ */}
      <FAQSection />

      {/* 12. CTA SECTION */}
      <section className="relative z-[1] py-36 lg:py-40 px-6 text-center border-t border-[var(--mk-border-rule)] overflow-hidden">
        {/* Decorative building silhouette background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.04 }}>
          <svg viewBox="0 0 800 600" fill="none" width="800" height="600">
            <polygon points="200,580 200,180 400,80 400,580" fill="#f4f0e8" />
            <polygon points="400,580 400,80 600,180 600,580" fill="#d4d0c8" />
            <line x1="200" y1="180" x2="400" y2="80" stroke="#b8973a" strokeWidth="2" />
            <line x1="400" y1="80" x2="600" y2="180" stroke="#b8973a" strokeWidth="1.5" />
            <line x1="400" y1="80" x2="400" y2="580" stroke="#b8973a" strokeWidth="2.5" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={i} x1="200" y1={230 + i * 60} x2="400" y2={130 + i * 60} stroke="#b8973a" strokeWidth="0.6" />
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={`r${i}`} x1="400" y1={130 + i * 60} x2="600" y2={230 + i * 60} stroke="#b8973a" strokeWidth="0.4" />
            ))}
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
