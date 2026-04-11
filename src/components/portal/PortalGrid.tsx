"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { PortalData } from "@/app/portal/[slug]/layout";

interface Props {
  portal: PortalData;
}

/**
 * PortalGrid — Cinematic fullscreen grid for constructora portals.
 *
 * Design philosophy:
 * - Images ARE the layout. No padding, no gaps, no rounded corners — edge to edge.
 * - Each project is a full-bleed panel that fills maximum viewport space.
 * - Hover reveals content with a dramatic curtain effect.
 * - Logo floats above everything, anchored to the viewport top.
 * - For 2 projects: side-by-side, each taking 50% of viewport height.
 * - For 3+: first project spans full width as hero, rest below.
 */

export function PortalGrid({ portal }: Props) {
  const projects = portal.projects;
  const count = projects.length;

  if (count === 0) {
    return (
      <div className="flex h-dvh items-center justify-center bg-black">
        <p className="font-mono text-sm text-white/30">
          No hay proyectos disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black">
      {/* ── Floating logo — anchored top center ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-30 flex justify-center pointer-events-none"
      >
        <div className="pt-6 sm:pt-8 pointer-events-auto">
          {portal.logo_url ? (
            <Image
              src={portal.logo_url}
              alt={portal.nombre}
              width={160}
              height={60}
              className="h-8 w-auto object-contain sm:h-10 md:h-12 drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]"
              priority
            />
          ) : (
            <h1 className="font-heading text-2xl font-light tracking-[0.08em] text-white sm:text-3xl drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
              {portal.nombre}
            </h1>
          )}
        </div>
      </motion.div>

      {/* ── Project panels ──────────────────────────────────────── */}
      <div
        className={
          count === 1
            ? "h-dvh"
            : count === 2
            ? "flex flex-col sm:flex-row h-dvh"
            : "flex flex-col"
        }
      >
        {projects.map((project, index) => {
          const projectUrl = project.subdomain
            ? `https://${project.subdomain}.noddo.io`
            : `https://${project.slug}.noddo.io`;

          // For 3+ projects: first is hero (full width, 60vh), rest are grid
          const isHero = count >= 3 && index === 0;
          const isGridItem = count >= 3 && index > 0;

          if (isGridItem && index === 1) {
            // Render remaining projects as grid starting from index 1
            const gridProjects = projects.slice(1);
            return (
              <div
                key="grid"
                className={`grid ${
                  gridProjects.length === 1
                    ? "grid-cols-1"
                    : gridProjects.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-3"
                }`}
                style={{ minHeight: "40vh" }}
              >
                {gridProjects.map((gp, gi) => (
                  <ProjectPanel
                    key={gp.id}
                    project={gp}
                    url={
                      gp.subdomain
                        ? `https://${gp.subdomain}.noddo.io`
                        : `https://${gp.slug}.noddo.io`
                    }
                    index={gi + 1}
                    className="aspect-[4/3] sm:aspect-auto"
                    nameSize="text-xl sm:text-2xl"
                  />
                ))}
              </div>
            );
          }

          if (isGridItem) return null; // Already rendered in the grid block above

          return (
            <ProjectPanel
              key={project.id}
              project={project}
              url={projectUrl}
              index={index}
              className={
                count === 1
                  ? "h-full"
                  : count === 2
                  ? "flex-1 min-h-[50vh]"
                  : isHero
                  ? "min-h-[60vh]"
                  : ""
              }
              nameSize={
                count === 1
                  ? "text-4xl sm:text-6xl md:text-7xl"
                  : count === 2
                  ? "text-3xl sm:text-4xl md:text-5xl"
                  : isHero
                  ? "text-3xl sm:text-5xl md:text-6xl"
                  : "text-xl sm:text-2xl"
              }
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Project Panel — each image fills its container ──────────────────── */

interface ProjectPanelProps {
  project: PortalData["projects"][number];
  url: string;
  index: number;
  className?: string;
  nameSize?: string;
}

function ProjectPanel({ project, url, index, className = "", nameSize = "text-3xl sm:text-4xl" }: ProjectPanelProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.1 + index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative block overflow-hidden ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background image */}
      {project.render_principal_url ? (
        <Image
          src={project.render_principal_url}
          alt={project.nombre}
          fill
          className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.06]"
          sizes="100vw"
          priority={index < 2}
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-900" />
      )}

      {/* Dark gradient — stronger on hover */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.08) 100%)",
          opacity: hovered ? 1 : 0.7,
        }}
      />

      {/* Thin border between panels */}
      <div className="absolute inset-0 border border-white/[0.04]" />

      {/* Project logo — top right, very subtle */}
      {project.logo_url && (
        <div className="absolute top-5 right-5 z-10 sm:top-6 sm:right-6">
          <Image
            src={project.logo_url}
            alt=""
            width={60}
            height={60}
            className="h-7 w-auto object-contain opacity-20 transition-opacity duration-500 group-hover:opacity-50 sm:h-9"
          />
        </div>
      )}

      {/* Content — bottom left */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8 md:p-10">
        {/* Gold accent line that expands on hover */}
        <motion.div
          className="h-[2px] mb-4 origin-left"
          style={{ background: `rgba(var(--site-primary-rgb), 0.6)` }}
          initial={{ width: 0 }}
          animate={{ width: hovered ? 48 : 24 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Project name */}
        <h2
          className={`font-heading font-light text-white leading-[1.05] tracking-wide ${nameSize}`}
        >
          {project.nombre}
        </h2>

        {/* CTA — slides in on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 flex items-center gap-2"
            >
              <span className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--site-primary)]">
                Explorar proyecto
              </span>
              <ArrowRight size={14} className="text-[var(--site-primary)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.a>
  );
}
