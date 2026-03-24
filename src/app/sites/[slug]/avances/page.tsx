"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionTransition } from "@/components/site/SectionTransition";
import { AmbientBackground } from "@/components/site/AmbientBackground";
import { X, Play, Calendar, ChevronRight } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import type { AvanceObra } from "@/types";
import { useTranslation } from "@/i18n";
import { SiteEmptyState } from "@/components/site/SiteEmptyState";
import { useSectionVisibility } from "@/hooks/useSectionVisibility";

/* ── Helpers ── */
function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string, locale: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const month = d.toLocaleDateString(locale, { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  return `${month} ${year}`;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
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
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

/* ── Timeline Dot ── */
function TimelineDot({ isFirst }: { isFirst: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse ring for first dot */}
      {isFirst && (
        <div
          className="absolute w-8 h-8 rounded-full animate-ping"
          style={{
            backgroundColor: "rgba(var(--site-primary-rgb), 0.15)",
            animationDuration: "2.5s",
          }}
        />
      )}
      <div
        className={cn(
          "relative w-4 h-4 rounded-full border-2 z-10",
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
  const sectionVisible = useSectionVisibility("avances");
  const proyecto = useSiteProject();
  if (!sectionVisible) return null;
  const avances = (proyecto.avances_obra || [])
    .filter((a) => a.estado === "publicado")
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  const [selectedAvance, setSelectedAvance] = useState<AvanceObra | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const { t, locale } = useTranslation("site");
  const dateLocale = locale === "en" ? "en-US" : "es";

  const closeModal = useCallback(() => setSelectedAvance(null), []);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);
  useEffect(() => {
    if (!selectedAvance && !lightboxSrc) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxSrc) closeLightbox();
        else closeModal();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedAvance, lightboxSrc, closeModal, closeLightbox]);

  /** Click handler for inline images in prose content */
  const handleProseClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG" && (target as HTMLImageElement).src) {
      setLightboxSrc((target as HTMLImageElement).src);
    }
  }, []);

  const isSingle = avances.length === 1;

  return (
    <SectionTransition className="relative h-full flex flex-col">
      <AmbientBackground variant="gold" />

      {/* Scrollable content — data-lenis-prevent on a real DOM element */}
      <div
        className="relative z-10 flex-1 overflow-y-auto overflow-x-clip"
        data-lenis-prevent
      >
        <div className="w-full max-w-5xl mx-auto px-6 lg:px-12 py-12 pb-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-14 text-center"
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
              /* ── Single avance: centered hero card ── */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="max-w-2xl mx-auto"
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
                {/* Central line (desktop) */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[rgba(var(--site-primary-rgb),0.4)] via-[rgba(var(--site-primary-rgb),0.15)] to-transparent hidden md:block" />
                {/* Left line (mobile) */}
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-[rgba(var(--site-primary-rgb),0.4)] via-[rgba(var(--site-primary-rgb),0.15)] to-transparent md:hidden" />

                <div className="space-y-10 md:space-y-16">
                  {avances.map((avance, index) => (
                    <motion.div
                      key={avance.id}
                      variants={cardVariant}
                      className={cn(
                        "relative flex items-start gap-4 md:gap-0",
                        index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                      )}
                    >
                      {/* Mobile dot */}
                      <div className="md:hidden flex-shrink-0 mt-3">
                        <TimelineDot isFirst={index === 0} />
                      </div>

                      {/* Card side */}
                      <div className={cn("flex-1 md:w-[calc(50%-2rem)]", index % 2 === 0 ? "md:pr-12" : "md:pl-12")}>
                        <TimelineCard
                          avance={avance}
                          onClick={() => setSelectedAvance(avance)}
                          dateLocale={dateLocale}
                          t={t}
                        />
                      </div>

                      {/* Desktop center dot */}
                      <div className="hidden md:flex items-start justify-center w-10 flex-shrink-0 pt-8">
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
            <SiteEmptyState
              variant="avances"
              title={t("avances.notAvailable")}
              description={t("avances.notConfigured")}
              compact
            />
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedAvance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-6"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(to bottom, var(--surface-1), var(--surface-0))",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
              }}
            >
              {/* Modal header */}
              <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
                <div className="flex-1 min-w-0 pr-4">
                  <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-[var(--site-primary)] mb-2">
                    <Calendar size={10} />
                    {formatDate(selectedAvance.fecha, dateLocale)}
                  </span>
                  <h3 className="text-xl font-site-heading font-light tracking-wide text-white leading-tight">
                    {selectedAvance.titulo}
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white/5 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal body — scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6 space-y-6" data-lenis-prevent>
                {/* Video */}
                {selectedAvance.video_url && (() => {
                  const embedUrl = getYouTubeEmbedUrl(selectedAvance.video_url);
                  return embedUrl ? (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black/50 border border-[var(--border-subtle)]">
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
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-[var(--border-subtle)]">
                    <Image
                      src={selectedAvance.imagen_url}
                      alt={selectedAvance.titulo}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                {selectedAvance.descripcion && (
                  <div
                    onClick={handleProseClick}
                    className="text-sm text-[var(--text-secondary)] leading-[1.85] prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedAvance.descripcion) }}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Image Lightbox ── */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={lightboxSrc}
              alt=""
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionTransition>
  );
}

/* ── Timeline Card (polished, detail-rich) ── */
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
  const hasMedia = !!(avance.imagen_url || avance.video_url);
  const thumbnailUrl = avance.imagen_url || (avance.video_url ? getYouTubeThumbnail(avance.video_url) : null);

  return (
    <motion.button
      whileHover={{ scale: 1.015, y: -3 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="w-full text-left group cursor-pointer relative overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(var(--site-primary-rgb),0.06)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Image/Video hero area */}
      {hasMedia && thumbnailUrl && (
        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--surface-2)]">
          <Image
            src={thumbnailUrl}
            alt={avance.titulo}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

          {/* Video play badge */}
          {avance.video_url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[var(--site-primary)]/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Play size={18} className="text-black ml-0.5" fill="currentColor" />
              </div>
            </div>
          )}

          {/* Date badge overlaid on image */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-white/90 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <Calendar size={10} />
              {formatDateShort(avance.fecha, dateLocale)}
            </span>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="relative z-10 p-5">
        {/* Date badge (when no media) */}
        {!hasMedia && (
          <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.10)] px-3 py-1.5 rounded-full mb-3">
            <Calendar size={10} />
            {formatDateShort(avance.fecha, dateLocale)}
          </span>
        )}

        <h3 className="text-[15px] font-medium tracking-wide text-white mb-2 group-hover:text-[var(--site-primary)] transition-colors duration-300 leading-snug">
          {avance.titulo}
        </h3>

        {avance.descripcion && (
          <p className="text-xs text-[var(--text-tertiary)] line-clamp-3 leading-[1.8] mb-3">
            {avance.descripcion.replace(/<[^>]*>/g, "").slice(0, 200)}
          </p>
        )}

        {/* "Ver detalles" CTA */}
        <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-[var(--site-primary)] opacity-60 group-hover:opacity-100 transition-opacity duration-300">
          {t("avances.viewDetails") || "Ver detalles"}
          <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </motion.button>
  );
}

/* ── Single Avance Card (centered hero) ── */
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
  const thumbnailUrl = avance.imagen_url || (avance.video_url ? getYouTubeThumbnail(avance.video_url) : null);

  return (
    <motion.button
      whileHover={{ scale: 1.01, y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="w-full text-left group cursor-pointer relative overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(var(--site-primary-rgb),0.06)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Hero image */}
      {thumbnailUrl && (
        <div className="relative aspect-video overflow-hidden bg-[var(--surface-2)]">
          <Image
            src={thumbnailUrl}
            alt={avance.titulo}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

          {avance.video_url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[var(--site-primary)]/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Play size={22} className="text-black ml-0.5" fill="currentColor" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6">
        <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.10)] px-3 py-1.5 rounded-full mb-4">
          <Calendar size={11} />
          {formatDate(avance.fecha, dateLocale)}
        </span>

        <h3 className="text-xl font-site-heading font-light tracking-wide text-white mb-3 group-hover:text-[var(--site-primary)] transition-colors duration-300 leading-snug">
          {avance.titulo}
        </h3>

        {avance.descripcion && (
          <p className="text-sm text-[var(--text-tertiary)] line-clamp-4 leading-[1.8] mb-4">
            {avance.descripcion.replace(/<[^>]*>/g, "").slice(0, 300)}
          </p>
        )}

        <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-[var(--site-primary)] opacity-60 group-hover:opacity-100 transition-opacity duration-300">
          {t("avances.viewDetails") || "Ver detalles"}
          <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </motion.button>
  );
}