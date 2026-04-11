"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { PortalData } from "@/app/portal/[slug]/layout";

interface Props {
  portal: PortalData;
}

const staggerContainer: import("framer-motion").Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const cardVariant: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const headerVariant: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: -20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export function PortalGrid({ portal }: Props) {
  const projects = portal.projects;
  const count = projects.length;

  // Dynamic grid: 1 project = full width hero, 2 = two columns, 3+ = masonry-like
  const gridClass =
    count === 1
      ? "grid-cols-1"
      : count === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : count === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";

  // For single project, use taller aspect ratio
  const aspectClass = count === 1 ? "aspect-[21/9]" : "aspect-[16/10]";

  return (
    <div className="min-h-dvh bg-[var(--surface-0)]">
      {/* ── Header — minimal, cinematic ──────────────────────────── */}
      <motion.header
        variants={headerVariant}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center px-6 pt-16 pb-10 sm:pt-20 sm:pb-14 md:pt-28 md:pb-16"
      >
        {portal.logo_url ? (
          <Image
            src={portal.logo_url}
            alt={portal.nombre}
            width={220}
            height={80}
            className="h-12 w-auto object-contain sm:h-16 md:h-20"
            priority
          />
        ) : (
          <h1 className="font-heading text-5xl font-light tracking-wide text-white sm:text-6xl md:text-7xl">
            {portal.nombre}
          </h1>
        )}

        {portal.descripcion && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-5 max-w-lg text-center font-mono text-[13px] leading-[1.9] text-white/35"
          >
            {portal.descripcion}
          </motion.p>
        )}
      </motion.header>

      {/* ── Project grid — edge-to-edge, cinematic ──────────────── */}
      {projects.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <p className="font-mono text-sm text-white/30">
            No hay proyectos disponibles.
          </p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className={`grid ${gridClass} gap-[2px] sm:gap-1 px-0 sm:px-4 md:px-6 lg:px-8 pb-1`}
        >
          {projects.map((project, index) => {
            const projectUrl = project.subdomain
              ? `https://${project.subdomain}.noddo.io`
              : `https://${project.slug}.noddo.io`;

            // First project in 4+ grid gets featured size
            const isFeatured = count >= 4 && index === 0;
            const cardAspect = isFeatured
              ? "sm:col-span-2 aspect-[16/9] sm:aspect-[21/9]"
              : aspectClass;

            return (
              <motion.a
                key={project.id}
                variants={cardVariant}
                href={projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative block overflow-hidden ${cardAspect} sm:rounded-2xl bg-[var(--surface-1)]`}
                style={{ willChange: "transform" }}
              >
                {/* Background image with parallax-like zoom on hover */}
                {project.render_principal_url ? (
                  <Image
                    src={project.render_principal_url}
                    alt={project.nombre}
                    fill
                    className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.08]"
                    sizes={isFeatured ? "100vw" : "(max-width: 640px) 100vw, 50vw"}
                    priority={index < 2}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[var(--surface-2)]" />
                )}

                {/* Cinematic gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-70" />

                {/* Subtle vignette */}
                <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.3)]" />

                {/* Project logo (top-right, subtle) */}
                {project.logo_url && (
                  <div className="absolute top-5 right-5 z-10 sm:top-6 sm:right-6">
                    <Image
                      src={project.logo_url}
                      alt=""
                      width={60}
                      height={60}
                      className="h-8 w-auto object-contain opacity-30 transition-opacity duration-500 group-hover:opacity-60 sm:h-10"
                    />
                  </div>
                )}

                {/* Content at bottom */}
                <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7 md:p-8">
                  {/* Project name only — no subheader */}
                  <h2
                    className={`font-heading font-light text-white leading-[1.1] tracking-wide ${
                      isFeatured
                        ? "text-3xl sm:text-4xl md:text-5xl"
                        : "text-2xl sm:text-3xl"
                    }`}
                  >
                    {project.nombre}
                  </h2>

                  {/* Explore CTA — appears on hover */}
                  <div className="mt-3 flex items-center gap-2 opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                    <span className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--site-primary)]">
                      Explorar
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[var(--site-primary)] transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Gold accent line */}
                  <div
                    className="mt-4 h-[1px] w-0 transition-all duration-700 group-hover:w-16"
                    style={{ background: `rgba(var(--site-primary-rgb), 0.5)` }}
                  />
                </div>
              </motion.a>
            );
          })}
        </motion.div>
      )}

      {/* Footer spacing for NoddoBadge (rendered by layout) */}
      <div className="h-16" />
    </div>
  );
}
