import type { TipologiaFieldsConfig } from "@/types";

type TipoProyecto = "apartamentos" | "casas" | "lotes" | "hibrido";

/* ── Smart defaults per project type ───────────────────────────── */

const DEFAULTS: Record<TipoProyecto, TipologiaFieldsConfig> = {
  apartamentos: {
    area_m2: true,
    area_construida: false,
    area_privada: false,
    area_lote: false,
    area_balcon: true,
    habitaciones: true,
    banos: true,
    parqueaderos: true,
    depositos: true,
    precio: true,
  },
  casas: {
    area_m2: false,
    area_construida: true,
    area_privada: true,
    area_lote: true,
    area_balcon: false,
    habitaciones: true,
    banos: true,
    parqueaderos: true,
    depositos: true,
    precio: true,
  },
  lotes: {
    area_m2: false,
    area_construida: false,
    area_privada: false,
    area_lote: true,
    area_balcon: false,
    habitaciones: false,
    banos: false,
    parqueaderos: false,
    depositos: false,
    precio: true,
  },
  hibrido: {
    area_m2: true,
    area_construida: true,
    area_privada: true,
    area_lote: true,
    area_balcon: true,
    habitaciones: true,
    banos: true,
    parqueaderos: true,
    depositos: true,
    precio: true,
  },
};

/**
 * Resolves the effective tipología field visibility for a project.
 * If the project has explicit tipologia_fields config, use those.
 * Otherwise, derive from tipo_proyecto defaults.
 */
export function getTipologiaFields(
  tipoProyecto: TipoProyecto,
  customConfig: TipologiaFieldsConfig | null | undefined
): TipologiaFieldsConfig {
  if (customConfig) return customConfig;
  return DEFAULTS[tipoProyecto] ?? DEFAULTS.hibrido;
}

/** Returns the default tipología fields for a project type */
export function getDefaultTipologiaFields(tipoProyecto: TipoProyecto): TipologiaFieldsConfig {
  return DEFAULTS[tipoProyecto] ?? DEFAULTS.hibrido;
}

/** All available tipología field keys with their i18n label keys and icon names */
export const TIPOLOGIA_FIELD_KEYS: {
  key: keyof TipologiaFieldsConfig;
  labelKey: string;
  icon: string;
}[] = [
  { key: "area_m2", labelKey: "config.tipologiaFields.area_m2", icon: "Maximize" },
  { key: "area_construida", labelKey: "config.tipologiaFields.area_construida", icon: "Ruler" },
  { key: "area_privada", labelKey: "config.tipologiaFields.area_privada", icon: "Home" },
  { key: "area_lote", labelKey: "config.tipologiaFields.area_lote", icon: "LandPlot" },
  { key: "area_balcon", labelKey: "config.tipologiaFields.area_balcon", icon: "Palmtree" },
  { key: "habitaciones", labelKey: "config.tipologiaFields.habitaciones", icon: "BedDouble" },
  { key: "banos", labelKey: "config.tipologiaFields.banos", icon: "Bath" },
  { key: "parqueaderos", labelKey: "config.tipologiaFields.parqueaderos", icon: "Car" },
  { key: "depositos", labelKey: "config.tipologiaFields.depositos", icon: "Package" },
  { key: "precio", labelKey: "config.tipologiaFields.precio", icon: "DollarSign" },
];
