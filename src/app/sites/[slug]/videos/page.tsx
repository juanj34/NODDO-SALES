"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SectionTransition } from "@/components/site/SectionTransition";
import { Play } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";

export default function VideosPage() {
  const proyecto = useSiteProject();
  const videos = proyecto.videos;
  const [activeVideo, setActiveVideo] = useState(0);
  const current = videos[activeVideo];

  return (
    <SectionTransition className="h-screen flex flex-col justify-center px-8 lg:px-16">
      <motion.p
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs tracking-[0.4em] text-[var(--site-primary)] mb-8 uppercase"
      >
        Videos
      </motion.p>

      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl">
        {/* Main player */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 aspect-video rounded-lg overflow-hidden bg-black"
        >
          <iframe
            src={current.url}
            className="w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={current.titulo || "Video"}
          />
        </motion.div>

        {/* Video list */}
        {videos.length > 1 && (
          <div className="lg:w-64 flex-shrink-0 space-y-3">
            {videos.map((video, idx) => (
              <motion.button
                key={video.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                onClick={() => setActiveVideo(idx)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  idx === activeVideo
                    ? "bg-white/5 border border-[var(--site-primary)]/30"
                    : "border border-transparent hover:bg-white/5"
                }`}
              >
                <div className="w-20 h-12 rounded overflow-hidden bg-white/5 flex items-center justify-center flex-shrink-0">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.titulo || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Play size={16} className="text-white/30" />
                  )}
                </div>
                <span className="text-sm text-left text-white/60">
                  {video.titulo || `Video ${idx + 1}`}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </SectionTransition>
  );
}
