/**
 * React PDF Document for NODDO Cotizaciones
 *
 * Replaces the imperative jsPDF implementation with declarative React components.
 * Produces the same 5-page structure:
 *   Page 1: Cover (hero or minimalista)
 *   Page 2: Offer details with payment table
 *   Page 3: Floor plan (conditional)
 *   Page 4: Key plan (conditional)
 *   Page 5: Additional info (conditional)
 */

import React from "react";
import { Document, Page, View, Text, Image, StyleSheet, Link } from "@react-pdf/renderer";
import type { PDFData } from "../generar-pdf";
import type { EmailLocale } from "@/lib/email-i18n";
import type { Currency } from "@/types";
import { formatCurrency } from "@/lib/currency";
import { FONT_FAMILY } from "./fonts";
import {
  type ThemePalette,
  type PDFStrings,
  THEME_DARK,
  THEME_NEUTRAL,
  PDF_STRINGS,
  FREQ_LABELS,
  STATUS_LABELS,
  hexToRgba,
  lightenHex,
} from "./theme";

/* ── Page dimensions (letter, mm → pt: 1mm = 2.835pt) ── */
const LETTER_W = 612; // 215.9mm
const LETTER_H = 791; // 279.4mm
const MARGIN = 62; // ~22mm
const CONTENT_W = LETTER_W - MARGIN * 2;

/* ── Base64 image helper ── */
function imgSrc(base64: string | null | undefined, format: "JPEG" | "PNG" | null | undefined): string | undefined {
  if (!base64 || !format) return undefined;
  const mime = format === "PNG" ? "image/png" : "image/jpeg";
  // Already has data URI prefix
  if (base64.startsWith("data:")) return base64;
  return `data:${mime};base64,${base64}`;
}

/* ── Shared styles ── */
const s = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY.BODY,
    fontSize: 9,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  // Accent bars top + bottom
  accentBarTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 11, // ~4mm
  },
  accentBarTopThin: {
    position: "absolute",
    top: 11,
    left: 0,
    right: 0,
    height: 1.2,
  },
  accentBarBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 10, // ~3.5mm
  },
  // Content area with margins
  content: {
    paddingHorizontal: MARGIN,
    paddingTop: 40,
    paddingBottom: 36,
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 6.5,
  },
});

/* ═══════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════ */

function PageFrame({ accent, accentLight, theme, children }: {
  accent: string;
  accentLight: string;
  theme: ThemePalette;
  children: React.ReactNode;
}) {
  return (
    <Page size="LETTER" style={[s.page, { backgroundColor: theme.bg }]}>
      {/* Top accent bar */}
      <View style={[s.accentBarTop, { backgroundColor: accent }]} />
      <View style={[s.accentBarTopThin, { backgroundColor: accentLight }]} />
      {/* Bottom accent bar */}
      <View style={[s.accentBarBottom, { backgroundColor: accent }]} />
      {children}
    </Page>
  );
}

function DualLogoHeader({ data, accent, theme }: {
  data: PDFData;
  accent: string;
  theme: ThemePalette;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingHorizontal: MARGIN, paddingTop: 36 }}>
      {/* Constructora logo (left) */}
      {data.constructoraLogoBase64 && data.constructoraLogoFormat ? (
        <Image
          src={imgSrc(data.constructoraLogoBase64, data.constructoraLogoFormat)}
          style={{ width: 70, height: 28, objectFit: "contain" }}
        />
      ) : data.constructoraName ? (
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7.5, color: theme.textMuted, letterSpacing: 1 }}>
          {data.constructoraName.toUpperCase()}
        </Text>
      ) : <View />}

      {/* Project logo (right) */}
      {data.projectLogoBase64 && data.projectLogoFormat ? (
        <Image
          src={imgSrc(data.projectLogoBase64, data.projectLogoFormat)}
          style={{ width: 70, height: 28, objectFit: "contain" }}
        />
      ) : (
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7.5, color: accent, letterSpacing: 1 }}>
          {data.projectName}
        </Text>
      )}
    </View>
  );
}

function SectionLabel({ label, accent, theme }: {
  label: string;
  accent: string;
  theme: ThemePalette;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 8.5, color: accent, letterSpacing: 1.5 }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", marginTop: 4 }}>
        <View style={{ width: 60, height: 1.5, backgroundColor: accent }} />
        <View style={{ flex: 1, height: 0.5, backgroundColor: theme.divider, marginTop: 0.5 }} />
      </View>
    </View>
  );
}

function FooterText({ strings, theme }: { strings: PDFStrings; theme: ThemePalette }) {
  return (
    <Text style={[s.footer, { color: theme.footerText }]}>{strings.generatedBy}</Text>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE 1: COVER — HERO
   ═══════════════════════════════════════════════════ */

function CoverHero({ data, accent, strings }: {
  data: PDFData;
  accent: string;
  strings: PDFStrings;
}) {
  const coverBg = "rgb(10,10,11)";
  const coverText = "rgb(240,237,230)";
  const coverSecondary = "rgb(160,155,145)";
  const coverMuted = "rgb(110,107,100)";
  const hasCover = !!data.coverImageBase64 && !!data.coverImageFormat;

  return (
    <Page size="LETTER" style={[s.page, { backgroundColor: coverBg }]}>
      {/* Cover image - full bleed */}
      {hasCover && (
        <Image
          src={imgSrc(data.coverImageBase64, data.coverImageFormat)!}
          style={{ position: "absolute", top: 0, left: 0, width: LETTER_W, height: LETTER_H, objectFit: "cover" }}
        />
      )}

      {/* Dark gradient overlay (bottom half) */}
      {hasCover && (
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: LETTER_H * 0.55, backgroundColor: "rgba(10,10,11,0.82)" }} />
      )}

      {/* Top accent bar */}
      <View style={[s.accentBarTop, { backgroundColor: accent }]} />

      {/* Constructora logo pill */}
      {data.constructoraLogoBase64 && data.constructoraLogoFormat && (
        <View style={{ position: "absolute", top: 22, left: 50, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 8, padding: 8 }}>
          <Image
            src={imgSrc(data.constructoraLogoBase64, data.constructoraLogoFormat)!}
            style={{ width: 85, height: 34, objectFit: "contain" }}
          />
        </View>
      )}

      {/* Bottom content area */}
      <View style={{ position: "absolute", bottom: 45, left: 62, right: 62 }}>
        {data.constructoraName && (
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 9, color: coverSecondary, letterSpacing: 2, marginBottom: 10 }}>
            {data.constructoraName.toUpperCase()}
          </Text>
        )}

        <Text style={{ fontFamily: FONT_FAMILY.HEADING, fontSize: 38, color: coverText, marginBottom: 10 }}>
          {data.projectName}
        </Text>

        {/* Accent line */}
        <View style={{ width: 140, height: 2.3, backgroundColor: accent, marginBottom: 12 }} />

        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 10, color: accent, letterSpacing: 2 }}>
          {strings.quotation}
        </Text>

        <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: coverMuted, marginTop: 6 }}>
          {data.referenceNumber}
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 9, color: coverText }}>
            {strings.unit} {data.unidadId}
          </Text>
          <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: coverSecondary }}>
            {data.fecha}
          </Text>
        </View>
      </View>

      {/* Bottom accent bar */}
      <View style={[s.accentBarBottom, { backgroundColor: accent }]} />
    </Page>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE 1: COVER — MINIMALISTA
   ═══════════════════════════════════════════════════ */

function CoverMinimalista({ data, accent, theme, strings }: {
  data: PDFData;
  accent: string;
  theme: ThemePalette;
  strings: PDFStrings;
}) {
  return (
    <Page size="LETTER" style={[s.page, { backgroundColor: theme.coverBg }]}>
      {/* Top accent bar */}
      <View style={[s.accentBarTop, { backgroundColor: accent }]} />

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: MARGIN }}>
        {/* Project logo */}
        {data.projectLogoBase64 && data.projectLogoFormat && (
          <Image
            src={imgSrc(data.projectLogoBase64, data.projectLogoFormat)!}
            style={{ width: 170, height: 70, objectFit: "contain", marginBottom: 24 }}
          />
        )}

        {/* Project name */}
        <Text style={{ fontFamily: FONT_FAMILY.HEADING, fontSize: 30, color: theme.coverText, textAlign: "center", marginBottom: 12 }}>
          {data.projectName}
        </Text>

        {/* Accent line */}
        <View style={{ width: 70, height: 2.3, backgroundColor: accent, marginBottom: 12 }} />

        {/* COTIZACIÓN label */}
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 10, color: accent, letterSpacing: 2 }}>
          {strings.quotation}
        </Text>

        {/* Reference */}
        <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.coverTextMuted, marginTop: 8 }}>
          {data.referenceNumber}
        </Text>

        {/* Unit */}
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 9, color: theme.coverTextSecondary, letterSpacing: 1, marginTop: 12 }}>
          {strings.unit} {data.unidadId}
        </Text>
      </View>

      {/* Constructora logo (bottom center) */}
      <View style={{ position: "absolute", bottom: 55, left: 0, right: 0, alignItems: "center" }}>
        {data.constructoraLogoBase64 && data.constructoraLogoFormat ? (
          <Image
            src={imgSrc(data.constructoraLogoBase64, data.constructoraLogoFormat)!}
            style={{ width: 85, height: 34, objectFit: "contain" }}
          />
        ) : data.constructoraName ? (
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 9, color: theme.coverTextSecondary, letterSpacing: 1.5 }}>
            {data.constructoraName.toUpperCase()}
          </Text>
        ) : null}
      </View>

      {/* Date */}
      <View style={{ position: "absolute", bottom: 34, left: 0, right: 0, alignItems: "center" }}>
        <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 7, color: theme.coverTextMuted }}>
          {data.fecha}
        </Text>
      </View>

      {/* Bottom accent bar */}
      <View style={[s.accentBarBottom, { backgroundColor: accent }]} />
    </Page>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE 2: OFFER DETAILS
   ═══════════════════════════════════════════════════ */

/* Grid cell (key-value pair in 2-col layout) */
function GridCell({ label, value, theme, isRight }: {
  label: string;
  value: string;
  theme: ThemePalette;
  isRight?: boolean;
}) {
  return (
    <View style={{
      width: "50%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 5,
      ...(isRight ? { borderLeftWidth: 0.5, borderLeftColor: theme.gridBorder } : {}),
    }}>
      <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 7, color: theme.textMuted }}>
        {label}
      </Text>
      <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 9, color: theme.text }}>
        {value}
      </Text>
    </View>
  );
}

function OfferPage({ data, accent, accentLight, theme, strings, locale }: {
  data: PDFData;
  accent: string;
  accentLight: string;
  theme: ThemePalette;
  strings: PDFStrings;
  locale: EmailLocale;
}) {
  const moneda = (data.config.moneda || "COP") as Currency;
  const u = data.unidad_medida || "m²";
  const areaDisplay = data.area_m2 ? ` / ${data.area_m2} ${u}` : "";
  const displayTotal = data.resultado.precio_total ?? data.resultado.precio_neto;
  const cargosAplicados = data.resultado.cargos_aplicados ?? [];
  const adminFee = data.resultado.admin_fee ?? 0;
  const adminLabel = data.resultado.admin_fee_label ?? "Admin Fee";
  const hasDualCurrency = !!data.monedaSecundaria && !!data.tipoCambio;
  const secCur = data.monedaSecundaria;
  const xRate = data.tipoCambio ?? 0;

  // Build project pairs
  const projPairs: [string, string][] = [
    [strings.project + ":", `${data.projectName}${data.constructoraName ? ` by ${data.constructoraName}` : ""}`],
  ];
  if (data.ubicacionDireccion) projPairs.push([strings.location + ":", data.ubicacionDireccion]);
  const statusKey = data.estadoConstruccion || "sobre_planos";
  projPairs.push([strings.status + ":", STATUS_LABELS[statusKey]?.[locale] ?? STATUS_LABELS.sobre_planos[locale]]);
  if (data.fechaEstimadaEntrega) projPairs.push([strings.estimatedDelivery + ":", data.fechaEstimadaEntrega]);

  // Build property pairs
  const propPairs: [string, string][] = [];
  if (data.tipologiaName) propPairs.push([strings.typology + ":", data.tipologiaName]);
  propPairs.push([strings.unit + ":", data.unidadId]);
  if (data.area_construida) propPairs.push([strings.area_construida + ":", `${data.area_construida} ${u}`]);
  if (data.area_privada) propPairs.push([strings.area_privada + ":", `${data.area_privada} ${u}`]);
  if (data.area_lote) propPairs.push([strings.area_lote + ":", `${data.area_lote} ${u}`]);
  if (data.area_m2 && !data.area_construida && !data.area_privada) propPairs.push([strings.area + ":", `${data.area_m2} ${u}`]);
  if (data.habitaciones) propPairs.push([strings.bedrooms + ":", `${data.habitaciones}`]);
  if (data.banos) propPairs.push([strings.bathrooms + ":", `${data.banos}`]);
  if (data.piso !== null && data.piso !== undefined) propPairs.push([strings.floor + ":", `${data.piso}`]);
  if (data.vista) propPairs.push([strings.view + ":", data.vista]);
  if (data.orientacion) propPairs.push([strings.orientation + ":", data.orientacion]);
  if (data.parqueaderos) propPairs.push([strings.parking + ":", `${data.parqueaderos}`]);
  if (data.depositos) propPairs.push([strings.storage + ":", `${data.depositos}`]);
  if (data.tiene_terraza) propPairs.push([strings.terrace + ":", strings.yes]);
  if (data.tiene_jardin) propPairs.push([strings.garden + ":", strings.yes]);
  if (data.tiene_bbq) propPairs.push([strings.bbq + ":", strings.yes]);
  if (data.tiene_jacuzzi) propPairs.push([strings.jacuzzi + ":", strings.yes]);
  if (data.tiene_piscina) propPairs.push([strings.pool + ":", strings.yes]);
  if (data.tiene_cuarto_servicio) propPairs.push([strings.maidsRoom + ":", strings.yes]);
  if (data.tiene_estudio) propPairs.push([strings.study + ":", strings.yes]);
  if (data.tiene_chimenea) propPairs.push([strings.fireplace + ":", strings.yes]);
  if (data.tiene_doble_altura) propPairs.push([strings.doubleHeight + ":", strings.yes]);
  if (data.tiene_rooftop) propPairs.push([strings.rooftop + ":", strings.yes]);
  if (data.amoblado !== undefined) propPairs.push([strings.furnished + ":", data.amoblado ? strings.yes : strings.no]);

  // Group pairs into rows of 2
  const pairRows = (pairs: [string, string][]) => {
    const rows: [string, string][][] = [];
    for (let i = 0; i < pairs.length; i += 2) {
      rows.push(pairs.slice(i, i + 2));
    }
    return rows;
  };

  // Price header string
  let priceStr = `${strings.sellingPrice} ${formatCurrency(displayTotal, moneda)}`;
  if (hasDualCurrency && secCur) {
    priceStr += `  ≈ ${formatCurrency(Math.round(displayTotal * xRate), secCur)}`;
  }

  // Notes
  const autoNote = data.tipoEntrega
    ? (locale === "en"
      ? "Indicative quotation — subject to confirmation by the sales team."
      : "Cotización indicativa — sujeta a confirmación por el equipo comercial.")
    : null;
  const notes = [autoNote, data.config.notas_legales, data.disclaimer].filter(Boolean).join(" ");

  return (
    <PageFrame accent={accent} accentLight={accentLight} theme={theme}>
      {/* Header */}
      <DualLogoHeader data={data} accent={accent} theme={theme} />

      <View style={{ paddingHorizontal: MARGIN }}>
        {/* ── Title block ── */}
        <View style={{
          backgroundColor: theme.gridBg,
          borderWidth: 1,
          borderColor: accent,
          borderRadius: 6,
          paddingVertical: 10,
          paddingHorizontal: 16,
          alignItems: "center",
          marginBottom: 8,
        }}>
          <Text style={{ fontFamily: FONT_FAMILY.HEADING, fontSize: 16, color: theme.text }}>
            {strings.salesOffer}
          </Text>
          <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8.5, color: theme.textSecondary, marginTop: 4 }}>
            {strings.unit} No: {data.unidadId}{areaDisplay}
          </Text>
        </View>

        {/* ── Ref + Date ── */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 7.5, color: theme.textMuted }}>Ref: {data.referenceNumber}</Text>
          <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 7.5, color: theme.textMuted }}>{locale === "en" ? "Date:" : "Fecha:"} {data.fecha}</Text>
        </View>
        <View style={{ height: 1, backgroundColor: accent, marginBottom: 10 }} />

        {/* ── Project Details ── */}
        <SectionLabel label={strings.projectDetails} accent={accent} theme={theme} />
        <View style={{
          backgroundColor: theme.gridBg,
          borderWidth: 0.5,
          borderColor: theme.gridBorder,
          borderRadius: 6,
          marginBottom: 8,
        }}>
          {pairRows(projPairs).map((row, ri) => (
            <View key={ri} style={{
              flexDirection: "row",
              ...(ri > 0 ? { borderTopWidth: 0.3, borderTopColor: theme.gridBorder } : {}),
            }}>
              {row.map((pair, ci) => (
                <GridCell key={ci} label={pair[0]} value={pair[1]} theme={theme} isRight={ci === 1} />
              ))}
              {row.length === 1 && <View style={{ width: "50%" }} />}
            </View>
          ))}
        </View>

        {/* ── Property Details ── */}
        <SectionLabel label={strings.propertyDetails} accent={accent} theme={theme} />
        <View style={{
          backgroundColor: theme.gridBg,
          borderWidth: 0.5,
          borderColor: theme.gridBorder,
          borderRadius: 6,
          marginBottom: 8,
        }}>
          {pairRows(propPairs).map((row, ri) => (
            <View key={ri} style={{
              flexDirection: "row",
              ...(ri > 0 ? { borderTopWidth: 0.3, borderTopColor: theme.gridBorder } : {}),
            }}>
              {row.map((pair, ci) => (
                <GridCell key={ci} label={pair[0]} value={pair[1]} theme={theme} isRight={ci === 1} />
              ))}
              {row.length === 1 && <View style={{ width: "50%" }} />}
            </View>
          ))}
        </View>

        {/* ── Payment Plan ── */}
        <SectionLabel
          label={data.paymentPlanNombre || (locale === "en" ? "Payment Plan" : "Plan de Pagos")}
          accent={accent}
          theme={theme}
        />

        {/* Selling price bar */}
        <View style={{
          backgroundColor: theme.gridBg,
          borderWidth: 0.5,
          borderColor: theme.gridBorder,
          borderRadius: 4,
          paddingVertical: 5,
          paddingHorizontal: 14,
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 8,
        }}>
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 8, color: theme.text }}>
            {priceStr}
          </Text>
          {adminFee > 0 && (
            <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 8, color: theme.text }}>
              {adminLabel}: {formatCurrency(adminFee, moneda)}
            </Text>
          )}
        </View>

        {/* Table header */}
        <View style={{
          flexDirection: "row",
          backgroundColor: theme.tableHeader,
          borderRadius: 4,
          paddingVertical: 5,
          paddingHorizontal: 14,
          marginBottom: 2,
        }}>
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: theme.tableHeaderText, width: "42%" }}>
            {strings.description}
          </Text>
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: theme.tableHeaderText, width: "14%", textAlign: "center" }}>
            {strings.percentage}
          </Text>
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: theme.tableHeaderText, width: "20%", textAlign: "center" }}>
            {locale === "en" ? "Date" : "Fecha"}
          </Text>
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: theme.tableHeaderText, width: "24%", textAlign: "right" }}>
            {locale === "en" ? "Amount" : "Monto"}
          </Text>
        </View>

        {/* Table rows */}
        {data.resultado.fases.map((fase, i) => {
          const totalBase = data.resultado.precio_total ?? data.resultado.precio_neto;
          const pct = fase.porcentaje ?? (totalBase > 0 ? Math.round((fase.monto_total / totalBase) * 100) : 0);
          const displayAmt = i === 0 && adminFee > 0 ? fase.monto_total + adminFee : fase.monto_total;
          let faseDisplayName = fase.nombre;
          if (/contra\s*entrega/i.test(faseDisplayName)) {
            faseDisplayName = locale === "en" ? "Delivery" : "Entrega";
          }
          if (i === 0 && adminFee > 0) {
            faseDisplayName = `${faseDisplayName} (+${pct}% + ${adminLabel})`;
          }
          const hasCondition = !!fase.condicion_hito;

          return (
            <View key={i}>
              <View style={{
                flexDirection: "row",
                alignItems: "flex-start",
                paddingVertical: 5,
                paddingHorizontal: 14,
                ...(i % 2 === 0 ? { backgroundColor: theme.rowAlt } : {}),
                borderBottomWidth: 0.4,
                borderBottomColor: theme.divider,
              }}>
                {/* Bullet + description */}
                <View style={{ width: "42%", flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    borderWidth: 1.2,
                    borderColor: accent,
                    marginRight: 6,
                    marginTop: 1,
                  }} />
                  <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8.5, color: theme.text, flex: 1 }}>
                    {faseDisplayName}
                  </Text>
                </View>

                {/* Percentage */}
                <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: accent, width: "14%", textAlign: "center" }}>
                  {pct}%
                </Text>

                {/* Date + condition */}
                <View style={{ width: "20%", alignItems: "center" }}>
                  <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.textSecondary }}>
                    {fase.fecha || (hasCondition ? "" : "--")}
                  </Text>
                  {hasCondition && (
                    <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 6.5, color: accent, fontStyle: "italic", marginTop: 2 }}>
                      {fase.condicion_hito}
                    </Text>
                  )}
                </View>

                {/* Amount */}
                <View style={{ width: "24%", alignItems: "flex-end" }}>
                  <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.text }}>
                    {formatCurrency(displayAmt, moneda)}
                  </Text>
                  {hasDualCurrency && secCur && (
                    <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 6.5, color: theme.textMuted, marginTop: 1 }}>
                      ≈ {formatCurrency(Math.round(displayAmt * xRate), secCur)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Installment subtitle */}
              {fase.cuotas > 1 && (
                <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 6.5, color: theme.textMuted, paddingLeft: 40, paddingBottom: 3 }}>
                  ({fase.cuotas} {FREQ_LABELS[locale][fase.frecuencia] || fase.frecuencia} × {formatCurrency(fase.monto_por_cuota, moneda)})
                </Text>
              )}
            </View>
          );
        })}

        {/* Discounts */}
        {data.resultado.descuentos_aplicados.length > 0 && (
          <View style={{ marginTop: 4 }}>
            {data.resultado.descuentos_aplicados.map((desc, i) => (
              <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 2 }}>
                <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8.5, color: "rgb(46,139,87)" }}>
                  - {desc.nombre}
                </Text>
                <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8.5, color: "rgb(46,139,87)" }}>
                  -{formatCurrency(desc.monto, moneda)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Additional charges */}
        {cargosAplicados.length > 0 && (
          <View style={{ marginTop: 4 }}>
            {cargosAplicados.map((cargo, i) => {
              const label = cargo.tipo === "porcentaje" && cargo.porcentaje
                ? `${cargo.nombre} (${cargo.porcentaje}%)`
                : cargo.nombre;
              return (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 2 }}>
                  <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8.5, color: theme.textSecondary }}>
                    {label}
                  </Text>
                  <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.text }}>
                    {formatCurrency(cargo.monto, moneda)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Legacy impuestos fallback */}
        {cargosAplicados.length === 0 && data.resultado.impuestos_aplicados && data.resultado.impuestos_aplicados.length > 0 && (
          <View style={{ marginTop: 4 }}>
            {data.resultado.impuestos_aplicados.map((imp, i) => (
              <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 2 }}>
                <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8.5, color: theme.textSecondary }}>
                  {imp.nombre} ({imp.porcentaje}%)
                </Text>
                <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.text }}>
                  {formatCurrency(imp.monto, moneda)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {notes && (
          <Text style={{ fontFamily: FONT_FAMILY.BODY, fontStyle: "italic", fontSize: 6.5, color: theme.textMuted, textAlign: "center", marginTop: 14 }}>
            {notes}
          </Text>
        )}

        {/* Sign-off */}
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 9, color: theme.textSecondary }}>
            {data.pdfDespedida || strings.defaultClosing}
          </Text>
          {data.constructoraName && (
            <Text style={{ fontFamily: FONT_FAMILY.HEADING, fontSize: 10, color: theme.text, marginTop: 4 }}>
              {data.constructoraName}
            </Text>
          )}
          {data.agenteName && (
            <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: accent, marginTop: 2 }}>
              {data.agenteName}
            </Text>
          )}
        </View>
      </View>

      <FooterText strings={strings} theme={theme} />
    </PageFrame>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE 3: FLOOR PLAN
   ═══════════════════════════════════════════════════ */

function FloorPlanPage({ data, accent, accentLight, theme, strings }: {
  data: PDFData;
  accent: string;
  accentLight: string;
  theme: ThemePalette;
  strings: PDFStrings;
}) {
  const header = data.tipologiaName
    ? `${data.tipologiaName} — ${strings.unit}: ${data.unidadId}`
    : `${strings.unit}: ${data.unidadId}`;

  return (
    <PageFrame accent={accent} accentLight={accentLight} theme={theme}>
      <DualLogoHeader data={data} accent={accent} theme={theme} />
      <View style={{ paddingHorizontal: MARGIN, flex: 1 }}>
        <SectionLabel label={strings.floorPlan} accent={accent} theme={theme} />

        <Text style={{ fontFamily: FONT_FAMILY.HEADING, fontSize: 16, color: theme.text, marginBottom: 14 }}>
          {header}
        </Text>

        {data.planoBase64 && data.planoFormat && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Image
              src={imgSrc(data.planoBase64, data.planoFormat)!}
              style={{ maxWidth: CONTENT_W, maxHeight: 550, objectFit: "contain" }}
            />
          </View>
        )}
      </View>

      {/* Disclaimer */}
      <Text style={{
        position: "absolute",
        bottom: 34,
        left: MARGIN,
        right: MARGIN,
        fontFamily: FONT_FAMILY.BODY,
        fontSize: 6,
        color: theme.footerText,
        textAlign: "center",
      }}>
        {strings.floorPlanDisclaimer}
      </Text>

      <FooterText strings={strings} theme={theme} />
    </PageFrame>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE 4: KEY PLAN
   ═══════════════════════════════════════════════════ */

function KeyPlanPage({ data, accent, accentLight, theme, strings }: {
  data: PDFData;
  accent: string;
  accentLight: string;
  theme: ThemePalette;
  strings: PDFStrings;
}) {
  return (
    <PageFrame accent={accent} accentLight={accentLight} theme={theme}>
      <DualLogoHeader data={data} accent={accent} theme={theme} />
      <View style={{ paddingHorizontal: MARGIN, flex: 1 }}>
        <SectionLabel label={strings.keyPlan} accent={accent} theme={theme} />

        {data.pisoLabel && (
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 12, color: accent, marginBottom: 6 }}>
            {data.pisoLabel}
          </Text>
        )}

        <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 10, color: theme.textSecondary, marginBottom: 14 }}>
          {strings.unit}: {data.unidadId}
        </Text>

        {data.keyPlanBase64 && data.keyPlanFormat && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Image
              src={imgSrc(data.keyPlanBase64, data.keyPlanFormat)!}
              style={{ maxWidth: CONTENT_W, maxHeight: 550, objectFit: "contain" }}
            />
          </View>
        )}
      </View>

      {/* Disclaimer */}
      <Text style={{
        position: "absolute",
        bottom: 34,
        left: MARGIN,
        right: MARGIN,
        fontFamily: FONT_FAMILY.BODY,
        fontSize: 6,
        color: theme.footerText,
        textAlign: "center",
      }}>
        {strings.keyPlanDisclaimer}
      </Text>

      <FooterText strings={strings} theme={theme} />
    </PageFrame>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE 5: ADDITIONAL INFO
   ═══════════════════════════════════════════════════ */

function InfoPage({ data, accent, accentLight, theme, strings, locale }: {
  data: PDFData;
  accent: string;
  accentLight: string;
  theme: ThemePalette;
  strings: PDFStrings;
  locale: EmailLocale;
}) {
  // Build legal text
  const legalParts: string[] = [];
  if (data.tipoEntrega) {
    legalParts.push(
      locale === "en"
        ? "Indicative quotation — subject to confirmation by the sales team. The payment plan adjusts dynamically based on the quotation date."
        : "Cotización indicativa — sujeta a confirmación por el equipo comercial. El plan de pagos se ajusta dinámicamente según la fecha de la cotización."
    );
  }
  if (data.disclaimer) legalParts.push(data.disclaimer);
  if (data.config.notas_legales) legalParts.push(data.config.notas_legales);
  const legalText = legalParts.join("\n\n");

  return (
    <PageFrame accent={accent} accentLight={accentLight} theme={theme}>
      <DualLogoHeader data={data} accent={accent} theme={theme} />
      <View style={{ paddingHorizontal: MARGIN, flex: 1 }}>

        {/* Virtual Tour */}
        {data.tour360Url && (
          <View style={{ marginBottom: 30 }}>
            <SectionLabel label={strings.virtualTour} accent={accent} theme={theme} />
            <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 9, color: theme.textSecondary, marginBottom: 8 }}>
              {strings.virtualTourDesc.replace("{unit}", data.unidadId)}
            </Text>
            <Link src={data.tour360Url} style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 9, color: accent }}>
              {strings.viewTour}
            </Link>
          </View>
        )}

        {/* Contact */}
        {data.whatsappNumero && (
          <View style={{ marginBottom: 30 }}>
            <SectionLabel label={strings.contact} accent={accent} theme={theme} />
            <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 9, color: theme.textSecondary, marginBottom: 6 }}>
              {strings.contactDesc}
            </Text>
            <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 10, color: theme.text }}>
              {data.whatsappNumero}
            </Text>
          </View>
        )}

        {/* Legal */}
        {legalText && (
          <View style={{ marginBottom: 30 }}>
            <SectionLabel label={strings.legalNotice} accent={accent} theme={theme} />
            <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 7.5, color: theme.textMuted }}>
              {legalText}
            </Text>
          </View>
        )}

        {/* Buyer info */}
        <View style={{ marginTop: "auto" }}>
          <View style={{ height: 0.5, backgroundColor: theme.divider, marginBottom: 14 }} />

          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: accent, letterSpacing: 1.5, marginBottom: 6 }}>
            {strings.preparedFor}
          </Text>

          <Text style={{ fontFamily: FONT_FAMILY.HEADING, fontSize: 11, color: theme.text, marginBottom: 4 }}>
            {data.buyerName}
          </Text>

          <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.textMuted }}>
            {data.buyerEmail}
          </Text>

          {data.buyerPhone && (
            <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.textMuted, marginTop: 3 }}>
              {data.buyerPhone}
            </Text>
          )}
        </View>
      </View>

      <FooterText strings={strings} theme={theme} />
    </PageFrame>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN DOCUMENT
   ═══════════════════════════════════════════════════ */

export function CotizacionDocument({ data }: { data: PDFData }) {
  const accent = hexToRgba(data.colorPrimario || "#b8973a");
  const accentLight = lightenHex(data.colorPrimario || "#b8973a", 40);
  const locale: EmailLocale = data.idioma || "es";
  const strings = PDF_STRINGS[locale];
  const theme = data.pdfTheme === "dark" ? THEME_DARK : THEME_NEUTRAL;
  const coverStyle = data.coverStyle || "hero";

  const hasFloorPlan = !!data.planoBase64 && !!data.planoFormat;
  const hasKeyPlan = !!data.keyPlanBase64 && !!data.keyPlanFormat;
  const hasInfoContent = !!data.tour360Url || !!data.whatsappNumero || !!data.disclaimer || !!data.config.notas_legales || !!data.tipoEntrega;

  return (
    <Document
      title={`Cotización ${data.projectName} - ${data.unidadId}`}
      author={data.constructoraName || "NODDO"}
      subject={`Cotización para ${data.buyerName}`}
      creator="NODDO — noddo.io"
    >
      {/* Page 1: Cover */}
      {coverStyle === "minimalista" ? (
        <CoverMinimalista data={data} accent={accent} theme={theme} strings={strings} />
      ) : (
        <CoverHero data={data} accent={accent} strings={strings} />
      )}

      {/* Page 2: Offer Details */}
      <OfferPage data={data} accent={accent} accentLight={accentLight} theme={theme} strings={strings} locale={locale} />

      {/* Page 3: Floor Plan (conditional) */}
      {hasFloorPlan && (
        <FloorPlanPage data={data} accent={accent} accentLight={accentLight} theme={theme} strings={strings} />
      )}

      {/* Page 4: Key Plan (conditional) */}
      {hasKeyPlan && (
        <KeyPlanPage data={data} accent={accent} accentLight={accentLight} theme={theme} strings={strings} />
      )}

      {/* Page 5: Additional Info (conditional) */}
      {hasInfoContent && (
        <InfoPage data={data} accent={accent} accentLight={accentLight} theme={theme} strings={strings} locale={locale} />
      )}
    </Document>
  );
}
