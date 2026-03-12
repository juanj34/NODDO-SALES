"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SiteNav } from "@/components/site/SiteNav";
import { ChevronLeft } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { RotateDevice } from "@/components/site/RotateDevice";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { EditorialWatermark } from "@/components/site/EditorialWatermark";
import { SitePreloader } from "@/components/site/SitePreloader";
import { AudioProvider, AudioMuteButton } from "@/components/site/AudioPlayer";
import { NoddoBadge } from "@/components/site/NoddoBadge";
import { SiteProjectContext } from "@/hooks/useSiteProject";
import type { ProyectoCompleto } from "@/types";

interface Props {
  proyecto: ProyectoCompleto;
  basePath: string;
  children: React.ReactNode;
}

export function SiteLayoutClient({ proyecto, basePath, children }: Props) {
  const pathname = usePathname();
  const isLanding =
    pathname === `/sites/${proyecto.slug}` || pathname === "/";
  const [navExpanded, setNavExpanded] = useState(true);
  const [showPreloader, setShowPreloader] = useState(isLanding);
  const isMobile = useMediaQuery("(max-width: 1023px)");

  return (
    <SiteProjectContext.Provider value={{ proyecto, basePath }}>
      <AudioProvider audioUrl={proyecto.background_audio_url}>
        <div
          className="h-screen overflow-hidden"
          style={{
            ["--site-primary" as string]: proyecto.color_primario || "#b8973a",
            ["--site-secondary" as string]: proyecto.color_secundario,
            ["--site-bg" as string]: proyecto.color_fondo,
            ["--site-primary-rgb" as string]: hexToRgb(proyecto.color_primario || "#b8973a"),
            backgroundColor: proyecto.color_fondo,
            color: proyecto.color_secundario,
          }}
        >
          <AnimatePresence>
            {showPreloader && (
              <SitePreloader
                logoUrl={proyecto.logo_url}
                projectName={proyecto.nombre}
                onComplete={() => setShowPreloader(false)}
              />
            )}
          </AnimatePresence>
          <RotateDevice />
          {!isLanding && (
            <>
              <SiteNav
                basePath={basePath}
                projectName={proyecto.nombre}
                logoUrl={proyecto.logo_url}
                faviconUrl={proyecto.favicon_url}
                constructoraLogoUrl={proyecto.constructora_logo_url}
                constructoraWebsite={proyecto.constructora_website}
                expanded={navExpanded}
                disclaimer={proyecto.disclaimer}
                politicaPrivacidadUrl={proyecto.politica_privacidad_url}
                etapaLabel={proyecto.etapa_label}
                hasImplantaciones={proyecto.planos_interactivos?.some(p => p.tipo === "urbanismo" && p.visible) ?? false}
                hasTour360={!!proyecto.tour_360_url}
                hasAvances={(proyecto.avances_obra?.length || 0) > 0}
              />
              {/* Sidebar toggle arrow — outside the nav, centered vertically */}
              <motion.button
                onClick={() => setNavExpanded((prev) => !prev)}
                className="fixed top-1/2 -translate-y-1/2 z-[56] hidden lg:flex items-center justify-center w-4 h-9 rounded-r-md cursor-pointer"
                animate={{
                  left: navExpanded ? 200 : 60,
                  backgroundColor: "rgba(26,26,26,0.7)",
                }}
                whileHover={{
                  backgroundColor: "rgba(42,42,42,0.9)",
                  width: 20,
                }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  backdropFilter: "blur(8px)",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <motion.div
                  animate={{ rotate: navExpanded ? 0 : 180 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ChevronLeft size={12} className="text-[var(--text-tertiary)]" />
                </motion.div>
              </motion.button>
            </>
          )}
          <EditorialWatermark basePath={basePath} />
          {/* Floating audio control on landing */}
          {isLanding && (
            <div className="fixed bottom-6 right-6 z-30">
              <AudioMuteButton />
            </div>
          )}
          {/* Noddo badge — fixed bottom-right on all non-landing pages */}
          {!proyecto.hide_noddo_badge && !isLanding && (
            <NoddoBadge className="fixed bottom-5 right-5 z-30" />
          )}
          <SmoothScroll>
            <main
              className={isLanding ? "h-full" : "h-full transition-[padding] duration-300"}
              style={!isLanding ? { paddingLeft: isMobile ? 0 : navExpanded ? 200 : 60 } : undefined}
            >
              {children}
            </main>
          </SmoothScroll>
        </div>
      </AudioProvider>
    </SiteProjectContext.Provider>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "129, 140, 248";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
