"use client";

import type { FinancieroProjectBreakdown } from "@/types";

interface Props {
  projects: FinancieroProjectBreakdown[];
}

export function ProjectFinancialTable({ projects }: Props) {
  if (projects.length === 0) return null;

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      notation: "compact",
    }).format(amount);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="text-left py-3 px-3 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px]">
              Proyecto
            </th>
            <th className="text-right py-3 px-3 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px]">
              Ingresos
            </th>
            <th className="text-right py-3 px-3 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px]">
              Inv. Disponible
            </th>
            <th className="text-center py-3 px-3 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px] hidden sm:table-cell">
              Disponible
            </th>
            <th className="text-center py-3 px-3 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px] hidden sm:table-cell">
              Separado
            </th>
            <th className="text-center py-3 px-3 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px] hidden md:table-cell">
              Reservada
            </th>
            <th className="text-center py-3 px-3 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px]">
              Vendida
            </th>
            <th className="text-right py-3 px-3 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px]">
              Sell-through
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const f = p.financial;
            const totalUnits = f.total_units || 1;
            const sellThrough = ((f.vendida_count / totalUnits) * 100).toFixed(1);
            const separado = totalUnits - f.disponible_count - f.vendida_count - f.reservada_count;

            return (
              <tr
                key={p.id}
                className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <td className="py-3 px-3">
                  <span className="font-mono text-white text-[12px]">
                    {p.nombre}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono text-white font-medium text-[12px]">
                  {formatCurrency(f.total_revenue, p.currency)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)] text-[12px]">
                  {formatCurrency(f.available_inventory_value, p.currency)}
                </td>
                <td className="py-3 px-3 text-center hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-secondary)]">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    {f.disponible_count}
                  </span>
                </td>
                <td className="py-3 px-3 text-center hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-secondary)]">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    {separado > 0 ? separado : 0}
                  </span>
                </td>
                <td className="py-3 px-3 text-center hidden md:table-cell">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-secondary)]">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    {f.reservada_count}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-secondary)]">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    {f.vendida_count}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono text-[var(--site-primary)] text-[12px] font-medium">
                  {sellThrough}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
