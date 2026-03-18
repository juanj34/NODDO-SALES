/**
 * Status color constants for unit states across editor pages.
 * Replaces hardcoded color values to maintain consistency.
 */

export const UNIT_STATUS_COLORS = {
  disponible: {
    bg: "bg-green-500/15",
    text: "text-green-400",
    border: "border-green-500/20",
    dot: "bg-green-500",
    label: "Disponible",
    short: "Disp.",
  },
  proximamente: {
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
    label: "Próximamente",
    short: "Prox.",
  },
  separado: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
    dot: "bg-yellow-500",
    label: "Separado",
    short: "Sep.",
  },
  reservada: {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/20",
    dot: "bg-orange-500",
    label: "Reservada",
    short: "Res.",
  },
  vendida: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/20",
    dot: "bg-red-500",
    label: "Vendida",
    short: "Vend.",
  },
} as const;

export type UnitStatus = keyof typeof UNIT_STATUS_COLORS;
