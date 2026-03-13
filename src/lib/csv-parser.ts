interface ParsedUnit {
  identificador?: string;
  etapa?: string;
  piso?: number;
  area_m2?: number;
  precio?: number;
  estado?: "disponible" | "separado" | "reservada" | "vendida";
  habitaciones?: number;
  banos?: number;
  parqueaderos?: number;
  depositos?: number;
  orientacion?: string;
  vista?: string;
  notas?: string;
}

const HEADER_MAP: Record<string, keyof ParsedUnit> = {
  identificador: "identificador",
  id: "identificador",
  unidad: "identificador",
  unit: "identificador",
  apartamento: "identificador",
  apt: "identificador",
  numero: "identificador",
  torre: "etapa",
  etapa: "etapa",
  sector: "etapa",
  bloque: "etapa",
  manzana: "etapa",
  fase: "etapa",
  building: "etapa",
  tower: "etapa",
  block: "etapa",
  phase: "etapa",
  piso: "piso",
  floor: "piso",
  nivel: "piso",
  area: "area_m2",
  area_m2: "area_m2",
  metros: "area_m2",
  m2: "area_m2",
  precio: "precio",
  price: "precio",
  valor: "precio",
  estado: "estado",
  status: "estado",
  habitaciones: "habitaciones",
  rooms: "habitaciones",
  bedrooms: "habitaciones",
  hab: "habitaciones",
  alcobas: "habitaciones",
  banos: "banos",
  bathrooms: "banos",
  bath: "banos",
  parqueaderos: "parqueaderos",
  parking: "parqueaderos",
  garajes: "parqueaderos",
  garaje: "parqueaderos",
  depositos: "depositos",
  deposito: "depositos",
  storage: "depositos",
  bodega: "depositos",
  bodegas: "depositos",
  orientacion: "orientacion",
  orientation: "orientacion",
  vista: "vista",
  view: "vista",
  notas: "notas",
  notes: "notas",
  observaciones: "notas",
};

const ESTADO_MAP: Record<string, ParsedUnit["estado"]> = {
  disponible: "disponible",
  available: "disponible",
  libre: "disponible",
  separado: "separado",
  separated: "separado",
  reservada: "reservada",
  reserved: "reservada",
  reserva: "reservada",
  vendida: "vendida",
  sold: "vendida",
  vendido: "vendida",
};

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0];
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  for (const char of firstLine) {
    if (char in counts) counts[char]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function parseCSV(text: string): ParsedUnit[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(text);
  const headers = lines[0].split(delimiter).map((h) => h.trim());

  const columnMap: (keyof ParsedUnit | null)[] = headers.map((h) => {
    const normalized = normalizeHeader(h);
    return HEADER_MAP[normalized] || null;
  });

  const results: ParsedUnit[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim());
    const unit: ParsedUnit = {};

    for (let j = 0; j < columnMap.length && j < values.length; j++) {
      const field = columnMap[j];
      if (!field || !values[j]) continue;

      const value = values[j].replace(/^["']|["']$/g, "");

      switch (field) {
        case "identificador":
        case "etapa":
        case "orientacion":
        case "vista":
        case "notas":
          (unit as Record<string, string>)[field] = value;
          break;
        case "piso":
        case "habitaciones":
        case "banos":
        case "parqueaderos":
        case "depositos":
          (unit as Record<string, number>)[field] = parseInt(value) || 0;
          break;
        case "area_m2":
        case "precio":
          (unit as Record<string, number>)[field] =
            parseFloat(value.replace(/[,$]/g, "")) || 0;
          break;
        case "estado": {
          const normalized = normalizeHeader(value);
          unit.estado = ESTADO_MAP[normalized] || "disponible";
          break;
        }
      }
    }

    if (unit.identificador) {
      results.push(unit);
    }
  }

  return results;
}
