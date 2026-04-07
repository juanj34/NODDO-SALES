/**
 * React PDF render entry point
 *
 * Drop-in replacement for the jsPDF-based generarPDF.
 * Returns a Promise<Buffer> instead of Buffer (async rendering).
 */

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { registerFonts } from "./fonts";
import { CotizacionDocument } from "./document";
import type { PDFData } from "../generar-pdf";

// Re-export PDFData so consumers can import from here
export type { PDFData } from "../generar-pdf";

/**
 * Generate a cotización PDF using React PDF.
 *
 * @param data - All data needed to render the quotation
 * @returns Promise<Buffer> — The PDF as a Node.js Buffer
 */
export async function generarPDF(data: PDFData): Promise<Buffer> {
  // Register fonts once (idempotent)
  registerFonts();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = <CotizacionDocument data={data} /> as any;
  const buffer = await renderToBuffer(element);

  return Buffer.from(buffer);
}
