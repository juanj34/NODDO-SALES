import type { LucideProps } from "lucide-react";
import * as LucideIcons from "lucide-react";

/* ══════════════════════════════════════════════════════════════════
   Amenidades Catalog — 85+ predefined real estate amenities
   with lucide-react icon mappings, grouped by category.
   ══════════════════════════════════════════════════════════════════ */

export interface AmenidadCatalogItem {
  id: string;
  nombre: string;
  icono: string; // PascalCase lucide icon component name
  categoria: string;
}

export interface AmenidadItem {
  id: string;
  nombre: string;
  icono: string;
  icon_url?: string;
}

/* ── Dynamic Icon Component ──────────────────────────────────────── */

const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>;

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = iconMap[name];
  if (!Icon) return <LucideIcons.CircleDot {...props} />;
  return <Icon {...props} />;
}

/* ── Catalog ─────────────────────────────────────────────────────── */

export const AMENIDADES_CATALOG: AmenidadCatalogItem[] = [
  // ── Deporte & Fitness ──
  { id: "piscina", nombre: "Piscina", icono: "Waves", categoria: "Deporte & Fitness" },
  { id: "gimnasio", nombre: "Gimnasio", icono: "Dumbbell", categoria: "Deporte & Fitness" },
  { id: "cancha-tenis", nombre: "Cancha de tenis", icono: "CircleDot", categoria: "Deporte & Fitness" },
  { id: "cancha-basketball", nombre: "Cancha de basketball", icono: "CircleDot", categoria: "Deporte & Fitness" },
  { id: "cancha-squash", nombre: "Cancha de squash", icono: "Square", categoria: "Deporte & Fitness" },
  { id: "pista-trote", nombre: "Pista de trote", icono: "Footprints", categoria: "Deporte & Fitness" },
  { id: "muro-escalada", nombre: "Muro de escalada", icono: "Mountain", categoria: "Deporte & Fitness" },
  { id: "crossfit", nombre: "Zona de crossfit", icono: "Zap", categoria: "Deporte & Fitness" },
  { id: "cancha-futbol", nombre: "Cancha de fútbol", icono: "Circle", categoria: "Deporte & Fitness" },
  { id: "putting-green", nombre: "Putting green", icono: "Flag", categoria: "Deporte & Fitness" },
  { id: "ping-pong", nombre: "Ping pong", icono: "TableProperties", categoria: "Deporte & Fitness" },
  { id: "boliche", nombre: "Boliche", icono: "Target", categoria: "Deporte & Fitness" },
  { id: "yoga", nombre: "Yoga / Pilates", icono: "PersonStanding", categoria: "Deporte & Fitness" },
  { id: "spinning", nombre: "Spinning", icono: "Bike", categoria: "Deporte & Fitness" },
  { id: "boxing", nombre: "Boxing", icono: "Swords", categoria: "Deporte & Fitness" },

  // ── Social & Entretenimiento ──
  { id: "salon-social", nombre: "Salón social", icono: "Users", categoria: "Social & Entretenimiento" },
  { id: "zona-bbq", nombre: "Zona BBQ", icono: "Flame", categoria: "Social & Entretenimiento" },
  { id: "cine", nombre: "Cine / Teatro", icono: "Film", categoria: "Social & Entretenimiento" },
  { id: "bar-lounge", nombre: "Bar lounge", icono: "Wine", categoria: "Social & Entretenimiento" },
  { id: "sala-juegos", nombre: "Sala de juegos", icono: "Gamepad2", categoria: "Social & Entretenimiento" },
  { id: "karaoke", nombre: "Karaoke", icono: "Mic", categoria: "Social & Entretenimiento" },
  { id: "terraza-social", nombre: "Terraza social", icono: "Sun", categoria: "Social & Entretenimiento" },
  { id: "salon-fiestas", nombre: "Salón de fiestas", icono: "PartyPopper", categoria: "Social & Entretenimiento" },
  { id: "wine-bar", nombre: "Wine bar", icono: "GlassWater", categoria: "Social & Entretenimiento" },
  { id: "chefs-kitchen", nombre: "Chef's kitchen", icono: "ChefHat", categoria: "Social & Entretenimiento" },
  { id: "comedor-privado", nombre: "Comedor privado", icono: "UtensilsCrossed", categoria: "Social & Entretenimiento" },
  { id: "rooftop-bar", nombre: "Rooftop bar", icono: "CloudSun", categoria: "Social & Entretenimiento" },

  // ── Bienestar & Spa ──
  { id: "spa", nombre: "Spa", icono: "Sparkles", categoria: "Bienestar & Spa" },
  { id: "sauna", nombre: "Sauna", icono: "Thermometer", categoria: "Bienestar & Spa" },
  { id: "turco", nombre: "Turco", icono: "CloudFog", categoria: "Bienestar & Spa" },
  { id: "jacuzzi", nombre: "Jacuzzi", icono: "Bath", categoria: "Bienestar & Spa" },
  { id: "sala-masajes", nombre: "Sala de masajes", icono: "Hand", categoria: "Bienestar & Spa" },
  { id: "zona-humeda", nombre: "Zona húmeda", icono: "Droplets", categoria: "Bienestar & Spa" },
  { id: "meditacion", nombre: "Sala de meditación", icono: "Brain", categoria: "Bienestar & Spa" },
  { id: "bano-vapor", nombre: "Baño de vapor", icono: "Wind", categoria: "Bienestar & Spa" },
  { id: "peluqueria", nombre: "Peluquería", icono: "Scissors", categoria: "Bienestar & Spa" },
  { id: "relajacion", nombre: "Sala de relajación", icono: "Moon", categoria: "Bienestar & Spa" },

  // ── Niños & Familia ──
  { id: "parque-infantil", nombre: "Parque infantil", icono: "Baby", categoria: "Niños & Familia" },
  { id: "piscina-ninos", nombre: "Piscina para niños", icono: "Waves", categoria: "Niños & Familia" },
  { id: "ludoteca", nombre: "Ludoteca", icono: "Puzzle", categoria: "Niños & Familia" },
  { id: "salon-cumpleanos", nombre: "Salón de cumpleaños", icono: "Cake", categoria: "Niños & Familia" },
  { id: "trampolin", nombre: "Trampolín", icono: "ArrowUpFromLine", categoria: "Niños & Familia" },
  { id: "arenero", nombre: "Arenero", icono: "Castle", categoria: "Niños & Familia" },
  { id: "mini-golf", nombre: "Mini golf", icono: "Flag", categoria: "Niños & Familia" },
  { id: "guarderia", nombre: "Guardería", icono: "Heart", categoria: "Niños & Familia" },

  // ── Trabajo & Estudio ──
  { id: "coworking", nombre: "Coworking", icono: "Laptop", categoria: "Trabajo & Estudio" },
  { id: "business-center", nombre: "Business center", icono: "Briefcase", categoria: "Trabajo & Estudio" },
  { id: "sala-reuniones", nombre: "Sala de reuniones", icono: "Presentation", categoria: "Trabajo & Estudio" },
  { id: "biblioteca", nombre: "Biblioteca", icono: "BookOpen", categoria: "Trabajo & Estudio" },
  { id: "sala-estudio", nombre: "Sala de estudio", icono: "GraduationCap", categoria: "Trabajo & Estudio" },
  { id: "sala-musica", nombre: "Sala de música", icono: "Music", categoria: "Trabajo & Estudio" },

  // ── Mascotas ──
  { id: "pet-park", nombre: "Pet park", icono: "Dog", categoria: "Mascotas" },
  { id: "dog-grooming", nombre: "Dog grooming", icono: "Scissors", categoria: "Mascotas" },
  { id: "pet-spa", nombre: "Pet spa", icono: "Heart", categoria: "Mascotas" },
  { id: "zona-mascotas", nombre: "Zona de mascotas", icono: "PawPrint", categoria: "Mascotas" },

  // ── Áreas Verdes & Exteriores ──
  { id: "jardines", nombre: "Jardines", icono: "TreePine", categoria: "Áreas Verdes & Exteriores" },
  { id: "sendero", nombre: "Sendero peatonal", icono: "Route", categoria: "Áreas Verdes & Exteriores" },
  { id: "huerto", nombre: "Huerto urbano", icono: "Sprout", categoria: "Áreas Verdes & Exteriores" },
  { id: "camping", nombre: "Zona de camping", icono: "Tent", categoria: "Áreas Verdes & Exteriores" },
  { id: "miradores", nombre: "Miradores", icono: "Eye", categoria: "Áreas Verdes & Exteriores" },
  { id: "plazoleta", nombre: "Plazoleta", icono: "MapPin", categoria: "Áreas Verdes & Exteriores" },
  { id: "fogata", nombre: "Fogata exterior", icono: "Flame", categoria: "Áreas Verdes & Exteriores" },
  { id: "deck", nombre: "Deck", icono: "Armchair", categoria: "Áreas Verdes & Exteriores" },

  // ── Servicios & Tecnología ──
  { id: "seguridad", nombre: "Seguridad 24/7", icono: "Shield", categoria: "Servicios & Tecnología" },
  { id: "lobby", nombre: "Lobby", icono: "DoorOpen", categoria: "Servicios & Tecnología" },
  { id: "ascensor", nombre: "Ascensor", icono: "ArrowUpDown", categoria: "Servicios & Tecnología" },
  { id: "conserjeria", nombre: "Conserjería", icono: "BellRing", categoria: "Servicios & Tecnología" },
  { id: "paqueteria", nombre: "Paquetería", icono: "Package", categoria: "Servicios & Tecnología" },
  { id: "bicicletero", nombre: "Bicicletero", icono: "Bike", categoria: "Servicios & Tecnología" },
  { id: "lavanderia", nombre: "Lavandería", icono: "WashingMachine", categoria: "Servicios & Tecnología" },
  { id: "parqueadero", nombre: "Parqueadero", icono: "Car", categoria: "Servicios & Tecnología" },
  { id: "carga-ev", nombre: "Carga EV", icono: "PlugZap", categoria: "Servicios & Tecnología" },
  { id: "domotica", nombre: "Domótica", icono: "Smartphone", categoria: "Servicios & Tecnología" },
  { id: "fibra-optica", nombre: "Fibra óptica", icono: "Wifi", categoria: "Servicios & Tecnología" },
  { id: "car-wash", nombre: "Car wash", icono: "Droplets", categoria: "Servicios & Tecnología" },

  // ── Exclusivas ──
  { id: "helipuerto", nombre: "Helipuerto", icono: "Plane", categoria: "Exclusivas" },
  { id: "marina", nombre: "Marina", icono: "Anchor", categoria: "Exclusivas" },
  { id: "acceso-playa", nombre: "Acceso playa", icono: "Umbrella", categoria: "Exclusivas" },
  { id: "suite-huespedes", nombre: "Suite de huéspedes", icono: "BedDouble", categoria: "Exclusivas" },
  { id: "bodega", nombre: "Bodega privada", icono: "Warehouse", categoria: "Exclusivas" },
  { id: "capilla", nombre: "Capilla", icono: "Church", categoria: "Exclusivas" },
  { id: "sala-cata", nombre: "Sala de cata", icono: "Wine", categoria: "Exclusivas" },
  { id: "sky-lounge", nombre: "Sky lounge", icono: "Cloud", categoria: "Exclusivas" },
];

export const AMENIDADES_CATEGORIAS = [
  "Deporte & Fitness",
  "Social & Entretenimiento",
  "Bienestar & Spa",
  "Niños & Familia",
  "Trabajo & Estudio",
  "Mascotas",
  "Áreas Verdes & Exteriores",
  "Servicios & Tecnología",
  "Exclusivas",
];
