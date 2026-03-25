import type { CotizadorConfig, DescuentoConfig, ResultadoCotizacion, FaseResultado, ComplementoSeleccion } from "@/types";
import type { DeliveryContext } from "./delivery";
import { adjustFasesToDelivery } from "./delivery";

/**
 * Build virtual ComplementoSeleccion items for precio_base mode.
 * These are not real DB records — just count × price items that flow
 * through the same suma_al_total calculation path.
 */
export function buildPrecioBaseComplementos(
  parqCount: number,
  parqPrecio: number | null,
  depoCount: number,
  depoPrecio: number | null,
): ComplementoSeleccion[] {
  const result: ComplementoSeleccion[] = [];

  if (parqCount > 0 && parqPrecio != null && parqPrecio > 0) {
    result.push({
      complemento_id: "__precio_base_parqueadero__",
      tipo: "parqueadero",
      identificador: `${parqCount} parqueadero${parqCount > 1 ? "s" : ""}`,
      subtipo: null,
      precio: parqCount * parqPrecio,
      suma_al_total: true,
      cantidad: parqCount,
      es_precio_base: true,
    });
  }

  if (depoCount > 0 && depoPrecio != null && depoPrecio > 0) {
    result.push({
      complemento_id: "__precio_base_deposito__",
      tipo: "deposito",
      identificador: `${depoCount} depósito${depoCount > 1 ? "s" : ""}`,
      subtipo: null,
      precio: depoCount * depoPrecio,
      suma_al_total: true,
      cantidad: depoCount,
      es_precio_base: true,
    });
  }

  return result;
}

/**
 * Pure calculation engine for real estate quotations.
 * Takes a unit price + project config → returns full payment breakdown.
 * Used in: editor preview, microsite modal, server-side API (source of truth).
 *
 * When complementos are provided with suma_al_total=true, their prices
 * add to the total before phase calculations.
 */
export function calcularCotizacion(
  precioUnidad: number,
  config: CotizadorConfig,
  descuentos: DescuentoConfig[] = [],
  complementos: ComplementoSeleccion[] = [],
  deliveryContext?: DeliveryContext | null,
): ResultadoCotizacion {
  const precio_base = precioUnidad;

  // Apply ad-hoc discounts
  const descuentos_aplicados: { nombre: string; monto: number }[] = [];
  let totalDescuento = 0;

  for (const desc of descuentos) {
    const monto = desc.tipo === "porcentaje"
      ? Math.round(precio_base * (desc.valor / 100))
      : desc.valor;
    descuentos_aplicados.push({ nombre: desc.nombre, monto });
    totalDescuento += monto;
  }

  const precio_neto = precio_base - totalDescuento;

  // Sum complementos that add to total (inventario_separado / precio_base / extras)
  const complementos_total = complementos
    .filter((c) => c.suma_al_total && (c.precio != null || c.precio_negociado != null))
    .reduce((sum, c) => sum + (c.precio_negociado ?? c.precio ?? 0), 0);

  const precio_total = precio_neto + complementos_total;

  // Adjust phases for delivery timeline if configured
  const effectiveFases = deliveryContext
    ? adjustFasesToDelivery(config.fases, deliveryContext.mesesDisponibles).fases
    : config.fases;

  // Calculate phases on precio_total (includes complementos if any)
  const fases: FaseResultado[] = [];
  let acumulado = 0;
  // Separación always forms part of the cuota inicial — deduct once from the first % phase
  const shouldDeductSeparacion = effectiveFases[0]?.tipo === "fijo" && effectiveFases.length > 1;
  let separacionDeducted = false;

  for (const fase of effectiveFases) {
    let monto_total: number;

    switch (fase.tipo) {
      case "fijo":
        monto_total = fase.valor;
        break;
      case "porcentaje":
        monto_total = Math.round(precio_total * (fase.valor / 100));
        break;
      case "resto":
        monto_total = precio_total - acumulado;
        break;
      default:
        monto_total = 0;
    }

    // Separación is always part of cuota inicial — subtract from the first % phase only
    if (
      shouldDeductSeparacion &&
      !separacionDeducted &&
      fase.tipo === "porcentaje" &&
      fases.length > 0
    ) {
      const separacionMonto = fases[0].monto_total;
      monto_total = Math.max(0, monto_total - separacionMonto);
      separacionDeducted = true;
    }

    const cuotas = Math.max(1, fase.cuotas);
    const monto_por_cuota = Math.round(monto_total / cuotas);

    fases.push({
      nombre: fase.nombre,
      monto_total,
      cuotas,
      monto_por_cuota,
      frecuencia: fase.frecuencia,
      fecha: fase.fecha || undefined,
      porcentaje: precio_total > 0 ? Math.round((monto_total / precio_total) * 100) : 0,
    });

    acumulado += monto_total;
  }

  const admin_fee = config.admin_fee ?? 0;

  // Calculate taxes on precio_total (includes complementos)
  const impuestos_aplicados = (config.impuestos ?? [])
    .filter((imp) => imp.porcentaje > 0)
    .map((imp) => ({
      nombre: imp.nombre,
      monto: Math.round(precio_total * (imp.porcentaje / 100)),
      porcentaje: imp.porcentaje,
    }));
  const impuestos_total = impuestos_aplicados.reduce((sum, imp) => sum + imp.monto, 0);

  return {
    precio_base,
    descuentos_aplicados,
    precio_neto,
    fases,
    complementos: complementos.length > 0 ? complementos : undefined,
    complementos_total: complementos.length > 0 ? complementos_total : undefined,
    precio_total: complementos.length > 0 ? precio_total : undefined,
    admin_fee: admin_fee > 0 ? admin_fee : undefined,
    admin_fee_label: config.admin_fee_label || undefined,
    impuestos_aplicados: impuestos_aplicados.length > 0 ? impuestos_aplicados : undefined,
    impuestos_total: impuestos_total > 0 ? impuestos_total : undefined,
    fecha_entrega_calculada: deliveryContext
      ? deliveryContext.fechaEntrega.toISOString().split("T")[0]
      : undefined,
    meses_restantes: deliveryContext?.mesesDisponibles,
  };
}
