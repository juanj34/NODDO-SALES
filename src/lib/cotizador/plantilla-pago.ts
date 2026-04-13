import type { PlantillaPago, PlantillaPagoFila, PlantillaQuickDef } from "@/types";
import type { PaymentRow } from "./payment-rows";
import { newRowId, addMonthsToDate, formatDateDisplay, parseDateStr } from "./payment-rows";

/* ── Resolve a template into concrete PaymentRow[] ────────────── */

export function resolveTemplate(
  plantilla: PlantillaPago,
  fechaReserva: string,
  fechaEntrega: string,
): PaymentRow[] {
  const reservaDate = parseDateStr(fechaReserva);
  const entregaDate = parseDateStr(fechaEntrega);

  return plantilla.filas.map((fila) => {
    const row: PaymentRow = {
      id: newRowId(),
      nombre: fila.nombre,
      tipo_valor: fila.tipo_valor,
      valor: fila.valor,
      fecha: resolveDate(fila.regla_fecha, reservaDate, entregaDate),
    };

    // Attach construction progress condition if anchored to avance
    if (fila.regla_fecha.tipo === "al_avance" && fila.regla_fecha.porcentaje_avance) {
      row.condicion_hito = `Al ${fila.regla_fecha.porcentaje_avance}% de avance`;
    }

    return row;
  });
}

function resolveDate(
  regla: PlantillaPagoFila["regla_fecha"],
  reserva: Date | null,
  entrega: Date | null,
): string {
  switch (regla.tipo) {
    case "al_reservar":
      return reserva ? formatDateDisplay(reserva) : "";
    case "meses_desde_reserva": {
      if (!reserva || regla.meses == null) return "";
      return formatDateDisplay(addMonthsToDate(reserva, regla.meses));
    }
    case "al_completar":
      return entrega ? formatDateDisplay(entrega) : "";
    case "al_avance":
      return ""; // No concrete date — condition-based
    default:
      return "";
  }
}

/* ── Validate a template ──────────────────────────────────────── */

export function validateTemplate(
  plantilla: PlantillaPago,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (plantilla.filas.length === 0) {
    errors.push("La plantilla debe tener al menos una fila");
  }

  const restoRows = plantilla.filas.filter((f) => f.tipo_valor === "resto");
  if (restoRows.length > 1) {
    errors.push("Solo puede haber una fila de tipo 'Resto'");
  }

  const pctSum = plantilla.filas
    .filter((f) => f.tipo_valor === "porcentaje")
    .reduce((sum, f) => sum + f.valor, 0);

  if (pctSum > 100) {
    errors.push(`Los porcentajes suman ${pctSum}% — no pueden exceder 100%`);
  }

  if (restoRows.length === 0 && pctSum !== 100) {
    const fixedRows = plantilla.filas.filter((f) => f.tipo_valor === "fijo");
    if (fixedRows.length === 0 && Math.abs(pctSum - 100) > 0.01) {
      errors.push(`Los porcentajes suman ${pctSum}% — deben sumar 100% o incluir una fila 'Resto'`);
    }
  }

  for (const fila of plantilla.filas) {
    if (fila.regla_fecha.tipo === "meses_desde_reserva") {
      if (fila.regla_fecha.meses == null || fila.regla_fecha.meses < 0) {
        errors.push(`"${fila.nombre}": los meses deben ser ≥ 0`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/* ── Compute percentage total for UI ──────────────────────────── */

export function templatePctTotal(plantilla: PlantillaPago): number {
  return plantilla.filas
    .filter((f) => f.tipo_valor === "porcentaje")
    .reduce((sum, f) => sum + f.valor, 0);
}

/* ── Expand a quick-create definition into a full template ──── */

export function expandQuickDef(
  def: PlantillaQuickDef,
  nombre: string,
): PlantillaPago {
  const filas: PlantillaPagoFila[] = [];
  const freqMonths = def.frecuencia === "mensual" ? 1
    : def.frecuencia === "bimestral" ? 2 : 3;

  // Separación row (fijo or porcentaje, at reservation)
  if (def.incluye_separacion && def.separacion_monto && def.separacion_monto > 0) {
    const sepTipo = def.separacion_tipo ?? "fijo";
    filas.push({
      id: crypto.randomUUID(),
      nombre: "Separación",
      tipo_valor: sepTipo === "porcentaje" ? "porcentaje" : "fijo",
      valor: def.separacion_monto,
      regla_fecha: { tipo: "al_reservar" },
    });
  }

  // Installment rows
  const pctPerCuota = +(def.porcentaje_inicial / def.cuotas).toFixed(2);
  for (let i = 0; i < def.cuotas; i++) {
    const isLast = i === def.cuotas - 1;
    const pct = isLast
      ? +(def.porcentaje_inicial - pctPerCuota * (def.cuotas - 1)).toFixed(2)
      : pctPerCuota;
    filas.push({
      id: crypto.randomUUID(),
      nombre: `Cuota ${i + 1}`,
      tipo_valor: "porcentaje",
      valor: pct,
      regla_fecha: { tipo: "meses_desde_reserva", meses: (i + 1) * freqMonths },
    });
  }

  // Entrega (resto)
  filas.push({
    id: crypto.randomUUID(),
    nombre: "Entrega",
    tipo_valor: "resto",
    valor: 0,
    regla_fecha: { tipo: "al_completar" },
  });

  return {
    id: crypto.randomUUID(),
    nombre,
    filas,
    es_default: false,
    created_at: new Date().toISOString(),
    quick_def: def,
  };
}
