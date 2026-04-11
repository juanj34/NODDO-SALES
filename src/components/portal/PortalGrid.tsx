"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import type { PortalData } from "@/app/portal/[slug]/layout";

interface Props {
  portal: PortalData;
}

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const cardVariant: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export function PortalGrid({ portal }: Props) {
  const projects = portal.projects;

  return (
    <div className="min-h-dvh bg-[var(--surface-0)]">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex flex-col items-center gap-4 px-6 pb-8 pt-12 sm:px-10 sm:pb-12 sm:pt-16 md:pt-20">
        {portal.logo_url ? (
          <Image
            src={portal.logo_url}
            alt={portal.nombre}
            width={180}
            height={60}
            className="h-10 w-auto object-contain sm:h-14"
          />
        ) : (
          <h1 className="font-heading text-4xl font-light tracking-wide text-white sm:text-5xl">
            {portal.nombre}
          </h1>
        )}
        {portal.descripcion && (
          <p className="max-w-xl text-center font-mono text-sm leading-[1.8] text-[var(--text-secondary)]">
            {portal.descripcion}
          </p>
        )}
        {/* Accent line */}
        <div className="mt-2 h-px w-16 bg-[var(--site-primary)] opacity-50" />
      </header>

      {/* ── Project grid ────────────────────────────────────────── */}
      {projects.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <p className="font-mono text-sm text-[var(--text-secondary)]">
            No hay proyectos disponibles.
          </p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mx-auto grid max-w-6xl gap-5 px-5 pb-20 sm:grid-cols-2 sm:px-8 md:gap-6 lg:px-12"
        >
          {projects.map((project) => {
            const projectUrl = project.subdomain
              ? `https://${project.subdomain}.noddo.io`
              : `https://${project.slug}.noddo.io`;

            return (
              <motion.a
                key={project.id}
                variants={cardVariant}
                href={projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-[16/10] overflow-hidden rounded-[1.25rem] border border-[var(--border-subtle)] bg-[var(--surface-1)] transition-all duration-500 hover:border-[var(--border-default)] hover:shadow-[var(--glow-md)]"
                style={{ willChange: "transform" }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Background image */}
                {project.render_principal_url ? (
                  <Image
                    src={project.render_principal_url}
                    alt={project.nombre}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[var(--surface-2)]" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Plan badge (top-left corner) */}
                <div className="absolute top-4 left-4 z-10">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-lg font-ui text-[9px] font-bold uppercase tracking-[0.15em] backdrop-blur-md border ${
                      project.plan === "pro"
                        ? "text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.25)]"
                        : "text-white/50 bg-black/30 border-white/10"
                    }`}
                  >
                    {project.plan === "pro" ? "Pro" : "Básico"}
                  </span>
                </div>

                {/* Project logo (top-right corner) */}
                {project.logo_url && (
                  <div className="absolute top-4 right-4 z-10">
                    <Image
                      src={project.logo_url}
                      alt={`${project.nombre} logo`}
                      width={48}
                      height={48}
                      className="h-8 w-auto object-contain opacity-50 transition-opacity duration-300 group-hover:opacity-80"
                    />
                  </div>
                )}

                {/* Glass content at bottom */}
                <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-5 sm:p-6">
                  {project.tipo_proyecto && (
                    <span className="self-start font-ui text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--site-primary)]">
                      {project.tipo_proyecto}
                    </span>
                  )}
                  <h2 className="font-heading text-2xl font-light text-white sm:text-3xl">
                    {project.nombre}
                  </h2>
                  {project.descripcion && (
                    <p className="line-clamp-2 max-w-md font-mono text-xs leading-[1.8] text-[var(--text-secondary)]">
                      {project.descripcion}
                    </p>
                  )}
                  <span className="mt-1 inline-flex items-center gap-1.5 self-start font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--site-primary)] transition-all duration-300 group-hover:gap-2.5">
                    Explorar
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </motion.a>
            );
          })}
        </motion.div>
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="flex flex-col items-center gap-4 border-t border-[var(--border-subtle)] px-6 py-8">
        <a
          href="https://noddo.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-black/30 px-3 py-1.5 opacity-50 backdrop-blur-md transition-all duration-300 hover:opacity-80"
        >
          <span className="text-[7px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            Powered by
          </span>
          <NodDoLogo
            width={42}
            colorNod="var(--text-secondary)"
            colorDo="#b8983c"
          />
        </a>
      </footer>
    </div>
  );
}
