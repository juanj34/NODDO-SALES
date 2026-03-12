"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HeroSection } from "@/components/marketing/HeroSection";
import { BentoGrid } from "@/components/marketing/BentoGrid";
import { ComparisonStrip } from "@/components/marketing/ComparisonStrip";
import { TrustBar } from "@/components/marketing/TrustBar";
import { Testimonials } from "@/components/marketing/Testimonials";

export default function MarketingHomePage() {
  return (
    <div className="bg-[var(--mk-bg)] min-h-screen text-[var(--mk-text-secondary)] overflow-hidden selection:bg-[rgba(184,151,58,0.30)] selection:text-[var(--mk-text-primary)]">
      {/* 1. HERO */}
      <HeroSection />

      {/* 2. TRUST BAR */}
      <TrustBar />

      {/* 3. FEATURES GRID */}
      <BentoGrid />

      {/* 4. COMPARISON STRIP */}
      <ComparisonStrip />

      {/* 5. TESTIMONIALS */}
      <Testimonials />

      {/* 6. CTA SECTION */}
      <section className="relative z-[1] py-36 lg:py-40 px-6 text-center border-t border-[var(--mk-border-rule)]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
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
            className="text-[14px] mb-12 tracking-[0.05em]"
            style={{ color: "rgba(244, 240, 232, 0.4)" }}
          >
            Sin agencia. Sin código. Sin esperar.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="mailto:hola@noddo.co"
              className="btn-mk-primary text-xs py-4 px-10"
            >
              Agendar Demo
            </Link>
            <Link
              href="/sites/alto-de-yeguas"
              className="btn-mk-outline text-xs py-4 px-10"
            >
              Demo en Vivo
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
