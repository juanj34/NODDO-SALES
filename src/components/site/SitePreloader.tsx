"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface SitePreloaderProps {
  logoUrl?: string | null;
  projectName: string;
  onComplete: () => void;
}

/** Minimum display time so the animation feels intentional. */
const MIN_DISPLAY_MS = 1500;
/** Max timeout — dismiss even if hero never reports ready. */
const MAX_TIMEOUT_MS = 5000;

export function SitePreloader({ logoUrl, projectName, onComplete }: SitePreloaderProps) {
  const [phase, setPhase] = useState<"loading" | "exiting">("loading");
  const [readyAt, setReadyAt] = useState<number | null>(null);
  const mountedAt = useState(() => Date.now())[0];

  const startExit = useCallback(() => {
    if (phase !== "loading") return;
    const elapsed = Date.now() - mountedAt;
    if (elapsed < MIN_DISPLAY_MS) {
      setTimeout(() => setPhase("exiting"), MIN_DISPLAY_MS - elapsed);
    } else {
      setPhase("exiting");
    }
  }, [phase, mountedAt]);

  // Listen for hero-ready event from landing page
  useEffect(() => {
    const handler = () => setReadyAt(Date.now());
    window.addEventListener("hero-ready", handler);
    return () => window.removeEventListener("hero-ready", handler);
  }, []);

  // When hero is ready, trigger exit (respecting minimum display time)
  useEffect(() => {
    if (readyAt) startExit();
  }, [readyAt, startExit]);

  // Max timeout fallback
  useEffect(() => {
    const timer = setTimeout(startExit, MAX_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [startExit]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={phase === "exiting" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      onAnimationComplete={() => {
        if (phase === "exiting") onComplete();
      }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ backgroundColor: "var(--site-bg, #0A0A0B)" }}
    >
      {/* Subtle radial glow behind logo */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-[100px]"
        style={{ background: `radial-gradient(circle, rgba(var(--site-primary-rgb), 0.4), transparent 70%)` }}
      />

      {/* Logo / name */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10"
      >
        {logoUrl ? (
          <motion.img
            src={logoUrl}
            alt={projectName}
            className="h-20 lg:h-28 w-auto object-contain drop-shadow-2xl"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <motion.div
            className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl glass flex items-center justify-center"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="font-site-heading text-3xl lg:text-4xl text-white">
              {projectName.charAt(0)}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Loading indicator — subtle animated line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative z-10 mt-10 w-16 h-[1px] overflow-hidden rounded-full"
        style={{ backgroundColor: "rgba(var(--site-primary-rgb), 0.15)" }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 w-8 rounded-full"
          style={{ backgroundColor: "rgba(var(--site-primary-rgb), 0.6)" }}
          animate={{ x: ["-32px", "64px"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Film grain overlay */}
      <div className="bg-noise absolute inset-0 pointer-events-none mix-blend-overlay opacity-30" />
    </motion.div>
  );
}
