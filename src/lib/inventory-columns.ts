import type { InventoryColumnConfig } from "@/types";

type TipoProyecto = "apartamentos" | "casas" | "lotes" | "hibrido";

const DEFAULTS: Record<TipoProyecto, InventoryColumnConfig> = {
  apartamentos: {
    area_m2: true,
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
    area_m2: true,
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
    area_m2: true,
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

/** All available column keys with their i18n label keys */
export const INVENTORY_COLUMN_KEYS: {
  key: keyof InventoryColumnConfig;
  labelKey: string;
  icon: string;
}[] = [
  { key: "area_m2", labelKey: "inventario.columns.area", icon: "Maximize" },
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
