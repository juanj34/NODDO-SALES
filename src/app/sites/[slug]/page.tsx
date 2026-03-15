"use client";

import { motion, useMotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MouseEvent, useCallback, useState } from "react";
import { useSiteProject, useSiteBasePath } from "@/hooks/useSiteProject";
import { useTranslation } from "@/i18n";
import { NodDoLogo } from "@/components/ui/NodDoLogo";

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

  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleEnter = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      router.push(`${basePath}/galeria`);
    }, 1600);
  }, [isExiting, router, basePath]);

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
    <div className={`relative h-full ${isExiting ? "pointer-events-none" : ""}`} onMouseMove={handleMouseMove}>
      {/* Background Layer */}
      <motion.div
        className="absolute inset-0 z-0 overflow-hidden bg-[var(--site-bg)]"
        animate={isExiting ? { scale: 1.15 } : { scale: 1 }}
        transition={{ duration: 1.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {hasVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={proyecto.render_principal_url || undefined}
            onCanPlay={() => window.dispatchEvent(new Event("hero-ready"))}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={proyecto.hero_video_url!} type={proyecto.hero_video_url!.endsWith(".webm") ? "video/webm" : "video/mp4"} />
          </video>
        ) : hasImage ? (
          <img
            src={proyecto.render_principal_url!}
            alt={proyecto.nombre}
            onLoad={() => window.dispatchEvent(new Event("hero-ready"))}
            className={`absolute inset-0 w-full h-full object-cover ${isExiting ? "" : "animate-[kenBurns_20s_ease-in-out_infinite_alternate]"}`}
          />
        ) : null}

        {/* Dark overlay for text readability — lightens during exit to reveal more image */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30"
          animate={isExiting ? { opacity: 0.4 } : { opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </motion.div>

      {/* Developer logo + Powered by NODDO — bottom-right */}
      {hasBothLogos && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isExiting ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
          transition={isExiting ? { duration: 0.4 } : { duration: 1.2, delay: 1.5 }}
          className="absolute bottom-6 right-4 sm:bottom-10 sm:right-8 z-30 flex items-center gap-4"
        >
          {/* Constructora logo */}
          {proyecto.constructora_website ? (
            <a href={proyecto.constructora_website} target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
              <img
                src={proyecto.constructora_logo_url!}
                alt={proyecto.constructora_nombre || "Constructora"}
                loading="lazy"
                className="h-8 w-auto object-contain opacity-60 hover:opacity-90 transition-opacity"
              />
            </a>
          ) : (
            <img
              src={proyecto.constructora_logo_url!}
              alt={proyecto.constructora_nombre || "Constructora"}
              loading="lazy"
              className="h-8 w-auto object-contain opacity-60"
            />
          )}

          {/* Vertical divider + NODDO lockup */}
          {!proyecto.hide_noddo_badge && (
            <>
              <div className="w-px h-8 bg-white/15" />
              <a
                href="https://noddo.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 no-underline opacity-50 hover:opacity-80 transition-opacity"
              >
                <span className="text-[7px] tracking-[0.2em] uppercase font-medium text-white/60">
                  powered by
                </span>
                <NodDoLogo width={80} colorNod="#fff" colorDo="#b8983c" />
              </a>
            </>
          )}
        </motion.div>
      )}

      {/* Content Layer */}
      <motion.div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8"
        style={{ x: mouseX, y: mouseY }}
        animate={isExiting ? { opacity: 0, y: -30, filter: "blur(12px)" } : {}}
        transition={isExiting
          ? { duration: 0.6, ease: [0.4, 0, 1, 1] as [number, number, number, number] }
          : { type: "spring", stiffness: 50, damping: 20 }
        }
      >
        {/* Hidden H1 for SEO when logo is shown */}
        {hasBothLogos && (
          <h1 className="sr-only">{proyecto.nombre}</h1>
        )}

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
                className={`w-auto object-contain drop-shadow-2xl ${hasBothLogos ? "h-28 sm:h-40 lg:h-52" : "h-24"}`}
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
                      loading="lazy"
                      className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                  </a>
                ) : (
                  <img
                    src={proyecto.constructora_logo_url}
                    alt={proyecto.constructora_nombre || "Constructora"}
                    loading="lazy"
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
              className="font-site-heading text-3xl sm:text-5xl lg:text-8xl font-light tracking-[0.15em] text-white mb-6 leading-tight"
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
            <button
              onClick={handleEnter}
              className="btn-warm group relative overflow-hidden inline-flex items-center gap-3 px-6 py-3 sm:px-10 sm:py-4 text-sm tracking-[0.3em] uppercase cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative z-10">{t("landing.enterExperience")}</span>
              <ArrowRight
                size={16}
                className="relative z-10 group-hover:translate-x-1 transition-transform duration-300"
              />
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Disclaimer — bottom of page */}
      {proyecto.disclaimer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
          transition={isExiting ? { duration: 0.4 } : { duration: 1, delay: 2 }}
          className="absolute bottom-2 sm:bottom-4 left-0 right-0 z-30 px-4 sm:px-8 text-center"
        >
          <p className="text-[10px] text-white/25 max-w-2xl mx-auto leading-relaxed">
            {proyecto.disclaimer}
          </p>
        </motion.div>
      )}

      {/* Exit vignette — radial darkening from edges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isExiting ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: isExiting ? 0.8 : 0, ease: "easeIn" }}
        className="absolute inset-0 z-40 pointer-events-none"
        style={{ background: "radial-gradient(circle at center, transparent 0%, var(--site-bg) 70%)" }}
      />

      {/* Final blackout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isExiting ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3, delay: isExiting ? 1.3 : 0, ease: "easeIn" }}
        className="absolute inset-0 z-50 pointer-events-none"
        style={{ backgroundColor: "var(--site-bg)" }}
      />

      {/* Atmospheric overlays */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none"
        animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.4 }}
      />
      <div className="bg-noise fixed inset-0 pointer-events-none z-[5] mix-blend-overlay opacity-50" />
    </div>
  );
}
