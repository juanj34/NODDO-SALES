"use client";

export const dynamic = "force-dynamic";

import { Calculator } from "lucide-react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { CotizadorTool } from "@/components/dashboard/cotizador/CotizadorTool";
import type { ProjectForCotizador } from "@/types";

export default function CotizadorOperativoPage() {
  const { project } = useEditorProject();

  const projectForCotizador: ProjectForCotizador = {
    id: project.id,
    nombre: project.nombre,
    cotizador_enabled: project.cotizador_enabled,
    cotizador_config: project.cotizador_config,
    color_primario: project.color_primario,
    parqueaderos_mode: project.parqueaderos_mode,
    depositos_mode: project.depositos_mode,
    parqueaderos_precio_base: project.parqueaderos_precio_base,
    depositos_precio_base: project.depositos_precio_base,
    precio_source: project.precio_source,
    tipologia_mode: project.tipologia_mode,
    tipologia_fields: project.tipologia_fields,
    habilitar_extra_jacuzzi: project.habilitar_extra_jacuzzi,
    habilitar_extra_piscina: project.habilitar_extra_piscina,
    habilitar_extra_bbq: project.habilitar_extra_bbq,
    habilitar_extra_terraza: project.habilitar_extra_terraza,
    habilitar_extra_jardin: project.habilitar_extra_jardin,
    habilitar_extra_cuarto_servicio: project.habilitar_extra_cuarto_servicio,
    habilitar_extra_estudio: project.habilitar_extra_estudio,
    habilitar_extra_chimenea: project.habilitar_extra_chimenea,
    habilitar_extra_doble_altura: project.habilitar_extra_doble_altura,
    habilitar_extra_rooftop: project.habilitar_extra_rooftop,
    politica_amoblado: project.politica_amoblado,
    precio_amoblado: project.precio_amoblado,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <PageHeader icon={Calculator} title="Cotizador" description="Herramienta de cotización" />
      <CotizadorTool
        project={projectForCotizador}
        tipologias={project.tipologias || []}
        unidadTipologias={project.unidad_tipologias || []}
      />
    </div>
  );
}
