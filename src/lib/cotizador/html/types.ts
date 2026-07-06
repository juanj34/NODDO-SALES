import type {
  CotizadorConfig,
  ResultadoCotizacion,
  ComplementoSeleccion,
  Currency,
} from "@/types";
import type { EmailLocale } from "@/lib/email-i18n";

/** A single payment phase, already formatted-ready (numbers + raw strings). */
export interface ViewFase {
  nombre: string;
  montoTotal: number;
  cuotas: number;
  montoPorCuota: number;
  frecuencia: string;
  fecha: string | null;
  porcentaje: number;
  condicionHito: string | null;
}

export interface ViewCargo {
  nombre: string;
  monto: number;
  tipo: "porcentaje" | "fijo";
  porcentaje: number | null;
}

export interface ViewDescuento {
  nombre: string;
  monto: number;
}

export interface ViewComplemento {
  label: string;
  precio: number | null;
  incluido: boolean;
}

/** Flat, render-ready normalization of a quote. No IO, no async, no DB shapes. */
export interface CotizacionView {
  // Branding
  proyectoNombre: string;
  constructoraNombre: string | null;
  colorPrimario: string;
  logoUrl: string | null;
  constructoraLogoUrl: string | null;
  coverUrl: string | null;
  renders: string[];
  planoUrl: string | null;
  ubicacionDireccion: string | null;
  estadoConstruccion: "sobre_planos" | "en_construccion" | "entregado";
  whatsappNumero: string | null;
  tour360Url: string | null;

  // Unit
  unidadId: string;
  tipologiaName: string | null;
  areaConstruida: number | null;
  areaPrivada: number | null;
  areaLote: number | null;
  areaM2: number | null;
  unidadMedida: string;
  piso: number | null;
  vista: string | null;
  habitaciones: number | null;
  banos: number | null;
  orientacion: string | null;
  parqueaderos: number | null;
  depositos: number | null;
  /** boolean amenity flags, e.g. { tiene_terraza: true } — rendered as "Sí" rows */
  features: Record<string, boolean>;

  // Pricing
  moneda: Currency;
  monedaSecundaria: Currency | null;
  tipoCambio: number | null;
  precioBase: number;
  descuentos: ViewDescuento[];
  /** Plan total the payment phases sum to (precio_total ?? precio_neto). */
  planTotal: number;
  cargos: ViewCargo[];
  cargosTotal: number;
  /** What the buyer owes: planTotal + cargosTotal. */
  grandTotal: number;
  complementos: ViewComplemento[];
  complementosTotal: number;
  fases: ViewFase[];
  paymentPlanNombre: string;
  /**
   * Render Separación + Cuota inicial as one grouped "CUOTA INICIAL (NN%)" block
   * (delivery-calculator mode) instead of three flat rows. Defaults to false —
   * existing template-mode quotes are unaffected. See BuildCotizacionDataInput.agrupar_inicial.
   */
  agruparInicial: boolean;

  // Parties
  agenteNombre: string | null;
  agenteTelefono: string | null;
  agenteEmail: string | null;
  buyerNombre: string;
  buyerEmail: string;
  buyerTelefono: string | null;

  // Meta
  fechaDisplay: string;
  fechaEstimadaEntrega: string | null;
  referenceNumber: string;
  notasLegales: string | null;
  idioma: EmailLocale;

  // Excel-parity extras band (printed after the payment plan table) + validity note.
  // Sourced straight from CotizadorConfig — non-empty-string normalized, null when unset.
  leasingNota: string | null;
  parqueaderosLabel: string | null;
  acabadosNota: string | null;
  bonosNota: string | null;
  /** Validity in calendar days from the quote's expedition date (fechaDisplay). Null when unset. */
  vigenciaDias: number | null;
}

/** Raw, already-fetched inputs the route hands to the builder. */
export interface BuildCotizacionDataInput {
  resultado: ResultadoCotizacion;
  config: CotizadorConfig;
  moneda: Currency;
  proyecto: {
    nombre: string;
    constructoraNombre: string | null;
    colorPrimario: string | null;
    ubicacionDireccion: string | null;
    estadoConstruccion: "sobre_planos" | "en_construccion" | "entregado" | null;
    logoUrl: string | null;
    constructoraLogoUrl: string | null;
    coverUrl: string | null;
    renders: string[];
    planoUrl: string | null;
    whatsappNumero: string | null;
    tour360Url: string | null;
  };
  unidad: {
    identificador: string;
    tipologiaName: string | null;
    areaConstruida: number | null;
    areaPrivada: number | null;
    areaLote: number | null;
    areaM2: number | null;
    unidadMedida: string;
    piso: number | null;
    vista: string | null;
    habitaciones: number | null;
    banos: number | null;
    orientacion: string | null;
    parqueaderos: number | null;
    depositos: number | null;
    features: Record<string, boolean>;
  };
  agente: { nombre: string | null; telefono: string | null; email: string | null; avatarUrl: string | null };
  buyer: { nombre: string; email: string; telefono: string | null };
  complementos: ComplementoSeleccion[];
  fechaDisplay: string;
  fechaEstimadaEntrega: string | null;
  referenceNumber: string;
  paymentPlanNombre: string;
  notasLegales: string | null;
  idioma: EmailLocale;
  monedaSecundaria: Currency | null;
  tipoCambio: number | null;
  /**
   * True when this quote's payment plan came from the delivery calculator
   * (API sets it to `plan_origen === "calculadora"`). Enables the grouped
   * "Cuota inicial" PDF layout when the fase shape also matches
   * (Separación fijo -> Cuota inicial porcentaje). Defaults to false.
   */
  agrupar_inicial?: boolean;
}
