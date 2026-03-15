"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HardDrive,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Globe,
  Film,
  Image,
} from "lucide-react";

interface StorageProject {
  id: string;
  nombre: string;
  slug: string;
  ownerEmail: string;
  tours_bytes: number;
  videos_bytes: number;
  media_bytes: number;
  total_bytes: number;
  limit_bytes: number;
  pct_used: number;
}

interface StorageSummary {
  total_bytes: number;
  tours_bytes: number;
  videos_bytes: number;
  media_bytes: number;
  total_limit_bytes: number;
  pct_used: number;
}

interface StorageData {
  summary: StorageSummary;
  projects: StorageProject[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getBarColor(pct: number): string {
  if (pct >= 80) return "#ef4444";
  if (pct >= 60) return "#f59e0b";
  return "#b8973a";
}

export default function AdminStoragePage() {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/storage");
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
        <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar datos de storage</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 mt-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
        >
          <RefreshCw size={13} /> Reintentar
        </button>
      </div>
    );
  }

  const { summary, projects } = data;
  const kpis = [
    { label: "Total Usado", value: formatBytes(summary.total_bytes), icon: HardDrive, pct: summary.pct_used },
    { label: "Tours 360", value: formatBytes(summary.tours_bytes), icon: Globe, pct: summary.total_bytes > 0 ? Math.round((summary.tours_bytes / summary.total_bytes) * 100) : 0 },
    { label: "Videos", value: formatBytes(summary.videos_bytes), icon: Film, pct: summary.total_bytes > 0 ? Math.round((summary.videos_bytes / summary.total_bytes) * 100) : 0 },
    { label: "Media", value: formatBytes(summary.media_bytes), icon: Image, pct: summary.total_bytes > 0 ? Math.round((summary.media_bytes / summary.total_bytes) * 100) : 0 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
          Almacenamiento
        </h1>
        <p className="text-[var(--text-tertiary)] text-sm mt-1">
          Uso de almacenamiento global de la plataforma
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
                  <Icon size={14} className="text-[var(--text-tertiary)]" />
                </div>
                <span className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {kpi.label}
                </span>
              </div>
              <p className="font-heading text-xl font-light text-white mb-1">
                {kpi.value}
              </p>
              <p className="font-mono text-[10px] text-[var(--text-muted)] mb-2">
                {kpi.label === "Total Usado" ? `de ${formatBytes(summary.total_limit_bytes)}` : `${kpi.pct}% del total`}
              </p>
              <div className="h-1.5 w-full bg-[var(--surface-3)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(kpi.pct, 100)}%`,
                    backgroundColor: kpi.label === "Total Usado" ? getBarColor(kpi.pct) : "#b8973a",
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Projects table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
          <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Top Proyectos por Uso
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
                <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Proyecto</th>
                <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Owner</th>
                <th className="text-right px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Tours</th>
                <th className="text-right px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Videos</th>
                <th className="text-right px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Media</th>
                <th className="text-right px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total</th>
                <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] w-32">Uso</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs text-[var(--text-primary)]">{p.nombre}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-[var(--text-tertiary)]">{p.ownerEmail}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{formatBytes(p.tours_bytes)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{formatBytes(p.videos_bytes)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{formatBytes(p.media_bytes)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-xs text-white">{formatBytes(p.total_bytes)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(p.pct_used, 100)}%`,
                            backgroundColor: getBarColor(p.pct_used),
                          }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-[var(--text-muted)] w-8 text-right">
                        {p.pct_used}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <HardDrive size={24} className="text-[var(--text-muted)] mb-3" />
            <p className="text-sm text-[var(--text-tertiary)]">No hay datos de almacenamiento</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
