"use client";

import { SiteNav } from "@/components/site/SiteNav";
import { RotateDevice } from "@/components/site/RotateDevice";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { Disclaimer } from "@/components/site/Disclaimer";
import { SiteProjectContext } from "@/hooks/useSiteProject";
import type { ProyectoCompleto } from "@/types";

interface Props {
  proyecto: ProyectoCompleto;
  children: React.ReactNode;
}

export function SiteLayoutClient({ proyecto, children }: Props) {
  return (
    <SiteProjectContext.Provider value={proyecto}>
      <div
        className="min-h-screen"
        style={{
          ["--site-primary" as string]: proyecto.color_primario,
          ["--site-secondary" as string]: proyecto.color_secundario,
          ["--site-bg" as string]: proyecto.color_fondo,
          backgroundColor: proyecto.color_fondo,
          color: proyecto.color_secundario,
        }}
      >
        <RotateDevice />
        <SiteNav slug={proyecto.slug} projectName={proyecto.nombre} />
        <main className="lg:pl-20 min-h-screen pb-10">{children}</main>
        {proyecto.whatsapp_numero && (
          <WhatsAppButton numero={proyecto.whatsapp_numero} />
        )}
        <Disclaimer text={proyecto.disclaimer} />
      </div>
    </SiteProjectContext.Provider>
  );
}
