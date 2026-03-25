"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CotizadorTool } from "@/components/dashboard/cotizador/CotizadorTool";
import type { ProjectForCotizador, CotizadorConfig, ComplementoMode, TipologiaFieldsConfig, Tipologia, UnidadTipologia } from "@/types";

export default function CotizadorPage() {
  const [projects, setProjects] = useState<ProjectForCotizador[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // For multi-tipo projects, fetch tipologias separately
  const [tipologias, setTipologias] = useState<Tipologia[]>([]);
  const [unidadTipologias, setUnidadTipologias] = useState<UnidadTipologia[]>([]);

  // Fetch projects list
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/proyectos");
        if (res.ok) {
          const data = await res.json();
          const mapped: ProjectForCotizador[] = data.map(
            (p: Record<string, unknown>) => ({
              id: p.id as string,
              nombre: p.nombre as string,
              cotizador_enabled: p.cotizador_enabled as boolean,
              cotizador_config: p.cotizador_config as CotizadorConfig | null,
              color_primario: p.color_primario as string | null,
              parqueaderos_mode: (p.parqueaderos_mode as ComplementoMode) || "sin_inventario",
              depositos_mode: (p.depositos_mode as ComplementoMode) || "sin_inventario",
              parqueaderos_precio_base: (p.parqueaderos_precio_base as number | null) ?? null,
              depositos_precio_base: (p.depositos_precio_base as number | null) ?? null,
              precio_source: (p.precio_source as "unidad" | "tipologia") || "unidad",
              tipologia_mode: (p.tipologia_mode as "fija" | "multiple") || "fija",
              tipologia_fields: (p.tipologia_fields as TipologiaFieldsConfig | null) ?? null,
              habilitar_extra_jacuzzi: p.habilitar_extra_jacuzzi as boolean | undefined,
              habilitar_extra_piscina: p.habilitar_extra_piscina as boolean | undefined,
              habilitar_extra_bbq: p.habilitar_extra_bbq as boolean | undefined,
              habilitar_extra_terraza: p.habilitar_extra_terraza as boolean | undefined,
              habilitar_extra_jardin: p.habilitar_extra_jardin as boolean | undefined,
              habilitar_extra_cuarto_servicio: p.habilitar_extra_cuarto_servicio as boolean | undefined,
              habilitar_extra_estudio: p.habilitar_extra_estudio as boolean | undefined,
              habilitar_extra_chimenea: p.habilitar_extra_chimenea as boolean | undefined,
              habilitar_extra_doble_altura: p.habilitar_extra_doble_altura as boolean | undefined,
              habilitar_extra_rooftop: p.habilitar_extra_rooftop as boolean | undefined,
            })
          );
          setProjects(mapped);
          if (mapped.length > 0) setSelectedProjectId(mapped[0].id);
        }
      } finally {
        setLoadingProjects(false);
      }
    })();
  }, []);

  // Fetch tipologias for multi-tipo projects
  useEffect(() => {
    if (!selectedProjectId) return;
    const proj = projects.find((p) => p.id === selectedProjectId);
    if (proj?.tipologia_mode !== "multiple") {
      setTipologias([]);
      setUnidadTipologias([]);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/proyectos/${selectedProjectId}`);
        if (res.ok) {
          const fullProject = await res.json();
          setTipologias(fullProject.tipologias ?? []);
          setUnidadTipologias(fullProject.unidad_tipologias ?? []);
        }
      } catch {
        setTipologias([]);
        setUnidadTipologias([]);
      }
    })();
  }, [selectedProjectId, projects]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  /* ── Loading / empty states ── */

  if (loadingProjects) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center py-24">
        <h2 className="font-heading text-2xl font-light text-[var(--text-primary)] mb-3">
          Cotizador
        </h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          No tienes proyectos configurados.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-light text-[var(--text-primary)] mb-1">
          Cotizador
        </h1>
        <p className="text-xs text-[var(--text-tertiary)]">
          Genera cotizaciones para tus unidades
        </p>
      </div>

      {/* Project tabs */}
      {projects.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={cn(
                "px-4 py-2 rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] whitespace-nowrap transition-all shrink-0",
                selectedProjectId === p.id
                  ? "bg-[rgba(var(--site-primary-rgb),0.12)] text-[var(--site-primary)] border border-[rgba(var(--site-primary-rgb),0.25)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] border border-transparent"
              )}
            >
              {p.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Cotizador tool */}
      {selectedProject && (
        <CotizadorTool
          key={selectedProject.id}
          project={selectedProject}
          tipologias={tipologias}
          unidadTipologias={unidadTipologias}
        />
      )}
    </div>
  );
}
