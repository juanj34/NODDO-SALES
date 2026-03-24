import type { SeccionesVisibles } from "@/types";

/** All toggleable section keys */
export const SECTION_KEYS: (keyof SeccionesVisibles)[] = [
  "galeria",
  "tipologias",
  "inventario",
  "explorar",
  "implantaciones",
  "ubicacion",
  "videos",
  "recursos",
  "avances",
  "tour360",
  "contacto",
  "plan_pago",
];

/** Default config: all sections visible */
export function getDefaultSeccionesVisibles(): SeccionesVisibles {
  return {
    galeria: true,
    tipologias: true,
    inventario: true,
    explorar: true,
    implantaciones: true,
    ubicacion: true,
    videos: true,
    recursos: true,
    avances: true,
    tour360: true,
    contacto: true,
    plan_pago: true,
  };
}

/** Resolve effective visibility: null = all visible */
export function getEffectiveVisibility(
  config: SeccionesVisibles | null | undefined
): SeccionesVisibles {
  return config ?? getDefaultSeccionesVisibles();
}

/** Check if a specific section is visible (null = all visible) */
export function isSectionVisible(
  config: SeccionesVisibles | null | undefined,
  section: keyof SeccionesVisibles
): boolean {
  if (!config) return true;
  return config[section] !== false;
}

/** Map from microsite route segment to SeccionesVisibles key */
export const ROUTE_TO_SECTION: Record<string, keyof SeccionesVisibles> = {
  galeria: "galeria",
  tipologias: "tipologias",
  inventario: "inventario",
  explorar: "explorar",
  implantaciones: "implantaciones",
  ubicacion: "ubicacion",
  videos: "videos",
  recursos: "recursos",
  avances: "avances",
  "tour-360": "tour360",
  contacto: "contacto",
  "plan-de-pago": "plan_pago",
};

/** Section display metadata for the editor UI */
export const SECTION_DISPLAY: {
  key: keyof SeccionesVisibles;
  labelKey: string;
  descKey: string;
  icon: string;
}[] = [
  { key: "galeria", labelKey: "visibility.sections.galeria", descKey: "visibility.sections.galeriaDesc", icon: "ImageIcon" },
  { key: "tipologias", labelKey: "visibility.sections.tipologias", descKey: "visibility.sections.tipologiasDesc", icon: "Layers" },
  { key: "inventario", labelKey: "visibility.sections.inventario", descKey: "visibility.sections.inventarioDesc", icon: "Package" },
  { key: "explorar", labelKey: "visibility.sections.explorar", descKey: "visibility.sections.explorarDesc", icon: "Building2" },
  { key: "implantaciones", labelKey: "visibility.sections.implantaciones", descKey: "visibility.sections.implantacionesDesc", icon: "MapIcon" },
  { key: "ubicacion", labelKey: "visibility.sections.ubicacion", descKey: "visibility.sections.ubicacionDesc", icon: "MapPin" },
  { key: "videos", labelKey: "visibility.sections.videos", descKey: "visibility.sections.videosDesc", icon: "Film" },
  { key: "recursos", labelKey: "visibility.sections.recursos", descKey: "visibility.sections.recursosDesc", icon: "FileText" },
  { key: "avances", labelKey: "visibility.sections.avances", descKey: "visibility.sections.avancesDesc", icon: "HardHat" },
  { key: "tour360", labelKey: "visibility.sections.tour360", descKey: "visibility.sections.tour360Desc", icon: "Globe" },
  { key: "contacto", labelKey: "visibility.sections.contacto", descKey: "visibility.sections.contactoDesc", icon: "MessageCircle" },
  { key: "plan_pago", labelKey: "visibility.sections.planPago", descKey: "visibility.sections.planPagoDesc", icon: "CreditCard" },
];
