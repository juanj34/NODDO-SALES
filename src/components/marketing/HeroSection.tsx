"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { IsometricBuilding } from "./illustrations/IsometricBuilding";

import { useBooking } from "./BookingProvider";
import { useTranslation } from "@/i18n";

export function HeroSection() {
  const { openBooking } = useBooking();
  const { t } = useTranslation("marketing");

  const perspectives = [
    {
      id: "compradores",
      label: t("hero.perspectives.buyers.label"),
      content: (
        <>
          {t("hero.perspectives.buyers.p1")}<em className="italic text-[var(--mk-accent-light)]">{t("hero.perspectives.buyers.p1em")}</em>{t("hero.perspectives.buyers.p1end")}
          {t("hero.perspectives.buyers.p2")}<strong className="text-[var(--mk-text-primary)] font-normal">{t("hero.perspectives.buyers.p2strong")}</strong>{t("hero.perspectives.buyers.p2end")}
          {t("hero.perspectives.buyers.p3")}<strong className="text-[var(--mk-text-primary)] font-normal">{t("hero.perspectives.buyers.p3strong")}</strong>{t("hero.perspectives.buyers.p3end")}
        </>
      ),
    },
    {
      id: "comerciales",
      label: t("hero.perspectives.advisors.label"),
      content: (
        <>
          {t("hero.perspectives.advisors.p1")}<em className="italic text-[var(--mk-accent-light)]">{t("hero.perspectives.advisors.p1em")}</em>{t("hero.perspectives.advisors.p1end")}
          {t("hero.perspectives.advisors.p2")}<strong className="text-[var(--mk-text-primary)] font-normal">{t("hero.perspectives.advisors.p2strong")}</strong>{t("hero.perspectives.advisors.p2end")}
          {t("hero.perspectives.advisors.p3")}<strong className="text-[var(--mk-text-primary)] font-normal">{t("hero.perspectives.advisors.p3strong")}</strong>{t("hero.perspectives.advisors.p3end")}
        </>
      ),
    },
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % perspectives.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleTabClick = useCallback((index: number) => {
    setActiveIndex(index);
    setIsPaused(true);
    const timeout = setTimeout(() => setIsPaused(false), 10000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <section className="relative min-h-0 lg:min-h-screen grid grid-cols-1 lg:grid-cols-2 items-center px-5 sm:px-6 lg:px-24 gap-6 lg:gap-12 overflow-hidden z-[1]">
      {/* ── LEFT: Copy ── */}
      <div className="relative z-[2] pt-24 sm:pt-28 pb-6 lg:pt-28 lg:pb-0">
        {/* Label with gold line */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex items-center gap-3.5 mb-7"
        >
          <span
            className="block w-8 h-px"
            style={{ background: "var(--mk-accent)" }}
          />
          <span className="font-ui text-[10px] tracking-[0.35em] uppercase text-[var(--mk-accent)]">
            {t("hero.label")}
          </span>
        </motion.div>

        {/* Hero title — Cormorant Garamond */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="font-heading text-[clamp(32px,8vw,96px)] font-light leading-[1.05] tracking-[-0.02em] text-[var(--mk-text-primary)] mb-6 lg:mb-8"
        >
          {t("hero.titleLine1")}
          <br />
          <em className="italic text-[var(--mk-accent-light)]">{t("hero.titleEmphasis")}</em>
        </motion.h1>

        {/* Perspective tabs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: "easeOut" }}
          className="flex items-center gap-6 mb-5"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {perspectives.map((p, i) => (
            <button
              key={p.id}
              onClick={() => handleTabClick(i)}
              className="relative pb-2.5 font-ui text-[9px] tracking-[0.2em] uppercase"
              style={{
                color: i === activeIndex
                  ? "var(--mk-accent)"
                  : "rgba(244, 240, 232, 0.35)",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "color 0.3s ease",
              }}
            >
              {p.label}
              {i === activeIndex && (
                <motion.div
                  layoutId="perspective-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: "var(--mk-accent)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Animated subtitle — grid stack so tallest paragraph sets the height */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: "easeOut" }}
          className="mb-8 lg:mb-14 grid"
        >
          {perspectives.map((p, i) => (
            <motion.p
              key={p.id}
              animate={{ opacity: i === activeIndex ? 1 : 0, y: i === activeIndex ? 0 : 6 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="text-[13px] sm:text-[15px] leading-[1.75] sm:leading-[1.85] max-w-[580px]"
              style={{
                color: "rgba(244, 240, 232, 0.5)",
                gridArea: "1 / 1",
                pointerEvents: i === activeIndex ? "auto" : "none",
              }}
            >
              {p.content}
            </motion.p>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-5">
            {/* Primary CTA — book a call */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-[12px]"
                style={{
                  background: "transparent",
                  boxShadow: "0 0 0 0 rgba(184,151,58,0.7)",
                  animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
              <button
                onClick={openBooking}
                className="btn-mk-primary inline-flex items-center justify-center gap-2.5 whitespace-nowrap relative z-[1] w-full sm:w-auto"
                style={{ fontSize: 13, padding: "14px 32px" }}
              >
                {t("hero.ctaBookCall")}
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* Secondary CTA — see a live project */}
            <Link
              href="/sites/demo"
              target="_blank"
              className="btn-mk-outline inline-flex items-center justify-center gap-2.5 whitespace-nowrap w-full sm:w-auto"
              style={{ fontSize: 13, padding: "14px 28px" }}
            >
              <Play size={13} strokeWidth={2.5} fill="currentColor" />
              {t("hero.ctaViewLive")}
            </Link>
          </div>

          {/* Trust elements below CTAs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
            {/* Avatar stack */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center" style={{ marginLeft: -4 }}>
                {[
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
                ].map((photoUrl, i) => (
                  <div
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "2px solid var(--mk-bg)",
                      marginLeft: i === 0 ? 0 : -10,
                      position: "relative",
                      zIndex: 5 - i,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(184,151,58,0.2)",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src={photoUrl}
                      alt=""
                      width={28}
                      height={28}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 13, color: "rgba(244,240,232,0.5)" }}>
                <strong style={{ color: "var(--mk-text-primary)", fontWeight: 500 }}>100+</strong> {t("hero.developers")}
              </span>
            </div>

            {/* Divider — hidden on mobile */}
            <div className="hidden sm:block" style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />

            {/* Micro-copy trust elements */}
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-[12px]" style={{ color: "rgba(244,240,232,0.4)" }}>
              <div className="flex items-center gap-1.5">
                <span style={{ color: "var(--mk-accent)" }}>✓</span>
                {t("hero.trustNoCard")}
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ color: "var(--mk-accent)" }}>✓</span>
                {t("hero.trustReady24h")}
              </div>
              <div className="flex items-center gap-1.5 hidden sm:flex">
                <span style={{ color: "var(--mk-accent)" }}>✓</span>
                {t("hero.trustNoCommitment")}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pulse ring keyframes */}
        <style jsx>{`
          @keyframes pulse-ring {
            0% {
              box-shadow: 0 0 0 0 rgba(184,151,58,0.7);
            }
            50% {
              box-shadow: 0 0 0 10px rgba(184,151,58,0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(184,151,58,0);
            }
          }
        `}</style>

        {/* ── Mobile hero visual — same SVG illustrations as desktop ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.2, ease: "easeOut" }}
          className="lg:hidden mt-6 flex justify-center"
        >
          <div className="w-full max-w-[280px]">
            <IsometricBuilding />
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT: Isometric Building (desktop only) ── */}
      <div className="hidden lg:flex items-center justify-center h-screen pt-20">
        <IsometricBuilding />
      </div>

      {/* ── Scroll hint ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2, ease: "easeOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 z-[2]"
      >
        <div
          className="w-px h-10"
          style={{
            background:
              "linear-gradient(to bottom, rgba(184, 151, 58, 0.6), transparent)",
            animation: "scrollPulse 2s infinite",
          }}
        />
        <span
          className="text-[8px] tracking-[0.3em] uppercase"
          style={{ color: "rgba(244, 240, 232, 0.2)" }}
        >
          {t("hero.scroll")}
        </span>
      </motion.div>

      {/* Scroll pulse keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.6; transform: scaleY(1); }
          50% { opacity: 0.2; transform: scaleY(0.6); }
        }
      `}} />
    </section>
  );
}
