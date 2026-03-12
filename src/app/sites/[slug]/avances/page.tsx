"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionTransition } from "@/components/site/SectionTransition";
import { AmbientBackground } from "@/components/site/AmbientBackground";
import { X, Play, Calendar } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import { cn } from "@/lib/utils";
import type { AvanceObra } from "@/types";
import { useTranslation } from "@/i18n";

/* ── Helpers ── */
function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string, locale: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString(locale, {
    month: "short",
    year: "numeric",
  });
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

/* ── SVG Icons ── */
function IconAvancesHeader({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-6 h-6", className)}>
      <path d="M12 2v20" />
      <circle cx="12" cy="6" r="2" fill="rgba(var(--site-primary-rgb),0.3)" stroke="currentColor" />
      <circle cx="12" cy="12" r="2" fill="rgba(var(--site-primary-rgb),0.3)" stroke="currentColor" />
      <circle cx="12" cy="18" r="2" fill="rgba(var(--site-primary-rgb),0.3)" stroke="currentColor" />
      <line x1="14.5" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="9.5" y2="12" />
      <line x1="14.5" y1="18" x2="20" y2="18" />
    </svg>
  );
}

/* ── Animations ── */
const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

/* ── Timeline Dot ── */
function TimelineDot({ isFirst }: { isFirst: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <div
        className={cn(
          "w-4 h-4 rounded-full border-2 z-10",
          isFirst
            ? "bg-[var(--site-primary)] border-[var(--site-primary)]"
            : "bg-[var(--surface-2)] border-[rgba(var(--site-primary-rgb),0.4)]"
        )}
        style={
          isFirst
            ? { boxShadow: "0 0 12px rgba(var(--site-primary-rgb), 0.5), 0 0 24px rgba(var(--site-primary-rgb), 0.2)" }
            : undefined
        }
      />
    </div>
  );
}

/* ── Main Page ── */
export default function AvancesPage() {
  const proyecto = useSiteProject();
  const avances = (proyecto.avances_obra || []).sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
  const [selectedAvance, setSelectedAvance] = useState<AvanceObra | null>(null);
  const { t, locale } = useTranslation("site");
  const dateLocale = locale === "en" ? "en-US" : "es";

  const closeModal = useCallback(() => setSelectedAvance(null), []);
  useEffect(() => {
    if (!selectedAvance) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedAvance, closeModal]);

  const isSingle = avances.length === 1;

  return (
    <SectionTransition className="relative min-h-screen flex flex-col items-center px-6 lg:px-12 py-12 overflow-hidden">
      <AmbientBackground variant="gold" />

      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-[rgba(var(--site-primary-rgb),0.10)] border border-[rgba(var(--site-primary-rgb),0.20)] flex items-center justify-center mx-auto mb-5"
          >
            <IconAvancesHeader className="text-[var(--site-primary)]" />
          </motion.div>
          <h1 className="text-3xl font-site-heading text-white tracking-wide mb-3">
            {t("avances.heading")}
          </h1>
          <p className="text-[var(--text-tertiary)] text-sm max-w-md mx-auto leading-relaxed">
            {t("avances.subtitle")}
          </p>
        </motion.div>

        {/* Timeline */}
        {avances.length > 0 ? (
          isSingle ? (
            /* ── Single avance: centered card ── */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-lg mx-auto"
            >
              <SingleAvanceCard
                avance={avances[0]}
                onClick={() => setSelectedAvance(avances[0])}
                dateLocale={dateLocale}
                t={t}
              />
            </motion.div>
          ) : (
            /* ── Timeline layout ── */
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              {/* Central line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[rgba(var(--site-primary-rgb),0.3)] via-[rgba(var(--site-primary-rgb),0.15)] to-transparent hidden md:block" />
              {/* Mobile left line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-[rgba(var(--site-primary-rgb),0.3)] via-[rgba(var(--site-primary-rgb),0.15)] to-transparent md:hidden" />

              <div className="space-y-8 md:space-y-12">
                {avances.map((avance, index) => (
                  <motion.div
                    key={avance.id}
                    variants={cardVariant}
                    className={cn(
                      "relative flex items-start gap-4 md:gap-0",
                      // Desktop: alternate sides
                      index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    )}
                  >
                    {/* Mobile dot */}
                    <div className="md:hidden flex-shrink-0 mt-2">
                      <TimelineDot isFirst={index === 0} />
                    </div>

                    {/* Card side */}
                    <div className={cn("flex-1 md:w-[calc(50%-2rem)]", index % 2 === 0 ? "md:pr-10" : "md:pl-10")}>
                      <TimelineCard
                        avance={avance}
                        onClick={() => setSelectedAvance(avance)}
                        dateLocale={dateLocale}
                        t={t}
                      />
                    </div>

                    {/* Desktop center dot */}
                    <div className="hidden md:flex items-start justify-center w-8 flex-shrink-0 pt-6">
                      <TimelineDot isFirst={index === 0} />
                    </div>

                    {/* Empty space on opposite side (desktop) */}
                    <div className="hidden md:block flex-1 md:w-[calc(50%-2rem)]" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )
        ) : (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <IconAvancesHeader className="text-[var(--text-muted)] w-7 h-7" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-site-heading text-[var(--text-secondary)] mb-1">
                {t("avances.notAvailable")}
              </h2>
              <p className="text-sm text-[var(--text-tertiary)]">
                {t("avances.notConfigured")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAvance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-6"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col glass-card overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
                <div>
                  <h3 className="text-base font-medium tracking-wider text-white">
                    {selectedAvance.titulo}
                  </h3>
                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] mt-0.5">
                    <Calendar size={12} />
                    {formatDate(selectedAvance.fecha, dateLocale)}
                  </span>
                </div>
                <button
                  onClick={closeModal}
                  className="w-9 h-9 flex items-center justify-center glass rounded-full text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Video */}
                {selectedAvance.video_url && (() => {
                  const embedUrl = getYouTubeEmbedUrl(selectedAvance.video_url);
                  return embedUrl ? (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black/50">
                      <iframe
                        src={embedUrl}
                        title={selectedAvance.titulo}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : null;
                })()}

                {/* Image (if no video) */}
                {!selectedAvance.video_url && selectedAvance.imagen_url && (
                  <div className="rounded-xl overflow-hidden">
                    <img
                      src={selectedAvance.imagen_url}
                      alt={selectedAvance.titulo}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                {selectedAvance.descripcion && (
                  <div
                    className="text-sm text-[var(--text-secondary)] leading-relaxed prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedAvance.descripcion }}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionTransition>
  );
}

/* ── Timeline Card ── */
function TimelineCard({
  avance,
  onClick,
  dateLocale,
  t,
}: {
  avance: AvanceObra;
  onClick: () => void;
  dateLocale: string;
  t: (key: string) => string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card p-5 text-left w-full group cursor-pointer relative overflow-hidden"
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(var(--site-primary-rgb),0.08)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* Date badge */}
        <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.10)] px-2.5 py-1 rounded-full mb-3">
          <Calendar size={10} />
          {formatDateShort(avance.fecha, dateLocale)}
        </span>

        {/* Thumbnail + title */}
        <div className="flex gap-4">
          {avance.imagen_url && (
            <div className="w-20 h-14 rounded-lg overflow-hidden bg-[var(--surface-2)] flex-shrink-0">
              <img src={avance.imagen_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium tracking-wider text-white mb-1 group-hover:text-[var(--site-primary)] transition-colors">
              {avance.titulo}
            </h3>
            {avance.descripcion && (
              <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 leading-relaxed">
                {avance.descripcion.replace(/<[^>]*>/g, "").slice(0, 150)}
              </p>
            )}
          </div>
        </div>

        {/* Video badge */}
        {avance.video_url && (
          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[var(--text-tertiary)]">
            <Play size={10} className="text-[var(--site-primary)]" />
            {t("avances.watchVideo")}
          </div>
        )}
      </div>
    </motion.button>
  );
}

/* ── Single Avance Card (centered, larger) ── */
function SingleAvanceCard({
  avance,
  onClick,
  dateLocale,
  t,
}: {
  avance: AvanceObra;
  onClick: () => void;
  dateLocale: string;
  t: (key: string) => string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card p-6 text-left w-full group cursor-pointer relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(var(--site-primary-rgb),0.08)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* Date */}
        <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.10)] px-3 py-1 rounded-full mb-4">
          <Calendar size={11} />
          {formatDate(avance.fecha, dateLocale)}
        </span>

        {/* Image */}
        {avance.imagen_url && (
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-[var(--surface-2)] mb-4">
            <img src={avance.imagen_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <h3 className="text-lg font-medium tracking-wider text-white mb-2 group-hover:text-[var(--site-primary)] transition-colors">
          {avance.titulo}
        </h3>

        {avance.descripcion && (
          <p className="text-sm text-[var(--text-tertiary)] line-clamp-3 leading-relaxed">
            {avance.descripcion.replace(/<[^>]*>/g, "").slice(0, 250)}
          </p>
        )}

        {avance.video_url && (
          <div className="flex items-center gap-2 mt-4 text-xs text-[var(--site-primary)]">
            <Play size={12} />
            {t("avances.watchVideo")}
          </div>
        )}
      </div>
    </motion.button>
  );
}
