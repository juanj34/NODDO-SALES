"use client";

interface Props {
  disponible: number;
  proximamente: number;
  separado: number;
  reservada: number;
  vendida: number;
}

const STATUS_CONFIG = [
  { key: "disponible", label: "Disponible", color: "#22c55e" },
  { key: "proximamente", label: "Próximamente", color: "#3b82f6" },
  { key: "separado", label: "Separado", color: "#f59e0b" },
  { key: "reservada", label: "Reservada", color: "#f97316" },
  { key: "vendida", label: "Vendida", color: "#ef4444" },
] as const;

export function InventoryBreakdown({
  disponible,
  proximamente,
  separado,
  reservada,
  vendida,
}: Props) {
  const counts: Record<string, number> = {
    disponible,
    proximamente,
    separado,
    reservada,
    vendida,
  };
  const total = disponible + proximamente + separado + reservada + vendida;

  if (total === 0) {
    return (
      <div className="text-[var(--text-muted)] text-xs py-8 text-center">
        No hay unidades registradas
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_CONFIG.map(({ key, label, color }) => (
          <div
            key={key}
            className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-subtle)]"
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <div>
              <p className="font-heading text-xl font-light text-white leading-none">
                {counts[key]}
              </p>
              <p className="font-ui text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] mt-0.5">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="flex h-2 rounded-full overflow-hidden mt-4 bg-[var(--surface-3)]">
        {STATUS_CONFIG.map(({ key, color }) => {
          const pct = total > 0 ? (counts[key] / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className="h-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          );
        })}
      </div>
    </div>
  );
}
