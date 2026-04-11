"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Loader2, ArrowLeft, ArrowRight, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateProject } from "@/hooks/useProjectsQuery";
import { useToast } from "@/components/dashboard/Toast";
import { getDefaultTipologiaFields } from "@/lib/tipologia-fields";
import { trackDashboardEvent } from "@/lib/dashboard-tracking";
import { MagneticButton } from "@/components/ui/MagneticButton";
import type { TipologiaFieldsConfig } from "@/types";

import { WizardProgressBar } from "./WizardProgressBar";
import StepIdentidad from "./steps/StepIdentidad";
import StepTipoProyecto from "./steps/StepTipoProyecto";
import StepIdiomaEstado from "./steps/StepIdiomaEstado";
import StepConfigPrecios from "./steps/StepConfigPrecios";
import StepComplementos from "./steps/StepComplementos";
import StepCamposTipologia from "./steps/StepCamposTipologia";
import StepCrearTipologias from "./steps/StepCrearTipologias";

type TipoProyecto = "apartamentos" | "casas" | "lotes" | "hibrido";
type ComplementoMode = "sin_inventario" | "inventario_incluido" | "inventario_separado" | "precio_base";

interface TipologiaQuickAdd {
  nombre: string;
  area_m2?: number;
  habitaciones?: number;
  banos?: number;
}

interface ProjectCreationWizardProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
  userRole?: "admin" | "director" | "asesor";
}

const TOTAL_STEPS = 7;

const STEP_TITLES = [
  { es: "Identidad del proyecto", en: "Project identity" },
  { es: "Tipo de proyecto", en: "Project type" },
  { es: "Idioma y estado", en: "Language & status" },
  { es: "Precios y moneda", en: "Pricing & currency" },
  { es: "Parqueaderos y depósitos", en: "Parking & storage" },
  { es: "Campos de tipología", en: "Unit type fields" },
  { es: "Crear tipologías", en: "Create unit types" },
];

const STEP_DESCRIPTIONS = [
  { es: "Nombre y URL de tu micrositio", en: "Name and URL for your microsite" },
  { es: "Define la estructura de tu desarrollo", en: "Define your development structure" },
  { es: "Idioma del micrositio y etapa de construcción", en: "Microsite language and construction stage" },
  { es: "Moneda, unidades y modelo de precios", en: "Currency, units and pricing model" },
  { es: "Cómo se gestionan parqueaderos y depósitos", en: "How parking and storage are managed" },
  { es: "Elige qué campos mostrar en las tipologías", en: "Choose which fields to show in unit types" },
  { es: "Crea las primeras tipologías para tu proyecto", en: "Create the first unit types for your project" },
];

export function ProjectCreationWizard({
  open,
  onClose,
  userId,
  userRole,
}: ProjectCreationWizardProps) {
  const router = useRouter();
  const toast = useToast();
  const { mutate: createProject, isPending: creating } = useCreateProject();

  /* ── Wizard state ──────────────────────────────────────────── */
  const [step, setStep] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Step 0 — Identidad
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 1 — Tipo
  const [tipoProyecto, setTipoProyecto] = useState<TipoProyecto>("apartamentos");

  // Step 2 — Idioma y estado
  const [idioma, setIdioma] = useState<"es" | "en">("es");
  const [estadoConstruccion, setEstadoConstruccion] = useState<"sobre_planos" | "en_construccion" | "entregado">("sobre_planos");

  // Step 3 — Precios
  const [precioSource, setPrecioSource] = useState<"unidad" | "tipologia">("tipologia");
  const [moneda, setMoneda] = useState("COP");
  const [unidadMedida, setUnidadMedida] = useState<"m2" | "sqft">("m2");
  const [tipologiaMode, setTipologiaMode] = useState<"fija" | "multiple">("fija");

  // Step 4 — Complementos
  const [parqueaderosMode, setParqueaderosMode] = useState<ComplementoMode>("sin_inventario");
  const [depositosMode, setDepositosMode] = useState<ComplementoMode>("sin_inventario");

  // Step 5 — Campos
  const [tipologiaFields, setTipologiaFields] = useState<TipologiaFieldsConfig>(
    getDefaultTipologiaFields("apartamentos")
  );

  // Step 6 — Tipologías
  const [tipologias, setTipologias] = useState<TipologiaQuickAdd[]>([]);

  /* ── Slug generation ───────────────────────────────────────── */
  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  /* ── Slug availability check ───────────────────────────────── */
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null);
      return;
    }
    setCheckingSlug(true);
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/domains/check?subdomain=${encodeURIComponent(slug)}`);
        const data = await res.json();
        setSlugAvailable(data.available);
      } catch {
        setSlugAvailable(null);
      }
      setCheckingSlug(false);
    }, 400);
    return () => {
      if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    };
  }, [slug]);

  /* ── Update defaults when tipo changes ─────────────────────── */
  const handleTipoChange = useCallback(
    (tipo: TipoProyecto) => {
      setTipoProyecto(tipo);
      setTipologiaFields(getDefaultTipologiaFields(tipo));
      // Smart defaults for pricing
      if (tipo === "apartamentos" || tipo === "hibrido") {
        setPrecioSource("tipologia");
      } else {
        setPrecioSource("unidad");
      }
    },
    []
  );

  /* ── Step 0: Create project ────────────────────────────────── */
  const handleCreateProject = useCallback(() => {
    createProject(
      { nombre, slug },
      {
        onSuccess: (proyecto) => {
          setProjectId(proyecto.id);
          trackDashboardEvent(
            "project_create",
            { project_id: proyecto.id, project_name: nombre },
            userId,
            userRole
          );
          setStep(1);
        },
        onError: (error) => {
          toast.error(error.message || "Error al crear proyecto");
        },
      }
    );
  }, [nombre, slug, createProject, userId, userRole, toast]);

  /* ── Save configuration (before tipologías step) ──────────── */
  const saveConfig = useCallback(async () => {
    if (!projectId) return false;
    setSaving(true);
    try {
      const res = await fetch(`/api/proyectos/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_proyecto: tipoProyecto,
          idioma,
          estado_construccion: estadoConstruccion,
          precio_source: precioSource,
          moneda_base: moneda,
          unidad_medida_base: unidadMedida,
          tipologia_mode: tipologiaMode,
          parqueaderos_mode: parqueaderosMode,
          depositos_mode: depositosMode,
          tipologia_fields: tipologiaFields,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar configuración");
      return true;
    } catch {
      toast.error("Error al guardar la configuración");
      return false;
    } finally {
      setSaving(false);
    }
  }, [projectId, tipoProyecto, idioma, estadoConstruccion, precioSource, moneda, unidadMedida, tipologiaMode, parqueaderosMode, depositosMode, tipologiaFields, toast]);

  /* ── Save tipologías (last step) ──────────────────────────── */
  const saveTipologias = useCallback(async () => {
    if (!projectId || tipologias.length === 0) return true;
    setSaving(true);
    try {
      const results = await Promise.allSettled(
        tipologias.map((tip) =>
          fetch("/api/tipologias", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              proyecto_id: projectId,
              nombre: tip.nombre,
              ...(tip.area_m2 !== undefined && { area_m2: tip.area_m2 }),
              ...(tip.habitaciones !== undefined && { habitaciones: tip.habitaciones }),
              ...(tip.banos !== undefined && { banos: tip.banos }),
            }),
          })
        )
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        toast.error(`${failed} tipología(s) no se pudieron crear`);
      }
      return true;
    } catch {
      toast.error("Error al crear tipologías");
      return false;
    } finally {
      setSaving(false);
    }
  }, [projectId, tipologias, toast]);

  /* ── Navigation ────────────────────────────────────────────── */
  const LAST_STEP = TOTAL_STEPS - 1; // 6

  const handleNext = useCallback(async () => {
    if (step === 0) {
      handleCreateProject();
      return;
    }

    if (step === LAST_STEP - 1) {
      // Save config before moving to last step (crear tipologías)
      const ok = await saveConfig();
      if (!ok) return;
      setStep(LAST_STEP);
      return;
    }

    if (step === LAST_STEP) {
      // Save tipologías and finish
      await saveTipologias();
      router.push(`/editor/${projectId}`);
      return;
    }

    setStep((s) => s + 1);
  }, [step, LAST_STEP, handleCreateProject, saveConfig, saveTipologias, router, projectId]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const handleSkipTipologias = useCallback(async () => {
    if (step === LAST_STEP) {
      router.push(`/editor/${projectId}`);
    }
  }, [router, projectId, step, LAST_STEP]);

  /* ── Can advance? ──────────────────────────────────────────── */
  const canAdvance = (() => {
    if (step === 0) {
      return !!(nombre && slug && slug.length >= 2 && slugAvailable === true && !checkingSlug && !creating);
    }
    if (step === 1) return !!tipoProyecto;
    if (step === 2) return true; // skippable — has defaults
    if (step === 3) return !!precioSource && !!moneda && !!unidadMedida;
    if (step === 4) return true; // skippable — has defaults
    if (step === 5) return true;
    if (step === 6) return true;
    return false;
  })();

  /* ── Button labels ─────────────────────────────────────────── */
  const nextLabel = (() => {
    if (step === 0) return creating ? "Creando..." : "Crear proyecto";
    if (step === LAST_STEP - 1) return saving ? "Guardando..." : "Continuar";
    if (step === LAST_STEP) return saving ? "Creando..." : tipologias.length > 0 ? "Crear y finalizar" : "Finalizar";
    return "Continuar";
  })();

  /* ── Reset on close ────────────────────────────────────────── */
  const handleClose = useCallback(() => {
    setStep(0);
    setProjectId(null);
    setNombre("");
    setSlug("");
    setSlugAvailable(null);
    setTipoProyecto("apartamentos");
    setIdioma("es");
    setEstadoConstruccion("sobre_planos");
    setPrecioSource("tipologia");
    setMoneda("COP");
    setUnidadMedida("m2");
    setTipologiaMode("fija");
    setParqueaderosMode("sin_inventario");
    setDepositosMode("sin_inventario");
    setTipologiaFields(getDefaultTipologiaFields("apartamentos"));
    setTipologias([]);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 8 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-modal p-0 w-full max-w-[32rem] overflow-hidden"
        >
          {/* Progress bar */}
          <WizardProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

          {/* Header */}
          <div className="relative px-7 pt-4 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[rgba(var(--noddo-primary-rgb),0.1)] border border-[rgba(var(--noddo-primary-rgb),0.15)] flex items-center justify-center shrink-0">
                  {step === 0 ? (
                    <Plus size={18} className="text-[var(--noddo-primary)]" />
                  ) : (
                    <Sparkles size={18} className="text-[var(--noddo-primary)]" />
                  )}
                </div>
                <div>
                  <h2 className="font-heading text-xl font-light text-[var(--text-primary)]">
                    {STEP_TITLES[step].es}
                  </h2>
                  <p className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5">
                    {STEP_DESCRIPTIONS[step].es}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1.5 -mr-1.5 -mt-0.5 rounded-lg hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--border-subtle)]" />

          {/* Step content */}
          <div className="px-7 py-6 max-h-[60vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 0 && (
                  <StepIdentidad
                    nombre={nombre}
                    onNombreChange={(v) => {
                      setNombre(v);
                      setSlug(generateSlug(v));
                    }}
                    slug={slug}
                    onSlugChange={(v) => setSlug(generateSlug(v))}
                    slugAvailable={slugAvailable}
                    checkingSlug={checkingSlug}
                  />
                )}
                {step === 1 && (
                  <StepTipoProyecto
                    value={tipoProyecto}
                    onChange={handleTipoChange}
                  />
                )}
                {step === 2 && (
                  <StepIdiomaEstado
                    idioma={idioma}
                    onIdiomaChange={setIdioma}
                    estadoConstruccion={estadoConstruccion}
                    onEstadoConstruccionChange={setEstadoConstruccion}
                  />
                )}
                {step === 3 && (
                  <StepConfigPrecios
                    precioSource={precioSource}
                    onPrecioSourceChange={setPrecioSource}
                    moneda={moneda}
                    onMonedaChange={setMoneda}
                    unidadMedida={unidadMedida}
                    onUnidadMedidaChange={setUnidadMedida}
                    tipologiaMode={tipologiaMode}
                    onTipologiaModeChange={setTipologiaMode}
                  />
                )}
                {step === 4 && (
                  <StepComplementos
                    parqueaderosMode={parqueaderosMode}
                    onParqueaderosModeChange={setParqueaderosMode}
                    depositosMode={depositosMode}
                    onDepositosModeChange={setDepositosMode}
                  />
                )}
                {step === 5 && (
                  <StepCamposTipologia
                    fields={tipologiaFields}
                    onChange={setTipologiaFields}
                    tipoProyecto={tipoProyecto}
                    onReset={() => setTipologiaFields(getDefaultTipologiaFields(tipoProyecto))}
                  />
                )}
                {step === 6 && (
                  <StepCrearTipologias
                    tipologias={tipologias}
                    onAdd={(t) => setTipologias((prev) => [...prev, t])}
                    onRemove={(i) => setTipologias((prev) => prev.filter((_, idx) => idx !== i))}
                    fields={tipologiaFields}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--border-subtle)]" />

          {/* Footer */}
          <div className="px-7 py-5 flex items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 py-2.5 px-4 font-ui text-xs font-bold uppercase tracking-[0.1em] border border-[var(--border-default)] rounded-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all"
              >
                <ArrowLeft size={14} />
                Atrás
              </button>
            ) : step === 0 ? (
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] border border-[var(--border-default)] rounded-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all"
              >
                Cancelar
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {step === LAST_STEP && tipologias.length === 0 && (
              <button
                type="button"
                onClick={handleSkipTipologias}
                className="py-2.5 px-4 font-ui text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Agregar después
              </button>
            )}

            <MagneticButton className={step === 0 ? "flex-1" : ""}>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance || saving}
                className={cn(
                  "btn-noddo py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2",
                  step === 0 ? "w-full" : "px-6"
                )}
              >
                {(creating || saving) && <Loader2 size={14} className="animate-spin" />}
                {nextLabel}
                {step > 0 && step < LAST_STEP && !saving && <ArrowRight size={14} />}
              </button>
            </MagneticButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
