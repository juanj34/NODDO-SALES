import {
  FolderOpen,
  Users,
  Mail,
  Settings2,
  Building2,
  Layers,
  Package,
  Grid3X3,
  Map as MapIcon,
  Image as ImageIcon,
  Film,
  MapPin,
  FileText,
  HardHat,
  Globe,
  Rocket,
  Save,
  Sparkles,
  Upload,
  Calculator,
  BarChart3,
  Zap,
  BookOpen,
  LayoutDashboard,
  Settings,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── Article ID → icon mapping ─── */
export const iconMap: Record<string, LucideIcon> = {
  proyectos: FolderOpen,
  equipo: Users,
  leads: Mail,
  disponibilidad: Package,
  estadisticas: BarChart3,
  general: Settings2,
  torres: Building2,
  tipologias: Layers,
  inventario: Package,
  cotizador: Calculator,
  fachadas: Grid3X3,
  planos: MapIcon,
  galeria: ImageIcon,
  videos: Film,
  ubicacion: MapPin,
  recursos: FileText,
  avances: HardHat,
  config: Settings2,
  dominio: Globe,
  webhooks: Zap,
  publicacion: Rocket,
  autoguardado: Save,
  iaCreacion: Sparkles,
  archivos: Upload,
};

/* ─── Category-level icons for card grid ─── */
export const categoryIconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  proyecto: Settings2,
  contenido: Layers,
  ajustes: Settings,
  flujos: Workflow,
};

/* ─── Default icon ─── */
export const defaultIcon: LucideIcon = BookOpen;

/* ─── Category → article IDs structure ─── */
export const categoryStructure = [
  {
    id: "dashboard",
    articleIds: [
      "proyectos",
      "equipo",
      "leads",
      "disponibilidad",
      "estadisticas",
    ],
  },
  { id: "proyecto", articleIds: ["general", "torres"] },
  {
    id: "contenido",
    articleIds: [
      "tipologias",
      "inventario",
      "cotizador",
      "fachadas",
      "planos",
      "galeria",
      "videos",
      "ubicacion",
      "recursos",
      "avances",
    ],
  },
  { id: "ajustes", articleIds: ["config", "dominio", "webhooks"] },
  {
    id: "flujos",
    articleIds: ["publicacion", "autoguardado", "iaCreacion", "archivos"],
  },
] as const;

/* ─── Article translation shape ─── */
export interface ArticleTranslation {
  title: string;
  description: string;
  content: string;
  steps?: readonly string[];
  tips?: readonly string[];
}

/* ─── Strip accents for search ─── */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
