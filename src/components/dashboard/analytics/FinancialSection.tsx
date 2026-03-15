"use client";

import { sectionCard, sectionTitle, sectionDescription } from "@/components/dashboard/editor-styles";
import { DollarSign, TrendingUp, Package, Clock } from "lucide-react";
import { KPICard } from "./KPICard";
import { RevenueChart } from "./RevenueChart";
import { UnitsSoldTable } from "./UnitsSoldTable";
import type { FinancialMetrics } from "@/types";

interface Props {
  financial: FinancialMetrics;
}

export function FinancialSection({ financial }: Props) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: financial.currency,
      minimumFractionDigits: 0,
    }).format(amount);

  const sellThroughRate = financial.total_units > 0
    ? ((financial.vendida_count / financial.total_units) * 100).toFixed(1)
    : "0";

  return (
    <>
      {/* KPIs financieros */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard
          label="Ingresos totales"
          value={formatCurrency(financial.total_revenue)}
          icon={<DollarSign size={16} />}
        />
        <KPICard
          label="Inventario disponible"
          value={formatCurrency(financial.available_inventory_value)}
          icon={<Package size={16} />}
        />
        <KPICard
          label="Ritmo de ventas"
          value={financial.sales_velocity.toFixed(1)}
          suffix="unidades/mes"
          icon={<TrendingUp size={16} />}
        />
        <KPICard
          label="Sell-through"
          value={`${sellThroughRate}%`}
          icon={<Clock size={16} />}
        />
      </div>

      {/* Gráfico de ingresos mensuales */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <DollarSign size={14} className="text-[var(--site-primary)]" />
          Ingresos mensuales
        </div>
        <p className={sectionDescription}>Evolución de ventas en el periodo seleccionado</p>
        <RevenueChart data={financial.monthly_revenue} currency={financial.currency} />
      </div>

      {/* Tabla de unidades vendidas */}
      <div className={sectionCard}>
        <div className={sectionTitle}>Unidades vendidas</div>
        <p className={sectionDescription}>
          Detalle de {financial.units_sold_detail.length} unidades vendidas en el periodo
        </p>
        <UnitsSoldTable units={financial.units_sold_detail} currency={financial.currency} />
      </div>
    </>
  );
}
