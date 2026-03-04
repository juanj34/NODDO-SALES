"use client";

import { motion } from "framer-motion";
import { SectionTransition } from "@/components/site/SectionTransition";
import { Download, FileText } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";

export default function BrochurePage() {
  const proyecto = useSiteProject();

  return (
    <SectionTransition className="h-screen flex items-center justify-center px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <FileText size={32} className="text-[var(--site-primary)]" />
        </div>

        <p className="text-xs tracking-[0.4em] text-[var(--site-primary)] mb-4 uppercase">
          Brochure
        </p>

        <h2 className="text-2xl font-light tracking-wider mb-4">
          Descarga nuestro brochure
        </h2>

        <p className="text-white/40 text-sm mb-8 leading-relaxed">
          Conoce todos los detalles del proyecto {proyecto.nombre}, tipologías,
          acabados y mucho más.
        </p>

        {proyecto.brochure_url ? (
          <div className="flex flex-col items-center gap-4">
            {/* PDF preview embed */}
            <div className="w-full max-w-md aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/10">
              <iframe
                src={proyecto.brochure_url}
                className="w-full h-full border-0"
                title="Brochure PDF"
              />
            </div>

            <a
              href={proyecto.brochure_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[var(--site-primary)] text-[var(--site-primary)] px-8 py-3 text-sm tracking-[0.2em] hover:bg-[var(--site-primary)] hover:text-black transition-all duration-300"
            >
              <Download size={16} />
              DESCARGAR PDF
            </a>
          </div>
        ) : (
          <p className="text-white/20 text-sm">
            Brochure no disponible en este momento.
          </p>
        )}
      </motion.div>
    </SectionTransition>
  );
}
