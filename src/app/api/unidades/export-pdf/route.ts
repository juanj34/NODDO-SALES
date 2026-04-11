import { NextResponse } from "next/server";
import sharp from "sharp";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAuthContext } from "@/lib/auth-context";
import { registerFonts } from "@/lib/cotizador/pdf-react/fonts";
import { AvailabilityDocument } from "@/lib/inventario/pdf-disponibilidad";
import type { AvailabilityUnit, AvailabilityPDFData } from "@/lib/inventario/pdf-disponibilidad";
import { getPrimaryArea } from "@/lib/inventory-columns";

/* ── Image fetcher (simplified, no cache needed for single use) ── */

async function fetchImageBase64(
  url: string | null
): Promise<{ base64: string; format: "JPEG" | "PNG" } | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    const isJPEG = uint8[0] === 0xff && uint8[1] === 0xd8;
    const isPNG = uint8[0] === 0x89 && uint8[1] === 0x50;

    let resized: Buffer;
    let format: "JPEG" | "PNG";

    if (!isJPEG && !isPNG) {
      resized = await sharp(Buffer.from(buffer)).resize(400, null, { withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
      format = "JPEG";
    } else {
      resized = await sharp(Buffer.from(buffer)).resize(400, null, { withoutEnlargement: true }).toBuffer();
      format = isJPEG ? "JPEG" : "PNG";
    }

    return { base64: resized.toString("base64"), format };
  } catch {
    return null;
  }
}

/* ── POST /api/unidades/export-pdf ── */

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { proyecto_id, filter_estado } = body as {
      proyecto_id: string;
      filter_estado?: string[]; // optional: only include these statuses
    };

    if (!proyecto_id) {
      return NextResponse.json({ error: "proyecto_id requerido" }, { status: 400 });
    }

    const { supabase } = auth;

    // Fetch project
    const { data: proyecto, error: projErr } = await supabase
      .from("proyectos")
      .select("nombre, color_primario, moneda_base, unidad_medida_base, logo_url, constructora_nombre, constructora_logo_url, inventory_columns, ocultar_precio_vendidas")
      .eq("id", proyecto_id)
      .single();

    if (projErr || !proyecto) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // Fetch units with relations
    const { data: unidades, error: unitsErr } = await supabase
      .from("unidades")
      .select("identificador, piso, area_m2, area_construida, area_privada, area_lote, habitaciones, banos, parqueaderos, precio, estado, tipologia:tipologias(nombre), torre:torres(nombre)")
      .eq("proyecto_id", proyecto_id)
      .order("piso", { ascending: false, nullsFirst: false })
      .order("identificador", { ascending: true });

    if (unitsErr) {
      return NextResponse.json({ error: "Error cargando unidades" }, { status: 500 });
    }

    if (!unidades || unidades.length === 0) {
      return NextResponse.json({ error: "No hay unidades en este proyecto" }, { status: 400 });
    }

    // Filter by status if specified
    let filtered = unidades;
    if (filter_estado && filter_estado.length > 0) {
      filtered = unidades.filter((u) => filter_estado.includes(u.estado));
    }

    // Determine if prices should be hidden for sold units
    const hideSoldPrices = proyecto.ocultar_precio_vendidas === true;

    // Map to PDF format
    const pdfUnits: AvailabilityUnit[] = filtered.map((u) => {
      const area = getPrimaryArea(u as Parameters<typeof getPrimaryArea>[0], proyecto.inventory_columns);
      let precio = u.precio;
      if (hideSoldPrices && u.estado === "vendida") {
        precio = null;
      }

      return {
        identificador: u.identificador,
        piso: u.piso,
        area,
        habitaciones: u.habitaciones,
        banos: u.banos,
        parqueaderos: u.parqueaderos,
        precio,
        estado: u.estado,
        tipologia_nombre: (u.tipologia as unknown as { nombre: string } | null)?.nombre ?? null,
        torre_nombre: (u.torre as unknown as { nombre: string } | null)?.nombre ?? null,
      };
    });

    // Fetch logos in parallel
    const [projectLogo, constructoraLogo] = await Promise.all([
      fetchImageBase64(proyecto.logo_url),
      fetchImageBase64(proyecto.constructora_logo_url),
    ]);

    const pdfData: AvailabilityPDFData = {
      projectName: proyecto.nombre,
      constructoraName: proyecto.constructora_nombre,
      colorPrimario: proyecto.color_primario || "#C9A96E",
      moneda: proyecto.moneda_base || "COP",
      unidadMedida: proyecto.unidad_medida_base || "m²",
      projectLogoBase64: projectLogo?.base64 ?? null,
      projectLogoFormat: projectLogo?.format ?? null,
      constructoraLogoBase64: constructoraLogo?.base64 ?? null,
      constructoraLogoFormat: constructoraLogo?.format ?? null,
      units: pdfUnits,
      generatedAt: new Date().toISOString(),
      showPrices: true,
    };

    // Register fonts and render PDF
    registerFonts();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(AvailabilityDocument, { data: pdfData }) as any;
    const pdfBuffer = await renderToBuffer(element);

    if (pdfBuffer.byteLength < 100) {
      throw new Error("PDF render produced empty output");
    }

    const filename = `${proyecto.nombre.replace(/\s+/g, "_")}_Disponibilidad_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[unidades/export-pdf] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error generando PDF" },
      { status: 500 }
    );
  }
}
