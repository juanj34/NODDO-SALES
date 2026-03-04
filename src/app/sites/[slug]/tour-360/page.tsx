"use client";

import { motion } from "framer-motion";
import { SectionTransition } from "@/components/site/SectionTransition";
import { Globe } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";

export default function Tour360Page() {
  const proyecto = useSiteProject();

  return (
    <SectionTransition className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-8 lg:px-16 pt-8">
        <p className="text-xs tracking-[0.4em] text-[var(--site-primary)] mb-2 uppercase">
          Tour 360°
        </p>
      </div>

      {/* Tour embed */}
      <div className="flex-1 px-4 pb-12">
        {proyecto.tour_360_url ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full h-full rounded-lg overflow-hidden border border-white/10"
          >
            <iframe
              src={proyecto.tour_360_url}
              className="w-full h-full border-0"
              allowFullScreen
              title="Tour Virtual 360°"
            />
          </motion.div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
            <Globe size={48} className="mb-4" />
            <p>Tour virtual no disponible</p>
          </div>
        )}
      </div>
    </SectionTransition>
  );
}
