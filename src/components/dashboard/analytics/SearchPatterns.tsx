"use client";

import { motion } from "framer-motion";
import { Search, TrendingUp } from "lucide-react";

interface Props {
  searches: Array<{ query: string; count: number }>;
}

export function SearchPatterns({ searches }: Props) {
  const totalSearches = searches.reduce((sum, s) => sum + s.count, 0);
  const maxCount = searches.length > 0 ? Math.max(...searches.map((s) => s.count)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="
        bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]
        border border-[var(--border-subtle)]
        rounded-2xl
        p-6
      "
    >
      <div className="mb-4">
        <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-white mb-1">
          Búsquedas populares
        </h3>
        <p className="font-mono text-xs text-[var(--text-tertiary)]">
          {totalSearches} búsquedas totales
        </p>
      </div>

      <div className="space-y-2.5">
        {searches.slice(0, 8).map((item, idx) => {
          const percentage = (item.count / maxCount) * 100;

          return (
            <motion.div
              key={item.query}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.04, duration: 0.3 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search size={12} className="text-[var(--text-muted)] shrink-0" />
                  <p className="font-mono text-xs text-white truncate">
                    "{item.query}"
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs text-[var(--text-tertiary)]">
                    {item.count}x
                  </span>
                  <TrendingUp size={12} className="text-[var(--site-primary)]" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: 0.3 + idx * 0.04, duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-[var(--site-primary)] to-[rgba(var(--site-primary-rgb),0.6)] rounded-full"
                />
              </div>
            </motion.div>
          );
        })}

        {searches.length === 0 && (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">
            No hay búsquedas registradas
          </p>
        )}
      </div>
    </motion.div>
  );
}
