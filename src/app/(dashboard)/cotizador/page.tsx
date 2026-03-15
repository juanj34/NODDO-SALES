"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, ExternalLink, FileText, Search, Download, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import { useAuthRole } from "@/hooks/useAuthContext";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import type { CotizadorConfig, ResultadoCotizacion } from "@/types";

/* ── Types ─────────────────────────────────────────────── */

interface UnitRow {
  id: string;
  identificador: string;
  piso: number | null;
  area_m2: number | null;
  precio: number | null;
  estado: string;
  habitaciones: number | null;
  banos: number | null;
  vista: string | null;
  tipologia: { nombre: string } | null;
  torre: { nombre: string } | null;
}

interface ProjectForCotizador {
  id: string;
  nombre: string;
  constructora: string | null;
  cotizador_enabled: boolean;
  cotizador_config: CotizadorConfig | null;
  color_primario: string | null;
}

/* ── Helpers ───────────────────────────────────────────── */

function formatPrice(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${Math.round(n / 1_000_000)}M`;
  return `$${n.toLocaleString("es-CO")}`;
}

function formatFullPrice(n: number, moneda: string): string {
  const locale = moneda === "USD" ? "en-US" : "es-CO";
  const prefix = moneda === "USD" ? "USD " : "$";
  return `${prefix}${n.toLocaleString(locale)}`;
}

const frecLabels: Record<string, string> = {
  unica: "Pago unico",
  mensual: "Mensual",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Page ──────────────────────────────────────────────── */

export default function CotizadorPage() {
  const { t } = useTranslation("dashboard");
  const toast = useToast();
  const { user, role } = useAuthRole();

  // Projects
  const [projects, setProjects] = useState<ProjectForCotizador[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Units
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Selection
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // PDF generation
  const [generating, setGenerating] = useState(false);

  const isAdmin = role === "admin";

  // Fetch projects (need cotizador_config fields)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/proyectos");
        if (res.ok) {
          const data = await res.json();
          const mapped: ProjectForCotizador[] = data.map(
            (p: {
              id: string;
              nombre: string;
              constructora: string | null;
              cotizador_enabled: boolean;
              cotizador_config: CotizadorConfig | null;
              color_primario: string | null;
            }) => ({
              id: p.id,
              nombre: p.nombre,
              constructora: p.constructora,
              cotizador_enabled: p.cotizador_enabled,
              cotizador_config: p.cotizador_config,
              color_primario: p.color_primario,
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

  // Fetch units when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoadingUnits(true);
    setSelectedUnitId(null);
    setSearch("");

    (async () => {
      try {
        const res = await fetch(`/api/unidades?proyecto_id=${selectedProjectId}`);
        if (res.ok) setUnits(await res.json());
      } finally {
        setLoadingUnits(false);
      }
    })();
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  // Available units (cotizable)
  const cotizableUnits = useMemo(() => {
    return units.filter(
      (u) =>
        (u.estado === "disponible" || u.estado === "separado") &&
        u.precio &&
        u.precio > 0
    );
  }, [units]);

  // Filtered by search
  const filteredUnits = useMemo(() => {
    if (!search) return cotizableUnits;
    const s = search.toLowerCase();
    return cotizableUnits.filter(
      (u) =>
        u.identificador.toLowerCase().includes(s) ||
        u.tipologia?.nombre?.toLowerCase().includes(s)
    );
  }, [cotizableUnits, search]);

  // Calculate cotización
  const cotizacion: ResultadoCotizacion | null = useMemo(() => {
    if (!selectedUnit?.precio || !selectedProject?.cotizador_config) return null;
    return calcularCotizacion(selectedUnit.precio, selectedProject.cotizador_config);
  }, [selectedUnit, selectedProject]);

  // Client form validation
  const clientFormValid = clientName.trim().length > 0 && EMAIL_RE.test(clientEmail.trim());

  // Generate PDF
  const handleGeneratePdf = async () => {
    if (!selectedUnit || !selectedProjectId || !clientFormValid) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: selectedProjectId,
          unidad_id: selectedUnit.id,
          nombre: clientName.trim(),
          email: clientEmail.trim(),
          telefono: clientPhone.trim() || undefined,
          agente_id: user?.id,
          agente_nombre: user?.email,
        }),
      });

      if (res.ok) {
        const { pdf_url } = await res.json();
        if (pdf_url) {
          window.open(pdf_url, "_blank");
        }
        toast.success("Cotización generada");
        // Reset client form
        setClientName("");
        setClientEmail("");
        setClientPhone("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al generar cotización");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGenerating(false);
    }
  };

  const moneda = selectedProject?.cotizador_config?.moneda || "COP";

  // Loading
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
        <h1 className="font-heading text-2xl font-light text-[var(--text-primary)] mb-3">
          {t("cotizador.title")}
        </h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          No tienes proyectos configurados.
        </p>
      </div>
    );
  }

  const cotizadorEnabled = selectedProject?.cotizador_enabled && selectedProject?.cotizador_config;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-light text-[var(--text-primary)] mb-1">
          {t("cotizador.title")}
        </h1>
        <p className="text-xs text-[var(--text-tertiary)]">
          {t("cotizador.description")}
        </p>
      </div>

      {/* Project tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProjectId(p.id)}
            className={cn(
              "px-4 py-2 rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] whitespace-nowrap transition-all shrink-0",
              selectedProjectId === p.id
                ? "bg-[rgba(184,151,58,0.12)] text-[var(--site-primary)] border border-[rgba(184,151,58,0.25)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] border border-transparent"
            )}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {loadingUnits ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[var(--site-primary)]" size={24} />
        </div>
      ) : !cotizadorEnabled ? (
        <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-10 text-center">
          <FileText size={32} className="mx-auto text-[var(--text-muted)] mb-4" />
          <p className="text-sm text-[var(--text-tertiary)] mb-3">
            {isAdmin ? t("cotizador.notConfigured") : t("cotizador.notConfiguredCollab")}
          </p>
          {isAdmin && (
            <Link
              href={`/editor/${selectedProjectId}/config`}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--site-primary)] hover:underline"
            >
              {t("cotizador.configureLink")}
              <ExternalLink size={12} />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: Unit list */}
          <div className="lg:col-span-2 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden flex flex-col" style={{ maxHeight: "70vh" }}>
            {/* Search */}
            <div className="p-3 border-b border-[var(--border-subtle)]">
              <div className="relative">
                <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("cotizador.search")}
                  className="input-glass w-full pl-9 text-xs"
                />
              </div>
            </div>

            {/* Units */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
              {filteredUnits.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                  {t("cotizador.noAvailable")}
                </div>
              ) : (
                filteredUnits.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnitId(unit.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-all",
                      selectedUnitId === unit.id
                        ? "bg-[rgba(184,151,58,0.08)]"
                        : "hover:bg-[var(--surface-2)]"
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: unit.estado === "disponible" ? "#4ade80" : "#facc15",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-[var(--text-primary)] font-medium block">
                        {unit.identificador}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] truncate block">
                        {unit.tipologia?.nombre || "—"}
                        {unit.area_m2 ? ` · ${unit.area_m2}m²` : ""}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                      {unit.precio ? formatPrice(unit.precio) : "—"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-6">
            {!selectedUnit ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText size={32} className="text-[var(--text-muted)] mb-4" />
                <p className="text-sm text-[var(--text-tertiary)]">
                  {t("cotizador.selectUnit")}
                </p>
              </div>
            ) : !cotizacion ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-[var(--site-primary)]" size={24} />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Unit header */}
                <div>
                  <h3 className="font-heading text-xl font-light text-[var(--text-primary)] mb-1">
                    Unidad {selectedUnit.identificador}
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {selectedUnit.tipologia?.nombre || "—"}
                    {selectedUnit.torre?.nombre ? ` · ${selectedUnit.torre.nombre}` : ""}
                    {selectedUnit.piso !== null ? ` · Piso ${selectedUnit.piso}` : ""}
                  </p>
                </div>

                {/* Unit details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedUnit.area_m2 && (
                    <DetailBox label="Area" value={`${selectedUnit.area_m2} m²`} />
                  )}
                  {selectedUnit.habitaciones !== null && (
                    <DetailBox label="Hab." value={String(selectedUnit.habitaciones)} />
                  )}
                  {selectedUnit.banos !== null && (
                    <DetailBox label="Baños" value={String(selectedUnit.banos)} />
                  )}
                  {selectedUnit.vista && (
                    <DetailBox label="Vista" value={selectedUnit.vista} />
                  )}
                </div>

                {/* Price */}
                <div className="p-4 rounded-xl bg-[rgba(184,151,58,0.06)] border border-[rgba(184,151,58,0.15)]">
                  <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] block mb-1">
                    Precio
                  </span>
                  <span className="font-heading text-2xl font-light text-[var(--site-primary)]">
                    {formatFullPrice(cotizacion.precio_base, moneda)}
                  </span>
                  {cotizacion.descuentos_aplicados.length > 0 && (
                    <div className="mt-2 text-xs text-green-400">
                      Neto: {formatFullPrice(cotizacion.precio_neto, moneda)}
                    </div>
                  )}
                </div>

                {/* Payment phases */}
                <div>
                  <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] block mb-3">
                    Plan de pagos
                  </span>
                  <div className="space-y-2">
                    {cotizacion.fases.map((fase, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                      >
                        <div>
                          <span className="text-xs text-[var(--text-primary)] block">
                            {fase.nombre}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {fase.cuotas > 1
                              ? `${fase.cuotas} cuotas · ${frecLabels[fase.frecuencia] || fase.frecuencia}`
                              : frecLabels[fase.frecuencia] || fase.frecuencia}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-[var(--text-primary)] block">
                            {formatFullPrice(fase.monto_total, moneda)}
                          </span>
                          {fase.cuotas > 1 && (
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {formatFullPrice(fase.monto_por_cuota, moneda)} / cuota
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Client info form */}
                <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2 mb-4">
                    <User size={14} className="text-[var(--site-primary)]" />
                    <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      {t("cotizador.clientInfo")}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={t("cotizador.clientName")}
                      className="input-glass w-full text-xs"
                    />
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder={t("cotizador.clientEmail")}
                      className="input-glass w-full text-xs"
                    />
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder={t("cotizador.clientPhone")}
                      className="input-glass w-full text-xs"
                    />
                  </div>
                </div>

                {/* Generate PDF */}
                <button
                  onClick={handleGeneratePdf}
                  disabled={generating || !clientFormValid}
                  className={cn(
                    "btn-noddo w-full py-3 font-ui text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2",
                    !clientFormValid && !generating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {generating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  {generating ? t("cotizador.generating") : t("cotizador.generatePdf")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small detail box ──────────────────────────────────── */

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
      <span className="font-ui text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] block mb-0.5">
        {label}
      </span>
      <span className="text-xs text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
