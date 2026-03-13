import type { CotizadorConfig, ResultadoCotizacion, FaseResultado } from "@/types";

/**
 * Pure calculation engine for real estate quotations.
 * Takes a unit price + project config → returns full payment breakdown.
 * Used in: editor preview, microsite modal, server-side API (source of truth).
 */
export function calcularCotizacion(
  precioUnidad: number,
  config: CotizadorConfig,
  descuentosSeleccionados: string[] = []
): ResultadoCotizacion {
  const precio_base = precioUnidad;

  // Apply selected discounts
  const descuentos_aplicados: { nombre: string; monto: number }[] = [];
  let totalDescuento = 0;

  for (const desc of config.descuentos) {
    if (!descuentosSeleccionados.includes(desc.id)) continue;
    const monto = desc.tipo === "porcentaje"
      ? Math.round(precio_base * (desc.valor / 100))
      : desc.valor;
    descuentos_aplicados.push({ nombre: desc.nombre, monto });
    totalDescuento += monto;
  }

  const precio_neto = precio_base - totalDescuento;

  // Calculate phases
  const fases: FaseResultado[] = [];
  let acumulado = 0;

  for (const fase of config.fases) {
    let monto_total: number;

    switch (fase.tipo) {
      case "fijo":
        monto_total = fase.valor;
        break;
      case "porcentaje":
        monto_total = Math.round(precio_neto * (fase.valor / 100));
        break;
      case "resto":
        monto_total = precio_neto - acumulado;
        break;
      default:
        monto_total = 0;
    }

    // If separación is included in cuota inicial, subtract it
    if (
      config.separacion_incluida_en_inicial &&
      fase.tipo === "porcentaje" &&
      fases.length > 0 &&
      config.fases[0]?.tipo === "fijo"
    ) {
      // This is the cuota inicial phase (first % phase after a fixed separación)
      const separacionMonto = fases[0].monto_total;
      monto_total = Math.max(0, monto_total - separacionMonto);
    }

    const cuotas = Math.max(1, fase.cuotas);
    const monto_por_cuota = Math.round(monto_total / cuotas);

    fases.push({
      nombre: fase.nombre,
      monto_total,
      cuotas,
      monto_por_cuota,
      frecuencia: fase.frecuencia,
    });

    acumulado += monto_total;
  }

  return {
    precio_base,
    descuentos_aplicados,
    precio_neto,
    fases,
  };
}
