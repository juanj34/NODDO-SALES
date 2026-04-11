"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Globe,
  Palette,
  LayoutGrid,
  SlidersHorizontal,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Check,
  Loader2,
  Link2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { useToast } from "@/components/dashboard/Toast";
import {
  inputClass,
  labelClass,
  fieldHint,
  sectionCard,
  sectionTitle,
  sectionDescription,
  btnPrimary,
  btnSecondary,
} from "@/components/dashboard/editor-styles";
import type { ConstructoraPortal } from "@/types";

/* ── Helpers ───────────────────────────────────────────────────────── */

interface ProyectoOption {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  imagen_hero_url: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function PortalPage() {
  const toast = useToast();

  /* ── State ─────────────────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portal, setPortal] = useState<ConstructoraPortal | null>(null);
  const [proyectos, setProyectos] = useState<ProyectoOption[]>([]);

  // Form fields
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [colorPrimario, setColorPrimario] = useState("#b8973a");
  const [layout, setLayout] = useState<"slider" | "grid">("slider");
  const [proyectoIds, setProyectoIds] = useState<string[]>([]);
  const [customDomain, setCustomDomain] = useState("");
  const [heroVideoUrl, setHeroVideoUrl] = useState("");

  const slugManuallyEdited = useRef(false);

  /* ── Fetch portal + projects on mount ──────────────────────────── */
  useEffect(() => {
    async function load() {
      try {
        const [portalRes, projectsRes] = await Promise.all([
          fetch("/api/portals"),
          fetch("/api/proyectos"),
        ]);

        const portalData = await portalRes.json();
        const projectsData = await projectsRes.json();

        // Projects list
        const projs: ProyectoOption[] = Array.isArray(projectsData)
          ? projectsData.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              nombre: p.nombre as string,
              slug: p.slug as string,
              estado: p.estado as string,
              imagen_hero_url: (p.imagen_hero_url as string) ?? null,
            }))
          : [];
        setProyectos(projs);

        // Portal data (null if none exists)
        if (portalData && portalData.id) {
          const p = portalData as ConstructoraPortal;
          setPortal(p);
          setNombre(p.nombre);
          setSlug(p.slug);
          setDescripcion(p.descripcion ?? "");
          setLogoUrl(p.logo_url);
          setColorPrimario(p.color_primario ?? "#b8973a");
          setLayout(p.layout ?? "slider");
          setProyectoIds(p.proyecto_ids ?? []);
          setCustomDomain(p.custom_domain ?? "");
          setHeroVideoUrl(p.hero_video_url ?? "");
          slugManuallyEdited.current = true; // don't auto-generate slug for existing portals
        }
      } catch {
        toast.error("Error cargando datos del portal");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Auto-slug from nombre ─────────────────────────────────────── */
  const handleNombreChange = useCallback(
    (value: string) => {
      setNombre(value);
      if (!slugManuallyEdited.current) {
        setSlug(slugify(value));
      }
    },
    []
  );

  /* ── Project selection ─────────────────────────────────────────── */
  const toggleProject = useCallback((projectId: string) => {
    setProyectoIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  }, []);

  const moveProject = useCallback((index: number, direction: "up" | "down") => {
    setProyectoIds((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  /* ── Save / Create ─────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!nombre.trim() || !slug.trim()) {
      toast.error("Nombre y slug son requeridos");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        slug: slug.trim(),
        descripcion: descripcion.trim() || null,
        logo_url: logoUrl,
        color_primario: colorPrimario,
        layout,
        proyecto_ids: proyectoIds.length > 0 ? proyectoIds : null,
        custom_domain: customDomain.trim() || null,
        hero_video_url: heroVideoUrl.trim() || null,
      };

      let res: Response;

      if (portal) {
        // Update existing
        res = await fetch(`/api/portals/${portal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        res = await fetch("/api/portals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error guardando portal");
      }

      const saved = (await res.json()) as ConstructoraPortal;
      setPortal(saved);
      slugManuallyEdited.current = true;
      toast.success(portal ? "Portal actualizado" : "Portal creado exitosamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error guardando portal");
    } finally {
      setSaving(false);
    }
  }, [
    nombre, slug, descripcion, logoUrl, colorPrimario,
    layout, proyectoIds, customDomain, heroVideoUrl,
    portal, toast,
  ]);

  /* ── Loading state ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 size={28} className="animate-spin text-[var(--site-primary)]" />
      </div>
    );
  }

  /* ── Selected projects for reorder list ────────────────────────── */
  const selectedProjects = proyectoIds
    .map((id) => proyectos.find((p) => p.id === id))
    .filter(Boolean) as ProyectoOption[];

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto pb-20"
    >
      <PageHeader
        icon={Building2}
        title="Portal de constructora"
        description="Configura tu portal para mostrar todos tus proyectos en un solo sitio."
        actions={
          <button
            onClick={handleSave}
            disabled={saving || !nombre.trim() || !slug.trim()}
            className={btnPrimary}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {portal ? "Guardar cambios" : "Crear portal"}
          </button>
        }
      />

      {/* Preview link when portal exists */}
      {portal && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-8"
        >
          <a
            href={`https://${portal.slug}.noddo.io`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[var(--site-primary)] hover:underline"
          >
            <ExternalLink size={14} />
            <span className="font-mono text-xs">{portal.slug}.noddo.io</span>
          </a>
        </motion.div>
      )}

      <div className="space-y-8">
        {/* ── Section 1: Info basica ─────────────────────────────── */}
        <section className={sectionCard}>
          <h3 className={sectionTitle}>
            <Sparkles size={14} className="text-[var(--site-primary)]" />
            Informacion basica
          </h3>
          <p className={sectionDescription}>
            Nombre y URL de tu portal de constructora.
          </p>

          <div className="space-y-5">
            {/* Nombre */}
            <div>
              <label className={labelClass}>Nombre del portal</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Mi Constructora"
                className={inputClass}
              />
            </div>

            {/* Slug */}
            <div>
              <label className={labelClass}>Slug (URL)</label>
              <div className="relative">
                <Link2
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                />
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    slugManuallyEdited.current = true;
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="mi-constructora"
                  className={`${inputClass} pl-10`}
                />
              </div>
              {slug && (
                <p className={fieldHint}>
                  Vista previa:{" "}
                  <span className="font-mono text-[var(--site-primary)]">
                    {slug}.noddo.io
                  </span>
                </p>
              )}
            </div>

            {/* Descripcion */}
            <div>
              <label className={labelClass}>Descripcion</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve descripcion de tu constructora..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Hero Video URL */}
            <div>
              <label className={labelClass}>Video hero (URL de YouTube)</label>
              <input
                type="url"
                value={heroVideoUrl}
                onChange={(e) => setHeroVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={inputClass}
              />
              <p className={fieldHint}>
                Video destacado que se muestra en la parte superior del portal.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 2: Branding ────────────────────────────────── */}
        <section className={sectionCard}>
          <h3 className={sectionTitle}>
            <Palette size={14} className="text-[var(--site-primary)]" />
            Branding
          </h3>
          <p className={sectionDescription}>
            Logo y color principal de tu portal.
          </p>

          <div className="space-y-5">
            {/* Logo */}
            <div>
              <label className={labelClass}>Logo</label>
              <FileUploader
                onUpload={(url) => setLogoUrl(url)}
                currentUrl={logoUrl}
                folder="portals/logos"
                aspect="logo"
                label="Subir logo"
                compact
              />
            </div>

            {/* Color primario */}
            <div>
              <label className={labelClass}>Color primario</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colorPrimario}
                  onChange={(e) => setColorPrimario(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-[var(--border-default)] cursor-pointer bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={colorPrimario}
                  onChange={(e) => setColorPrimario(e.target.value)}
                  placeholder="#b8973a"
                  className={`${inputClass} max-w-[160px] font-mono text-xs`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: Layout ──────────────────────────────────── */}
        <section className={sectionCard}>
          <h3 className={sectionTitle}>
            <LayoutGrid size={14} className="text-[var(--site-primary)]" />
            Disposicion
          </h3>
          <p className={sectionDescription}>
            Como se presentan tus proyectos en el portal.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <LayoutOption
              active={layout === "slider"}
              onClick={() => setLayout("slider")}
              icon={SlidersHorizontal}
              label="Slider"
              description="Carrusel horizontal con navegacion"
            />
            <LayoutOption
              active={layout === "grid"}
              onClick={() => setLayout("grid")}
              icon={LayoutGrid}
              label="Cuadricula"
              description="Tarjetas en grilla responsive"
            />
          </div>
        </section>

        {/* ── Section 4: Proyectos ───────────────────────────────── */}
        <section className={sectionCard}>
          <h3 className={sectionTitle}>
            <Building2 size={14} className="text-[var(--site-primary)]" />
            Proyectos
          </h3>
          <p className={sectionDescription}>
            Selecciona y ordena los proyectos que apareceran en tu portal.
          </p>

          {proyectos.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] py-6 text-center">
              No tienes proyectos aun. Crea al menos 2 proyectos publicados.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Available projects */}
              <div className="space-y-2">
                {proyectos.map((p) => {
                  const isSelected = proyectoIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProject(p.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "border-[rgba(var(--site-primary-rgb),0.4)] bg-[rgba(var(--site-primary-rgb),0.08)]"
                          : "border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-default)]"
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[var(--site-primary)] border-[var(--site-primary)]"
                            : "border-[var(--border-strong)] bg-[var(--surface-3)]"
                        }`}
                      >
                        {isSelected && (
                          <Check size={12} className="text-[#141414]" />
                        )}
                      </div>

                      {/* Project info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{p.nombre}</p>
                        <p className="text-[11px] font-mono text-[var(--text-muted)]">
                          /{p.slug}
                        </p>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-ui font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          p.estado === "publicado"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-[var(--surface-3)] text-[var(--text-tertiary)]"
                        }`}
                      >
                        {p.estado}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Reorder selected projects */}
              <AnimatePresence>
                {selectedProjects.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-[11px] font-ui font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                      Orden de aparicion ({selectedProjects.length} seleccionados)
                    </p>
                    <div className="space-y-1.5">
                      {selectedProjects.map((p, idx) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                        >
                          <GripVertical
                            size={14}
                            className="text-[var(--text-muted)] flex-shrink-0"
                          />
                          <span className="font-mono text-xs text-[var(--text-tertiary)] w-5">
                            {idx + 1}.
                          </span>
                          <span className="text-sm text-white flex-1 truncate">
                            {p.nombre}
                          </span>
                          <div className="flex gap-0.5">
                            <button
                              onClick={() => moveProject(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-[var(--surface-3)] text-[var(--text-tertiary)] hover:text-white disabled:opacity-30 transition-colors"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => moveProject(idx, "down")}
                              disabled={idx === selectedProjects.length - 1}
                              className="p-1 rounded hover:bg-[var(--surface-3)] text-[var(--text-tertiary)] hover:text-white disabled:opacity-30 transition-colors"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* ── Section 5: Dominio ─────────────────────────────────── */}
        <section className={sectionCard}>
          <h3 className={sectionTitle}>
            <Globe size={14} className="text-[var(--site-primary)]" />
            Dominio
          </h3>
          <p className={sectionDescription}>
            Configura el dominio de tu portal.
          </p>

          <div className="space-y-5">
            {/* Subdomain (readonly) */}
            <div>
              <label className={labelClass}>Subdominio NODDO</label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <Globe size={14} className="text-[var(--site-primary)] flex-shrink-0" />
                <span className="font-mono text-sm text-white">
                  {slug || "tu-slug"}.noddo.io
                </span>
              </div>
              <p className={fieldHint}>
                Este subdominio se activa automaticamente al crear el portal.
              </p>
            </div>

            {/* Custom domain */}
            <div>
              <label className={labelClass}>Dominio personalizado (opcional)</label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="portal.miconstructora.com"
                className={inputClass}
              />
              <p className={fieldHint}>
                Apunta un registro CNAME a <span className="font-mono">cname.noddo.io</span> para
                activar tu dominio personalizado.
              </p>
              {portal?.domain_verified && customDomain && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                  <Check size={12} />
                  Dominio verificado
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ── Floating save button (mobile) ────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden z-50">
        <button
          onClick={handleSave}
          disabled={saving || !nombre.trim() || !slug.trim()}
          className={`${btnPrimary} shadow-xl px-6 py-3`}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          {portal ? "Guardar" : "Crear portal"}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Layout Option Card ────────────────────────────────────────────── */

interface LayoutOptionProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  description: string;
}

function LayoutOption({ active, onClick, icon: Icon, label, description }: LayoutOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 p-5 rounded-xl border transition-all text-center ${
        active
          ? "border-[rgba(var(--site-primary-rgb),0.5)] bg-[rgba(var(--site-primary-rgb),0.08)] shadow-[0_0_20px_rgba(var(--site-primary-rgb),0.08)]"
          : "border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-default)]"
      }`}
    >
      {active && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[var(--site-primary)] flex items-center justify-center">
          <Check size={10} className="text-[#141414]" />
        </div>
      )}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
          active
            ? "bg-[rgba(var(--site-primary-rgb),0.15)]"
            : "bg-[var(--surface-3)]"
        }`}
      >
        <Icon
          size={20}
          className={
            active ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]"
          }
        />
      </div>
      <div>
        <p
          className={`font-ui text-xs font-bold uppercase tracking-wider ${
            active ? "text-[var(--site-primary)]" : "text-white"
          }`}
        >
          {label}
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
          {description}
        </p>
      </div>
    </button>
  );
}
