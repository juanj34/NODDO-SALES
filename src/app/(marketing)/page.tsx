"use client";

import { HeroSection } from "@/components/marketing/HeroSection";
import { ComparisonStrip } from "@/components/marketing/ComparisonStrip";
import { TrustBar } from "@/components/marketing/TrustBar";
import { Testimonials } from "@/components/marketing/Testimonials";
import { ScrollFeatures } from "@/components/marketing/ScrollFeatures";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ProjectsShowcase } from "@/components/marketing/ProjectsShowcase";
import { PricingSection } from "@/components/marketing/PricingSection";
import { FAQSection } from "@/components/marketing/FAQSection";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { StickyCTA } from "@/components/marketing/StickyCTA";

export default function MarketingHomePage() {
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

      {/* 5. COMPARISON TABLE — por qué cambiar */}
      <ComparisonStrip />

      {/* 6. SCROLL FEATURES (deep dive) */}
      <ScrollFeatures />

      {/* 7. PROJECTS SHOWCASE — quiénes ya lo usan */}
      <ProjectsShowcase />

      {/* 8. TESTIMONIALS — qué dicen */}
      <Testimonials />

      {/* 9. PRICING */}
      <PricingSection />

      {/* 10. FAQ */}
      <FAQSection />

      {/* 11. STICKY CTA (fixed position) */}
      <StickyCTA />
    </div>
  );
}
