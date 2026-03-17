/**
 * Shared i18n helpers for estado config objects used across multiple pages.
 */

export function getEstadoConfig(t: (key: string) => string) {
  return {
    disponible: { label: t("estados.disponible"), color: "text-emerald-400", dot: "bg-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/30" },
    separado: { label: t("estados.separado"), color: "text-yellow-400", dot: "bg-yellow-400", bg: "bg-yellow-400/10", ring: "ring-yellow-400/30" },
    reservada: { label: t("estados.reservada"), color: "text-orange-400", dot: "bg-orange-400", bg: "bg-orange-400/10", ring: "ring-orange-400/30" },
    vendida: { label: t("estados.vendida"), color: "text-red-400", dot: "bg-red-400", bg: "bg-red-400/10", ring: "ring-red-400/30" },
    proximamente: { label: t("estados.proximamente"), color: "text-blue-400", dot: "bg-blue-400", bg: "bg-blue-400/10", ring: "ring-blue-400/30" },
  } as const;
}

export function getEstadoPluralConfig(t: (key: string) => string) {
  return {
    disponible: { label: t("estadoPlural.disponible"), color: "text-emerald-400", dot: "bg-emerald-400", bg: "bg-emerald-400/10" },
    separado: { label: t("estadoPlural.separado"), color: "text-yellow-400", dot: "bg-yellow-400", bg: "bg-yellow-400/10" },
    reservada: { label: t("estadoPlural.reservada"), color: "text-orange-400", dot: "bg-orange-400", bg: "bg-orange-400/10" },
    vendida: { label: t("estadoPlural.vendida"), color: "text-red-400", dot: "bg-red-400", bg: "bg-red-400/10" },
    proximamente: { label: t("estadoPlural.proximamente"), color: "text-blue-400", dot: "bg-blue-400", bg: "bg-blue-400/10" },
  } as const;
}
