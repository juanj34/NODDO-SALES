"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, X, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/currency";
import { createClient } from "@/lib/supabase/client";
import type { Currency } from "@/types";

interface PriceHistoryEntry {
  id: string;
  precio_anterior: number | null;
  precio_nuevo: number;
  changed_at: string;
  changed_by: string;
  notas: string | null;
}

interface PriceAuditBadgeProps {
  tipologiaId: string;
  updatedAt: string | null;
  updatedBy: string | null;
  currency?: Currency;
}

export function PriceAuditBadge({
  tipologiaId,
  updatedAt,
  updatedBy,
  currency = "COP",
}: PriceAuditBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && history.length === 0) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tipologia_precio_historial")
        .select("*")
        .eq("tipologia_id", tipologiaId)
        .order("changed_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Error loading price history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!updatedAt && !updatedBy) {
    return null;
  }

  const lastUpdate = updatedAt ? new Date(updatedAt) : null;
  const timeAgo = lastUpdate
    ? formatDistanceToNow(lastUpdate, { addSuffix: true, locale: es })
    : "Sin datos";

  return (
    <>
      {/* Trigger Button - More visible */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 shrink-0 rounded-lg bg-[rgba(var(--site-primary-rgb),0.08)] border border-[rgba(var(--site-primary-rgb),0.2)] hover:border-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.12)] transition-all text-[var(--site-primary)] group"
      >
        <History size={12} className="group-hover:rotate-12 transition-transform shrink-0" />
        <span className="text-[10px] font-mono whitespace-nowrap">{timeAgo}</span>
      </button>

      {/* Full-screen Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, type: "spring", damping: 25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-2xl max-h-[85vh] overflow-hidden"
            >
              <div className="glass-card p-6 shadow-2xl border border-[var(--border-default)]">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center">
                      <History size={20} className="text-[var(--site-primary)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-heading font-light text-white">
                        Historial de Cambios de Precio
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] font-mono">
                        {history.length} {history.length === 1 ? "cambio" : "cambios"} registrado{history.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors text-[var(--text-tertiary)] hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Timeline */}
                <div className="overflow-y-auto max-h-[calc(85vh-12rem)] pr-2 custom-scrollbar">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-[var(--site-primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-[var(--text-muted)]">No hay cambios registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-0 relative">
                      {/* Timeline line */}
                      <div className="absolute left-[19px] top-4 bottom-4 w-px bg-[var(--border-subtle)]" />

                      {history.map((entry, index) => {
                        const isFirst = index === 0;
                        const isIncrease = entry.precio_anterior
                          ? entry.precio_nuevo > entry.precio_anterior
                          : false;
                        const date = new Date(entry.changed_at);
                        const formattedDate = new Intl.DateTimeFormat("es-CO", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(date);
                        const relativeTime = formatDistanceToNow(date, {
                          addSuffix: true,
                          locale: es,
                        });

                        const priceDiff = entry.precio_anterior
                          ? entry.precio_nuevo - entry.precio_anterior
                          : null;
                        const percentChange =
                          entry.precio_anterior && priceDiff
                            ? (priceDiff / entry.precio_anterior) * 100
                            : null;

                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative pl-12 pb-6 last:pb-0"
                          >
                            {/* Timeline dot */}
                            <div
                              className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center ${
                                isFirst
                                  ? "bg-[var(--site-primary)] shadow-lg shadow-[rgba(var(--site-primary-rgb),0.3)]"
                                  : "bg-[var(--surface-3)] border-2 border-[var(--border-default)]"
                              }`}
                            >
                              {entry.precio_anterior === null ? (
                                <span className="text-xs font-bold text-black">$</span>
                              ) : isIncrease ? (
                                <TrendingUp
                                  size={16}
                                  className={isFirst ? "text-black" : "text-green-400"}
                                />
                              ) : (
                                <TrendingDown
                                  size={16}
                                  className={isFirst ? "text-black" : "text-red-400"}
                                />
                              )}
                            </div>

                            {/* Content */}
                            <div className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors">
                              {/* Header row */}
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {isFirst && (
                                      <span className="px-2 py-0.5 rounded-md bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] text-[9px] font-bold uppercase tracking-wider">
                                        Actual
                                      </span>
                                    )}
                                    {entry.precio_anterior === null && (
                                      <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-[9px] font-bold uppercase tracking-wider">
                                        Inicial
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[var(--text-tertiary)] font-mono">
                                    {formattedDate}
                                  </p>
                                  <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                                    {relativeTime}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-white font-mono">
                                    {formatCurrency(entry.precio_nuevo, currency, {
                                      compact: true,
                                    })}
                                  </p>
                                  {priceDiff !== null && percentChange !== null && (
                                    <div
                                      className={`text-xs font-medium font-mono ${
                                        isIncrease ? "text-green-400" : "text-red-400"
                                      }`}
                                    >
                                      {isIncrease ? "+" : ""}
                                      {formatCurrency(priceDiff, currency, { compact: true })}
                                      <span className="text-[10px] ml-1 opacity-70">
                                        ({isIncrease ? "+" : ""}
                                        {percentChange.toFixed(1)}%)
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Details row */}
                              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                                <div className="text-xs text-[var(--text-tertiary)]">
                                  <span className="uppercase tracking-wide text-[10px] text-[var(--text-muted)] font-bold">
                                    Por
                                  </span>{" "}
                                  <span className="font-mono text-[var(--text-secondary)]">
                                    {entry.changed_by}
                                  </span>
                                </div>
                                {entry.precio_anterior !== null && (
                                  <div className="text-xs text-[var(--text-muted)] font-mono">
                                    Antes:{" "}
                                    {formatCurrency(entry.precio_anterior, currency, {
                                      compact: true,
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    Mostrando últimos {Math.min(history.length, 20)} cambios
                  </p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[var(--surface-3)] hover:bg-[var(--surface-4)] text-white text-sm font-medium transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--surface-1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-default);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--site-primary);
        }
      `}</style>
    </>
  );
}
