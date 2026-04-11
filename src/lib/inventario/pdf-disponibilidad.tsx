/**
 * Availability PDF Document using @react-pdf/renderer
 *
 * Generates a branded PDF showing unit availability for a project.
 * Reuses the same font/theme infrastructure as cotizador PDFs.
 *
 * Layout:
 *   - Header: constructora logo (left) + project logo (right)
 *   - Title: project name + date
 *   - Summary: status counts
 *   - Table: units with key fields + status
 *   - Footer: NODDO branding (small)
 */

import React from "react";
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { FONT_FAMILY } from "@/lib/cotizador/pdf-react/fonts";
import { hexToRgba } from "@/lib/cotizador/pdf-react/theme";
import { formatCurrency } from "@/lib/currency";
import type { Currency } from "@/types";

/* ── Types ── */

export interface AvailabilityUnit {
  identificador: string;
  piso: number | null;
  area: number | null;
  habitaciones: number | null;
  banos: number | null;
  parqueaderos: number | null;
  precio: number | null;
  estado: string;
  tipologia_nombre: string | null;
  torre_nombre: string | null;
}

export interface AvailabilityPDFData {
  projectName: string;
  constructoraName: string | null;
  colorPrimario: string;
  moneda: Currency;
  unidadMedida: string;
  projectLogoBase64: string | null;
  projectLogoFormat: "JPEG" | "PNG" | null;
  constructoraLogoBase64: string | null;
  constructoraLogoFormat: "JPEG" | "PNG" | null;
  units: AvailabilityUnit[];
  generatedAt: string; // ISO date string
  showPrices: boolean;
}

/* ── Constants ── */

const LETTER_W = 612;
const LETTER_H = 791;
const M = 40; // margin
const CW = LETTER_W - M * 2;

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  disponible: { bg: "rgb(34,197,94)", text: "rgb(255,255,255)", label: "Disponible" },
  proximamente: { bg: "rgb(59,130,246)", text: "rgb(255,255,255)", label: "Próximamente" },
  separado: { bg: "rgb(234,179,8)", text: "rgb(30,30,30)", label: "Separado" },
  reservada: { bg: "rgb(249,115,22)", text: "rgb(255,255,255)", label: "Reservada" },
  vendida: { bg: "rgb(239,68,68)", text: "rgb(255,255,255)", label: "Vendida" },
};

/* ── Helpers ── */

function imgSrc(b64: string | null, fmt: "JPEG" | "PNG" | null): string | undefined {
  if (!b64 || !fmt) return undefined;
  if (b64.startsWith("data:")) return b64;
  return `data:${fmt === "PNG" ? "image/png" : "image/jpeg"};base64,${b64}`;
}

function fmtArea(area: number | null, unit: string): string {
  if (area == null) return "—";
  return `${area.toLocaleString("es-CO", { maximumFractionDigits: 1 })} ${unit}`;
}

function fmtPrice(price: number | null, currency: Currency): string {
  if (price == null) return "—";
  return formatCurrency(price, currency);
}

/* ── Document ── */

export function AvailabilityDocument({ data }: { data: AvailabilityPDFData }) {
  const accent = data.colorPrimario || "#C9A96E";
  const accentLight = hexToRgba(accent, 0.15);

  // Count statuses
  const statusCounts: Record<string, number> = {};
  for (const u of data.units) {
    statusCounts[u.estado] = (statusCounts[u.estado] || 0) + 1;
  }

  const dateStr = new Date(data.generatedAt).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Determine columns to show
  const hasTorre = data.units.some((u) => u.torre_nombre);
  const hasTipologia = data.units.some((u) => u.tipologia_nombre);
  const hasPiso = data.units.some((u) => u.piso != null);
  const hasRooms = data.units.some((u) => u.habitaciones != null);
  const hasBaths = data.units.some((u) => u.banos != null);
  const hasParking = data.units.some((u) => u.parqueaderos != null);

  // Build column config dynamically
  interface Col {
    header: string;
    width: number;
    align: "left" | "center" | "right";
    render: (u: AvailabilityUnit) => string;
    mono?: boolean;
  }

  const cols: Col[] = [
    { header: "Unidad", width: 60, align: "left", render: (u) => u.identificador },
  ];

  if (hasTorre) cols.push({ header: "Torre", width: 50, align: "left", render: (u) => u.torre_nombre || "—" });
  if (hasTipologia) cols.push({ header: "Tipo", width: 65, align: "left", render: (u) => u.tipologia_nombre || "—" });
  if (hasPiso) cols.push({ header: "Piso", width: 30, align: "center", render: (u) => u.piso != null ? String(u.piso) : "—", mono: true });

  cols.push({ header: `Área (${data.unidadMedida})`, width: 55, align: "right", render: (u) => fmtArea(u.area, data.unidadMedida), mono: true });

  if (hasRooms) cols.push({ header: "Hab.", width: 28, align: "center", render: (u) => u.habitaciones != null ? String(u.habitaciones) : "—", mono: true });
  if (hasBaths) cols.push({ header: "Baños", width: 32, align: "center", render: (u) => u.banos != null ? String(u.banos) : "—", mono: true });
  if (hasParking) cols.push({ header: "Parq.", width: 30, align: "center", render: (u) => u.parqueaderos != null ? String(u.parqueaderos) : "—", mono: true });

  if (data.showPrices) {
    cols.push({ header: "Precio", width: 75, align: "right", render: (u) => fmtPrice(u.precio, data.moneda), mono: true });
  }

  // Status column always last
  cols.push({ header: "Estado", width: 60, align: "center", render: (u) => STATUS_COLORS[u.estado]?.label || u.estado });

  // Calculate remaining width for proportional distribution
  const totalFixedWidth = cols.reduce((s, c) => s + c.width, 0);
  const scale = CW / totalFixedWidth;

  // Chunk units into pages (~32 rows per page after header)
  const ROWS_FIRST_PAGE = 28;
  const ROWS_PER_PAGE = 36;
  const pages: AvailabilityUnit[][] = [];
  let remaining = [...data.units];
  pages.push(remaining.splice(0, ROWS_FIRST_PAGE));
  while (remaining.length > 0) {
    pages.push(remaining.splice(0, ROWS_PER_PAGE));
  }

  return (
    <Document>
      {pages.map((pageUnits, pageIdx) => (
        <Page
          key={pageIdx}
          size="LETTER"
          style={{
            fontFamily: FONT_FAMILY.BODY,
            fontSize: 8,
            backgroundColor: "rgb(255,255,255)",
            paddingBottom: 40,
          }}
        >
          {/* Top accent bar */}
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: accent }} />

          {pageIdx === 0 ? (
            <>
              {/* ── FIRST PAGE HEADER ── */}
              <View style={{ paddingHorizontal: M, paddingTop: 24 }}>
                {/* Logos row */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  {data.constructoraLogoBase64 && data.constructoraLogoFormat ? (
                    <Image
                      src={imgSrc(data.constructoraLogoBase64, data.constructoraLogoFormat)}
                      style={{ width: 80, height: 30, objectFit: "contain" }}
                    />
                  ) : data.constructoraName ? (
                    <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: "rgb(130,130,130)", letterSpacing: 1 }}>
                      {data.constructoraName.toUpperCase()}
                    </Text>
                  ) : (
                    <View />
                  )}

                  {data.projectLogoBase64 && data.projectLogoFormat ? (
                    <Image
                      src={imgSrc(data.projectLogoBase64, data.projectLogoFormat)}
                      style={{ width: 80, height: 30, objectFit: "contain" }}
                    />
                  ) : (
                    <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: accent, letterSpacing: 1 }}>
                      {data.projectName.toUpperCase()}
                    </Text>
                  )}
                </View>

                {/* Title */}
                <Text style={{ fontFamily: FONT_FAMILY.HEADING, fontSize: 22, fontWeight: 300, color: "rgb(25,25,25)", marginBottom: 3 }}>
                  Disponibilidad de Unidades
                </Text>
                <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: "rgb(130,130,130)", marginBottom: 14 }}>
                  {data.projectName} · Generado el {dateStr}
                </Text>

                {/* Status summary pills */}
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {Object.entries(statusCounts).map(([status, count]) => {
                    const sc = STATUS_COLORS[status] || { bg: "rgb(150,150,150)", text: "rgb(255,255,255)", label: status };
                    return (
                      <View
                        key={status}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: hexToRgba(sc.bg.replace("rgb(", "#").replace(/,/g, "").replace(")", ""), 0.1),
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 4,
                        }}
                      >
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sc.bg }} />
                        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontSize: 6.5, fontWeight: 700, letterSpacing: 0.8, color: "rgb(80,80,80)" }}>
                          {sc.label.toUpperCase()}
                        </Text>
                        <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 7, color: "rgb(60,60,60)" }}>
                          {count}
                        </Text>
                      </View>
                    );
                  })}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontSize: 6.5, fontWeight: 700, letterSpacing: 0.8, color: "rgb(130,130,130)" }}>
                      TOTAL
                    </Text>
                    <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 7, color: "rgb(60,60,60)" }}>
                      {data.units.length}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={{ height: 0.5, backgroundColor: "rgb(230,225,215)", marginBottom: 8 }} />
              </View>
            </>
          ) : (
            /* ── CONTINUATION PAGE HEADER ── */
            <View style={{ paddingHorizontal: M, paddingTop: 20, marginBottom: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontSize: 6.5, fontWeight: 700, letterSpacing: 1, color: "rgb(130,130,130)" }}>
                  {data.projectName.toUpperCase()} — DISPONIBILIDAD
                </Text>
                <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 6.5, color: "rgb(160,160,160)" }}>
                  Página {pageIdx + 1}
                </Text>
              </View>
              <View style={{ height: 0.5, backgroundColor: "rgb(230,225,215)", marginBottom: 8 }} />
            </View>
          )}

          {/* ── TABLE ── */}
          <View style={{ paddingHorizontal: M }}>
            {/* Header row */}
            <View style={{ flexDirection: "row", backgroundColor: "rgb(35,35,38)", borderRadius: 3, paddingVertical: 5, paddingHorizontal: 6, marginBottom: 2 }}>
              {cols.map((col) => (
                <Text
                  key={col.header}
                  style={{
                    width: col.width * scale,
                    fontFamily: FONT_FAMILY.LABEL,
                    fontSize: 6,
                    fontWeight: 700,
                    letterSpacing: 0.8,
                    color: "rgb(255,255,255)",
                    textAlign: col.align,
                  }}
                >
                  {col.header.toUpperCase()}
                </Text>
              ))}
            </View>

            {/* Data rows */}
            {pageUnits.map((unit, rowIdx) => {
              const isAlt = rowIdx % 2 === 1;
              const sc = STATUS_COLORS[unit.estado] || { bg: "rgb(150,150,150)", text: "rgb(255,255,255)", label: unit.estado };
              const isLast = cols[cols.length - 1].header === "Estado";

              return (
                <View
                  key={unit.identificador + rowIdx}
                  style={{
                    flexDirection: "row",
                    paddingVertical: 4.5,
                    paddingHorizontal: 6,
                    backgroundColor: isAlt ? "rgb(250,248,244)" : "rgb(255,255,255)",
                    borderBottom: "0.3px solid rgb(240,238,234)",
                    alignItems: "center",
                  }}
                >
                  {cols.map((col, colIdx) => {
                    // Status column gets special rendering
                    if (isLast && colIdx === cols.length - 1) {
                      return (
                        <View key={col.header} style={{ width: col.width * scale, alignItems: "center" }}>
                          <View style={{
                            backgroundColor: sc.bg,
                            borderRadius: 2.5,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          }}>
                            <Text style={{
                              fontFamily: FONT_FAMILY.LABEL,
                              fontSize: 5.5,
                              fontWeight: 700,
                              letterSpacing: 0.6,
                              color: sc.text,
                            }}>
                              {sc.label.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      );
                    }

                    return (
                      <Text
                        key={col.header}
                        style={{
                          width: col.width * scale,
                          fontFamily: col.mono ? FONT_FAMILY.MONO : FONT_FAMILY.BODY,
                          fontSize: 7,
                          color: colIdx === 0 ? "rgb(25,25,25)" : "rgb(80,80,80)",
                          fontWeight: colIdx === 0 ? 700 : 400,
                          textAlign: col.align,
                        }}
                      >
                        {col.render(unit)}
                      </Text>
                    );
                  })}
                </View>
              );
            })}
          </View>

          {/* ── FOOTER ── */}
          <View style={{ position: "absolute", bottom: 14, left: M, right: M, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 5.5, color: "rgb(180,180,180)" }}>
              Generado con noddo.io · {dateStr}
            </Text>
            <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 5.5, color: "rgb(180,180,180)" }}>
              {pageIdx + 1} / {pages.length}
            </Text>
          </View>

          {/* Bottom accent bar */}
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, backgroundColor: accent }} />
        </Page>
      ))}
    </Document>
  );
}
