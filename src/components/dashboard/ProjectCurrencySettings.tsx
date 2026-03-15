"use client";

import { useState } from "react";
import { CURRENCY_CONFIG } from "@/lib/currency";
import type { Currency, UnitOfMeasurement } from "@/types";
import { UNIT_CONFIG } from "@/lib/units";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { DollarSign, Ruler } from "lucide-react";

interface ProjectCurrencySettingsProps {
  monedaBase: Currency;
  unidadMedidaBase: UnitOfMeasurement;
  onUpdate: (updates: {
    moneda_base?: Currency;
    unidad_medida_base?: UnitOfMeasurement;
  }) => Promise<void>;
}

export function ProjectCurrencySettings({
  monedaBase,
  unidadMedidaBase,
  onUpdate,
}: ProjectCurrencySettingsProps) {
  const [saving, setSaving] = useState(false);

  const currencyOptions = Object.entries(CURRENCY_CONFIG).map(([code, config]) => ({
    value: code,
    label: `${config.symbol} ${code} — ${config.name}`,
  }));

  const unitOptions = Object.entries(UNIT_CONFIG).map(([code, config]) => ({
    value: code,
    label: `${config.symbol} — ${config.namePlural}`,
  }));

  const handleCurrencyChange = async (value: string) => {
    setSaving(true);
    try {
      await onUpdate({ moneda_base: value as Currency });
    } finally {
      setSaving(false);
    }
  };

  const handleUnitChange = async (value: string) => {
    setSaving(true);
    try {
      await onUpdate({ unidad_medida_base: value as UnitOfMeasurement });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Currency */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
          <DollarSign size={14} />
          Moneda base del proyecto
        </label>
        <NodDoDropdown
          variant="dashboard"
          size="md"
          value={monedaBase}
          onChange={handleCurrencyChange}
          options={currencyOptions}
          disabled={saving}
        />
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
          Todos los precios en el editor se manejarán en esta moneda. Los visitantes del
          microsite podrán ver los precios en otras monedas.
        </p>
      </div>

      {/* Unit */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
          <Ruler size={14} />
          Unidad de medida base
        </label>
        <NodDoDropdown
          variant="dashboard"
          size="md"
          value={unidadMedidaBase}
          onChange={handleUnitChange}
          options={unitOptions}
          disabled={saving}
        />
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
          Todas las áreas en el editor se manejarán en esta unidad. Los visitantes podrán
          alternar entre m² y sqft en el microsite.
        </p>
      </div>
    </div>
  );
}
