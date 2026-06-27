import type { BuildCotizacionDataInput } from "./types";
import type { CotizadorConfig, ResultadoCotizacion, ComplementoSeleccion, Currency } from "@/types";
import type { EmailLocale } from "@/lib/email-i18n";

interface DbRowsInput {
  resultado: ResultadoCotizacion;
  config: CotizadorConfig;
  moneda: Currency;
  proyecto: {
    nombre: string;
    constructora_nombre: string | null;
    color_primario: string | null;
    ubicacion_direccion: string | null;
    estado_construccion: "sobre_planos" | "en_construccion" | "entregado" | null;
    logo_url: string | null;
    constructora_logo_url: string | null;
    cover_url: string | null;
    renders: string[];
    plano_url: string | null;
    whatsapp_numero: string | null;
    tour_360_url: string | null;
  };
  unidadSnapshot: Record<string, unknown>;
  unidadMedida: string;
  agente: { nombre: string | null; telefono: string | null; email: string | null; avatarUrl: string | null };
  buyer: { nombre: string; email: string; telefono: string | null };
  complementos: ComplementoSeleccion[];
  fechaDisplay: string;
  fechaEstimadaEntrega: string | null;
  referenceNumber: string;
  paymentPlanNombre: string;
  idioma: EmailLocale;
  monedaSecundaria: Currency | null;
  tipoCambio: number | null;
}

function asNum(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}
function asStr(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** Collect the snapshot's boolean `tiene_*`/amenity flags into a features map. */
function extractFeatures(snap: Record<string, unknown>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(snap)) {
    if (k.startsWith("tiene_") && v === true) out[k] = true;
  }
  if (snap.amoblado === true) out.amoblado = true;
  return out;
}

export function buildInputFromDbRows(i: DbRowsInput): BuildCotizacionDataInput {
  const snap = i.unidadSnapshot;
  return {
    resultado: i.resultado,
    config: i.config,
    moneda: i.moneda,
    proyecto: {
      nombre: i.proyecto.nombre,
      constructoraNombre: i.proyecto.constructora_nombre,
      colorPrimario: i.proyecto.color_primario,
      ubicacionDireccion: i.proyecto.ubicacion_direccion,
      estadoConstruccion: i.proyecto.estado_construccion,
      logoUrl: i.proyecto.logo_url,
      constructoraLogoUrl: i.proyecto.constructora_logo_url,
      coverUrl: i.proyecto.cover_url,
      renders: i.proyecto.renders ?? [],
      planoUrl: i.proyecto.plano_url,
      whatsappNumero: i.proyecto.whatsapp_numero,
      tour360Url: i.proyecto.tour_360_url,
    },
    unidad: {
      identificador: asStr(snap.identificador) ?? "—",
      tipologiaName: asStr(snap.tipologia),
      areaConstruida: asNum(snap.area_construida),
      areaPrivada: asNum(snap.area_privada),
      areaLote: asNum(snap.area_lote),
      areaM2: asNum(snap.area_m2),
      unidadMedida: i.unidadMedida,
      piso: asNum(snap.piso),
      vista: asStr(snap.vista),
      habitaciones: asNum(snap.habitaciones),
      banos: asNum(snap.banos),
      orientacion: asStr(snap.orientacion),
      parqueaderos: asNum(snap.parqueaderos),
      depositos: asNum(snap.depositos),
      features: extractFeatures(snap),
    },
    agente: i.agente,
    buyer: i.buyer,
    complementos: i.complementos,
    fechaDisplay: i.fechaDisplay,
    fechaEstimadaEntrega: i.fechaEstimadaEntrega,
    referenceNumber: i.referenceNumber,
    paymentPlanNombre: i.paymentPlanNombre,
    notasLegales: i.config.notas_legales ?? null,
    idioma: i.idioma,
    monedaSecundaria: i.monedaSecundaria,
    tipoCambio: i.tipoCambio,
  };
}
