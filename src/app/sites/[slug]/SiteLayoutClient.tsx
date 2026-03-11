"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
import { RotateDevice } from "@/components/site/RotateDevice";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { EditorialWatermark } from "@/components/site/EditorialWatermark";
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

  return (
    <SiteProjectContext.Provider value={{ proyecto, basePath }}>
      <div
        className="h-screen overflow-hidden"
        style={{
          ["--site-primary" as string]: proyecto.color_primario || "#D4A574",
          ["--site-secondary" as string]: proyecto.color_secundario,
          ["--site-bg" as string]: proyecto.color_fondo,
          ["--site-primary-rgb" as string]: hexToRgb(proyecto.color_primario || "#D4A574"),
          backgroundColor: proyecto.color_fondo,
          color: proyecto.color_secundario,
        }}
      >
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
          />
        )}
        <EditorialWatermark basePath={basePath} />
        <SmoothScroll>
          <main
            className={isLanding ? "h-full" : "h-full transition-[padding] duration-300"}
            style={!isLanding ? { paddingLeft: navExpanded ? 200 : 60 } : undefined}
          >
            {children}
          </main>
        </SmoothScroll>
      </div>
    </SiteProjectContext.Provider>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "129, 140, 248";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
