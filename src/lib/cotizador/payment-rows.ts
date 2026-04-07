import type { FaseConfig, CotizadorConfig } from "@/types";
import type { DeliveryContext } from "./delivery";
import { adjustFasesToDelivery } from "./delivery";

/* ── Types ─────────────────────────────────────────────── */

export interface PaymentRow {
  id: string;
  nombre: string;
  tipo_valor: "porcentaje" | "fijo" | "resto";
  valor: number; // % number (e.g. 5) or fixed $ amount; ignored for "resto"
  fecha: string; // dd/mm/yyyy or empty
  /** Milestone condition text (e.g. "Al 50% de avance constructivo") */
  condicion_hito?: string;
  /** Reference hito ID (for resolving from templates) */
  hito_id?: string;
}

/* ── ID Generation ─────────────────────────────────────── */

let rowIdCounter = 0;
export function newRowId(): string {
  return `r-${++rowIdCounter}-${Date.now()}`;
}

/* ── Date Helpers ──────────────────────────────────────── */

export function parseDateStr(dateStr: string): Date | null {
  if (!dateStr) return null;
  // dd/mm/yyyy
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return new Date(y, m, d);
  }
  // MM/yyyy (month format from delivery date)
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    if (m >= 1 && m <= 12 && y >= 2000) return new Date(y, m, 0); // last day of month
  }
  // Q1-Q4 format: "Q4 2028" or "Q4-2028"
  const qMatch = dateStr.match(/^Q([1-4])[\s-](\d{4})$/i);
  if (qMatch) {
    const quarter = parseInt(qMatch[1]);
    const year = parseInt(qMatch[2]);
    return new Date(year, quarter * 3, 0); // last day of quarter's last month
  }
  const iso = new Date(dateStr);
  return isNaN(iso.getTime()) ? null : iso;
}

export function formatDateDisplay(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function frecuenciaToMonths(frec: string): number {
  switch (frec) {
    case "mensual": return 1;
    case "bimestral": return 2;
    case "trimestral": return 3;
    default: return 1;
  }
}

/* ── Row Amount Resolution ─────────────────────────────── */

export function resolveRowAmount(
  row: PaymentRow,
  totalPrice: number,
  allRows: PaymentRow[],
): number {
  if (row.tipo_valor === "fijo") return row.valor;
  if (row.tipo_valor === "porcentaje") return Math.round(totalPrice * (row.valor / 100));
  // "resto" → total minus sum of all non-resto rows
  let assigned = 0;
  for (const r of allRows) {
    if (r.tipo_valor === "fijo") assigned += r.valor;
    else if (r.tipo_valor === "porcentaje") assigned += Math.round(totalPrice * (r.valor / 100));
  }
  return totalPrice - assigned;
}

/* ── Balance Computation ───────────────────────────────── */

export function computeBalance(
  rows: PaymentRow[],
  totalPrice: number,
): { assigned: number; remaining: number; pctAssigned: number } {
  let assigned = 0;
  for (const r of rows) {
    if (r.tipo_valor === "fijo") assigned += r.valor;
    else if (r.tipo_valor === "porcentaje") assigned += Math.round(totalPrice * (r.valor / 100));
  }
  const remaining = totalPrice - assigned;
  const pctAssigned = totalPrice > 0 ? Math.round((assigned / totalPrice) * 100) : 0;
  return { assigned, remaining, pctAssigned };
}

/* ── Structure Notation ────────────────────────────────── */

export function deriveStructure(rows: PaymentRow[], totalPrice: number): string {
  if (totalPrice <= 0) return "—";
  const { pctAssigned } = computeBalance(rows, totalPrice);
  const pctDelivery = 100 - pctAssigned;
  if (pctDelivery <= 0) return "100/0";
  return `${pctAssigned}/${pctDelivery}`;
}

/* ── Auto-distribute Dates ─────────────────────────────── */

export function autoDistributeDates(
  rows: PaymentRow[],
  fechaCompra: string,
  fechaEntrega: string,
): PaymentRow[] {
  const purchaseDate = parseDateStr(fechaCompra);
  const deliveryDate = parseDateStr(fechaEntrega);
  if (!purchaseDate || !deliveryDate) return rows;

  const result = [...rows];

  // Find first non-resto row → set to purchase date
  const firstIdx = result.findIndex((r) => r.tipo_valor !== "resto");
  if (firstIdx >= 0) {
    result[firstIdx] = { ...result[firstIdx], fecha: formatDateDisplay(purchaseDate) };
  }

  // Find resto row → set to delivery date
  const restoIdx = result.findIndex((r) => r.tipo_valor === "resto");
  if (restoIdx >= 0) {
    result[restoIdx] = { ...result[restoIdx], fecha: formatDateDisplay(deliveryDate) };
  }

  // Intermediate rows (between first and resto): distribute monthly
  const intermediateStart = firstIdx >= 0 ? firstIdx + 1 : 0;
  const intermediateEnd = restoIdx >= 0 ? restoIdx : result.length;
  const intermediateCount = intermediateEnd - intermediateStart;

  if (intermediateCount > 0) {
    for (let i = 0; i < intermediateCount; i++) {
      const idx = intermediateStart + i;
      const monthOffset = i + 1; // first cuota = purchase + 1 month
      const cuotaDate = addMonthsToDate(purchaseDate, monthOffset);
      result[idx] = { ...result[idx], fecha: formatDateDisplay(cuotaDate) };
    }
  }

  return result;
}

/* ── Config → PaymentRows Expansion ────────────────────── */

function determineSectionFromFase(
  fase: FaseConfig,
  index: number,
): "separacion" | "cuota" | "entrega" {
  const lower = fase.nombre.toLowerCase();
  if (lower.includes("separaci") || lower.includes("booking") || lower.includes("reserv")) return "separacion";
  if (lower.includes("entrega") || lower.includes("handover")) return "entrega";
  if (fase.tipo === "resto") return "entrega";
  if (index === 0 && fase.tipo === "fijo") return "separacion";
  return "cuota";
}

export function paymentRowsFromConfig(
  config: CotizadorConfig,
  totalPrice: number,
  fechaCompra?: string,
  fechaEntrega?: string,
  deliveryContext?: DeliveryContext | null,
): PaymentRow[] {
  const rows: PaymentRow[] = [];

  // If delivery context provided, adjust phases and auto-populate dates
  let fases = config.fases;
  if (deliveryContext) {
    fases = adjustFasesToDelivery(config.fases, deliveryContext.mesesDisponibles).fases;
    if (!fechaCompra) {
      fechaCompra = formatDateDisplay(deliveryContext.fechaInicio);
    }
    if (!fechaEntrega) {
      fechaEntrega = formatDateDisplay(deliveryContext.fechaEntrega);
    }
  }

  for (let i = 0; i < fases.length; i++) {
    const fase = fases[i];
    const section = determineSectionFromFase(fase, i);

    if (section === "entrega" || fase.tipo === "resto") {
      // Entrega → tipo_valor: "resto"
      rows.push({
        id: newRowId(),
        nombre: fase.nombre,
        tipo_valor: "resto",
        valor: 0,
        fecha: fechaEntrega || fase.fecha || "",
        condicion_hito: fase.condicion_hito || undefined,
      });
    } else if (fase.tipo === "porcentaje" && fase.cuotas > 1) {
      // Expand percentage with multiple cuotas into individual rows
      const pctPerCuota = fase.valor / fase.cuotas;
      const startDate = fase.fecha ? parseDateStr(fase.fecha) : (fechaCompra ? parseDateStr(fechaCompra) : null);
      const freqMonths = frecuenciaToMonths(fase.frecuencia);

      for (let j = 0; j < fase.cuotas; j++) {
        const cuotaDate = startDate ? addMonthsToDate(startDate, (j + 1) * freqMonths) : null;
        // Last cuota absorbs rounding: total % - (pctPerCuota * (cuotas-1))
        const isLast = j === fase.cuotas - 1;
        const pct = isLast ? (fase.valor - Math.round(pctPerCuota * 100) / 100 * (fase.cuotas - 1)) : pctPerCuota;
        rows.push({
          id: newRowId(),
          nombre: `Cuota ${j + 1}`,
          tipo_valor: "porcentaje",
          valor: Math.round(pct * 100) / 100, // keep 2 decimals
          fecha: cuotaDate ? formatDateDisplay(cuotaDate) : "",
        });
      }
    } else if (fase.tipo === "porcentaje") {
      // Single percentage row
      rows.push({
        id: newRowId(),
        nombre: fase.nombre,
        tipo_valor: "porcentaje",
        valor: fase.valor,
        fecha: section === "separacion" && fechaCompra ? fechaCompra : (fase.fecha || ""),
        condicion_hito: fase.condicion_hito || undefined,
      });
    } else {
      // Fixed amount row
      rows.push({
        id: newRowId(),
        nombre: fase.nombre,
        tipo_valor: "fijo",
        valor: fase.valor,
        fecha: section === "separacion" && fechaCompra ? fechaCompra : (fase.fecha || ""),
        condicion_hito: fase.condicion_hito || undefined,
      });
    }
  }

  return rows;
}

/* ── PaymentRows → FaseConfig[] (for API) ──────────────── */

export function paymentRowsToFases(
  rows: PaymentRow[],
  totalPrice: number,
): FaseConfig[] {
  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo_valor === "resto" ? ("resto" as const) : ("fijo" as const),
    valor: row.tipo_valor === "porcentaje"
      ? Math.round(totalPrice * (row.valor / 100))
      : row.tipo_valor === "resto"
        ? 0
        : row.valor,
    cuotas: 1,
    frecuencia: "unica" as const,
    fecha: row.fecha || undefined,
    condicion_hito: row.condicion_hito || undefined,
  }));
}
