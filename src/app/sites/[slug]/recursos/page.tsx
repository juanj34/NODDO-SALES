"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionTransition } from "@/components/site/SectionTransition";
import { AmbientBackground } from "@/components/site/AmbientBackground";
import {
  FileText,
  Download,
  X,
  BookOpen,
  ClipboardList,
  DollarSign,
  File,
} from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import { cn } from "@/lib/utils";
import type { Recurso } from "@/types";
import { useTranslation } from "@/i18n";

const tipoIcons: Record<
  Recurso["tipo"],
  { icon: typeof FileText; gradient: string }
> = {
  brochure: { icon: BookOpen, gradient: "from-amber-500/20 to-amber-700/5" },
  acabados: { icon: ClipboardList, gradient: "from-emerald-500/20 to-emerald-700/5" },
  ficha_tecnica: { icon: FileText, gradient: "from-blue-500/20 to-blue-700/5" },
  precios: { icon: DollarSign, gradient: "from-purple-500/20 to-purple-700/5" },
  otro: { icon: File, gradient: "from-gray-500/20 to-gray-700/5" },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const tipoLabelKeys: Record<Recurso["tipo"], string> = {
  brochure: "recursos.tipoBrochure",
  acabados: "recursos.tipoAcabados",
  ficha_tecnica: "recursos.tipoFichaTecnica",
  precios: "recursos.tipoPrecios",
  otro: "recursos.tipoDocumento",
};

export default function RecursosPage() {
  const proyecto = useSiteProject();
  const recursos = proyecto.recursos || [];
  const [viewingRecurso, setViewingRecurso] = useState<Recurso | null>(null);
  const { t } = useTranslation("site");

  const closeViewer = useCallback(() => setViewingRecurso(null), []);
  useEffect(() => {
    if (!viewingRecurso) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewingRecurso, closeViewer]);

  return (
    <SectionTransition className="relative min-h-screen flex flex-col items-center justify-center px-6 lg:px-12 py-12 overflow-hidden">
      <AmbientBackground variant="gold" />

      <div className="relative z-10 w-full max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-[rgba(var(--site-primary-rgb),0.10)] border border-[rgba(var(--site-primary-rgb),0.20)] flex items-center justify-center mx-auto mb-5"
          >
            <FileText size={24} className="text-[var(--site-primary)]" />
          </motion.div>
          <h1 className="text-3xl font-site-heading text-white tracking-wide mb-3">
            {t("recursos.heading")}
          </h1>
          <p className="text-[var(--text-tertiary)] text-sm max-w-md mx-auto leading-relaxed">
            {t("recursos.description", { name: proyecto.nombre })}
          </p>
        </motion.div>

        {/* Cards grid */}
        {recursos.length > 0 ? (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {recursos.map((recurso) => {
              const iconConfig = tipoIcons[recurso.tipo];
              const Icon = iconConfig.icon;

              return (
                <motion.button
                  key={recurso.id}
                  variants={cardVariant}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setViewingRecurso(recurso)}
                  className="glass-card p-6 text-left group cursor-pointer relative overflow-hidden"
                >
                  {/* Gradient accent */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                      iconConfig.gradient
                    )}
                  />

                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-[var(--border-default)] flex items-center justify-center mb-4 group-hover:border-[rgba(var(--site-primary-rgb),0.30)] transition-colors">
                      <Icon
                        size={22}
                        className="text-[var(--site-primary)]"
                      />
                    </div>

                    <span className="inline-block text-[10px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] bg-white/5 px-2 py-0.5 rounded-full mb-3">
                      {t(tipoLabelKeys[recurso.tipo])}
                    </span>

                    <h3 className="text-sm font-medium tracking-wider text-white mb-2">
                      {recurso.nombre}
                    </h3>

                    {recurso.descripcion && (
                      <p className="text-[var(--text-tertiary)] text-xs leading-relaxed line-clamp-2">
                        {recurso.descripcion}
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <Download size={28} className="text-[var(--text-muted)]" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-site-heading text-[var(--text-secondary)] mb-1">
                {t("recursos.notAvailable")}
              </h2>
              <p className="text-sm text-[var(--text-tertiary)]">
                {t("recursos.notConfigured")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {viewingRecurso && (
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
              onClick={() => setViewingRecurso(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-4xl h-[85vh] flex flex-col glass-card overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon =
                      tipoIcons[viewingRecurso.tipo].icon;
                    return (
                      <Icon
                        size={18}
                        className="text-[var(--site-primary)]"
                      />
                    );
                  })()}
                  <div>
                    <h3 className="text-sm font-medium tracking-wider">
                      {viewingRecurso.nombre}
                    </h3>
                    <span className="text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase">
                      {t(tipoLabelKeys[viewingRecurso.tipo])}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={viewingRecurso.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline-warm inline-flex items-center gap-2 px-4 py-2 text-xs tracking-[0.15em]"
                  >
                    <Download size={14} />
                    {t("recursos.download")}
                  </a>
                  <button
                    onClick={() => setViewingRecurso(null)}
                    className="w-9 h-9 flex items-center justify-center glass rounded-full text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* PDF viewer */}
              <div className="flex-1 bg-black/40">
                <iframe
                  src={viewingRecurso.url}
                  className="w-full h-full border-0"
                  title={viewingRecurso.nombre}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionTransition>
  );
}
