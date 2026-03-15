"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Calendar,
  Clock,
  Play,
  MessageCircle,
  ArrowRight,
  Quote,
} from "lucide-react";
import {
  PRE_CALL_VIDEO,
  BREAKOUT_VIDEOS,
  SHOW_RATE_TESTIMONIALS,
  DEMO_DURATION_MINUTES,
} from "@/lib/show-rate-content";
import {
  MONTH_NAMES_ES,
  LONG_DAY_NAMES_ES,
} from "@/lib/booking-constants";

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  const dayName = LONG_DAY_NAMES_ES[d.getDay()];
  const day = d.getDate();
  const month = MONTH_NAMES_ES[d.getMonth()].toLowerCase();
  return `${dayName}, ${day} de ${month}`;
}

function buildGoogleCalendarUrl(
  name: string,
  date: string,
  time: string,
): string {
  // Build start/end datetime for Google Calendar
  const [h, m] = time.split(":").map(Number);
  const start = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  const end = new Date(start.getTime() + DEMO_DURATION_MINUTES * 60 * 1000);

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Demo NODDO — ${name}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details:
      "Demo personalizada de NODDO — Sala de Ventas Digital para Constructoras.\n\nTe enviaremos el link de videollamada por email.",
    location: "Videollamada",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─── Animation variants ─────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

// ─── Main Page Content ──────────────────────────────────────────────

function DemoConfirmadaContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const firstName = name.split(" ")[0];

  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const visibleBreakouts = BREAKOUT_VIDEOS.filter(
    (v) => v.videoUrl || v.description,
  );

  // Track page visit
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", "ThankYouPageViewed");
    }
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* ─── Confirmation Banner ──────────────────────────────── */}
      <motion.section
        className="max-w-2xl mx-auto px-6 mb-20"
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center text-center"
        >
          {/* Success check */}
          <div className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center mb-6">
            <Check className="w-8 h-8 text-green-400" />
          </div>

          <h1
            className="text-4xl md:text-5xl font-light mb-3"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            {firstName
              ? `${firstName}, tu demo está confirmada`
              : "Tu demo está confirmada"}
          </h1>

          {date && time && (
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm" style={{ fontFamily: "var(--font-dm-mono)", color: "rgba(244,240,232,0.55)" }}>
                <Calendar className="w-4 h-4 text-[var(--mk-accent)]" />
                <span className="capitalize">{formatDateLong(date)}</span>
              </div>
              <span style={{ color: "rgba(244,240,232,0.18)" }}>·</span>
              <div className="flex items-center gap-2 text-sm" style={{ fontFamily: "var(--font-dm-mono)", color: "rgba(244,240,232,0.55)" }}>
                <Clock className="w-4 h-4 text-[var(--mk-accent)]" />
                <span>{time}</span>
              </div>
            </div>
          )}

          {/* Calendar + WhatsApp CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
            {date && time && name && (
              <a
                href={buildGoogleCalendarUrl(name, date, time)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--mk-accent)] text-[#141414] text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                <Calendar className="w-4 h-4" />
                Agregar a Google Calendar
              </a>
            )}
            <a
              href="https://wa.me/971585407848?text=Hola,%20acabo%20de%20agendar%20mi%20demo%20de%20NODDO"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[rgba(184,151,58,0.3)] text-[var(--mk-accent)] text-xs font-bold uppercase tracking-wider hover:bg-[rgba(184,151,58,0.08)] transition-all"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              <MessageCircle className="w-4 h-4" />
              Escríbenos por WhatsApp
            </a>
          </div>
        </motion.div>
      </motion.section>

      {/* ─── Pre-Call Video ────────────────────────────────────── */}
      {(PRE_CALL_VIDEO.url || PRE_CALL_VIDEO.description) && (
        <motion.section
          className="max-w-3xl mx-auto px-6 mb-24"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--mk-accent)] mb-4 text-center"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Mientras esperas
            </p>
            <h2
              className="text-3xl md:text-4xl font-light text-center mb-3"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              {PRE_CALL_VIDEO.title}
            </h2>
            <p
              className="text-sm text-center max-w-lg mx-auto mb-8"
              style={{
                fontFamily: "var(--font-dm-mono)",
                color: "rgba(244,240,232,0.55)",
                lineHeight: "1.8",
              }}
            >
              {PRE_CALL_VIDEO.description}
            </p>

            {PRE_CALL_VIDEO.url ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(184,151,58,0.08)]">
                <iframe
                  src={PRE_CALL_VIDEO.url}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={PRE_CALL_VIDEO.title}
                />
              </div>
            ) : (
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#1a1a1a] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[rgba(184,151,58,0.15)] border border-[rgba(184,151,58,0.3)] flex items-center justify-center mx-auto mb-4">
                    <Play className="w-7 h-7 text-[var(--mk-accent)] ml-1" />
                  </div>
                  <p
                    className="text-xs uppercase tracking-[0.15em] font-bold"
                    style={{
                      fontFamily: "var(--font-syne)",
                      color: "rgba(244,240,232,0.35)",
                    }}
                  >
                    Video próximamente
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.section>
      )}

      {/* ─── Breakout Videos (FAQ) ─────────────────────────────── */}
      {visibleBreakouts.length > 0 && (
        <motion.section
          className="max-w-4xl mx-auto px-6 mb-24"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--mk-accent)] mb-4 text-center"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Preguntas frecuentes
            </p>
            <h2
              className="text-3xl md:text-4xl font-light text-center mb-4"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              Lo que otros directores nos preguntan antes de la demo
            </h2>
            <p
              className="text-sm text-center max-w-lg mx-auto mb-12"
              style={{
                fontFamily: "var(--font-dm-mono)",
                color: "rgba(244,240,232,0.55)",
                lineHeight: "1.8",
              }}
            >
              Respuestas cortas a las dudas más comunes. Así llegas con todo
              claro a tu llamada.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleBreakouts.map((video, i) => (
              <motion.div
                key={video.id}
                variants={fadeUp}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {video.videoUrl && playingVideo !== video.id ? (
                  <button
                    onClick={() => setPlayingVideo(video.id)}
                    className="w-full text-left rounded-2xl border border-white/8 bg-[#141414] p-5 hover:border-[rgba(184,151,58,0.2)] hover:bg-[#1a1a1a] transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[rgba(184,151,58,0.1)] border border-[rgba(184,151,58,0.2)] flex items-center justify-center shrink-0 group-hover:bg-[rgba(184,151,58,0.2)] transition-colors">
                        <Play className="w-4 h-4 text-[var(--mk-accent)] ml-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-light mb-1"
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            color: "rgba(244,240,232,0.92)",
                          }}
                        >
                          {video.question}
                        </p>
                        <p
                          className="text-xs"
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            color: "rgba(244,240,232,0.35)",
                          }}
                        >
                          {video.durationLabel}
                        </p>
                      </div>
                    </div>
                  </button>
                ) : playingVideo === video.id ? (
                  <div className="rounded-2xl border border-[rgba(184,151,58,0.2)] bg-[#141414] overflow-hidden">
                    <div className="aspect-video">
                      <iframe
                        src={video.videoUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={video.question}
                      />
                    </div>
                    <div className="p-4">
                      <p
                        className="text-sm font-light"
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          color: "rgba(244,240,232,0.92)",
                        }}
                      >
                        {video.question}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* No video URL — show text-only card */
                  <div className="rounded-2xl border border-white/8 bg-[#141414] p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[rgba(184,151,58,0.1)] border border-[rgba(184,151,58,0.2)] flex items-center justify-center shrink-0">
                        <ArrowRight className="w-4 h-4 text-[var(--mk-accent)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-light mb-2"
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            color: "rgba(244,240,232,0.92)",
                          }}
                        >
                          {video.question}
                        </p>
                        <p
                          className="text-xs"
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            color: "rgba(244,240,232,0.55)",
                            lineHeight: "1.7",
                          }}
                        >
                          {video.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ─── Testimonials ──────────────────────────────────────── */}
      {SHOW_RATE_TESTIMONIALS.length > 0 && (
        <motion.section
          className="max-w-4xl mx-auto px-6 mb-20"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--mk-accent)] mb-4 text-center"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Resultados reales
            </p>
            <h2
              className="text-3xl md:text-4xl font-light text-center mb-12"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              Lo que dicen nuestros clientes
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SHOW_RATE_TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="rounded-2xl border border-white/8 bg-[#141414] p-6 flex flex-col"
              >
                {/* Metric badge */}
                {t.resultMetric && (
                  <div
                    className="inline-flex self-start px-3 py-1 rounded-full border border-[rgba(184,151,58,0.25)] bg-[rgba(184,151,58,0.08)] mb-4"
                  >
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--mk-accent)]"
                      style={{ fontFamily: "var(--font-syne)" }}
                    >
                      {t.resultMetric}
                    </span>
                  </div>
                )}

                {/* Quote */}
                <Quote
                  className="w-5 h-5 mb-3"
                  style={{ color: "rgba(184,151,58,0.3)" }}
                />
                <p
                  className="text-sm font-light flex-1 mb-6"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    color: "rgba(244,240,232,0.85)",
                    lineHeight: "1.8",
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  {t.avatarUrl ? (
                    <Image src={t.avatarUrl} alt="" width={400} height={300} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[rgba(184,151,58,0.15)] border border-[rgba(184,151,58,0.2)] flex items-center justify-center">
                      <span
                        className="text-xs font-bold text-[var(--mk-accent)]"
                        style={{ fontFamily: "var(--font-syne)" }}
                      >
                        {t.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        color: "rgba(244,240,232,0.92)",
                      }}
                    >
                      {t.name}
                    </p>
                    <p
                      className="text-[10px]"
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        color: "rgba(244,240,232,0.35)",
                      }}
                    >
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

// ─── Page Export (with Suspense for useSearchParams) ─────────────────

export default function DemoConfirmadaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--mk-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DemoConfirmadaContent />
    </Suspense>
  );
}
