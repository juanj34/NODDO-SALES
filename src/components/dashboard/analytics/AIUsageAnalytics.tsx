"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Database, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

interface AIUsageStats {
  period: string;
  summary: {
    total: number;
    cached: number;
    geminiCalls: number;
    cacheHitRate: number;
    totalInputChars: number;
    totalOutputChars: number;
    estimatedCost: number;
  };
  styleBreakdown: Record<
    string,
    { count: number; avgInputLength: number; avgOutputLength: number }
  >;
  dailyUsage: Array<{
    date: string;
    total: number;
    cached: number;
    gemini: number;
  }>;
}

const STYLE_LABELS: Record<string, string> = {
  expandir: "📝 Expandir",
  resumir: "✂️ Resumir",
  tono_premium: "✨ Tono Premium",
  corregir: "✓ Corregir",
};

export function AIUsageAnalytics() {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/ai-usage?period=${period}`);
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--noddo-primary)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
        Error: {error}
      </div>
    );
  }

  if (!stats) return null;

  const { summary, styleBreakdown, dailyUsage } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles size={20} className="text-[var(--noddo-primary)]" />
            Uso de IA para Mejora de Textos
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Estadísticas de mejoras con inteligencia artificial
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? "bg-[var(--noddo-primary)] text-black"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]"
              }`}
            >
              {p === "7d" ? "7 días" : p === "30d" ? "30 días" : "90 días"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)]"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[rgba(var(--noddo-primary-rgb),0.15)]">
              <TrendingUp size={18} className="text-[var(--noddo-primary)]" />
            </div>
            <p className="text-xs font-ui font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              Total Mejoras
            </p>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            {summary.total.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {summary.geminiCalls} llamadas a Gemini
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)]"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[rgba(var(--noddo-primary-rgb),0.15)]">
              <Database size={18} className="text-[var(--noddo-primary)]" />
            </div>
            <p className="text-xs font-ui font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              Cache Hit Rate
            </p>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            {summary.cacheHitRate}%
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {summary.cached} desde cache
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)]"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[rgba(var(--noddo-primary-rgb),0.15)]">
              <Sparkles size={18} className="text-[var(--noddo-primary)]" />
            </div>
            <p className="text-xs font-ui font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              Caracteres
            </p>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            {(summary.totalInputChars / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {(summary.totalOutputChars / 1000).toFixed(1)}K generados
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)]"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[rgba(var(--noddo-primary-rgb),0.15)]">
              <DollarSign size={18} className="text-[var(--noddo-primary)]" />
            </div>
            <p className="text-xs font-ui font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              Costo Estimado
            </p>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            ${summary.estimatedCost.toFixed(2)}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Gemini Flash API
          </p>
        </motion.div>
      </div>

      {/* Style Breakdown */}
      <div className="p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)]">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Estilos Más Usados
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(styleBreakdown || {})
            .sort(([, a], [, b]) => b.count - a.count)
            .map(([style, data]) => {
              const percentage =
                summary.total > 0 ? (data.count / summary.total) * 100 : 0;
              return (
                <div
                  key={style}
                  className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {STYLE_LABELS[style] || style}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {data.count} veces
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--noddo-primary)] rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Promedio: {data.avgInputLength} → {data.avgOutputLength}{" "}
                    chars
                  </p>
                </div>
              );
            })}
        </div>
      </div>

      {/* Daily Usage Chart */}
      <div className="p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)]">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Uso Diario (últimos 7 días)
        </h4>
        <div className="space-y-3">
          {dailyUsage.map((day) => {
            const maxDay = Math.max(...dailyUsage.map((d) => d.total));
            const percentage = maxDay > 0 ? (day.total / maxDay) * 100 : 0;
            return (
              <div key={day.date} className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-tertiary)] w-24 font-mono">
                  {new Date(day.date).toLocaleDateString("es", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex-1 h-8 bg-[var(--surface-2)] rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--noddo-primary)] to-[var(--noddo-secondary)] rounded-lg transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-end px-3 text-xs font-medium text-[var(--text-primary)]">
                    {day.total > 0 && (
                      <>
                        {day.total} total ({day.gemini} Gemini, {day.cached}{" "}
                        cache)
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
