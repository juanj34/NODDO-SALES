import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCotizacionData } from "./html/build-data";
import { buildCotizacionHtml } from "./html/build-html";
import type { BuildCotizacionDataInput } from "./html/types";

const BUCKET = "cotizaciones";
/** Signed URL lifetime for dashboard/email links (seconds). */
const SIGNED_URL_TTL = 60 * 15; // 15 minutes

export function cotizacionPdfPath(proyectoId: string, cotizacionId: string): string {
  return `${proyectoId}/${cotizacionId}.pdf`;
}

/**
 * Render an HTML string to a PDF via the Railway Chromium worker.
 * Fail-LOUD here: throws on missing config or non-200. Callers wrap this
 * in their own fail-soft/fail-loud policy (buyer path vs agent action).
 */
export async function renderCotizacionPdf(
  html: string,
  opts: { format?: "A4" | "Letter"; landscape?: boolean } = {},
): Promise<Buffer> {
  const base = process.env.COTIZADOR_RENDER_URL;
  const secret = process.env.RENDER_SHARED_SECRET;
  if (!base || !secret) {
    throw new Error(
      "[cotizador/generate] COTIZADOR_RENDER_URL or RENDER_SHARED_SECRET not configured",
    );
  }

  const res = await fetch(`${base.replace(/\/$/, "")}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-render-token": secret,
    },
    body: JSON.stringify({ html, format: opts.format ?? "Letter", landscape: opts.landscape ?? false }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(`[cotizador/generate] render worker returned ${res.status}: ${detail.slice(0, 300)}`);
  }

  const arrayBuf = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  if (buf.length < 100) {
    throw new Error(`[cotizador/generate] render worker returned ${buf.length} bytes — likely a blank render`);
  }
  return buf;
}

/**
 * Upload the PDF to the PRIVATE `cotizaciones` bucket (service-role client).
 * Returns the object PATH to persist in cotizaciones.pdf_url (NOT a public URL).
 */
export async function uploadCotizacionPdf(
  supabase: SupabaseClient,
  proyectoId: string,
  cotizacionId: string,
  pdf: Buffer,
): Promise<string> {
  const path = cotizacionPdfPath(proyectoId, cotizacionId);
  const { error } = await supabase.storage.from(BUCKET).upload(path, pdf, {
    contentType: "application/pdf",
    upsert: true, // idempotent re-render by cotizacion id
  });
  if (error) {
    throw new Error(`[cotizador/generate] PDF upload failed: ${error.message}`);
  }
  return path;
}

/**
 * Mint a short-lived signed URL for a stored PDF path. Returns null on error
 * so callers can degrade gracefully (e.g. show "PDF generándose…").
 */
export async function getCotizacionSignedUrl(
  supabase: SupabaseClient,
  path: string,
  ttlSeconds: number = SIGNED_URL_TTL,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttlSeconds);
  if (error || !data?.signedUrl) {
    console.warn("[cotizador/generate] createSignedUrl failed:", error?.message);
    return null;
  }
  return data.signedUrl;
}

export interface GenerateCotizacionPdfResult {
  /** Object path stored in cotizaciones.pdf_url. null if rendering/upload failed (fail-soft). */
  pdfPath: string | null;
  /** The rendered PDF buffer (for email attachment), or null on failure. */
  pdfBuffer: Buffer | null;
  /** Set when the worker/upload failed and the caller should surface/retry. */
  error: string | null;
}

/**
 * Full pipeline: data → html → worker PDF → upload → return path + buffer.
 *
 * @param failSoft When true (buyer/public path), swallows worker outages and
 *   returns { pdfPath: null, pdfBuffer: null, error } so lead capture never
 *   breaks. When false (agent "generate" action), re-throws so the route 502s.
 */
export async function generateCotizacionPdf(
  supabase: SupabaseClient,
  proyectoId: string,
  cotizacionId: string,
  input: BuildCotizacionDataInput,
  failSoft: boolean,
): Promise<GenerateCotizacionPdfResult> {
  try {
    const view = buildCotizacionData(input);
    const html = buildCotizacionHtml(view);
    const pdfBuffer = await renderCotizacionPdf(html);
    const pdfPath = await uploadCotizacionPdf(supabase, proyectoId, cotizacionId, pdfBuffer);
    return { pdfPath, pdfBuffer, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "render failed";
    console.error("[cotizador/generate] generateCotizacionPdf failed:", message);
    if (!failSoft) throw err;
    return { pdfPath: null, pdfBuffer: null, error: message };
  }
}
