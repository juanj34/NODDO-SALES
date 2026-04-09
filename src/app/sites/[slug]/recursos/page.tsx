"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { SectionTransition } from "@/components/site/SectionTransition";
import {
  FileText,
  BookOpen,
  ClipboardList,
  DollarSign,
  File,
  Loader2,
  Ruler,
  Image,
  BookMarked,
  ScrollText,
  ShieldCheck,
  Eye,
  Download,
} from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import type { Recurso } from "@/types";
import { useTranslation } from "@/i18n";
import { trackEvent } from "@/lib/tracking";
import { SiteEmptyState } from "@/components/site/SiteEmptyState";
import { useSectionVisibility } from "@/hooks/useSectionVisibility";

const PDFPresentationViewer = dynamic(
  () =>
    import("@/components/site/PDFPresentationViewer").then((mod) => ({
      default: mod.PDFPresentationViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--surface-0)]">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={32} />
      </div>
    ),
  }
);

const tipoIcons: Record<
  Recurso["tipo"],
  { icon: typeof FileText; gradient: string }
> = {
  brochure: { icon: BookOpen, gradient: "from-amber-500/20 to-amber-700/5" },
  acabados: { icon: ClipboardList, gradient: "from-emerald-500/20 to-emerald-700/5" },
  ficha_tecnica: { icon: FileText, gradient: "from-blue-500/20 to-blue-700/5" },
  precios: { icon: DollarSign, gradient: "from-purple-500/20 to-purple-700/5" },
  planos: { icon: Ruler, gradient: "from-cyan-500/20 to-cyan-700/5" },
  render: { icon: Image, gradient: "from-rose-500/20 to-rose-700/5" },
  manual: { icon: BookMarked, gradient: "from-teal-500/20 to-teal-700/5" },
  reglamento: { icon: ScrollText, gradient: "from-orange-500/20 to-orange-700/5" },
  garantias: { icon: ShieldCheck, gradient: "from-indigo-500/20 to-indigo-700/5" },
  otro: { icon: File, gradient: "from-gray-500/20 to-gray-700/5" },
};

const tipoLabelKeys: Record<Recurso["tipo"], string> = {
  brochure: "recursos.types.brochure",
  acabados: "recursos.types.acabados",
  ficha_tecnica: "recursos.types.ficha_tecnica",
  precios: "recursos.types.lista_precios",
  planos: "recursos.types.planos",
  render: "recursos.types.render",
  manual: "recursos.types.manual",
  reglamento: "recursos.types.reglamento",
  garantias: "recursos.types.garantias",
  otro: "recursos.types.otro",
};

function isPDF(url: string): boolean {
  const lower = url.toLowerCase().split("?")[0];
  return lower.endsWith(".pdf");
}

/* ── Animation variants ─────────────────────────────────── */

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.4 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

export default function RecursosPage() {
  const sectionVisible = useSectionVisibility("recursos");
  const proyecto = useSiteProject();
  const [viewingRecurso, setViewingRecurso] = useState<Recurso | null>(null);
  const { t } = useTranslation("site");

  const closeViewer = useCallback(() => setViewingRecurso(null), []);

  const handleView = useCallback((recurso: Recurso) => {
    if (isPDF(recurso.url)) {
      setViewingRecurso(recurso);
    }
  }, []);

  const handleDownload = useCallback(
    (recurso: Recurso) => {
      trackEvent(proyecto.id, "recurso_download", undefined, {
        recurso: recurso.nombre,
        tipo: recurso.tipo,
      });
      window.open(recurso.url, "_blank", "noopener,noreferrer");
    },
    [proyecto.id]
  );

  if (!sectionVisible) return null;

  const recursos = proyecto.recursos || [];

  return (
    <>
      <SectionTransition className="relative min-h-screen flex flex-col items-center px-6 lg:px-12 py-20 bg-[radial-gradient(ellipse_at_center,_var(--surface-1)_0%,_var(--surface-0)_70%)]">
        <div className="relative z-10 w-full max-w-4xl">
          {/* ── Header ────────────────────────────────────── */}
          <div className="mb-14">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="block font-ui text-[11px] font-bold tracking-[0.25em] uppercase text-[var(--site-primary)] mb-4"
            >
              {t("recursos.heading")}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-site-heading text-4xl md:text-5xl font-light text-[var(--text-primary)] tracking-wide mb-3"
            >
              {t("recursos.description", { name: proyecto.nombre })}
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-px w-20 bg-[rgba(var(--site-primary-rgb),0.40)] origin-left mt-6"
            />
          </div>

          {/* ── Resource list ─────────────────────────────── */}
          {recursos.length > 0 ? (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4"
            >
              {recursos.map((recurso) => {
                const iconConfig = tipoIcons[recurso.tipo];
                const Icon = iconConfig.icon;
                const pdf = isPDF(recurso.url);

                return (
                  <motion.div
                    key={recurso.id}
                    variants={cardVariant}
                    whileHover={{ y: -2 }}
                    className="glass-card p-6 md:p-8 group relative overflow-hidden transition-colors duration-300 hover:border-[rgba(var(--site-primary-rgb),0.25)]"
                  >
                    {/* Gradient accent on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[rgba(var(--site-primary-rgb),0.04)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${iconConfig.gradient} border border-[var(--border-default)] flex items-center justify-center shrink-0 group-hover:border-[rgba(var(--site-primary-rgb),0.30)] transition-colors`}>
                        <Icon size={24} className="text-[var(--site-primary)]" />
                      </div>

                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <span className="inline-block font-ui text-[9px] font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)] bg-white/5 px-2.5 py-1 rounded-full mb-2">
                          {t(tipoLabelKeys[recurso.tipo])}
                        </span>
                        <h3 className="font-site-heading text-xl md:text-2xl font-light text-[var(--text-primary)] tracking-wide leading-tight">
                          {recurso.nombre}
                        </h3>
                        {recurso.descripcion && (
                          <p className="font-mono text-[13px] text-[var(--text-tertiary)] leading-relaxed mt-1.5 line-clamp-2">
                            {recurso.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 shrink-0 sm:ml-4">
                        {pdf && (
                          <button
                            onClick={() => handleView(recurso)}
                            className="btn-outline-warm flex items-center gap-2 px-5 py-2.5 text-xs font-ui font-bold tracking-[0.15em] uppercase cursor-pointer"
                          >
                            <Eye size={14} />
                            {t("recursos.view")}
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(recurso)}
                          className="btn-warm flex items-center gap-2 px-5 py-2.5 text-xs font-ui font-bold tracking-[0.15em] uppercase cursor-pointer"
                        >
                          <Download size={14} />
                          {t("recursos.download")}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <SiteEmptyState
              variant="recursos"
              title={t("recursos.notAvailable")}
              description={t("recursos.notConfigured")}
              compact
            />
          )}
        </div>
      </SectionTransition>

      {/* Fullscreen PDF Presentation Viewer */}
      {viewingRecurso && isPDF(viewingRecurso.url) && (
        <PDFPresentationViewer
          url={viewingRecurso.url}
          onClose={closeViewer}
          title={viewingRecurso.nombre}
          projectId={proyecto.id}
          trackingEvent="recurso_download"
          trackingMeta={{
            recurso: viewingRecurso.nombre,
            tipo: viewingRecurso.tipo,
          }}
        />
      )}
    </>
  );
}
