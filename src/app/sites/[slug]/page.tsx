"use client";

import { motion, useMotionValue } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MouseEvent } from "react";
import { useSiteProject, useSiteBasePath } from "@/hooks/useSiteProject";
import { useTranslation } from "@/i18n";

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.3, delayChildren: 0.8 },
  },
};

const fadeUpBlur = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
};

const slowScaleFade = {
  hidden: { opacity: 0, scale: 0.9, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }
  },
};

export default function SiteLanding() {
  const proyecto = useSiteProject();
  const basePath = useSiteBasePath();
  const { t } = useTranslation("site");

  const hasVideo = !!proyecto.hero_video_url;
  const hasImage = !!proyecto.render_principal_url;
  const hasBothLogos = !!proyecto.logo_url && !!proyecto.constructora_logo_url;

  // Mouse Parallax Effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x * 25);
    mouseY.set(y * 25);
  }

  return (
    <div className="relative h-full" onMouseMove={handleMouseMove}>
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[var(--site-bg)]">
        {hasVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster={proyecto.render_principal_url || undefined}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={proyecto.hero_video_url!} type={proyecto.hero_video_url!.endsWith(".webm") ? "video/webm" : "video/mp4"} />
          </video>
        ) : hasImage ? (
          <img
            src={proyecto.render_principal_url!}
            alt={proyecto.nombre}
            className="absolute inset-0 w-full h-full object-cover animate-[kenBurns_20s_ease-in-out_infinite_alternate]"
          />
        ) : null}

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
      </div>

      {/* Developer logo — top-right corner when both logos exist */}
      {hasBothLogos && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="absolute top-6 right-8 z-30"
        >
          {proyecto.constructora_website ? (
            <a href={proyecto.constructora_website} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
              <img
                src={proyecto.constructora_logo_url!}
                alt={proyecto.constructora_nombre || "Constructora"}
                className="h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
              />
            </a>
          ) : (
            <img
              src={proyecto.constructora_logo_url!}
              alt={proyecto.constructora_nombre || "Constructora"}
              className="h-10 w-auto object-contain opacity-70"
            />
          )}
        </motion.div>
      )}

      {/* Content Layer */}
      <motion.div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8"
        style={{ x: mouseX, y: mouseY }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          {/* Project logo or fallback initial */}
          <motion.div variants={slowScaleFade} className={hasBothLogos ? "mb-12" : "mb-8"}>
            {proyecto.logo_url ? (
              <img
                src={proyecto.logo_url}
                alt={proyecto.nombre}
                className={`w-auto object-contain drop-shadow-2xl ${hasBothLogos ? "h-40 lg:h-52" : "h-24"}`}
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl glass flex items-center justify-center shadow-2xl shadow-[var(--site-primary)]/10">
                <span className="font-site-heading text-4xl text-white">
                  {proyecto.nombre.charAt(0)}
                </span>
              </div>
            )}
          </motion.div>

          {/* Constructora name/logo — only when NOT both logos */}
          {!hasBothLogos && (proyecto.constructora_logo_url || proyecto.constructora_nombre) && (
            <motion.div
              variants={fadeUpBlur}
              className="flex flex-col items-center gap-2 mb-4"
            >
              {proyecto.constructora_logo_url && (
                proyecto.constructora_website ? (
                  <a href={proyecto.constructora_website} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                    <img
                      src={proyecto.constructora_logo_url}
                      alt={proyecto.constructora_nombre || "Constructora"}
                      className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                  </a>
                ) : (
                  <img
                    src={proyecto.constructora_logo_url}
                    alt={proyecto.constructora_nombre || "Constructora"}
                    className="h-8 w-auto object-contain opacity-80"
                  />
                )
              )}
              {proyecto.constructora_nombre && !proyecto.constructora_logo_url && (
                proyecto.constructora_website ? (
                  <a href={proyecto.constructora_website} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                    <p className="text-xs tracking-[0.5em] text-[var(--site-primary)] uppercase opacity-80 hover:opacity-100 transition-opacity">
                      {proyecto.constructora_nombre}
                    </p>
                  </a>
                ) : (
                  <p className="text-xs tracking-[0.5em] text-[var(--site-primary)] uppercase opacity-80">
                    {proyecto.constructora_nombre}
                  </p>
                )
              )}
            </motion.div>
          )}

          {/* Project name — only when both logos are NOT present */}
          {!hasBothLogos && (
            <motion.h1
              variants={fadeUpBlur}
              className="font-site-heading text-5xl lg:text-8xl font-light tracking-[0.15em] text-white mb-6 leading-tight"
              style={{ textShadow: "0 10px 40px rgba(0,0,0,0.8)" }}
            >
              {proyecto.nombre.toUpperCase()}
            </motion.h1>
          )}

          {/* Description */}
          {proyecto.descripcion && (
            <motion.p
              variants={fadeUpBlur}
              className="text-white/60 text-base lg:text-lg font-light max-w-lg mb-12 leading-relaxed"
            >
              {proyecto.descripcion}
            </motion.p>
          )}

          {/* CTA Button */}
          <motion.div variants={fadeUpBlur}>
            <Link
              href={`${basePath}/galeria`}
              className="btn-warm group relative overflow-hidden inline-flex items-center gap-3 px-10 py-4 text-sm tracking-[0.3em] uppercase"
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative z-10">{t("landing.enterExperience")}</span>
              <ArrowRight
                size={16}
                className="relative z-10 group-hover:translate-x-1 transition-transform duration-300"
              />
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Disclaimer — bottom of page */}
      {proyecto.disclaimer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-4 left-0 right-0 z-30 px-8 text-center"
        >
          <p className="text-[10px] text-white/25 max-w-2xl mx-auto leading-relaxed">
            {proyecto.disclaimer}
          </p>
        </motion.div>
      )}

      {/* Atmospheric overlays */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none" />
      <div className="bg-noise fixed inset-0 pointer-events-none z-[5] mix-blend-overlay opacity-50" />
    </div>
  );
}
