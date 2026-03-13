"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionTransition } from "@/components/site/SectionTransition";
import { AmbientBackground } from "@/components/site/AmbientBackground";
import { Play, ChevronLeft, ChevronRight, Film } from "lucide-react";
import { SiteEmptyState } from "@/components/site/SiteEmptyState";
import { useSiteProject } from "@/hooks/useSiteProject";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { trackEvent } from "@/lib/tracking";

export default function VideosPage() {
  const proyecto = useSiteProject();
  const videos = proyecto.videos;
  const { t } = useTranslation("site");

  // Empty state — no videos configured
  if (!videos || videos.length === 0) {
    return (
      <SiteEmptyState
        variant="videos"
        title={t("videos.notAvailable")}
        description={t("videos.notConfigured")}
      />
    );
  }

  const [activeVideo, setActiveVideo] = useState(0);
  const current = videos[activeVideo];
  const stripRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: "left" | "right") => {
    if (!stripRef.current) return;
    const amount = 320;
    stripRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          setActiveVideo((prev) => Math.min(prev + 1, videos.length - 1));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setActiveVideo((prev) => Math.max(prev - 1, 0));
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [videos.length]);

  return (
    <SectionTransition className="relative min-h-screen flex flex-col items-center justify-center px-6 lg:px-12 py-12 overflow-hidden">
      <AmbientBackground variant="gold" />

      <div className="relative z-10 w-full max-w-5xl">
        {/* Main player — key forces remount on video change */}
        <motion.div
          key={activeVideo}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/50 mb-5"
        >
          <iframe
            src={current.url}
            className="w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={current.titulo || "Video"}
          />
        </motion.div>

        {/* Now playing label */}
        <div className="flex items-center gap-2 mb-4">
          <Play size={12} className="text-[var(--site-primary)]" />
          <span className="text-xs text-[var(--text-secondary)] tracking-wider">
            {current.titulo || `Video ${activeVideo + 1}`}
          </span>
          <span className="text-xs text-[var(--text-muted)] ml-auto tabular-nums">
            {activeVideo + 1} / {videos.length}
          </span>
        </div>

        {/* Thumbnail strip with scroll arrows */}
        <div className="relative group/strip">
          {/* Left arrow */}
          {videos.length > 4 && (
            <button
              onClick={() => scroll("left")}
              aria-label={t("videos.prevVideos")}
              className="absolute left-0 top-0 bottom-6 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-[var(--site-bg)] to-transparent opacity-0 group-hover/strip:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronLeft size={18} className="text-white/70" />
            </button>
          )}

          <div
            ref={stripRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          >
            {videos.map((video, idx) => (
              <motion.button
                key={video.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.04 }}
                onClick={() => {
                  setActiveVideo(idx);
                  trackEvent(proyecto.id, "video_play", undefined, { video_title: video.titulo });
                }}
                className={cn(
                  "flex-shrink-0 w-40 cursor-pointer group transition-all duration-200",
                  idx === activeVideo ? "opacity-100" : "opacity-50 hover:opacity-80"
                )}
              >
                <div className={cn(
                  "relative w-full aspect-video rounded-xl overflow-hidden mb-1.5 transition-all duration-200",
                  idx === activeVideo
                    ? "ring-2 ring-[var(--site-primary)] shadow-lg shadow-[rgba(var(--site-primary-rgb),0.10)]"
                    : "ring-1 ring-[var(--border-default)] group-hover:ring-white/20"
                )}>
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.titulo || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Film size={20} className="text-[var(--text-muted)]" />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-200",
                    idx === activeVideo ? "bg-black/20" : "bg-black/40 group-hover:bg-black/25"
                  )}>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200",
                      idx === activeVideo
                        ? "bg-[var(--site-primary)] scale-110"
                        : "bg-white/20 group-hover:bg-white/30"
                    )}>
                      <Play size={12} className={idx === activeVideo ? "text-black" : "text-white"} fill="currentColor" />
                    </div>
                  </div>
                </div>
                <p className={cn(
                  "text-[11px] truncate transition-colors duration-200",
                  idx === activeVideo ? "text-white" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"
                )}>
                  {video.titulo || `Video ${idx + 1}`}
                </p>
              </motion.button>
            ))}
          </div>

          {/* Right arrow */}
          {videos.length > 4 && (
            <button
              onClick={() => scroll("right")}
              aria-label={t("videos.nextVideos")}
              className="absolute right-0 top-0 bottom-6 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-[var(--site-bg)] to-transparent opacity-0 group-hover/strip:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronRight size={18} className="text-white/70" />
            </button>
          )}
        </div>
      </div>
    </SectionTransition>
  );
}
