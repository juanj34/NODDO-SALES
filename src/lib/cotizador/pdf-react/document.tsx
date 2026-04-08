/**
 * React PDF Document for NODDO Cotizaciones
 *
 * Produces professional cotización PDFs:
 *   Page 1:   Cover (hero or minimalista)
 *   Page 2+:  Offer details — wraps across pages
 *   Page N:   Floor plan (conditional)
 *   Page N+1: Key plan (conditional)
 *   Page N+2: Additional info (conditional)
 *
 * Typography rules:
 *   Cormorant (HEADING) — cover title, section titles only (≥14pt)
 *   Syne (LABEL)        — section labels, table header, buttons (7–8pt, UPPERCASE)
 *   Inter (BODY)         — all body text, descriptions, greetings (8pt)
 *   DM Mono (MONO)      — prices, dates, ref numbers, data values (8pt)
 *
 * Only 3 body sizes: 7pt (fine print), 8pt (standard), 14pt+ (display)
 */

import React from "react";
import { Document, Page, View, Text, Image, Link } from "@react-pdf/renderer";
import type { PDFData } from "../generar-pdf";
import type { EmailLocale } from "@/lib/email-i18n";
import type { Currency, ComplementoSeleccion } from "@/types";
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

/* ── Constants ── */
const LETTER_W = 612;
const LETTER_H = 791;
const M = 54; // margin (~19mm) — a bit tighter for more content room
const CW = LETTER_W - M * 2;

/* ── Helpers ── */
function imgSrc(b64: string | null | undefined, fmt: "JPEG" | "PNG" | null | undefined): string | undefined {
  if (!b64 || !fmt) return undefined;
  if (b64.startsWith("data:")) return b64;
  return `data:${fmt === "PNG" ? "image/png" : "image/jpeg"};base64,${b64}`;
}

/* ═══════════════════════════════════════════════════
   SHARED — used across multiple page types
   ═══════════════════════════════════════════════════ */

function PageFrame({ accent, accentLight, theme, children }: {
  accent: string; accentLight: string; theme: ThemePalette; children: React.ReactNode;
}) {
  return (
    <Page size="LETTER" style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, backgroundColor: theme.bg }}>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, backgroundColor: accent }} />
      <View style={{ position: "absolute", top: 8, left: 0, right: 0, height: 0.8, backgroundColor: accentLight }} />
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 7, backgroundColor: accent }} />
      {children}
    </Page>
  );
}

function DualLogoHeader({ data, accent, theme }: { data: PDFData; accent: string; theme: ThemePalette }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingHorizontal: M, paddingTop: 28 }}>
      {data.constructoraLogoBase64 && data.constructoraLogoFormat ? (
        <Image src={imgSrc(data.constructoraLogoBase64, data.constructoraLogoFormat)} style={{ width: 60, height: 24, objectFit: "contain" }} />
      ) : data.constructoraName ? (
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: theme.textMuted, letterSpacing: 1 }}>{data.constructoraName.toUpperCase()}</Text>
      ) : <View />}
      {data.projectLogoBase64 && data.projectLogoFormat ? (
        <Image src={imgSrc(data.projectLogoBase64, data.projectLogoFormat)} style={{ width: 60, height: 24, objectFit: "contain" }} />
      ) : (
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: accent, letterSpacing: 1 }}>{data.projectName.toUpperCase()}</Text>
      )}
    </View>
  );
}

function SectionLabel({ label, accent, theme }: { label: string; accent: string; theme: ThemePalette }) {
  return (
    <View style={{ marginBottom: 6, marginTop: 4 }} minPresenceAhead={80}>
      <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: accent, letterSpacing: 1.5 }}>{label}</Text>
      <View style={{ flexDirection: "row", marginTop: 3 }}>
        <View style={{ width: 40, height: 1.2, backgroundColor: accent }} />
        <View style={{ flex: 1, height: 0.4, backgroundColor: theme.divider, marginTop: 0.4 }} />
      </View>
    </View>
  );
}

function Footer({ strings, theme }: { strings: PDFStrings; theme: ThemePalette }) {
  return (
    <Text style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", fontSize: 6, color: theme.footerText }}>{strings.generatedBy}</Text>
  );
}

/* ═══════════════════════════════════════════════════
   COVER — HERO
   ═══════════════════════════════════════════════════ */

function CoverHero({ data, accent, strings }: { data: PDFData; accent: string; strings: PDFStrings }) {
  const hasCover = !!data.coverImageBase64 && !!data.coverImageFormat;
  return (
    <Page size="LETTER" style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, backgroundColor: "rgb(10,10,11)" }}>
      {/* Full-bleed cover image */}
      {hasCover && (
        <Image src={imgSrc(data.coverImageBase64, data.coverImageFormat)!} style={{ position: "absolute", top: 0, left: 0, width: LETTER_W, height: LETTER_H, objectFit: "cover" }} />
      )}
      {/* Single dark overlay so text is readable over the image */}
      {hasCover && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(10,10,11,0.55)" }} />
      )}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, backgroundColor: accent }} />
      {data.constructoraLogoBase64 && data.constructoraLogoFormat && (
        <View style={{ position: "absolute", top: 20, left: M, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 6, padding: 6 }}>
          <Image src={imgSrc(data.constructoraLogoBase64, data.constructoraLogoFormat)!} style={{ width: 70, height: 28, objectFit: "contain" }} />
        </View>
      )}
      <View style={{ position: "absolute", bottom: 40, left: M, right: M }}>
        {data.constructoraName && (
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: "rgb(160,155,145)", letterSpacing: 2, marginBottom: 8 }}>{data.constructoraName.toUpperCase()}</Text>
        )}
        <Text style={{ fontFamily: FONT_FAMILY.HEADING, fontSize: 36, color: "rgb(240,237,230)", marginBottom: 8 }}>{data.projectName}</Text>
        <View style={{ width: 100, height: 2, backgroundColor: accent, marginBottom: 10 }} />
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 8, color: accent, letterSpacing: 2 }}>{strings.quotation}</Text>
        <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 7, color: "rgb(110,107,100)", marginTop: 4 }}>{data.referenceNumber}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
          <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: "rgb(240,237,230)" }}>{strings.unit} {data.unidadId}</Text>
          <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 7, color: "rgb(160,155,145)" }}>{data.fecha}</Text>
        </View>
      </View>
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 7, backgroundColor: accent }} />
    </Page>
  );
}

/* ═══════════════════════════════════════════════════
   COVER — MINIMALISTA
   ═══════════════════════════════════════════════════ */

function CoverMinimalista({ data, accent, theme, strings }: { data: PDFData; accent: string; theme: ThemePalette; strings: PDFStrings }) {
  return (
    <Page size="LETTER" style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, backgroundColor: theme.coverBg }}>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, backgroundColor: accent }} />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: M }}>
        {data.projectLogoBase64 && data.projectLogoFormat && (
          <Image src={imgSrc(data.projectLogoBase64, data.projectLogoFormat)!} style={{ width: 150, height: 60, objectFit: "contain", marginBottom: 20 }} />
        )}
        <Text style={{ fontFamily: FONT_FAMILY.HEADING, fontSize: 28, color: theme.coverText, textAlign: "center", marginBottom: 10 }}>{data.projectName}</Text>
        <View style={{ width: 50, height: 2, backgroundColor: accent, marginBottom: 10 }} />
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 8, color: accent, letterSpacing: 2 }}>{strings.quotation}</Text>
        <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 7, color: theme.coverTextMuted, marginTop: 6 }}>{data.referenceNumber}</Text>
        <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.coverTextSecondary, marginTop: 10 }}>{strings.unit} {data.unidadId}</Text>
      </View>
      <View style={{ position: "absolute", bottom: 45, left: 0, right: 0, alignItems: "center" }}>
        {data.constructoraLogoBase64 && data.constructoraLogoFormat ? (
          <Image src={imgSrc(data.constructoraLogoBase64, data.constructoraLogoFormat)!} style={{ width: 70, height: 28, objectFit: "contain" }} />
        ) : data.constructoraName ? (
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: theme.coverTextSecondary, letterSpacing: 1.5 }}>{data.constructoraName.toUpperCase()}</Text>
        ) : null}
      </View>
      <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
        <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 7, color: theme.coverTextMuted }}>{data.fecha}</Text>
      </View>
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 7, backgroundColor: accent }} />
    </Page>
  );
}

/* ═══════════════════════════════════════════════════
   OFFER PAGE — SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */

/** Detail row — single key:value pair, full width, stacked for long values */
function DetailRow({ label, value, theme, accent }: {
  label: string; value: string; theme: ThemePalette; accent: string;
}) {
  return (
    <View wrap={false} style={{
      flexDirection: "row",
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderBottomWidth: 0.3,
      borderBottomColor: theme.gridBorder,
    }}>
      <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 7, color: theme.textMuted, width: 100 }}>{label}</Text>
      <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.text, flex: 1 }}>{value}</Text>
    </View>
  );
}

/** Details section — label + list of key:value rows */
function DetailsSection({ label, pairs, accent, theme }: {
  label: string; pairs: [string, string][]; accent: string; theme: ThemePalette;
}) {
  if (pairs.length === 0) return null;
  return (
    <View style={{ marginBottom: 10 }}>
      <SectionLabel label={label} accent={accent} theme={theme} />
      <View style={{ backgroundColor: theme.gridBg, borderRadius: 4, borderWidth: 0.4, borderColor: theme.gridBorder }}>
        {pairs.map(([k, v], i) => (
          <DetailRow key={i} label={k} value={v} theme={theme} accent={accent} />
        ))}
      </View>
    </View>
  );
}

/** Complementos list */
function ComplementosBlock({ complementos, complementosTotal, moneda, accent, theme, strings, hasDualCurrency, secCur, xRate }: {
  complementos: ComplementoSeleccion[]; complementosTotal: number; moneda: Currency;
  accent: string; theme: ThemePalette; strings: PDFStrings;
  hasDualCurrency: boolean; secCur?: Currency; xRate: number;
}) {
  if (complementos.length === 0) return null;

  function lbl(c: ComplementoSeleccion): string {
    const t = c.tipo === "parqueadero" ? strings.parking_label : c.tipo === "deposito" ? strings.storage_label : strings.addon_label;
    let s = `${t}: ${c.identificador}`;
    if (c.subtipo) s += ` (${c.subtipo})`;
    if (c.cantidad && c.cantidad > 1) s += ` ×${c.cantidad}`;
    if (c.es_extra) s += ` — ${strings.additional}`;
    return s;
  }

  function price(c: ComplementoSeleccion): number | null {
    const p = c.precio_negociado ?? c.precio;
    if (p === null || p === undefined) return null;
    return p * (c.cantidad ?? 1);
  }

  return (
    <View style={{ marginBottom: 10 }}>
      <SectionLabel label={strings.complements} accent={accent} theme={theme} />
      {complementos.map((c, i) => {
        const p = price(c);
        const incl = (p === null || p === 0) && !c.suma_al_total;
        return (
          <View key={i} wrap={false} style={{
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            paddingVertical: 4, paddingHorizontal: 10,
            ...(i % 2 === 0 ? { backgroundColor: theme.rowAlt } : {}),
            borderBottomWidth: 0.3, borderBottomColor: theme.divider,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent, marginRight: 6 }} />
              <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.text }}>{lbl(c)}</Text>
            </View>
            <View style={{ alignItems: "flex-end", minWidth: 80 }}>
              <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: incl ? theme.textMuted : theme.text }}>
                {incl ? strings.included : formatCurrency(p!, moneda)}
              </Text>
              {hasDualCurrency && secCur && p && !incl && (
                <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 6, color: theme.textMuted }}>≈ {formatCurrency(Math.round(p * xRate), secCur)}</Text>
              )}
            </View>
          </View>
        );
      })}
      {complementosTotal > 0 && (
        <View wrap={false} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 10, borderTopWidth: 0.6, borderTopColor: theme.gridBorder, marginTop: 1 }}>
          <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.textSecondary }}>{strings.complementsSubtotal}</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.text }}>{formatCurrency(complementosTotal, moneda)}</Text>
            {hasDualCurrency && secCur && (
              <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 6, color: theme.textMuted }}>≈ {formatCurrency(Math.round(complementosTotal * xRate), secCur)}</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   OFFER PAGE — PAYMENT TABLE
   ═══════════════════════════════════════════════════ */

function PaymentTable({ data, moneda, accent, theme, strings, locale, hasDualCurrency, secCur, xRate }: {
  data: PDFData; moneda: Currency; accent: string; theme: ThemePalette;
  strings: PDFStrings; locale: EmailLocale;
  hasDualCurrency: boolean; secCur?: Currency; xRate: number;
}) {
  const displayTotal = data.resultado.precio_total ?? data.resultado.precio_neto;
  const cargosAplicados = data.resultado.cargos_aplicados ?? [];

  let priceStr = `${strings.sellingPrice} ${formatCurrency(displayTotal, moneda)}`;
  if (hasDualCurrency && secCur) {
    priceStr += `  ≈ ${formatCurrency(Math.round(displayTotal * xRate), secCur)}`;
  }

  return (
    <View break style={{ marginBottom: 10 }}>
      <SectionLabel
        label={data.paymentPlanNombre || (locale === "en" ? "PAYMENT PLAN" : "PLAN DE PAGOS")}
        accent={accent} theme={theme}
      />

      {/* Price summary bar */}
      <View wrap={false} style={{
        backgroundColor: theme.gridBg, borderRadius: 4, borderWidth: 0.4, borderColor: theme.gridBorder,
        paddingVertical: 5, paddingHorizontal: 10, marginBottom: 6,
      }}>
        <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.text }}>{priceStr}</Text>
      </View>

      {/* Table header — minPresenceAhead ensures rows follow */}
      <View wrap={false} minPresenceAhead={60} style={{
        flexDirection: "row", backgroundColor: theme.tableHeader, borderRadius: 3,
        paddingVertical: 4, paddingHorizontal: 10, marginBottom: 1,
      }}>
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: theme.tableHeaderText, width: "40%", letterSpacing: 0.5 }}>{strings.description}</Text>
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: theme.tableHeaderText, width: "12%", textAlign: "center", letterSpacing: 0.5 }}>%</Text>
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: theme.tableHeaderText, width: "22%", textAlign: "center", letterSpacing: 0.5 }}>{locale === "en" ? "DATE" : "FECHA"}</Text>
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: theme.tableHeaderText, width: "26%", textAlign: "right", letterSpacing: 0.5 }}>{locale === "en" ? "AMOUNT" : "MONTO"}</Text>
      </View>

      {/* Rows */}
      {data.resultado.fases.map((fase, i) => {
        const totalBase = data.resultado.precio_total ?? data.resultado.precio_neto;
        const pct = fase.porcentaje ?? (totalBase > 0 ? Math.round((fase.monto_total / totalBase) * 100) : 0);
        let name = fase.nombre;
        if (/contra\s*entrega/i.test(name)) name = locale === "en" ? "Delivery" : "Entrega";
        const cond = fase.condicion_hito;

        return (
          <View key={i} wrap={false} style={{
            flexDirection: "row", alignItems: "flex-start",
            paddingVertical: 5, paddingHorizontal: 10,
            ...(i % 2 === 0 ? { backgroundColor: theme.rowAlt } : {}),
            borderBottomWidth: 0.3, borderBottomColor: theme.divider,
          }}>
            {/* Name */}
            <View style={{ width: "40%" }}>
              <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.text }}>{name}</Text>
              {fase.cuotas > 1 && (
                <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 6, color: theme.textMuted, marginTop: 1 }}>
                  {fase.cuotas} {FREQ_LABELS[locale][fase.frecuencia] || fase.frecuencia} × {formatCurrency(fase.monto_por_cuota, moneda)}
                </Text>
              )}
            </View>
            {/* % */}
            <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: accent, width: "12%", textAlign: "center" }}>{pct}%</Text>
            {/* Date */}
            <View style={{ width: "22%", alignItems: "center" }}>
              <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.textSecondary }}>{fase.fecha || (cond ? "" : "—")}</Text>
              {cond && <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 6, color: accent, marginTop: 1 }}>{cond}</Text>}
            </View>
            {/* Amount */}
            <View style={{ width: "26%", alignItems: "flex-end" }}>
              <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.text }}>{formatCurrency(fase.monto_total, moneda)}</Text>
              {hasDualCurrency && secCur && (
                <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 6, color: theme.textMuted }}>≈ {formatCurrency(Math.round(fase.monto_total * xRate), secCur)}</Text>
              )}
            </View>
          </View>
        );
      })}

      {/* Discounts */}
      {data.resultado.descuentos_aplicados.length > 0 && (
        <View style={{ marginTop: 3 }}>
          {data.resultado.descuentos_aplicados.map((d, i) => (
            <View key={i} wrap={false} style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 2 }}>
              <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: "rgb(46,139,87)" }}>- {d.nombre}</Text>
              <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: "rgb(46,139,87)" }}>-{formatCurrency(d.monto, moneda)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Charges */}
      {cargosAplicados.length > 0 && (
        <View style={{ marginTop: 3 }}>
          {cargosAplicados.map((c, i) => {
            const l = c.tipo === "porcentaje" && c.porcentaje ? `${c.nombre} (${c.porcentaje}%)` : c.nombre;
            return (
              <View key={i} wrap={false} style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 2 }}>
                <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.textSecondary }}>{l}</Text>
                <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.text }}>{formatCurrency(c.monto, moneda)}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Legacy impuestos */}
      {cargosAplicados.length === 0 && data.resultado.impuestos_aplicados && data.resultado.impuestos_aplicados.length > 0 && (
        <View style={{ marginTop: 3 }}>
          {data.resultado.impuestos_aplicados.map((imp, i) => (
            <View key={i} wrap={false} style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 2 }}>
              <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.textSecondary }}>{imp.nombre} ({imp.porcentaje}%)</Text>
              <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.text }}>{formatCurrency(imp.monto, moneda)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* TOTAL */}
      <View wrap={false} style={{
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        backgroundColor: accent, borderRadius: 3, paddingVertical: 6, paddingHorizontal: 10,
        marginTop: 4,
      }}>
        <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 8, color: "rgb(255,255,255)", letterSpacing: 1 }}>{strings.totalPrice}</Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 9, color: "rgb(255,255,255)" }}>{formatCurrency(displayTotal, moneda)}</Text>
          {hasDualCurrency && secCur && (
            <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 6, color: "rgba(255,255,255,0.7)" }}>≈ {formatCurrency(Math.round(displayTotal * xRate), secCur)}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   OFFER PAGE — MAIN (wrapping)
   ═══════════════════════════════════════════════════ */

function OfferPage({ data, accent, accentLight, theme, strings, locale }: {
  data: PDFData; accent: string; accentLight: string; theme: ThemePalette; strings: PDFStrings; locale: EmailLocale;
}) {
  const moneda = (data.config.moneda || "COP") as Currency;
  const u = data.unidad_medida || "m²";
  const hasDualCurrency = !!data.monedaSecundaria && !!data.tipoCambio;
  const secCur = data.monedaSecundaria as Currency | undefined;
  const xRate = data.tipoCambio ?? 0;
  const complementos = data.complementos ?? data.resultado.complementos ?? [];
  const complementosTotal = data.resultado.complementos_total ?? 0;
  const areaDisplay = data.area_m2 ? ` — ${data.area_m2} ${u}` : "";

  // Greeting
  const greeting = (data.pdfSaludo || strings.defaultGreeting).replace("{name}", data.buyerName).replace("{project}", data.projectName);

  // Project details
  const projPairs: [string, string][] = [];
  projPairs.push([strings.project, data.projectName + (data.constructoraName ? ` — ${data.constructoraName}` : "")]);
  if (data.ubicacionDireccion) projPairs.push([strings.location, data.ubicacionDireccion]);
  const sk = data.estadoConstruccion || "sobre_planos";
  projPairs.push([strings.status, STATUS_LABELS[sk]?.[locale] ?? STATUS_LABELS.sobre_planos[locale]]);
  if (data.fechaEstimadaEntrega) projPairs.push([strings.estimatedDelivery, data.fechaEstimadaEntrega]);

  // Property details
  const propPairs: [string, string][] = [];
  if (data.tipologiaName) propPairs.push([strings.typology, data.tipologiaName]);
  propPairs.push([strings.unit, data.unidadId]);
  if (data.area_construida) propPairs.push([strings.area_construida, `${data.area_construida} ${u}`]);
  if (data.area_privada) propPairs.push([strings.area_privada, `${data.area_privada} ${u}`]);
  if (data.area_lote) propPairs.push([strings.area_lote, `${data.area_lote} ${u}`]);
  if (data.area_m2 && !data.area_construida && !data.area_privada) propPairs.push([strings.area, `${data.area_m2} ${u}`]);
  if (data.habitaciones) propPairs.push([strings.bedrooms, `${data.habitaciones}`]);
  if (data.banos) propPairs.push([strings.bathrooms, `${data.banos}`]);
  if (data.piso !== null && data.piso !== undefined) propPairs.push([strings.floor, `${data.piso}`]);
  if (data.vista) propPairs.push([strings.view, data.vista]);
  if (data.orientacion) propPairs.push([strings.orientation, data.orientacion]);
  if (data.parqueaderos) propPairs.push([strings.parking, `${data.parqueaderos}`]);
  if (data.depositos) propPairs.push([strings.storage, `${data.depositos}`]);
  if (data.tiene_terraza) propPairs.push([strings.terrace, strings.yes]);
  if (data.tiene_jardin) propPairs.push([strings.garden, strings.yes]);
  if (data.tiene_bbq) propPairs.push([strings.bbq, strings.yes]);
  if (data.tiene_jacuzzi) propPairs.push([strings.jacuzzi, strings.yes]);
  if (data.tiene_piscina) propPairs.push([strings.pool, strings.yes]);
  if (data.tiene_cuarto_servicio) propPairs.push([strings.maidsRoom, strings.yes]);
  if (data.tiene_estudio) propPairs.push([strings.study, strings.yes]);
  if (data.tiene_chimenea) propPairs.push([strings.fireplace, strings.yes]);
  if (data.tiene_doble_altura) propPairs.push([strings.doubleHeight, strings.yes]);
  if (data.tiene_rooftop) propPairs.push([strings.rooftop, strings.yes]);
  if (data.amoblado) propPairs.push([strings.furnished, strings.yes]);

  // Notes
  const notesParts: string[] = [];
  if (data.tipoEntrega) notesParts.push(locale === "en" ? "Indicative quotation — subject to confirmation by the sales team." : "Cotización indicativa — sujeta a confirmación por el equipo comercial.");
  if (data.config.notas_legales) notesParts.push(data.config.notas_legales);
  if (data.disclaimer) notesParts.push(data.disclaimer);
  const notes = notesParts.join(" ");

  return (
    <Page
      size="LETTER"
      wrap={true}
      style={{
        fontFamily: FONT_FAMILY.BODY, fontSize: 8, backgroundColor: theme.bg,
        paddingTop: 18, paddingBottom: 36, paddingHorizontal: M,
      }}
    >
      {/* Fixed bars — repeat on every overflow page */}
      <View fixed style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, backgroundColor: accent }} />
      <View fixed style={{ position: "absolute", top: 8, left: 0, right: 0, height: 0.8, backgroundColor: accentLight }} />
      <View fixed style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 7, backgroundColor: accent }} />
      <Text fixed style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", fontSize: 6, color: theme.footerText }}>{strings.generatedBy}</Text>

      {/* Logos — first page only */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        {data.constructoraLogoBase64 && data.constructoraLogoFormat ? (
          <Image src={imgSrc(data.constructoraLogoBase64, data.constructoraLogoFormat)} style={{ width: 60, height: 24, objectFit: "contain" }} />
        ) : data.constructoraName ? (
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: theme.textMuted, letterSpacing: 1 }}>{data.constructoraName.toUpperCase()}</Text>
        ) : <View />}
        {data.projectLogoBase64 && data.projectLogoFormat ? (
          <Image src={imgSrc(data.projectLogoBase64, data.projectLogoFormat)} style={{ width: 60, height: 24, objectFit: "contain" }} />
        ) : (
          <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: accent, letterSpacing: 1 }}>{data.projectName.toUpperCase()}</Text>
        )}
      </View>

      {/* Title */}
      <View wrap={false} style={{ borderWidth: 0.8, borderColor: accent, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 12, alignItems: "center", marginBottom: 6 }}>
        <Text style={{ fontFamily: FONT_FAMILY.HEADING, fontSize: 14, color: theme.text }}>{strings.salesOffer}</Text>
        <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.textSecondary, marginTop: 2 }}>{strings.unit} {data.unidadId}{areaDisplay}</Text>
      </View>

      {/* Ref + Date */}
      <View wrap={false} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
        <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 7, color: theme.textMuted }}>Ref: {data.referenceNumber}</Text>
        <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 7, color: theme.textMuted }}>{data.fecha}</Text>
      </View>
      <View style={{ height: 0.6, backgroundColor: accent, marginBottom: 10 }} />

      {/* Greeting */}
      <View wrap={false} style={{ marginBottom: 10 }}>
        <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.textSecondary, lineHeight: 1.6 }}>{greeting}</Text>
      </View>

      {/* Project Details */}
      <DetailsSection label={strings.projectDetails} pairs={projPairs} accent={accent} theme={theme} />

      {/* Property Details */}
      <DetailsSection label={strings.propertyDetails} pairs={propPairs} accent={accent} theme={theme} />

      {/* Complementos */}
      {complementos.length > 0 && (
        <ComplementosBlock
          complementos={complementos} complementosTotal={complementosTotal} moneda={moneda}
          accent={accent} theme={theme} strings={strings}
          hasDualCurrency={hasDualCurrency} secCur={secCur} xRate={xRate}
        />
      )}

      {/* Payment Table — always starts on a fresh page */}
      <PaymentTable
        data={data} moneda={moneda} accent={accent} theme={theme}
        strings={strings} locale={locale}
        hasDualCurrency={hasDualCurrency} secCur={secCur} xRate={xRate}
      />

      {/* Notes */}
      {notes && (
        <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 7, color: theme.textMuted, textAlign: "center", marginBottom: 10 }}>{notes}</Text>
      )}

    </Page>
  );
}

/* ═══════════════════════════════════════════════════
   FLOOR PLAN PAGE
   ═══════════════════════════════════════════════════ */

function FloorPlanPage({ data, accent, accentLight, theme, strings }: {
  data: PDFData; accent: string; accentLight: string; theme: ThemePalette; strings: PDFStrings;
}) {
  const header = data.tipologiaName ? `${data.tipologiaName} — ${strings.unit}: ${data.unidadId}` : `${strings.unit}: ${data.unidadId}`;
  return (
    <PageFrame accent={accent} accentLight={accentLight} theme={theme}>
      <DualLogoHeader data={data} accent={accent} theme={theme} />
      <View style={{ paddingHorizontal: M, flex: 1, paddingBottom: 30 }}>
        <SectionLabel label={strings.floorPlan} accent={accent} theme={theme} />
        <Text style={{ fontFamily: FONT_FAMILY.HEADING, fontSize: 14, color: theme.text, marginBottom: 12 }}>{header}</Text>
        {data.planoBase64 && data.planoFormat && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Image src={imgSrc(data.planoBase64, data.planoFormat)!} style={{ maxWidth: CW, maxHeight: 550, objectFit: "contain" }} />
          </View>
        )}
      </View>
      <Text style={{ position: "absolute", bottom: 28, left: M, right: M, fontSize: 6, color: theme.footerText, textAlign: "center" }}>{strings.floorPlanDisclaimer}</Text>
      <Footer strings={strings} theme={theme} />
    </PageFrame>
  );
}

/* ═══════════════════════════════════════════════════
   KEY PLAN PAGE
   ═══════════════════════════════════════════════════ */

function KeyPlanPage({ data, accent, accentLight, theme, strings }: {
  data: PDFData; accent: string; accentLight: string; theme: ThemePalette; strings: PDFStrings;
}) {
  return (
    <PageFrame accent={accent} accentLight={accentLight} theme={theme}>
      <DualLogoHeader data={data} accent={accent} theme={theme} />
      <View style={{ paddingHorizontal: M, flex: 1, paddingBottom: 30 }}>
        <SectionLabel label={strings.keyPlan} accent={accent} theme={theme} />
        {data.pisoLabel && <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: accent, marginBottom: 4 }}>{data.pisoLabel}</Text>}
        <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.textSecondary, marginBottom: 12 }}>{strings.unit}: {data.unidadId}</Text>
        {data.keyPlanBase64 && data.keyPlanFormat && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Image src={imgSrc(data.keyPlanBase64, data.keyPlanFormat)!} style={{ maxWidth: CW, maxHeight: 550, objectFit: "contain" }} />
          </View>
        )}
      </View>
      <Text style={{ position: "absolute", bottom: 28, left: M, right: M, fontSize: 6, color: theme.footerText, textAlign: "center" }}>{strings.keyPlanDisclaimer}</Text>
      <Footer strings={strings} theme={theme} />
    </PageFrame>
  );
}

/* ═══════════════════════════════════════════════════
   INFO PAGE
   ═══════════════════════════════════════════════════ */

function InfoPage({ data, accent, accentLight, theme, strings, locale }: {
  data: PDFData; accent: string; accentLight: string; theme: ThemePalette; strings: PDFStrings; locale: EmailLocale;
}) {
  const legalParts: string[] = [];
  if (data.tipoEntrega) legalParts.push(locale === "en"
    ? "Indicative quotation — subject to confirmation by the sales team."
    : "Cotización indicativa — sujeta a confirmación por el equipo comercial.");
  if (data.disclaimer) legalParts.push(data.disclaimer);
  if (data.config.notas_legales) legalParts.push(data.config.notas_legales);
  const legalText = legalParts.join("\n\n");

  return (
    <PageFrame accent={accent} accentLight={accentLight} theme={theme}>
      <DualLogoHeader data={data} accent={accent} theme={theme} />
      <View style={{ paddingHorizontal: M, flex: 1, paddingBottom: 30 }}>
        {data.tour360Url && (
          <View style={{ marginBottom: 24 }}>
            <SectionLabel label={strings.virtualTour} accent={accent} theme={theme} />
            <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.textSecondary, marginBottom: 6 }}>{strings.virtualTourDesc.replace("{unit}", data.unidadId)}</Text>
            <Link src={data.tour360Url} style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: accent }}>{strings.viewTour}</Link>
          </View>
        )}
        {data.whatsappNumero && (
          <View style={{ marginBottom: 24 }}>
            <SectionLabel label={strings.contact} accent={accent} theme={theme} />
            <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.textSecondary, marginBottom: 4 }}>{strings.contactDesc}</Text>
            <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.text }}>{data.whatsappNumero}</Text>
          </View>
        )}
        {legalText && (
          <View style={{ marginBottom: 24 }}>
            <SectionLabel label={strings.legalNotice} accent={accent} theme={theme} />
            <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 7, color: theme.textMuted }}>{legalText}</Text>
          </View>
        )}
        {/* Sign-off + Advisor */}
        <View style={{ marginTop: "auto" }}>
          <View style={{ height: 0.4, backgroundColor: theme.divider, marginBottom: 10 }} />
          <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.textSecondary }}>{data.pdfDespedida || strings.defaultClosing}</Text>
          {data.constructoraName && (
            <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.text, marginTop: 3 }}>{data.constructoraName}</Text>
          )}
          {data.agenteName && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: accent, letterSpacing: 1, marginBottom: 2 }}>{locale === "en" ? "ADVISOR" : "ASESOR"}</Text>
              <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.text }}>{data.agenteName}</Text>
              {data.agentePhone && <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.textSecondary, marginTop: 1 }}>{data.agentePhone}</Text>}
              {data.agenteEmail && <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.textSecondary, marginTop: 1 }}>{data.agenteEmail}</Text>}
            </View>
          )}

          {/* Prepared for */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontFamily: FONT_FAMILY.LABEL, fontWeight: 700, fontSize: 7, color: accent, letterSpacing: 1.5, marginBottom: 4 }}>{strings.preparedFor}</Text>
            <Text style={{ fontFamily: FONT_FAMILY.BODY, fontSize: 8, color: theme.text, marginBottom: 2 }}>{data.buyerName}</Text>
            <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.textMuted }}>{data.buyerEmail}</Text>
            {data.buyerPhone && <Text style={{ fontFamily: FONT_FAMILY.MONO, fontSize: 8, color: theme.textMuted, marginTop: 2 }}>{data.buyerPhone}</Text>}
          </View>
        </View>
      </View>
      <Footer strings={strings} theme={theme} />
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
  return (
    <Document
      title={`Cotización ${data.projectName} - ${data.unidadId}`}
      author={data.constructoraName || "NODDO"}
      subject={`Cotización para ${data.buyerName}`}
      creator="NODDO — noddo.io"
    >
      {coverStyle === "minimalista" ? (
        <CoverMinimalista data={data} accent={accent} theme={theme} strings={strings} />
      ) : (
        <CoverHero data={data} accent={accent} strings={strings} />
      )}

      <OfferPage data={data} accent={accent} accentLight={accentLight} theme={theme} strings={strings} locale={locale} />

      {hasFloorPlan && <FloorPlanPage data={data} accent={accent} accentLight={accentLight} theme={theme} strings={strings} />}
      {hasKeyPlan && <KeyPlanPage data={data} accent={accent} accentLight={accentLight} theme={theme} strings={strings} />}

      {/* Info page — always renders (has sign-off, advisor, buyer info) */}
      <InfoPage data={data} accent={accent} accentLight={accentLight} theme={theme} strings={strings} locale={locale} />
    </Document>
  );
}
