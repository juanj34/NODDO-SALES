"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { FeatureAdoptionCard } from "@/components/admin/FeatureAdoptionCard";

interface FeatureStats {
  feature: string;
  enabled_count: number;
  adoption_rate: number;
  projects_using: string[];
}

interface FeaturesData {
  total_projects: number;
  features: FeatureStats[];
  top_projects: Array<{
    proyecto_id: string;
    features_count: number;
  }>;
}

export default function AdminFeaturesPage() {
  const [data, setData] = useState<FeaturesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/features");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle size={28} className="text-amber-400 mb-3" />
        <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar features</p>
        <p className="text-[11px] text-[var(--text-muted)] mb-4">Verifica tu conexión e intenta de nuevo</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
        >
          <RefreshCw size={13} /> Reintentar
        </button>
      </div>
    );
  }

  // Ordenar features por adopción (mayor a menor)
  const sortedFeatures = [...data.features].sort((a, b) => b.adoption_rate - a.adoption_rate);

  // Calcular promedio de adopción
  const avgAdoption =
    data.features.reduce((sum, f) => sum + f.adoption_rate, 0) / data.features.length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
              Feature Adoption
            </h1>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Análisis de uso de features por proyecto
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
          >
            <RefreshCw size={13} />
            Actualizar
          </button>
        </div>
      </motion.div>

      {/* Summary stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Total Features
            </span>
            <Sparkles size={14} className="text-[var(--site-primary)]" />
          </div>
          <span className="font-heading text-3xl font-light text-white">
            {data.features.length}
          </span>
        </div>

        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Adopción Promedio
            </span>
          </div>
          <span className="font-heading text-3xl font-light text-white">
            {avgAdoption.toFixed(1)}%
          </span>
        </div>

        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Total Proyectos
            </span>
          </div>
          <span className="font-heading text-3xl font-light text-white">
            {data.total_projects}
          </span>
        </div>
      </motion.div>

      {/* Features grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
          Features Disponibles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFeatures.map((feature, i) => (
            <motion.div
              key={feature.feature}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.03, duration: 0.3 }}
            >
              <FeatureAdoptionCard
                feature={feature.feature}
                enabledCount={feature.enabled_count}
                adoptionRate={feature.adoption_rate}
                totalProjects={data.total_projects}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Top projects by feature count */}
      {data.top_projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5"
        >
          <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
            Proyectos con Más Features
          </h2>
          <div className="space-y-2">
            {data.top_projects.slice(0, 5).map((project, i) => (
              <div
                key={project.proyecto_id}
                className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--text-muted)] w-6">
                    #{i + 1}
                  </span>
                  <span className="text-xs text-[var(--text-primary)] font-mono truncate">
                    {project.proyecto_id.slice(0, 8)}...
                  </span>
                </div>
                <span
                  className="px-2 py-1 rounded-md font-ui text-[9px] font-bold uppercase tracking-wider bg-[rgba(var(--site-primary-rgb),0.15)]"
                  style={{ color: "#b8973a" }}
                >
                  {project.features_count} feature{project.features_count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
