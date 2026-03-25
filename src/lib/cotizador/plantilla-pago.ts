import type { PlantillaPago, PlantillaPagoFila } from "@/types";
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

  return plantilla.filas.map((fila) => ({
    id: newRowId(),
    nombre: fila.nombre,
    tipo_valor: fila.tipo_valor,
    valor: fila.valor,
    fecha: resolveDate(fila.regla_fecha, reservaDate, entregaDate),
  }));
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
