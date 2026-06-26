import type {
  CotizacionView,
  BuildCotizacionDataInput,
  ViewFase,
  ViewCargo,
  ViewComplemento,
} from "./types";
import type { ComplementoSeleccion } from "@/types";

const DEFAULT_PRIMARY = "#b8973a";

function complementoLabel(c: ComplementoSeleccion): string {
  const tipo =
    c.tipo === "parqueadero" ? "Parqueadero" : c.tipo === "deposito" ? "Depósito" : "Adicional";
  let s = `${tipo}: ${c.identificador}`;
  if (c.subtipo) s += ` (${c.subtipo})`;
  if (c.cantidad && c.cantidad > 1) s += ` ×${c.cantidad}`;
  if (c.es_extra) s += " — adicional";
  return s;
}

function complementoPrecio(c: ComplementoSeleccion): number | null {
  const p = c.precio_negociado ?? c.precio;
  if (p == null) return null;
  return p * (c.cantidad ?? 1);
}

/**
 * Fold an already-priced quote into a flat, render-ready CotizacionView.
 * Pure: no IO, no async, no re-pricing. The phases come straight from
 * resultado.fases (which calcular.ts already computed on the negotiated price).
 */
export function buildCotizacionData(input: BuildCotizacionDataInput): CotizacionView {
  const { resultado, proyecto, unidad, agente, buyer } = input;

  // Plan total = what the phases sum to (precio_total when complementos exist, else precio_neto).
  const planTotal = resultado.precio_total ?? resultado.precio_neto;
  const cargosTotal = resultado.cargos_total ?? 0;
  const grandTotal = planTotal + cargosTotal;

  const fases: ViewFase[] = resultado.fases.map((f) => ({
    nombre: f.nombre,
    montoTotal: f.monto_total,
    cuotas: f.cuotas,
    montoPorCuota: f.monto_por_cuota,
    frecuencia: f.frecuencia,
    fecha: f.fecha ?? null,
    porcentaje:
      f.porcentaje ?? (planTotal > 0 ? Math.round((f.monto_total / planTotal) * 100) : 0),
    condicionHito: f.condicion_hito ?? null,
  }));

  const cargos: ViewCargo[] = (resultado.cargos_aplicados ?? []).map((c) => ({
    nombre: c.nombre,
    monto: c.monto,
    tipo: c.tipo,
    porcentaje: c.porcentaje ?? null,
  }));

  const descuentos = resultado.descuentos_aplicados.map((d) => ({
    nombre: d.nombre,
    monto: d.monto,
  }));

  const complementos: ViewComplemento[] = input.complementos.map((c) => {
    const precio = complementoPrecio(c);
    return {
      label: complementoLabel(c),
      precio,
      incluido: (precio == null || precio === 0) && !c.suma_al_total,
    };
  });
  const complementosTotal = resultado.complementos_total ?? 0;

  return {
    proyectoNombre: proyecto.nombre,
    constructoraNombre: proyecto.constructoraNombre,
    colorPrimario: proyecto.colorPrimario || DEFAULT_PRIMARY,
    logoUrl: proyecto.logoUrl,
    constructoraLogoUrl: proyecto.constructoraLogoUrl,
    coverUrl: proyecto.coverUrl,
    renders: proyecto.renders ?? [],
    planoUrl: proyecto.planoUrl,
    ubicacionDireccion: proyecto.ubicacionDireccion,
    estadoConstruccion: proyecto.estadoConstruccion ?? "sobre_planos",
    whatsappNumero: proyecto.whatsappNumero,
    tour360Url: proyecto.tour360Url,

    unidadId: unidad.identificador,
    tipologiaName: unidad.tipologiaName,
    areaConstruida: unidad.areaConstruida,
    areaPrivada: unidad.areaPrivada,
    areaLote: unidad.areaLote,
    areaM2: unidad.areaM2,
    unidadMedida: unidad.unidadMedida,
    piso: unidad.piso,
    vista: unidad.vista,
    habitaciones: unidad.habitaciones,
    banos: unidad.banos,
    orientacion: unidad.orientacion,
    parqueaderos: unidad.parqueaderos,
    depositos: unidad.depositos,
    features: unidad.features ?? {},

    moneda: input.moneda,
    monedaSecundaria: input.monedaSecundaria,
    tipoCambio: input.tipoCambio,
    precioBase: resultado.precio_base,
    descuentos,
    planTotal,
    cargos,
    cargosTotal,
    grandTotal,
    complementos,
    complementosTotal,
    fases,
    paymentPlanNombre: input.paymentPlanNombre,

    agenteNombre: agente.nombre,
    agenteTelefono: agente.telefono,
    agenteEmail: agente.email,
    buyerNombre: buyer.nombre,
    buyerEmail: buyer.email,
    buyerTelefono: buyer.telefono,

    fechaDisplay: input.fechaDisplay,
    fechaEstimadaEntrega: input.fechaEstimadaEntrega,
    referenceNumber: input.referenceNumber,
    notasLegales: input.notasLegales,
    idioma: input.idioma,
  };
}
