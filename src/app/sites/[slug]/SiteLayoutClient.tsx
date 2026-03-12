"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { SiteNav } from "@/components/site/SiteNav";
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
            <SiteNav
              basePath={basePath}
              projectName={proyecto.nombre}
              logoUrl={proyecto.logo_url}
              constructoraLogoUrl={proyecto.constructora_logo_url}
              constructoraWebsite={proyecto.constructora_website}
              expanded={navExpanded}
              onToggle={() => setNavExpanded((prev) => !prev)}
              disclaimer={proyecto.disclaimer}
              politicaPrivacidadUrl={proyecto.politica_privacidad_url}
              etapaLabel={proyecto.etapa_label}
              hasImplantaciones={proyecto.planos_interactivos?.some(p => p.tipo === "urbanismo" && p.visible) ?? false}
              hasTour360={!!proyecto.tour_360_url}
              hasAvances={(proyecto.avances_obra?.length || 0) > 0}
            />
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
              style={!isLanding ? { paddingLeft: navExpanded ? 200 : 60 } : undefined}
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
