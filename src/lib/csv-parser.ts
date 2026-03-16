/* ── Types used by SmartImportModal ──────────────────────────────────────── */

export type EstadoUnidad = "disponible" | "separado" | "reservada" | "vendida";

export interface MappedUnit {
  identificador: string;
  piso: number | null;
  lote: string | null;
  etapa_nombre: string | null;
  area_m2: number | null;
  precio: number | null;
  estado: EstadoUnidad;
  habitaciones: number | null;
  banos: number | null;
  parqueaderos: number | null;
  depositos: number | null;
  orientacion: string | null;
  vista: string | null;
  notas: string | null;
  _etapa: string | null;
  _tipologia: string | null;
  _fachada: string | null;
}

export interface MappedComplemento {
  identificador: string;
  subtipo: string | null;
  nivel: string | null;
  area_m2: number | null;
  precio: number | null;
  estado: EstadoUnidad;
  notas: string | null;
  _etapa: string | null;
}

export interface ColumnMapping {
  columnMap: Record<string, string>;
  statusMap: Record<string, EstadoUnidad>;
}

/* ── Original ParsedUnit (used by parseCSV) ─────────────────────────────── */

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

/* ── Smart Import helpers ───────────────────────────────────────────────── */

/**
 * Split raw CSV text into headers + sample rows (first 5) + all data rows.
 * Used by SmartImportModal to send a sample to the AI for analysis.
 */
export function extractCSVHeadersAndSample(text: string): {
  headers: string[];
  sampleRows: string[][];
  allRows: string[][];
  totalRows: number;
} {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { headers: [], sampleRows: [], allRows: [], totalRows: 0 };
  }

  const delimiter = detectDelimiter(text);
  const headers = lines[0].split(delimiter).map((h) => h.trim());

  const dataLines = lines.slice(1);
  const allRows = dataLines.map((line) =>
    line.split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ""))
  );

  const sampleRows = allRows.slice(0, 5);

  return { headers, sampleRows, allRows, totalRows: allRows.length };
}

/**
 * Parse all CSV rows using a user-supplied column mapping + status mapping.
 * Returns MappedUnit[] with all fields normalised.
 */
export function parseCSVWithMapping(
  allRows: string[][],
  headers: string[],
  mapping: ColumnMapping
): MappedUnit[] {
  const { columnMap, statusMap } = mapping;

  // Invert columnMap: csvHeader → dbField
  const headerToField: Record<string, string> = {};
  for (const [csvCol, dbField] of Object.entries(columnMap)) {
    headerToField[csvCol] = dbField;
  }

  // Build header-index lookup
  const headerIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerIndex[h] = i;
  });

  const results: MappedUnit[] = [];

  for (const row of allRows) {
    const unit: Record<string, string | number | null> = {};

    for (const [csvCol, dbField] of Object.entries(headerToField)) {
      const idx = headerIndex[csvCol];
      if (idx === undefined || idx >= row.length) continue;
      const rawValue = row[idx];
      if (!rawValue) continue;

      const intFields = ["piso", "habitaciones", "banos", "parqueaderos", "depositos"];
      const floatFields = ["area_m2", "precio"];

      if (intFields.includes(dbField)) {
        unit[dbField] = parseInt(rawValue) || null;
      } else if (floatFields.includes(dbField)) {
        unit[dbField] = parseFloat(rawValue.replace(/[,$\s]/g, "")) || null;
      } else if (dbField === "estado") {
        const mapped = statusMap[rawValue] || statusMap[rawValue.toLowerCase()];
        unit[dbField] = mapped || "disponible";
      } else {
        unit[dbField] = rawValue;
      }
    }

    const identificador = unit.identificador as string | undefined;
    if (!identificador) continue;

    results.push({
      identificador,
      piso: (unit.piso as number | null) ?? null,
      lote: (unit.lote as string | null) ?? null,
      etapa_nombre: (unit.etapa_nombre as string | null) ?? null,
      area_m2: (unit.area_m2 as number | null) ?? null,
      precio: (unit.precio as number | null) ?? null,
      estado: (unit.estado as EstadoUnidad) || "disponible",
      habitaciones: (unit.habitaciones as number | null) ?? null,
      banos: (unit.banos as number | null) ?? null,
      parqueaderos: (unit.parqueaderos as number | null) ?? null,
      depositos: (unit.depositos as number | null) ?? null,
      orientacion: (unit.orientacion as string | null) ?? null,
      vista: (unit.vista as string | null) ?? null,
      notas: (unit.notas as string | null) ?? null,
      _etapa: (unit._etapa as string | null) ?? null,
      _tipologia: (unit._tipologia as string | null) ?? null,
      _fachada: (unit._fachada as string | null) ?? null,
    });
  }

  return results;
}

/**
 * Parse CSV rows for complementos (parking/storage) using AI-provided mapping.
 */
export function parseCSVWithMappingComplementos(
  allRows: string[][],
  headers: string[],
  mapping: ColumnMapping
): MappedComplemento[] {
  const { columnMap, statusMap } = mapping;

  const headerToField: Record<string, string> = {};
  for (const [csvCol, dbField] of Object.entries(columnMap)) {
    headerToField[csvCol] = dbField;
  }

  const headerIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerIndex[h] = i;
  });

  const results: MappedComplemento[] = [];

  for (const row of allRows) {
    const item: Record<string, string | number | null> = {};

    for (const [csvCol, dbField] of Object.entries(headerToField)) {
      const idx = headerIndex[csvCol];
      if (idx === undefined || idx >= row.length) continue;
      const rawValue = row[idx];
      if (!rawValue) continue;

      const floatFields = ["area_m2", "precio"];

      if (floatFields.includes(dbField)) {
        item[dbField] = parseFloat(rawValue.replace(/[,$\s]/g, "")) || null;
      } else if (dbField === "estado") {
        const mapped = statusMap[rawValue] || statusMap[rawValue.toLowerCase()];
        item[dbField] = mapped || "disponible";
      } else {
        item[dbField] = rawValue;
      }
    }

    const identificador = item.identificador as string | undefined;
    if (!identificador) continue;

    results.push({
      identificador,
      subtipo: (item.subtipo as string | null) ?? null,
      nivel: (item.nivel as string | null) ?? null,
      area_m2: (item.area_m2 as number | null) ?? null,
      precio: (item.precio as number | null) ?? null,
      estado: (item.estado as EstadoUnidad) || "disponible",
      notas: (item.notas as string | null) ?? null,
      _etapa: (item._etapa as string | null) ?? null,
    });
  }

  return results;
}
