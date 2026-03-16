import type { InventoryColumnConfig, InventoryColumnsByType, TipoTipologia } from "@/types";

type TipoProyecto = "apartamentos" | "casas" | "lotes" | "hibrido";

const DEFAULTS: Record<TipoProyecto, InventoryColumnConfig> = {
  apartamentos: {
    area_m2: true,
    area_construida: false,
    area_privada: false,
    area_lote: false,
    habitaciones: true,
    banos: true,
    parqueaderos: true,
    depositos: true,
    orientacion: true,
    vista: true,
    precio: true,
    piso: true,
    lote: false,
    etapa: false,
  },
  casas: {
    area_m2: false,
    area_construida: true,
    area_privada: true,
    area_lote: true,
    habitaciones: true,
    banos: true,
    parqueaderos: true,
    depositos: true,
    orientacion: true,
    vista: true,
    precio: true,
    piso: false,
    lote: true,
    etapa: true,
  },
  lotes: {
    area_m2: false,
    area_construida: false,
    area_privada: false,
    area_lote: true,
    habitaciones: false,
    banos: false,
    parqueaderos: false,
    depositos: false,
    orientacion: false,
    vista: false,
    precio: true,
    piso: false,
    lote: true,
    etapa: true,
  },
  hibrido: {
    area_m2: true,
    area_construida: true,
    area_privada: true,
    area_lote: true,
    habitaciones: true,
    banos: true,
    parqueaderos: true,
    depositos: true,
    orientacion: true,
    vista: true,
    precio: true,
    piso: true,
    lote: true,
    etapa: true,
  },
};

/** Maps tipo_tipologia → default column config */
export const TIPO_DEFAULTS: Record<TipoTipologia, InventoryColumnConfig> = {
  apartamento: DEFAULTS.apartamentos,
  casa: DEFAULTS.casas,
  lote: DEFAULTS.lotes,
};

/**
 * Resolves the effective column visibility for a project.
 * If the project has explicit inventory_columns, use those.
 * Otherwise, derive from tipo_proyecto defaults.
 */
export function getInventoryColumns(
  tipoProyecto: TipoProyecto,
  customConfig: InventoryColumnConfig | null | undefined
): InventoryColumnConfig {
  if (customConfig) return customConfig;
  return DEFAULTS[tipoProyecto] ?? DEFAULTS.hibrido;
}

export function getDefaultColumns(tipoProyecto: TipoProyecto): InventoryColumnConfig {
  return DEFAULTS[tipoProyecto] ?? DEFAULTS.hibrido;
}

/**
 * For hybrid projects: resolves column config for a specific tipo_tipologia.
 * Priority: columnsByType[tipo] > per-tipo defaults.
 */
export function getHybridInventoryColumns(
  tipoTipologia: TipoTipologia,
  columnsByType: InventoryColumnsByType | null | undefined
): InventoryColumnConfig {
  if (columnsByType?.[tipoTipologia]) {
    return columnsByType[tipoTipologia];
  }
  return TIPO_DEFAULTS[tipoTipologia];
}

/** Returns default columns for a tipo_tipologia */
export function getDefaultColumnsForTipo(tipo: TipoTipologia): InventoryColumnConfig {
  return TIPO_DEFAULTS[tipo];
}

/**
 * Derives tipo_tipologia from tipo_proyecto for non-hybrid projects.
 * Returns null for hybrid (must use tipologia.tipo_tipologia directly).
 */
export function deriveTipoTipologia(
  tipoProyecto: TipoProyecto
): TipoTipologia | null {
  switch (tipoProyecto) {
    case "apartamentos": return "apartamento";
    case "casas": return "casa";
    case "lotes": return "lote";
    case "hibrido": return null;
  }
}

/** All available column keys with their i18n label keys */
export const INVENTORY_COLUMN_KEYS: {
  key: keyof InventoryColumnConfig;
  labelKey: string;
  icon: string;
}[] = [
  { key: "area_m2", labelKey: "inventario.columns.area", icon: "Maximize" },
  { key: "area_construida", labelKey: "inventario.columns.areaConstruida", icon: "Ruler" },
  { key: "area_privada", labelKey: "inventario.columns.areaPrivada", icon: "Home" },
  { key: "area_lote", labelKey: "inventario.columns.areaLote", icon: "LandPlot" },
  { key: "precio", labelKey: "inventario.columns.precio", icon: "DollarSign" },
  { key: "habitaciones", labelKey: "inventario.columns.habitaciones", icon: "BedDouble" },
  { key: "banos", labelKey: "inventario.columns.banos", icon: "Bath" },
  { key: "parqueaderos", labelKey: "inventario.columns.parqueaderos", icon: "Car" },
  { key: "depositos", labelKey: "inventario.columns.depositos", icon: "Package" },
  { key: "orientacion", labelKey: "inventario.columns.orientacion", icon: "Compass" },
  { key: "vista", labelKey: "inventario.columns.vista", icon: "Eye" },
  { key: "piso", labelKey: "inventario.columns.piso", icon: "Building2" },
  { key: "lote", labelKey: "inventario.columns.lote", icon: "MapPin" },
  { key: "etapa", labelKey: "inventario.columns.etapa", icon: "Layers" },
];

/**
 * Returns the "primary" area value for display in compact contexts (lists, cards).
 * Checks enabled area columns in priority order.
 */
export function getPrimaryArea(
  unit: { area_m2?: number | null; area_construida?: number | null; area_privada?: number | null; area_lote?: number | null },
  columns: InventoryColumnConfig
): number | null {
  if (columns.area_construida && unit.area_construida != null) return unit.area_construida;
  if (columns.area_m2 && unit.area_m2 != null) return unit.area_m2;
  if (columns.area_privada && unit.area_privada != null) return unit.area_privada;
  if (columns.area_lote && unit.area_lote != null) return unit.area_lote;
  return unit.area_m2 ?? null;
}
