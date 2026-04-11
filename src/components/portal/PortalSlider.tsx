"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import type { PortalData } from "@/app/portal/[slug]/layout";

interface Props {
  portal: PortalData;
}

const AUTOPLAY_INTERVAL = 6000;

export function PortalSlider({ portal }: Props) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const projects = portal.projects;
  const total = projects.length;

  const goTo = useCallback(
    (index: number, dir: number) => {
      setDirection(dir);
      setCurrent(((index % total) + total) % total);
    },
    [total]
  );

  const next = useCallback(() => goTo(current + 1, 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);

  // Autoplay
  useEffect(() => {
    if (isPaused || total <= 1) return;
    timerRef.current = setInterval(next, AUTOPLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, next, total]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (total === 0) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--surface-0)]">
        <p className="font-mono text-sm text-[var(--text-secondary)]">
          No hay proyectos disponibles.
        </p>
      </div>
    );
  }

  const project = projects[current];
  const projectUrl = project.subdomain
    ? `https://${project.subdomain}.noddo.io`
    : `https://${project.slug}.noddo.io`;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-[var(--surface-0)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Portal header (floating) ────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-4 px-6 py-5 sm:px-10 sm:py-7">
        {portal.logo_url ? (
          <Image
            src={portal.logo_url}
            alt={portal.nombre}
            width={120}
            height={40}
            className="h-8 w-auto object-contain sm:h-10"
          />
        ) : (
          <h1 className="font-heading text-2xl font-light tracking-wide text-white sm:text-3xl">
            {portal.nombre}
          </h1>
        )}
        {portal.descripcion && (
          <p className="hidden font-mono text-[11px] leading-relaxed text-[var(--text-tertiary)] md:block md:max-w-sm">
            {portal.descripcion}
          </p>
        )}
      </div>

      {/* ── Slides ──────────────────────────────────────────────── */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={project.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {/* Background image */}
          {project.render_principal_url && (
            <Image
              src={project.render_principal_url}
              alt={project.nombre}
              fill
              className="object-cover"
              priority={current === 0}
              sizes="100vw"
            />
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

          {/* Project logo (top right) */}
          {project.logo_url && (
            <div className="absolute top-6 right-6 z-10 sm:top-8 sm:right-10">
              <Image
                src={project.logo_url}
                alt={`${project.nombre} logo`}
                width={80}
                height={80}
                className="h-12 w-auto object-contain opacity-60 sm:h-16"
              />
            </div>
          )}

          {/* Content */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end px-6 pb-28 sm:px-10 sm:pb-32 md:pb-36 lg:max-w-3xl lg:px-16">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 className="font-heading text-4xl font-light leading-tight text-white sm:text-5xl md:text-6xl">
                {project.nombre}
              </h2>
              {project.descripcion && (
                <p className="mt-4 max-w-lg font-mono text-sm leading-[1.8] text-[var(--text-secondary)] sm:text-[15px]">
                  {project.descripcion.length > 160
                    ? `${project.descripcion.slice(0, 160)}...`
                    : project.descripcion}
                </p>
              )}
              <a
                href={projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-warm mt-6 inline-flex items-center gap-2 px-7 py-3 font-ui text-xs font-bold uppercase tracking-[0.15em]"
              >
                Explorar proyecto
              </a>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation arrows ───────────────────────────────────── */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Proyecto anterior"
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/30 p-2.5 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/50 sm:left-6 sm:p-3"
          >
            <ChevronLeft className="h-5 w-5 text-white/70" />
          </button>
          <button
            onClick={next}
            aria-label="Proyecto siguiente"
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/30 p-2.5 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/50 sm:right-6 sm:p-3"
          >
            <ChevronRight className="h-5 w-5 text-white/70" />
          </button>
        </>
      )}

      {/* ── Dot indicators ──────────────────────────────────────── */}
      {total > 1 && (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2.5 sm:bottom-10">
          {projects.map((p, i) => (
            <button
              key={p.id}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              aria-label={`Ver ${p.nombre}`}
              className="group relative h-2.5 w-2.5 rounded-full transition-all"
            >
              <span
                className={`absolute inset-0 rounded-full transition-all duration-300 ${
                  i === current
                    ? "scale-100 bg-[var(--site-primary)]"
                    : "scale-75 bg-white/30 group-hover:scale-90 group-hover:bg-white/50"
                }`}
              />
              {i === current && (
                <motion.span
                  layoutId="portal-dot"
                  className="absolute -inset-1 rounded-full border"
                  style={{ borderColor: `rgba(var(--site-primary-rgb), 0.4)` }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Powered by NODDO ────────────────────────────────────── */}
      <div className="absolute bottom-3 right-3 z-20">
        <a
          href="https://noddo.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-black/40 px-2.5 py-1.5 opacity-40 backdrop-blur-md transition-all duration-300 hover:opacity-70"
        >
          <span className="text-[7px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            by
          </span>
          <NodDoLogo
            width={38}
            colorNod="var(--text-secondary)"
            colorDo="#b8983c"
          />
        </a>
      </div>
    </div>
  );
}
