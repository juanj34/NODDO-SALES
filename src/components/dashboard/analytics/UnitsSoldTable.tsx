"use client";

import type { UnitSoldDetail, Currency } from "@/types";

interface Props {
  units: UnitSoldDetail[];
  currency: Currency;
}

export function UnitsSoldTable({ units, currency }: Props) {
  if (units.length === 0) {
    return (
      <div className="text-[var(--text-muted)] text-xs py-8 text-center">
        No hay unidades vendidas en este periodo
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

  // Agrupar por mes
  const byMonth = units.reduce((acc, u) => {
    if (!acc[u.month]) acc[u.month] = [];
    acc[u.month].push(u);
    return acc;
  }, {} as Record<string, UnitSoldDetail[]>);

  return (
    <div className="space-y-6 mt-4">
      {Object.entries(byMonth)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, monthUnits]) => (
          <div key={month}>
            <h3 className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--site-primary)] mb-2">
              {new Date(month + "-01").toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="text-left py-2 px-2 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px]">
                      Unidad
                    </th>
                    <th className="text-left py-2 px-2 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px]">
                      Tipología
                    </th>
                    <th className="text-right py-2 px-2 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px]">
                      Área
                    </th>
                    <th className="text-right py-2 px-2 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px]">
                      Precio
                    </th>
                    <th className="text-right py-2 px-2 font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] text-[9px]">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthUnits.map((u) => (
                    <tr key={u.unidad_id} className="border-b border-[var(--border-subtle)]">
                      <td className="py-2 px-2 font-mono text-white">{u.identificador}</td>
                      <td className="py-2 px-2 font-mono text-[var(--text-secondary)]">{u.tipologia || "—"}</td>
                      <td className="py-2 px-2 font-mono text-[var(--text-secondary)] text-right">
                        {u.area_m2 ? `${u.area_m2.toFixed(1)} m²` : "—"}
                      </td>
                      <td className="py-2 px-2 font-mono text-white text-right font-medium">
                        {formatCurrency(u.precio)}
                      </td>
                      <td className="py-2 px-2 font-mono text-[var(--text-tertiary)] text-right">
                        {formatDate(u.sold_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
}
