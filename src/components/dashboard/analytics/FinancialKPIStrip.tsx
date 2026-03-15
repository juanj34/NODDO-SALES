"use client";

import {
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { KPICard } from "./KPICard";
import type { Currency } from "@/types";

interface Props {
  totalRevenue: number;
  availableValue: number;
  reservedValue: number;
  salesVelocity: number;
  sellThroughRate: number;
  totalUnits: number;
  currency: Currency;
}

export function FinancialKPIStrip({
  totalRevenue,
  availableValue,
  reservedValue,
  salesVelocity,
  sellThroughRate,
  totalUnits,
  currency,
}: Props) {
  const fmt = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard
        label="Ingresos totales"
        value={fmt(totalRevenue)}
        icon={<DollarSign size={16} />}
      />
      <KPICard
        label="Inventario disponible"
        value={fmt(availableValue)}
        icon={<Package size={16} />}
      />
      <KPICard
        label="Valor reservado"
        value={fmt(reservedValue)}
        icon={<ShieldCheck size={16} />}
      />
      <KPICard
        label="Ritmo de ventas"
        value={salesVelocity.toFixed(1)}
        suffix="unidades/mes"
        icon={<TrendingUp size={16} />}
      />
      <KPICard
        label="Sell-through"
        value={`${sellThroughRate}%`}
        icon={<Clock size={16} />}
      />
      <KPICard
        label="Total unidades"
        value={totalUnits}
        icon={<Layers size={16} />}
      />
    </div>
  );
}
